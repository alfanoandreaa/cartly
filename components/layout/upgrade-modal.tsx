"use client";

import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-lime/30 bg-card p-6 shadow-2xl sm:p-9"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-muted transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime text-ink">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-lime">Your wishlist is popular</p>
          <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
            You’ve hit your free limit — go Cartly Pro
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Keep every good find, get price-drop alerts, and unlock a faster, smarter Cartly.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["20 active picks", "Unlimited collections", "Price & stock alerts", "Public sharing"].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-lime/15 text-lime">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={() => {
                window.location.href = "/api/stripe/checkout?interval=year";
              }}
            >
              Get Cartly Pro · €59/year
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">That’s €4.92/month. Cancel whenever you like.</p>
        </div>
      </div>
    </div>
  );
}
