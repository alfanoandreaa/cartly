"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Link2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const interests = [
  ["Fashion", "👟"],
  ["Home", "🛋️"],
  ["Beauty", "✨"],
  ["Tech", "💻"],
  ["Books", "📚"],
  ["Food", "🍵"],
  ["Other gems", "💎"]
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["Home", "Tech"]);

  function finish() {
    router.push("/app/dashboard");
  }

  return (
    <main className="min-h-screen bg-ink">
      <header className="flex h-16 items-center justify-between border-b border-line px-5 sm:px-8">
        <Logo />
        <button onClick={finish} className="text-sm text-muted transition hover:text-white">Skip for now</button>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <div className="mb-10 flex items-center gap-3">
          {[1, 2].map((number) => (
            <div key={number} className="flex flex-1 items-center gap-3">
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", step >= number ? "bg-lime text-ink" : "bg-card text-muted")}>
                {step > number ? <Check className="h-4 w-4" /> : number}
              </span>
              <span className={cn("h-1 flex-1 rounded-full", step > number ? "bg-lime" : "bg-card", number === 2 && "hidden")} />
            </div>
          ))}
        </div>
        {step === 1 ? (
          <section>
            <p className="text-sm font-semibold text-lime">A LITTLE TASTE TEST</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">What catches your eye?</h1>
            <p className="mt-4 text-muted">Pick a few interests. We’ll use them to make Discover feel like your corner of the internet.</p>
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {interests.map(([label, emoji]) => {
                const active = selected.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => setSelected(active ? selected.filter((item) => item !== label) : [...selected, label])}
                    className={cn(
                      "relative rounded-2xl border p-5 text-left transition",
                      active ? "border-lime bg-lime/10" : "border-line bg-surface hover:border-white/20"
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <p className="mt-3 text-sm font-semibold">{label}</p>
                    {active && <Check className="absolute right-3 top-3 h-4 w-4 text-lime" />}
                  </button>
                );
              })}
            </div>
            <Button size="lg" className="mt-9 w-full" onClick={() => setStep(2)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </section>
        ) : (
          <section>
            <p className="text-sm font-semibold text-lime">YOUR FIRST PICK</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">If it has a link, Cartly can save it.</h1>
            <p className="mt-4 text-muted">Copy a product URL from any store. We’ll bring over the photo, title, price, and stock status.</p>
            <div className="mt-10 rounded-[28px] border border-line bg-surface p-5 sm:p-8">
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-muted">Try it later from your dashboard</p>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm text-muted">
                  <Link2 className="h-4 w-4" /> https://your-favorite-store.com/perfect-thing
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-lime">
                  <Sparkles className="h-4 w-4" /> Cartly does the tedious part.
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-muted">
                {["Paste link", "Review details", "Start tracking"].map((label, index) => (
                  <div key={label}>
                    <span className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/5 font-bold text-white">{index + 1}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <Button size="lg" className="mt-9 w-full" onClick={finish}>
              Take me to Cartly <ArrowRight className="h-4 w-4" />
            </Button>
            <button onClick={() => setStep(1)} className="mt-4 w-full text-sm text-muted hover:text-white">Back</button>
          </section>
        )}
      </div>
    </main>
  );
}
