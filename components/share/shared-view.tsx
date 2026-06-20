"use client";

import Link from "next/link";
import { BookmarkPlus, Eye, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { DemoProduct } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

export function SharedView({ product }: { product: DemoProduct }) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button asChild variant="secondary" size="sm"><Link href="/auth/signup">Make your own Cartly</Link></Button>
        </div>
      </header>
      <div className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm text-muted">A pick shared by Alex</p>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Share link copied"); }} className="flex items-center gap-2 text-sm text-muted hover:text-white">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <article className="grid overflow-hidden rounded-[32px] border border-line bg-surface md:grid-cols-2">
            <div className="aspect-square md:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-lime">{product.siteName}</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">{product.title}</h1>
              <p className="mt-5 text-3xl font-bold">{formatPrice(product.price)}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted"><span className="h-2 w-2 rounded-full bg-lime" /> In stock when Cartly last checked</p>
              {product.personalNote && <blockquote className="mt-7 border-l-2 border-lime pl-4 text-sm italic leading-relaxed text-muted">“{product.personalNote}”</blockquote>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="flex-1"><a href={product.url} target="_blank" rel="noreferrer">Visit store <ExternalLink className="h-4 w-4" /></a></Button>
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => toast.success("Sign in to save this pick")}><BookmarkPlus className="h-4 w-4" /> Save to my Cartly</Button>
              </div>
            </div>
          </article>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted"><Eye className="h-3.5 w-3.5" /> Viewed 128 times</p>
        </div>
      </div>
    </main>
  );
}

export function SharedCollectionView({
  name,
  emoji,
  products
}: {
  name: string;
  emoji: string;
  products: DemoProduct[];
}) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button asChild variant="secondary" size="sm"><Link href="/auth/signup">Make your own Cartly</Link></Button>
        </div>
      </header>
      <div className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-muted">A collection shared by Alex</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">{emoji} {name}</h1>
          <p className="mt-4 text-muted">{products.length} considered picks, gathered in one place.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
                  <h2 className="mt-1 font-semibold">{product.title}</h2>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold">{formatPrice(product.price)}</span>
                    <Button asChild size="sm" variant="secondary"><a href={product.url} target="_blank" rel="noreferrer">View</a></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
