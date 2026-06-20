"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ImageIcon, Link2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { Button } from "@/components/ui/button";

type ScrapeResult = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  siteName: string;
  inStock: boolean;
};

export function AddProductForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/user/limits")
      .then((response) => response.json())
      .then((limits) => {
        if (limits.productCount >= limits.maxProducts && limits.plan === "FREE") setUpgrade(true);
      })
      .catch(() => undefined);
  }, []);

  async function scrape() {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "We couldn’t read that product page.");
      setResult(body);
      toast.success("Product details found");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not scrape that URL");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result) return;
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          title: data.get("title"),
          imageUrl: data.get("imageUrl"),
          price: Number(data.get("price")),
          priceCurrency: result.currency,
          siteName: result.siteName,
          inStock: result.inStock,
          personalNote: data.get("note"),
          priority: data.get("priority"),
          collectionId: data.get("collectionId") || null
        })
      });
      const body = await response.json();
      if (response.status === 403 && body.error === "LIMIT_REACHED") {
        setUpgrade(true);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Could not save this pick");
      toast.success("Saved to your Cartly");
      window.location.href = "/app/dashboard";
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save this pick");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-7 lg:p-10">
      <Link href="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to your picks
      </Link>
      <div className="mt-6">
        <p className="text-sm font-semibold text-lime">NEW PICK</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Found something good?</h1>
        <p className="mt-2 text-muted">Paste the product link. Cartly will do the fiddly bit.</p>
      </div>

      <div className="mt-8 rounded-[28px] border border-line bg-surface p-5 sm:p-8">
        <label className="block text-xs font-bold uppercase tracking-[.16em] text-muted">Product URL</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              type="url"
              placeholder="https://store.com/the-perfect-thing"
              className="focus-ring h-12 w-full rounded-xl border border-line bg-card pl-11 pr-4 text-sm"
            />
          </div>
          <Button size="lg" onClick={scrape} disabled={!url || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Reading page…" : "Get details"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">Cartly only reads public product information. Your URL stays private.</p>
      </div>

      {loading && (
        <div className="mt-6 grid animate-pulse gap-6 rounded-[28px] border border-line bg-surface p-6 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-card" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-24 rounded bg-card" />
            <div className="h-9 w-4/5 rounded bg-card" />
            <div className="h-12 w-32 rounded bg-card" />
            <div className="h-28 rounded bg-card" />
          </div>
        </div>
      )}

      {result && !loading && (
        <form onSubmit={save} className="mt-6 grid gap-6 rounded-[28px] border border-line bg-surface p-5 sm:p-8 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-card">
              {result.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-muted"><ImageIcon className="h-8 w-8" /></span>
              )}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs text-muted">Image URL</span>
              <input name="imageUrl" defaultValue={result.imageUrl ?? ""} className="focus-ring h-11 w-full rounded-xl border border-line bg-card px-3 text-xs" />
            </label>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs text-muted">Title</span>
              <input name="title" required defaultValue={result.title} className="focus-ring h-12 w-full rounded-xl border border-line bg-card px-4 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="mb-2 block text-xs text-muted">Price ({result.currency})</span>
                <input name="price" type="number" step="0.01" defaultValue={result.price ?? ""} className="focus-ring h-12 w-full rounded-xl border border-line bg-card px-4 text-sm" />
              </label>
              <label>
                <span className="mb-2 block text-xs text-muted">Priority</span>
                <select name="priority" className="focus-ring h-12 w-full rounded-xl border border-line bg-card px-4 text-sm">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs text-muted">Collection</span>
              <select name="collectionId" className="focus-ring h-12 w-full rounded-xl border border-line bg-card px-4 text-sm">
                <option value="">No collection</option>
                <option value="home">🏡 Dream home</option>
                <option value="creative">📷 Creative kit</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted">Personal note</span>
              <textarea name="note" maxLength={500} rows={4} placeholder="Why is this one worth remembering?" className="focus-ring w-full resize-none rounded-xl border border-line bg-card p-4 text-sm" />
            </label>
            <Button type="submit" size="lg" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save to my Cartly
            </Button>
          </div>
        </form>
      )}
      <UpgradeModal open={upgrade} onClose={() => setUpgrade(false)} />
    </div>
  );
}
