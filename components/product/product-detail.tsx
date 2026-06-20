"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BellRing, ExternalLink, Heart, Save, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { Button } from "@/components/ui/button";
import type { DemoProduct } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

export function ProductDetail({ product }: { product: DemoProduct }) {
  const [note, setNote] = useState(product.personalNote ?? "");
  const [priority, setPriority] = useState(product.priority);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-10">
      <Link href="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to all picks
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
          <div className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink/75 backdrop-blur">
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
              <Button variant="danger" size="icon" onClick={() => toast.success("Pick removed from your wishlist")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{product.title}</h1>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
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
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-muted">Collection</span>
                <select className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-3 text-sm" defaultValue={product.collection}>
                  <option>Dream home</option>
                  <option>Creative kit</option>
                  <option>Everyday rotation</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-muted">Priority</span>
                <select
                  className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as typeof priority)}
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
            <Button size="sm" className="mt-4" onClick={() => toast.success("Your changes are saved")}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>
      </div>
      <section className="mt-6 rounded-[28px] border border-line bg-surface p-5 sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">THE LONG GAME</p>
          <h2 className="mt-2 text-2xl font-bold">Price history</h2>
        </div>
        <PriceHistoryChart data={product.history} />
      </section>
    </div>
  );
}
