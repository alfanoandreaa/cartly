"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Check,
  FolderHeart,
  MoreHorizontal,
  RefreshCw,
  Signal,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartlyCollection, CartlyProduct, Priority } from "@/lib/cartly-data";
import { cn, formatPrice } from "@/lib/utils";

type ProductUpdate = {
  priority?: Priority;
  collectionId?: string | null;
};

function ProductActions({
  product,
  collections,
  onUpdate,
  onDelete
}: {
  product: CartlyProduct;
  collections: CartlyCollection[];
  onUpdate: (update: ProductUpdate) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function update(updateValue: ProductUpdate) {
    setBusy(true);
    try {
      await onUpdate(updateValue);
    } catch {
      // The parent restores optimistic state and shows the error toast.
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label={`Manage ${product.title}`}
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-white/5 hover:text-white"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {open && (
          <div
            className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-line bg-[#191919] p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-3 pb-2 pt-1">
              <p className="text-xs font-semibold text-white">Manage pick</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{product.title}</p>
            </div>

            <div className="border-t border-line px-2 py-3">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted">
                <Signal className="h-3.5 w-3.5" /> Priority
              </p>
              <div className="grid grid-cols-3 gap-1">
                {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((priority) => (
                  <button
                    type="button"
                    disabled={busy}
                    key={priority}
                    onClick={() => update({ priority })}
                    className={cn(
                      "flex h-8 items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition hover:bg-white/10",
                      product.priority === priority ? "bg-white/10 text-white" : "text-muted"
                    )}
                  >
                    {product.priority === priority && <Check className="h-3 w-3 text-lime" />}
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <label className="block border-t border-line px-2 py-3">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted">
                <FolderHeart className="h-3.5 w-3.5" /> Collection
              </span>
              <select
                disabled={busy}
                value={product.collectionId ?? ""}
                onChange={(event) => update({ collectionId: event.target.value || null })}
                className="focus-ring h-9 w-full rounded-lg border border-line bg-card px-2 text-xs"
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.emoji} {collection.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmDelete(true);
              }}
              className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold text-coral transition hover:bg-coral/10"
            >
              <Trash2 className="h-4 w-4" /> Delete pick
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={() => setConfirmDelete(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-${product.id}`}
            onMouseDown={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-[28px] border border-line bg-card p-7 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close confirmation"
              onClick={() => setConfirmDelete(false)}
              className="absolute right-5 top-5 text-muted transition hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 id={`delete-${product.id}`} className="mt-5 text-2xl font-bold">
              Delete this pick?
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              “{product.title}” will be removed from your Cartly. This action cannot be undone.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onDelete();
                    setConfirmDelete(false);
                  } catch {
                    // Keep the confirmation open so the user can retry.
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete pick
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ProductCard({
  product,
  collections,
  list = false,
  onUpdate,
  onDelete,
  onRefresh
}: {
  product: CartlyProduct;
  collections: CartlyCollection[];
  list?: boolean;
  onUpdate: (update: ProductUpdate) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const discount =
    product.oldPrice && product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  if (list) {
    return (
      <article className="group grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:border-white/20 sm:grid-cols-[88px_1fr_130px_130px_40px]">
        <Link href={`/app/dashboard/product/${product.id}`} className="h-[72px] overflow-hidden rounded-xl bg-card sm:h-[88px]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <span className="grid h-full place-items-center text-2xl">🛍️</span>
          )}
        </Link>
        <div className="min-w-0">
          <Link href={`/app/dashboard/product/${product.id}`}>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
            <h3 className="mt-1 truncate font-semibold">{product.title}</h3>
            <p className="mt-1 hidden text-xs text-muted sm:block">{product.collection?.name ?? "No collection"}</p>
          </Link>
          <button
            type="button"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
              } catch {
                // The parent shows the refresh error toast.
              } finally {
                setRefreshing(false);
              }
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-lime transition hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            Aggiorna prezzo
          </button>
        </div>
        <div className="hidden sm:block">
          <p className="font-semibold">{formatPrice(product.price, product.priceCurrency)}</p>
          {product.oldPrice && <p className="text-xs text-muted line-through">{formatPrice(product.oldPrice)}</p>}
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
          <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-lime" : "bg-coral"}`} />
          {product.inStock ? "In stock" : "Out of stock"}
        </div>
        <ProductActions product={product} collections={collections} onUpdate={onUpdate} onDelete={onDelete} />
      </article>
    );
  }

  return (
    <article className="group overflow-visible rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-card">
      <Link href={`/app/dashboard/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden rounded-t-2xl bg-card">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full place-items-center text-5xl">🛍️</span>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {discount ? (
            <span className="flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
              <ArrowDown className="h-3 w-3" /> {discount}%
            </span>
          ) : (
            <span />
          )}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${product.inStock ? "bg-lime" : "bg-coral"}`} />
          {product.inStock ? "In stock" : "Watching stock"}
        </span>
      </Link>
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/app/dashboard/product/${product.id}`} className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">{product.siteName}</p>
            <h3 className="mt-1 truncate font-semibold">{product.title}</h3>
          </Link>
          <ProductActions product={product} collections={collections} onUpdate={onUpdate} onDelete={onDelete} />
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
        <p className="mt-3 truncate text-[11px] text-muted">
          {product.collection ? `${product.collection.emoji} ${product.collection.name}` : "No collection"}
        </p>
        <button
          type="button"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            try {
              await onRefresh();
            } catch {
              // The parent shows the refresh error toast.
            } finally {
              setRefreshing(false);
            }
          }}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-line text-xs font-semibold text-muted transition hover:border-lime/40 hover:text-lime disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Aggiornamento…" : "Aggiorna prezzo"}
        </button>
      </div>
    </article>
  );
}
