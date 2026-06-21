"use client";

import { Grid2X2, List, Loader2, Plus, ShoppingBag, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import type { CartlyCollection, CartlyProduct, Priority } from "@/lib/cartly-data";
import { normalizeProduct } from "@/lib/cartly-data";
import {
  CARTLY_STORAGE_EVENT,
  readLocalCollections,
  readLocalPicks,
  writeLocalPicks
} from "@/lib/client-storage";
import { cn } from "@/lib/utils";

type ProductUpdate = {
  priority?: Priority;
  collectionId?: string | null;
};

export function ProductGrid() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState<CartlyProduct[]>([]);
  const [collections, setCollections] = useState<CartlyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const clientStorage = useRef(false);
  const email = session?.user?.email;

  const loadData = useCallback(async () => {
    if (status === "loading") return;
    setLoading(true);
    setError("");
    try {
      const [productsResponse, collectionsResponse] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/collections", { cache: "no-store" })
      ]);
      if (!productsResponse.ok || !collectionsResponse.ok) throw new Error("Could not load your Cartly");

      clientStorage.current = productsResponse.headers.get("x-cartly-client-storage") === "true";
      if (clientStorage.current) {
        setProducts(readLocalPicks(email));
        setCollections(readLocalCollections(email));
      } else {
        const [productData, collectionData] = await Promise.all([
          productsResponse.json(),
          collectionsResponse.json()
        ]);
        setProducts(productData.map(normalizeProduct));
        setCollections(
          collectionData.map((collection: any) => ({
            id: String(collection.id),
            name: String(collection.name),
            emoji: String(collection.emoji ?? "✨"),
            count: Number(collection._count?.products ?? 0),
            imageUrl: collection.products?.[0]?.imageUrl ?? null
          }))
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load your picks");
    } finally {
      setLoading(false);
    }
  }, [email, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function refreshLocalData() {
      if (!clientStorage.current) return;
      setProducts(readLocalPicks(email));
      setCollections(readLocalCollections(email));
    }
    window.addEventListener(CARTLY_STORAGE_EVENT, refreshLocalData);
    window.addEventListener("storage", refreshLocalData);
    return () => {
      window.removeEventListener(CARTLY_STORAGE_EVENT, refreshLocalData);
      window.removeEventListener("storage", refreshLocalData);
    };
  }, [email]);

  const filtered = useMemo(
    () => (filter === "all" ? products : products.filter((product) => product.collectionId === filter)),
    [filter, products]
  );
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date()).toUpperCase();

  async function updateProduct(id: string, update: ProductUpdate) {
    const previous = products;
    const selectedCollection =
      update.collectionId === undefined
        ? undefined
        : collections.find((collection) => collection.id === update.collectionId) ?? null;
    const next = products.map((product) =>
      product.id === id
        ? {
            ...product,
            ...update,
            ...(update.collectionId !== undefined
              ? {
                  collection: selectedCollection
                    ? {
                        id: selectedCollection.id,
                        name: selectedCollection.name,
                        emoji: selectedCollection.emoji
                      }
                    : null
                }
              : {})
          }
        : product
    );
    setProducts(next);

    try {
      if (clientStorage.current) {
        writeLocalPicks(email, next);
      } else {
        const response = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(update)
        });
        if (!response.ok) throw new Error("Could not update this pick");
      }
      toast.success(update.priority ? "Priority updated" : "Collection updated");
    } catch (caught) {
      setProducts(previous);
      toast.error(caught instanceof Error ? caught.message : "Could not update this pick");
      throw caught;
    }
  }

  async function deleteProduct(id: string) {
    const previous = products;
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    try {
      if (clientStorage.current) {
        writeLocalPicks(email, next);
      } else {
        const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete this pick");
      }
      toast.success("Pick deleted");
    } catch (caught) {
      setProducts(previous);
      toast.error(caught instanceof Error ? caught.message : "Could not delete this pick");
      throw caught;
    }
  }

  async function refreshProduct(id: string) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${id}/refresh`, {
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

      const next = products.map((item) =>
        item.id === id
          ? {
              ...item,
              price: Number(body.price),
              priceCurrency: String(body.priceCurrency),
              priceHistory: Array.isArray(body.priceHistory)
                ? body.priceHistory.map((point: any) => ({
                    price: Number(point.price),
                    date: String(point.date)
                  }))
                : item.priceHistory,
              inStock: body.inStock !== false
            }
          : item
      );
      setProducts(next);
      if (clientStorage.current) writeLocalPicks(email, next);
      toast.success(
        body.changed
          ? `Price updated: ${body.priceCurrency} ${Number(body.price).toFixed(2)}`
          : "Price is still the same"
      );
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not refresh this price");
      throw caught;
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-lime">{today}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Your picks</h1>
          <p className="mt-2 text-sm text-muted">
            {products.length
              ? `${products.length} good ${products.length === 1 ? "reason" : "reasons"} not to keep another tab open.`
              : "Save the things worth remembering. Cartly will keep watch."}
          </p>
        </div>
        <Button asChild className="sm:hidden">
          <Link href="/app/dashboard/add-product">
            <Plus className="h-4 w-4" /> Add a pick
          </Link>
        </Button>
      </div>

      {!loading && products.length > 0 && (
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === "all" ? "border-lime bg-lime text-ink" : "border-line bg-surface text-muted hover:text-white"
            )}
          >
            All
          </button>
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setFilter(collection.id)}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition",
                filter === collection.id ? "border-lime bg-lime text-ink" : "border-line bg-surface text-muted hover:text-white"
              )}
            >
              {collection.emoji} {collection.name}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-1 rounded-xl border border-line bg-surface p-1 sm:flex">
            <button
              aria-label="Grid view"
              className={cn("grid h-8 w-8 place-items-center rounded-lg text-muted", view === "grid" && "bg-card text-white")}
              onClick={() => setView("grid")}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              aria-label="List view"
              className={cn("grid h-8 w-8 place-items-center rounded-lg text-muted", view === "list" && "bg-card text-white")}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </Button>
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex items-center justify-center gap-3 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-lime" /> Loading your picks…
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl border border-coral/20 bg-coral/5 p-8 text-center">
          <p className="font-semibold text-coral">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={loadData}>Try again</Button>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-line bg-white/[0.02] p-8 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-lime/10 text-lime">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-2xl font-bold">Your Cartly is ready for its first pick.</h2>
            <p className="mt-3 leading-relaxed text-muted">
              Paste a product link from any store. We’ll collect the details and keep it organized for you.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/app/dashboard/add-product"><Plus className="h-4 w-4" /> Add your first pick</Link>
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-10 text-center text-muted">
          No picks in this collection yet.
        </div>
      ) : (
        <div className={cn("mt-5 grid gap-4", view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              collections={collections}
              list={view === "list"}
              onUpdate={(update) => updateProduct(product.id, update)}
              onDelete={() => deleteProduct(product.id)}
              onRefresh={() => refreshProduct(product.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
