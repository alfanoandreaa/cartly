"use client";

import { Check, Download, LogOut, Save, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag } from "@/components/brand/flag";
import { PlanBadge } from "@/components/layout/plan-badge";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useAccent } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { LOCALES, type TranslationKey } from "@/lib/i18n";
import { ACCENT_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

function initialsFrom(value: string) {
  return value
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}

const notifications: { titleKey: TranslationKey; bodyKey: TranslationKey; checked: boolean }[] = [
  { titleKey: "settings.notifPriceTitle", bodyKey: "settings.notifPriceBody", checked: true },
  { titleKey: "settings.notifStockTitle", bodyKey: "settings.notifStockBody", checked: true },
  { titleKey: "settings.notifDigestTitle", bodyKey: "settings.notifDigestBody", checked: false }
];

export function SettingsView() {
  const { data: session, update } = useSession();
  const { t, locale, setLocale } = useTranslation();
  const { accent, setAccent } = useAccent();
  const plan = session?.user?.plan ?? "FREE";
  const email = session?.user?.email ?? "";
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(session?.user?.name ?? "");
  }, [session?.user?.name]);

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your Cartly account? This permanently removes your picks, collections, and price history. This cannot be undone."
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/user", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete your account");
      toast.success("Your account has been deleted");
      await signOut({ callbackUrl: "/" });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete your account");
      setDeleting(false);
    }
  }

  async function saveProfile() {
    if (name.trim().length < 2) {
      toast.error("Please enter your name (at least 2 characters).");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save your profile");
      }
      await update?.();
      toast.success("Profile saved");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-7 lg:p-10">
      <p className="text-sm font-semibold text-lime">{t("settings.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t("settings.title")}</h1>
      <div className="mt-9 space-y-6">
        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t("settings.profile")}</h2>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-lime to-emerald-500 text-lg font-bold text-ink">
              {initialsFrom(name || email || "Cartly")}
            </span>
            <div>
              <p className="text-sm font-medium">{name || t("settings.yourAccount")}</p>
              <p className="mt-1 text-xs text-muted">{email || t("settings.signedIn")}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-medium text-muted">{t("settings.name")}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-4 text-sm"
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-medium text-muted">{t("settings.email")}</span>
              <input
                value={email}
                readOnly
                className="focus-ring h-11 w-full cursor-not-allowed rounded-xl border border-line bg-card px-4 text-sm text-muted"
              />
            </label>
          </div>
          <Button size="sm" className="mt-5" disabled={saving} onClick={saveProfile}>
            <Save className="h-4 w-4" /> {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t("settings.appearance")}</h2>
          <p className="mt-1 text-sm text-muted">{t("settings.appearanceBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {ACCENT_THEMES.map((theme) => {
              const selected = theme.id === accent;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAccent(theme.id)}
                  aria-pressed={selected}
                  aria-label={theme.name}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition",
                    selected ? "border-white/40 bg-white/[0.06]" : "border-line bg-card hover:border-white/20"
                  )}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full"
                    style={{ backgroundColor: theme.hex }}
                  >
                    {selected && <Check className="h-4 w-4 text-ink" />}
                  </span>
                  <span className="text-sm font-medium">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t("settings.language")}</h2>
          <p className="mt-1 text-sm text-muted">{t("settings.languageBody")}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {LOCALES.map((entry) => {
              const selected = entry.code === locale;
              return (
                <button
                  key={entry.code}
                  onClick={() => setLocale(entry.code)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                    selected ? "border-lime bg-lime/10 text-white" : "border-line bg-card text-muted hover:text-white"
                  )}
                >
                  <Flag code={entry.code} />
                  {entry.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">{t("settings.subscription")}</h2><PlanBadge plan={plan} /></div>
              <p className="mt-2 text-sm text-muted">
                {plan === "PRO" ? t("settings.subProOn") : t("settings.subFree")}
              </p>
            </div>
            <Button onClick={() => window.location.href = "/pricing"}>
              {plan === "PRO" ? t("settings.managePlan") : t("settings.viewPro")}
            </Button>
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t("settings.notifications")}</h2>
          <div className="mt-5 divide-y divide-line">
            {notifications.map(({ titleKey, bodyKey, checked }) => (
              <label key={titleKey} className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span><span className="block text-sm font-medium">{t(titleKey)}</span><span className="mt-1 block text-xs text-muted">{t(bodyKey)}</span></span>
                <input type="checkbox" defaultChecked={checked} className="h-5 w-5 accent-lime" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t("settings.data")}</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast.success(t("settings.exportToast"))}><Download className="h-4 w-4" /> {t("settings.export")}</Button>
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="h-4 w-4" /> {t("settings.signout")}</Button>
          </div>
        </section>

        <section className="rounded-[24px] border border-coral/20 bg-coral/[0.04] p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-coral">{t("settings.danger")}</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-muted">{t("settings.dangerBody")}</p>
            <Button variant="danger" disabled={deleting} onClick={deleteAccount}>
              <Trash2 className="h-4 w-4" /> {deleting ? t("settings.deleting") : t("settings.delete")}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
