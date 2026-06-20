"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderHeart, Loader2, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { Button } from "@/components/ui/button";
import type { CartlyCollection } from "@/lib/cartly-data";
import {
  readLocalCollections,
  readLocalPicks,
  writeLocalCollections,
  writeLocalPicks
} from "@/lib/client-storage";

export function CollectionsView() {
  const { data: session, status } = useSession();
  const [creating, setCreating] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CartlyCollection[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CartlyCollection | null>(null);
  const clientStorage = useRef(false);
  const email = session?.user?.email;

  const loadCollections = useCallback(async () => {
    if (status === "loading") return;
    setLoading(true);
    try {
      const response = await fetch("/api/collections", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load collections");
      clientStorage.current = response.headers.get("x-cartly-client-storage") === "true";
      if (clientStorage.current) {
        const picks = readLocalPicks(email);
        setCollections(
          readLocalCollections(email).map((collection) => ({
            ...collection,
            count: picks.filter((product) => product.collectionId === collection.id).length,
            imageUrl:
              picks.find((product) => product.collectionId === collection.id)?.imageUrl ??
              collection.imageUrl ??
              null
          }))
        );
      } else {
        const data = await response.json();
        setCollections(
          data.map((collection: any) => ({
            id: String(collection.id),
            name: String(collection.name),
            emoji: String(collection.emoji ?? "✨"),
            count: Number(collection._count?.products ?? 0),
            imageUrl: collection.products?.[0]?.imageUrl ?? null
          }))
        );
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not load collections");
    } finally {
      setLoading(false);
    }
  }, [email, status]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session?.user?.plan !== "PRO" && collections.length >= 3) {
      setCreating(false);
      setUpgrade(true);
      return;
    }
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name")),
          emoji: String(data.get("emoji") || "✨"),
          isPublic: false
        })
      });
      const body = await response.json();
      if (response.status === 403) {
        setCreating(false);
        setUpgrade(true);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Could not create collection");
      const collection: CartlyCollection = {
        id: String(body.id),
        name: String(body.name),
        emoji: String(body.emoji ?? "✨"),
        count: 0,
        imageUrl: null
      };
      const next = [...collections, collection];
      setCollections(next);
      if (clientStorage.current) writeLocalCollections(email, next);
      setCreating(false);
      toast.success("Collection created");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not create collection");
    }
  }

  async function deleteCollection(collection: CartlyCollection) {
    const previous = collections;
    const next = collections.filter((item) => item.id !== collection.id);
    setCollections(next);
    setDeleteTarget(null);
    try {
      if (clientStorage.current) {
        writeLocalCollections(email, next);
        writeLocalPicks(
          email,
          readLocalPicks(email).map((product) =>
            product.collectionId === collection.id
              ? { ...product, collectionId: null, collection: null }
              : product
          )
        );
      } else {
        const response = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete collection");
      }
      toast.success("Collection deleted");
    } catch (caught) {
      setCollections(previous);
      toast.error(caught instanceof Error ? caught.message : "Could not delete collection");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] p-5 sm:p-7 lg:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-lime">A PLACE FOR EVERYTHING</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Collections</h1>
          <p className="mt-2 text-sm text-muted">Turn a pile of wants into a point of view.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New collection</Button>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center gap-3 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-lime" /> Loading collections…
        </div>
      ) : (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <article key={collection.id} className="group overflow-visible rounded-[24px] border border-line bg-surface transition hover:-translate-y-1 hover:border-white/20">
              <div className="relative aspect-[16/10] overflow-visible rounded-t-[24px] bg-card">
                <div className="h-full overflow-hidden rounded-t-[24px]">
                  {collection.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={collection.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="grid h-full place-items-center bg-gradient-to-br from-white/[0.06] to-transparent text-6xl">{collection.emoji}</span>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-t-[24px] bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 text-4xl drop-shadow">{collection.emoji}</span>
                <div className="absolute right-3 top-3">
                  <button
                    aria-label={`Manage ${collection.name}`}
                    onClick={() => setMenuId(menuId === collection.id ? null : collection.id)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-ink/75 backdrop-blur"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuId === collection.id && (
                    <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-line bg-card p-2 shadow-2xl">
                      <button
                        onClick={() => {
                          setMenuId(null);
                          setDeleteTarget(collection);
                        }}
                        className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-xs font-semibold text-coral hover:bg-coral/10"
                      >
                        <Trash2 className="h-4 w-4" /> Delete collection
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <h2 className="text-lg font-semibold">{collection.name}</h2>
                  <p className="mt-1 text-xs text-muted">{collection.count ?? 0} {(collection.count ?? 0) === 1 ? "pick" : "picks"}</p>
                </div>
                <span className="text-sm text-muted">View →</span>
              </div>
            </article>
          ))}
          <button onClick={() => setCreating(true)} className="grid min-h-64 place-items-center rounded-[24px] border border-dashed border-line bg-white/[0.02] text-muted transition hover:border-lime/50 hover:text-lime">
            <span className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5">
                {collections.length ? <Plus className="h-5 w-5" /> : <FolderHeart className="h-5 w-5" />}
              </span>
              <span className="mt-3 block text-sm font-semibold">
                {collections.length ? "Create a collection" : "Create your first collection"}
              </span>
            </span>
          </button>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={createCollection} className="relative w-full max-w-md rounded-[28px] border border-line bg-card p-7 shadow-2xl">
            <button type="button" aria-label="Close" onClick={() => setCreating(false)} className="absolute right-5 top-5 text-muted hover:text-white"><X className="h-5 w-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-lime">NEW COLLECTION</p>
            <h2 className="mt-2 text-2xl font-bold">Gather the good stuff.</h2>
            <div className="mt-7 grid grid-cols-[80px_1fr] gap-3">
              <label>
                <span className="mb-2 block text-xs text-muted">Emoji</span>
                <input name="emoji" defaultValue="✨" className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-3 text-center text-xl" />
              </label>
              <label>
                <span className="mb-2 block text-xs text-muted">Name</span>
                <input name="name" required placeholder="Weekend escape" className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm" />
              </label>
            </div>
            <Button className="mt-6 w-full" size="lg">Create collection</Button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-[28px] border border-line bg-card p-7" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-2xl font-bold">Delete “{deleteTarget.name}”?</h2>
            <p className="mt-3 text-muted">The picks inside will stay in your Cartly without a collection.</p>
            <div className="mt-7 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteCollection(deleteTarget)}><Trash2 className="h-4 w-4" /> Delete</Button>
            </div>
          </div>
        </div>
      )}
      <UpgradeModal open={upgrade} onClose={() => setUpgrade(false)} />
    </div>
  );
}
