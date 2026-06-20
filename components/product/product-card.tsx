"use client";

import Link from "next/link";
import { ArrowDown, Heart, MoreHorizontal } from "lucide-react";
import type { DemoProduct } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, list = false }: { product: DemoProduct; list?: boolean }) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  if (list) {
    return (
      <Link
        href={`/app/dashboard/product/${product.id}`}
        className="group grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:border-white/20 sm:grid-cols-[88px_1fr_130px_130px_40px]"
      >
        <div className="h-[72px] overflow-hidden rounded-xl bg-card sm:h-[88px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
          <h3 className="mt-1 truncate font-semibold">{product.title}</h3>
          <p className="mt-1 hidden text-xs text-muted sm:block">{product.collection}</p>
        </div>
        <div className="hidden sm:block">
          <p className="font-semibold">{formatPrice(product.price, product.priceCurrency)}</p>
          {product.oldPrice && <p className="text-xs text-muted line-through">{formatPrice(product.oldPrice)}</p>}
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
          <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-lime" : "bg-coral"}`} />
          {product.inStock ? "In stock" : "Out of stock"}
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted" />
      </Link>
    );
  }

  return (
    <Link
      href={`/app/dashboard/product/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {discount ? (
            <span className="flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
              <ArrowDown className="h-3 w-3" /> {discount}%
            </span>
          ) : (
            <span />
          )}
          <button className="grid h-8 w-8 place-items-center rounded-full bg-ink/75 text-white backdrop-blur transition hover:bg-ink">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${product.inStock ? "bg-lime" : "bg-coral"}`} />
          {product.inStock ? "In stock" : "Watching stock"}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
            <h3 className="mt-1 truncate font-semibold">{product.title}</h3>
          </div>
          <button className="shrink-0 text-muted hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatPrice(product.price, product.priceCurrency)}</span>
            {product.oldPrice && <span className="text-xs text-muted line-through">{formatPrice(product.oldPrice)}</span>}
          </div>
          <span
            className={`h-2 w-2 rounded-full ${
              product.priority === "HIGH" ? "bg-coral" : product.priority === "MEDIUM" ? "bg-[#FFD166]" : "bg-muted"
            }`}
            title={`${product.priority.toLowerCase()} priority`}
          />
        </div>
      </div>
    </Link>
  );
}
