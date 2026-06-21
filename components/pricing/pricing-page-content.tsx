"use client";

import { PublicNav } from "@/components/layout/public-nav";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { useTranslation } from "@/components/providers/i18n-provider";

export function PricingPageContent() {
  const { t } = useTranslation();

  const faqs = [
    [t("pricing.faqQ1"), t("pricing.faqA1")],
    [t("pricing.faqQ2"), t("pricing.faqA2")],
    [t("pricing.faqQ3"), t("pricing.faqA3")],
    [t("pricing.faqQ4"), t("pricing.faqA4")],
    [t("pricing.faqQ5"), t("pricing.faqA5")]
  ];

  return (
    <main>
      <PublicNav />
      <section className="container-page py-20 text-center sm:py-28">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">{t("pricing.eyebrow")}</p>
        <h1 className="text-balance mx-auto mt-4 max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          {t("pricing.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t("pricing.subtitle")}</p>
        <div className="mt-14 text-left">
          <PricingCards />
        </div>
      </section>
      <section className="border-t border-line bg-surface/40 py-20">
        <div className="container-page mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">{t("pricing.faqTitle")}</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold">
                  {question}
                  <span className="text-2xl font-light text-lime transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pt-3 leading-relaxed text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
