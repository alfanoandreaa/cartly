"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowLeft, BellRing, ExternalLink, Heart, Loader2, RefreshCw, Save, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { Button } from "@/components/ui/button";
import type { CartlyCollection, CartlyProduct, Priority } from "@/lib/cartly-data";
import { normalizeProduct } from "@/lib/cartly-data";
import {
  readLocalCollections,
  readLocalPicks,
  writeLocalPicks
} from "@/lib/client-storage";
import { formatPrice } from "@/lib/utils";

export function ProductDetailLoader({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<CartlyProduct | null>(null);
  const [collections, setCollections] = useState<CartlyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clientStorage, setClientStorage] = useState(false);
  const email = session?.user?.email;

  useEffect(() => {
    if (status === "loading") return;
    Promise.all([
      fetch(`/api/products/${id}`, { cache: "no-store" }),
      fetch("/api/collections", { cache: "no-store" })
    ])
      .then(async ([productResponse, collectionsResponse]) => {
        const local = productResponse.headers.get("x-cartly-client-storage") === "true";
        setClientStorage(local);
        if (local) {
          const found = readLocalPicks(email).find((item) => item.id === id) ?? null;
          setProduct(found);
          setCollections(readLocalCollections(email));
          setNotFound(!found);
          return;
        }
        if (productResponse.status === 404) {
          setNotFound(true);
          return;
        }
        if (!productResponse.ok || !collectionsResponse.ok) throw new Error();
        setProduct(normalizeProduct(await productResponse.json()));
        const collectionData = await collectionsResponse.json();
        setCollections(
          collectionData.map((collection: any) => ({
            id: String(collection.id),
            name: String(collection.name),
            emoji: String(collection.emoji ?? "✨")
          }))
        );
      })
      .catch(() => toast.error("Could not load this pick"))
      .finally(() => setLoading(false));
  }, [email, id, status]);

  async function save(update: {
    personalNote: string;
    priority: Priority;
    collectionId: string | null;
  }) {
    if (!product) return;
    const selectedCollection = collections.find((collection) => collection.id === update.collectionId);
    const next: CartlyProduct = {
      ...product,
      ...update,
      collection: selectedCollection
        ? {
            id: selectedCollection.id,
            name: selectedCollection.name,
            emoji: selectedCollection.emoji
          }
        : null
    };

    if (clientStorage) {
      writeLocalPicks(
        email,
        readLocalPicks(email).map((item) => (item.id === product.id ? next : item))
      );
    } else {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(update)
      });
      if (!response.ok) throw new Error("Could not save your changes");
    }
    setProduct(next);
  }

  async function remove() {
    if (!product) return;
    if (clientStorage) {
      writeLocalPicks(email, readLocalPicks(email).filter((item) => item.id !== product.id));
    } else {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this pick");
    }
    router.push("/app/dashboard");
    router.refresh();
  }

  async function refreshPrice() {
    if (!product) return;
    const response = await fetch(`/api/products/${product.id}/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: product.url,
        currentPrice: product.price,
        priceHistory: product.priceHistory
      })
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(
        body.error === "PRICE_NOT_FOUND"
          ? "Price not detected. Your saved price was left unchanged."
          : body.message ?? body.error ?? "Could not refresh this price"
      );
    }

    const next: CartlyProduct = {
      ...product,
      price: Number(body.price),
      priceCurrency: String(body.priceCurrency),
      priceHistory: Array.isArray(body.priceHistory)
        ? body.priceHistory.map((point: any) => ({
            price: Number(point.price),
            date: String(point.date)
          }))
        : product.priceHistory,
      inStock: body.inStock !== false
    };
    setProduct(next);
    if (clientStorage) {
      writeLocalPicks(
        email,
        readLocalPicks(email).map((item) => (item.id === product.id ? next : item))
      );
    }
    return body.changed as boolean;
  }

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm text-muted">
        <span className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-lime" /> Loading pick…</span>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-6 text-center">
        <div>
          <p className="text-6xl">🫥</p>
          <h1 className="mt-5 text-3xl font-bold">That pick slipped away.</h1>
          <p className="mt-2 text-muted">It may have been deleted or moved.</p>
          <Button asChild className="mt-6"><Link href="/app/dashboard">Back to your picks</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      collections={collections}
      onSave={save}
      onDelete={remove}
      onRefresh={refreshPrice}
    />
  );
}

function ProductDetail({
  product,
  collections,
  onSave,
  onDelete,
  onRefresh
}: {
  product: CartlyProduct;
  collections: CartlyCollection[];
  onSave: (update: { personalNote: string; priority: Priority; collectionId: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => Promise<boolean | undefined>;
}) {
  const [note, setNote] = useState(product.personalNote ?? "");
  const [priority, setPriority] = useState(product.priority);
  const [collectionId, setCollectionId] = useState(product.collectionId ?? "");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-10">
      <Link href="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to all picks
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
          <div className="relative aspect-square">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-7xl">🛍️</span>
            )}
            <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink/75 backdrop-blur" aria-label="Favorite">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-lime">{product.siteName}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" onClick={() => toast("Sharing is a Cartly Pro feature")}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="danger" size="icon" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{product.title}</h1>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price, product.priceCurrency)}</span>
            {product.oldPrice && <span className="mb-1 text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-lime" : "bg-coral"}`} />
            {product.inStock ? "In stock and ready to ship" : "Currently out of stock — Cartly is watching"}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <a href={product.url} target="_blank" rel="noreferrer">
                Visit store <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => toast("Price alerts are included with Cartly Pro")}>
              <BellRing className="h-4 w-4 text-lime" /> Set price alert
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                try {
                  const changed = await onRefresh();
                  toast.success(changed ? "Price updated" : "Price is still the same");
                } catch (caught) {
                  toast.error(caught instanceof Error ? caught.message : "Could not refresh this price");
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh price"}
            </Button>
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-muted">Collection</span>
                <select
                  className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
                  value={collectionId}
                  onChange={(event) => setCollectionId(event.target.value)}
                >
                  <option value="">No collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.emoji} {collection.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-muted">Priority</span>
                <select
                  className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as Priority)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
            </div>
            <label className="mt-5 block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[.14em] text-muted">
                Personal note <span className="font-normal tracking-normal">{note.length}/500</span>
              </span>
              <textarea
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="focus-ring w-full resize-none rounded-xl border border-line bg-card p-3 text-sm leading-relaxed"
              />
            </label>
            <Button
              size="sm"
              className="mt-4"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave({ personalNote: note, priority, collectionId: collectionId || null });
                  toast.success("Your changes are saved");
                } catch (caught) {
                  toast.error(caught instanceof Error ? caught.message : "Could not save changes");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </Button>
          </div>
        </div>
      </div>
      <section className="mt-6 rounded-[28px] border border-line bg-surface p-5 sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">THE LONG GAME</p>
          <h2 className="mt-2 text-2xl font-bold">Price history</h2>
        </div>
        <PriceHistoryChart data={product.priceHistory} />
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setConfirmDelete(false)}>
          <div className="w-full max-w-md rounded-[28px] border border-line bg-card p-7" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-2xl font-bold">Delete this pick?</h2>
            <p className="mt-3 text-muted">“{product.title}” will be permanently removed from your Cartly.</p>
            <div className="mt-7 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Keep it</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await onDelete();
                    toast.success("Pick deleted");
                  } catch (caught) {
                    toast.error(caught instanceof Error ? caught.message : "Could not delete this pick");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete pick
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
