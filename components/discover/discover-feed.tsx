"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Flame, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { Button } from "@/components/ui/button";
import { discoverProducts } from "@/lib/demo-data";
import { cn, formatPrice } from "@/lib/utils";

const categories = ["All", "Fashion", "Home", "Beauty", "Tech", "Books", "Food", "Other"];

export function DiscoverFeed() {
  const [category, setCategory] = useState("All");
  const [upgrade, setUpgrade] = useState(false);
  const [plan] = useState<"FREE" | "PRO">("FREE");
  const products = useMemo(
    () => (category === "All" ? discoverProducts : discoverProducts.filter((product) => product.category === category.toUpperCase())),
    [category]
  );

  return (
    <div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-lime"><Flame className="h-4 w-4" /> WHAT THE INTERNET WANTS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Discover</h1>
          <p className="mt-2 text-sm text-muted">Interesting things, saved by people with excellent tabs.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-4 py-2 text-xs text-lime">
          <Sparkles className="h-3.5 w-3.5" /> Cartly Pro preview
        </div>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition",
              category === item ? "border-lime bg-lime text-ink" : "border-line bg-surface text-muted hover:text-white"
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="relative mt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 12).map((product, index) => (
            <article key={product.id} className={cn("group overflow-hidden rounded-2xl border border-line bg-surface", plan === "FREE" && index > 2 && "select-none blur-[5px]")}>
              <div className="relative aspect-[4/3] overflow-hidden bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">#{index + 1} trending</span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
                <h2 className="mt-1 truncate font-semibold">{product.title}</h2>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold">{formatPrice(product.price)}</span>
                  <button
                    onClick={() => plan === "PRO" ? toast.success("Saved to your Cartly") : setUpgrade(true)}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-muted transition hover:bg-lime hover:text-ink"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-muted">{product.saves} people saved this</p>
              </div>
            </article>
          ))}
        </div>
        {plan === "FREE" && (
          <div className="absolute inset-x-0 top-[33%] z-10 mx-auto max-w-md rounded-[28px] border border-lime/30 bg-card/95 p-7 text-center shadow-2xl backdrop-blur-xl">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-lime text-ink"><Lock className="h-5 w-5" /></span>
            <h2 className="mt-5 text-2xl font-bold">A whole internet of good taste.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Unlock trending picks, category filters, and one-tap saves with Cartly Pro.</p>
            <Button className="mt-6 w-full" onClick={() => setUpgrade(true)}>Unlock Discover</Button>
          </div>
        )}
      </div>
      <UpgradeModal open={upgrade} onClose={() => setUpgrade(false)} />
    </div>
  );
}
