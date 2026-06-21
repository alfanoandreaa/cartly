"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/i18n-provider";

export function ResetPasswordForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    const confirm = String(data.get("confirm"));

    if (password !== confirm) {
      setError(t("auth.passwordsNoMatch"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? t("auth.errReset"));
      setDone(true);
      setTimeout(() => router.push("/auth/signin"), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-8 rounded-2xl border border-coral/20 bg-coral/[0.06] p-6 text-center">
        <h2 className="text-lg font-semibold text-coral">{t("auth.invalidLink")}</h2>
        <p className="mt-2 text-sm text-muted">{t("auth.invalidLinkBody")}</p>
        <Button asChild className="mt-5">
          <Link href="/auth/forgot">{t("auth.requestNew")}</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{t("auth.passwordUpdated")}</h2>
        <p className="mt-2 text-sm text-muted">{t("auth.takingToSignin")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">{t("auth.newPassword")}</span>
        <span className="relative block">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 pr-12 text-sm placeholder:text-muted/60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">{t("auth.confirmPassword")}</span>
        <input
          name="confirm"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("auth.repeatPlaceholder")}
          className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-muted/60"
        />
      </label>
      {error && (
        <p className="rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.setNewPassword")}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
