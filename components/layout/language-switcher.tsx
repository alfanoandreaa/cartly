"use client";

import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Flag } from "@/components/brand/flag";
import { useTranslation } from "@/components/providers/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = LOCALES.find((entry) => entry.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm transition hover:border-white/25 hover:bg-card",
          open && "border-lime/50"
        )}
      >
        <Globe className="h-4 w-4 text-lime" />
        <Flag code={active.code} />
        <span className="hidden font-medium sm:inline">{active.code.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-card"
        >
          {LOCALES.map((entry) => {
            const selected = entry.code === locale;
            return (
              <button
                key={entry.code}
                role="option"
                aria-selected={selected}
                onClick={() => choose(entry.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  selected ? "bg-lime/10 text-white" : "text-muted hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Flag code={entry.code} />
                <span className="flex-1 text-left font-medium">{entry.label}</span>
                {selected && <Check className="h-4 w-4 text-lime" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
