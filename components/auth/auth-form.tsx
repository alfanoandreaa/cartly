"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/i18n-provider";
import { setRememberPreference } from "@/lib/remember";
import { cn } from "@/lib/utils";

export function AuthForm({
  mode,
  googleEnabled = false
}: {
  mode: "signin" | "signup";
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function handleGoogle() {
    setRememberPreference(remember);
    signIn("google", { callbackUrl: "/app/dashboard" });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: data.get("name"), email, password })
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error ?? t("auth.errCreate"));
        }
      }

      setRememberPreference(remember);
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error(t("auth.errCredentials"));
      router.push(mode === "signup" ? "/app/onboarding" : "/app/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {mode === "signup" && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">{t("auth.name")}</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            className="focus-ring h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-muted/60"
          />
        </label>
      )}
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
      <label className="block">
        <span className="mb-2 flex items-center justify-between text-sm font-medium">
          {t("auth.password")}
          {mode === "signin" && <Link href="/auth/forgot" className="text-xs text-lime hover:underline">{t("auth.forgot")}</Link>}
        </span>
        <span className="relative block">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
      {error && <p className="rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>}

      <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="h-4 w-4 rounded accent-lime"
        />
        {t("auth.remember")}
      </label>

      <div className={cn("grid gap-3", googleEnabled && "sm:grid-cols-2")}>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? t("auth.createAccount") : t("nav.signIn")}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
        {googleEnabled && (
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={handleGoogle}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
              <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/>
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4L15.4 17c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/>
              <path fill="#FBBC05" d="M6.5 13.9a6 6 0 0 1 0-3.8V7.4H3.1a10 10 0 0 0 0 9.2l3.4-2.7Z"/>
              <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/>
            </svg>
            {t("auth.google")}
          </Button>
        )}
      </div>
    </form>
  );
}
