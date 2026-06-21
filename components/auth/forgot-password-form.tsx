"use client";

import { useState } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/i18n-provider";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email"));

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? t("auth.errSendReset"));
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{t("auth.checkInbox")}</h2>
        <p className="mt-2 text-sm text-muted">{t("auth.checkInboxBody")}</p>
        <p className="mt-4 text-xs text-muted">
          {t("auth.didntGet")}{" "}
          <button onClick={() => setSent(false)} className="font-semibold text-lime hover:underline">
            {t("auth.tryAnother")}
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">{t("auth.email")}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-muted/60"
        />
      </label>
      {error && (
        <p className="rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.sendReset")}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
