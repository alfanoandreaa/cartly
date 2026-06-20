"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demoCollections } from "@/lib/demo-data";

export function CollectionsView() {
  const [creating, setCreating] = useState(false);
  const [collections, setCollections] = useState(demoCollections);

  function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setCollections([
      ...collections,
      {
        id: crypto.randomUUID(),
        name: String(data.get("name")),
        emoji: String(data.get("emoji") || "✨"),
        count: 0,
        imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1000&q=80"
      }
    ]);
    setCreating(false);
    toast.success("Collection created");
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

      <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <article key={collection.id} className="group overflow-hidden rounded-[24px] border border-line bg-surface transition hover:-translate-y-1 hover:border-white/20">
            <div className="relative aspect-[16/10] overflow-hidden bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={collection.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 text-4xl drop-shadow">{collection.emoji}</span>
              <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/75 backdrop-blur">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <h2 className="text-lg font-semibold">{collection.name}</h2>
                <p className="mt-1 text-xs text-muted">{collection.count} {collection.count === 1 ? "pick" : "picks"}</p>
              </div>
              <span className="text-sm text-muted">View →</span>
            </div>
          </article>
        ))}
        <button onClick={() => setCreating(true)} className="grid min-h-64 place-items-center rounded-[24px] border border-dashed border-line bg-white/[0.02] text-muted transition hover:border-lime/50 hover:text-lime">
          <span className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5"><Plus className="h-5 w-5" /></span>
            <span className="mt-3 block text-sm font-semibold">Create a collection</span>
          </span>
        </button>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={createCollection} className="relative w-full max-w-md rounded-[28px] border border-line bg-card p-7 shadow-2xl">
            <button type="button" onClick={() => setCreating(false)} className="absolute right-5 top-5 text-muted hover:text-white"><X className="h-5 w-5" /></button>
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
    </div>
  );
}
