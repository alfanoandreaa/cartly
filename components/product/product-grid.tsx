"use client";

import { Grid2X2, List, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { demoProducts } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function ProductGrid() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(
    () => (filter === "All" ? demoProducts : demoProducts.filter((product) => product.collection === filter)),
    [filter]
  );
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date()).toUpperCase();

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-lime">{today}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Your picks</h1>
          <p className="mt-2 text-sm text-muted">Five good reasons not to keep 34 tabs open.</p>
        </div>
        <Button asChild className="sm:hidden">
          <Link href="/app/dashboard/add-product">
            <Plus className="h-4 w-4" /> Add a pick
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
        {["All", "Dream home", "Creative kit", "Everyday rotation"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === item ? "border-lime bg-lime text-ink" : "border-line bg-surface text-muted hover:text-white"
            )}
          >
            {item}
          </button>
        ))}
        <div className="ml-auto hidden items-center gap-1 rounded-xl border border-line bg-surface p-1 sm:flex">
          <button
            className={cn("grid h-8 w-8 place-items-center rounded-lg text-muted", view === "grid" && "bg-card text-white")}
            onClick={() => setView("grid")}
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button
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

      <div className={cn("mt-5 grid gap-4", view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} list={view === "list"} />
        ))}
      </div>
    </>
  );
}
