"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export function PublicNav() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link className="transition hover:text-white" href="/#features">
            {t("nav.features")}
          </Link>
          <Link className="transition hover:text-white" href="/#how-it-works">
            {t("nav.howItWorks")}
          </Link>
          <Link className="transition hover:text-white" href="/pricing">
            {t("nav.pricing")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/signin">{t("nav.signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/signup">
              {t("nav.getStarted")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
