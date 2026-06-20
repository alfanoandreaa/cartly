"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Link2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function OnboardingFlow() {
  const router = useRouter();

  function finish() {
    router.push("/app/dashboard");
  }

  return (
    <main className="min-h-screen bg-ink">
      <header className="flex h-16 items-center justify-between border-b border-line px-5 sm:px-8">
        <Logo />
        <button onClick={finish} className="text-sm text-muted transition hover:text-white">
          Skip for now
        </button>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink">
          <Check className="h-4 w-4" />
        </span>
        <section className="mt-9">
          <p className="text-sm font-semibold text-lime">YOUR FIRST PICK</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            If it has a link, Cartly can save it.
          </h1>
          <p className="mt-4 text-muted">
            Copy a product URL from any store. Cartly identifies the shop, reads its product page,
            and collects the image, title, price, and availability for you.
          </p>
          <div className="mt-10 rounded-[28px] border border-line bg-surface p-5 sm:p-8">
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">
                Try it from your dashboard
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm text-muted">
                <Link2 className="h-4 w-4" /> https://your-favorite-store.com/perfect-thing
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm text-lime">
                <Sparkles className="h-4 w-4" /> Cartly does the tedious part automatically.
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-muted">
              {["Paste link", "Cartly collects", "Start tracking"].map((label, index) => (
                <div key={label}>
                  <span className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/5 font-bold text-white">
                    {index + 1}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <Button size="lg" className="mt-9 w-full" onClick={finish}>
            Take me to Cartly <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      </div>
    </main>
  );
}
