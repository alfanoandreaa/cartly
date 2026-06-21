"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BellRing,
  Bookmark,
  Boxes,
  Check,
  Clock3,
  Eye,
  Heart,
  Link2,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PublicNav } from "@/components/layout/public-nav";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/i18n-provider";
import { demoProducts } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";

function MiniPick({ index }: { index: number }) {
  const { t } = useTranslation();
  const item = demoProducts[index];
  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {item.oldPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold text-white">
            −{Math.round((1 - item.price / item.oldPrice) * 100)}%
          </span>
        )}
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 backdrop-blur">
          <Heart className="h-4 w-4" />
        </span>
      </div>
      <div className="px-2 pb-2 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{item.siteName}</p>
        <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-bold">{formatPrice(item.price)}</p>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${item.inStock ? "bg-lime" : "bg-coral"}`} />
            {item.inStock ? t("landing.inStock") : t("landing.watching")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingContent() {
  const { t } = useTranslation();

  return (
    <main>
      <PublicNav />
      <section className="container-page relative overflow-hidden pb-24 pt-20 lg:pb-36 lg:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[100px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.07] px-4 py-2 text-xs font-semibold text-lime">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.badge")}
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-[-0.065em] sm:text-7xl lg:text-[92px] lg:leading-[.95]">
            {t("landing.heroTitle1")}
            <span className="block text-lime">{t("landing.heroTitle2")}</span>
          </h1>
          <p className="text-balance mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/signup">
                {t("landing.heroCtaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link href="/pricing">{t("landing.heroCtaSecondary")}</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">{t("landing.heroFinePrint")}</p>
        </div>

        <div className="relative mx-auto mt-20 max-w-6xl">
          <div className="absolute -inset-5 rounded-[42px] bg-gradient-to-b from-lime/15 to-transparent blur-2xl" />
          <div className="relative rounded-[28px] border border-white/10 bg-[#171717] p-3 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFD166]" />
                <span className="h-2.5 w-2.5 rounded-full bg-lime" />
              </div>
              <div className="flex h-8 w-52 items-center gap-2 rounded-lg bg-ink px-3 text-[10px] text-muted">
                <Search className="h-3 w-3" /> {t("landing.mockSearch")}
              </div>
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-lime to-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {demoProducts.map((_, index) => (
                <MiniPick key={index} index={index} />
              ))}
            </div>
          </div>
          <div className="absolute -bottom-7 left-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-card p-3 pr-5 shadow-card sm:left-10">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral/15 text-coral">
              <TrendingDown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted">{t("landing.mockPriceDropped")}</p>
              <p className="text-sm font-semibold">Arc Lounge Chair · −€141</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface/40 py-24">
        <div className="container-page">
          <p className="text-center text-xs font-bold uppercase tracking-[.25em] text-muted">{t("landing.problemEyebrow")}</p>
          <h2 className="text-balance mx-auto mt-4 max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-5xl">
            {t("landing.problemTitle")}
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {([
              [Link2, "landing.problem1Title", "landing.problem1Body"],
              [ShoppingBag, "landing.problem2Title", "landing.problem2Body"],
              [Clock3, "landing.problem3Title", "landing.problem3Body"]
            ] as const).map(([Icon, titleKey, bodyKey]) => (
              <div key={titleKey} className="rounded-3xl border border-line bg-card p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-lime">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{t(titleKey)}</h3>
                <p className="mt-3 leading-relaxed text-muted">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="container-page py-24 lg:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">{t("landing.featuresEyebrow")}</p>
            <h2 className="text-balance mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {t("landing.featuresSubtitle")}
            </p>
            <div className="mt-9 space-y-5">
              {([
                [Bookmark, "landing.feature1Title", "landing.feature1Body"],
                [Boxes, "landing.feature2Title", "landing.feature2Body"],
                [BellRing, "landing.feature3Title", "landing.feature3Body"]
              ] as const).map(([Icon, titleKey, bodyKey]) => (
                <div key={titleKey} className="flex gap-4">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{t(titleKey)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{t(bodyKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-[32px] border border-line bg-surface p-5 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-lime/10 blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-card p-4 sm:mt-12">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{t("landing.cardPriceHistory")}</span>
                  <span className="text-lime">−17.8%</span>
                </div>
                <div className="mt-8 flex h-32 items-end gap-2">
                  {[88, 83, 83, 69, 58, 44].map((height, i) => (
                    <span
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`flex-1 rounded-t ${i === 5 ? "bg-lime" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted">{t("landing.cardCurrent")}</p>
                    <p className="text-2xl font-bold">€649</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-lime" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
                      <PackageCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted">{t("landing.cardStockWatch")}</p>
                      <p className="font-semibold">{t("landing.cardBackInStock")}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-muted">{t("landing.cardCameraFound")}</p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{t("landing.cardCollection")}</p>
                    <span>🏡</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">{t("landing.cardDreamHome")}</p>
                  <div className="mt-4 flex -space-x-2">
                    {demoProducts.slice(0, 3).map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={item.id} src={item.imageUrl} alt="" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
                    ))}
                    <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-surface text-xs text-muted">+4</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-coral/20 bg-coral/5 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-coral">
                    <BellRing className="h-4 w-4" /> {t("landing.cardTargetClose")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-line bg-surface/40 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">{t("landing.howEyebrow")}</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("landing.howTitle")}</h2>
          </div>
          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            {([
              ["01", "landing.how1Title", "landing.how1Body", Bookmark],
              ["02", "landing.how2Title", "landing.how2Body", Boxes],
              ["03", "landing.how3Title", "landing.how3Body", Eye]
            ] as const).map(([number, titleKey, bodyKey, Icon], index) => (
              <div key={titleKey} className="relative rounded-3xl border border-line bg-card p-7">
                {index < 2 && <ArrowDownRight className="absolute -right-4 top-10 z-10 hidden h-8 w-8 text-line md:block" />}
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-white/[0.06]">{number}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold">{t(titleKey)}</h3>
                <p className="mt-3 leading-relaxed text-muted">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="container-page py-24 lg:py-36">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">{t("landing.pricingEyebrow")}</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("landing.pricingTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{t("landing.pricingSubtitle")}</p>
        </div>
        <PricingCards compact />
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {([
            ["landing.quote1", "Maya R.", "landing.role1"],
            ["landing.quote2", "Theo J.", "landing.role2"],
            ["landing.quote3", "Sofia L.", "landing.role3"]
          ] as const).map(([quoteKey, name, roleKey]) => (
            <figure key={name} className="rounded-3xl border border-line bg-surface p-7">
              <div className="mb-5 flex gap-1 text-lime">★★★★★</div>
              <blockquote className="text-lg leading-relaxed">{t(quoteKey)}</blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold">{name}</span>
                <span className="ml-2 text-muted">{t(roleKey)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-[36px] border border-lime/20 bg-lime px-6 py-16 text-center text-ink sm:px-12">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#0f0f0f_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative">
            <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">{t("landing.ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-ink/70">{t("landing.ctaSubtitle")}</p>
            <Button asChild size="lg" className="mt-8 bg-ink text-white hover:bg-ink/85">
              <Link href="/auth/signup">
                {t("landing.ctaButton")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted">{t("landing.footerTagline")}</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <Link className="hover:text-white" href="/pricing">{t("nav.pricing")}</Link>
            <Link className="hover:text-white" href="/auth/signin">{t("nav.signIn")}</Link>
            <Link className="hover:text-white" href="#">{t("landing.footerPrivacy")}</Link>
            <Link className="hover:text-white" href="#">{t("landing.footerTerms")}</Link>
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Cartly</p>
        </div>
      </footer>
    </main>
  );
}
