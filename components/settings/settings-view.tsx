"use client";

import { Download, ExternalLink, LogOut, Save, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { PlanBadge } from "@/components/layout/plan-badge";
import { Button } from "@/components/ui/button";

export function SettingsView() {
  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-7 lg:p-10">
      <p className="text-sm font-semibold text-lime">MAKE CARTLY YOURS</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
      <div className="mt-9 space-y-6">
        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-lime to-emerald-500 text-lg font-bold text-ink">AM</span>
            <div>
              <Button variant="secondary" size="sm">Change photo</Button>
              <p className="mt-2 text-xs text-muted">JPG or PNG, up to 2 MB.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-medium text-muted">Name</span>
              <input defaultValue="Alex Morgan" className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-4 text-sm" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-medium text-muted">Email</span>
              <input defaultValue="hello@cartly.app" className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-4 text-sm" />
            </label>
          </div>
          <Button size="sm" className="mt-5" onClick={() => toast.success("Profile saved")}><Save className="h-4 w-4" /> Save profile</Button>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3"><h2 className="text-lg font-semibold">Subscription</h2><PlanBadge /></div>
              <p className="mt-2 text-sm text-muted">You’re on Cartly Free. Upgrade for alerts, sharing, and Discover.</p>
            </div>
            <Button onClick={() => window.location.href = "/pricing"}>View Cartly Pro</Button>
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="mt-5 divide-y divide-line">
            {[
              ["Price drops", "When a pick falls below your target price", true],
              ["Back in stock", "When an unavailable pick returns", true],
              ["Cartly digest", "A gentle weekly summary of your picks", false]
            ].map(([title, body, checked]) => (
              <label key={title as string} className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span><span className="block text-sm font-medium">{title as string}</span><span className="mt-1 block text-xs text-muted">{body as string}</span></span>
                <input type="checkbox" defaultChecked={checked as boolean} className="h-5 w-5 accent-[#C8FF00]" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Your data</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast.success("Your export is being prepared")}><Download className="h-4 w-4" /> Export JSON</Button>
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="h-4 w-4" /> Sign out</Button>
          </div>
        </section>

        <section className="rounded-[24px] border border-coral/20 bg-coral/[0.04] p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-coral">Danger zone</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-muted">Permanently delete your account, saved picks, collections, and price history.</p>
            <Button variant="danger"><Trash2 className="h-4 w-4" /> Delete account</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
