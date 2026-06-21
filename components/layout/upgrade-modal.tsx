"use client";

import { BellRing, Bookmark, FolderHeart, Share2, Sparkles, X } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const benefits: { icon: typeof Bookmark; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: Bookmark, titleKey: "upgrade.featurePicksTitle", bodyKey: "upgrade.featurePicksBody" },
  { icon: BellRing, titleKey: "upgrade.featureAlertsTitle", bodyKey: "upgrade.featureAlertsBody" },
  { icon: FolderHeart, titleKey: "upgrade.featureCollectionsTitle", bodyKey: "upgrade.featureCollectionsBody" },
  { icon: Share2, titleKey: "upgrade.featureSharingTitle", bodyKey: "upgrade.featureSharingBody" }
];

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
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
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-lime">{t("upgrade.eyebrow")}</p>
          <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">{t("upgrade.title")}</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">{t("upgrade.subtitle")}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="flex gap-3 rounded-2xl border border-line bg-surface/60 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t(titleKey)}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t(bodyKey)}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={() => {
                window.location.href = "/api/stripe/checkout?interval=year";
              }}
            >
              {t("upgrade.cta")}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t("upgrade.later")}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">{t("upgrade.fineprint")}</p>
        </div>
      </div>
    </div>
  );
}
