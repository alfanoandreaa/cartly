"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";
import { useTranslation } from "@/components/providers/i18n-provider";

export function SignInContent({ googleEnabled }: { googleEnabled: boolean }) {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Logo />
        <div className="my-auto mx-auto w-full max-w-md py-12">
          <p className="text-sm font-semibold text-lime">{t("auth.signinEyebrow")}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{t("auth.signinTitle")}</h1>
          <p className="mt-3 text-muted">{t("auth.signinSubtitle")}</p>
          <AuthForm mode="signin" googleEnabled={googleEnabled} />
          <p className="mt-7 text-center text-sm text-muted">
            {t("auth.newToCartly")}{" "}
            <Link href="/auth/signup" className="font-semibold text-white hover:text-lime">
              {t("auth.createAccount")}
            </Link>
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        <blockquote className="absolute bottom-16 left-12 right-12 max-w-xl text-3xl font-medium leading-tight tracking-tight">
          {t("auth.quote1")}
          <footer className="mt-5 text-sm font-normal text-white/60">{t("auth.quoteAuthor1")}</footer>
        </blockquote>
      </aside>
    </main>
  );
}
