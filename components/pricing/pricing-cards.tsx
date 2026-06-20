"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const freeFeatures = [
  "Save up to 6 products",
  "Create up to 3 collections",
  "Daily price refresh",
  "Notes, tags, and priorities"
];

const proFeatures = [
  "Save up to 20 products",
  "Unlimited collections",
  "Price and stock alerts",
  "Public sharing",
  "Priority 6-hour refresh",
  "Advanced price history"
];

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex justify-center">
        <div className="flex rounded-xl border border-line bg-surface p-1 text-sm">
          <button
            onClick={() => setAnnual(false)}
            className={cn("rounded-lg px-4 py-2 transition", !annual ? "bg-card text-white" : "text-muted")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn("rounded-lg px-4 py-2 transition", annual ? "bg-card text-white" : "text-muted")}
          >
            Yearly <span className="ml-1 text-lime">Save 30%</span>
          </button>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-surface p-7 sm:p-9">
          <p className="text-sm font-semibold text-muted">FREE</p>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight">€0</span>
            <span className="mb-1 text-muted">forever</span>
          </div>
          <p className="mt-4 max-w-sm text-muted">The cleanest way to keep a focused shopping shortlist.</p>
          <Button asChild variant="secondary" className="mt-7 w-full">
            <Link href="/auth/signup">Start saving for free</Link>
          </Button>
          <ul className="mt-8 space-y-4 text-sm">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-muted" />
                {feature}
              </li>
            ))}
          </ul>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-lime/40 bg-card p-7 shadow-glow sm:p-9">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-lime/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-lime">
                <Sparkles className="h-4 w-4" /> CARTLY PRO
              </p>
              <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">MOST LOVED</span>
            </div>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">€{annual ? "4.92" : "6.99"}</span>
              <span className="mb-1 text-muted">/ month</span>
            </div>
            <p className="mt-2 text-sm text-lime">
              {annual ? "€59 billed yearly — two months on us" : "Billed monthly, cancel anytime"}
            </p>
            <p className="mt-4 max-w-sm text-muted">
              For thoughtful shoppers who want the right thing at the right price.
            </p>
            <Button
              className="mt-7 w-full"
              onClick={() => {
                window.location.href = `/api/stripe/checkout?interval=${annual ? "year" : "month"}`;
              }}
            >
              Go Cartly Pro
            </Button>
            <ul className="mt-8 space-y-4 text-sm">
              {proFeatures.slice(0, compact ? 4 : undefined).map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-lime/15">
                    <Check className="h-3.5 w-3.5 text-lime" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
