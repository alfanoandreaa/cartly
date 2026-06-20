"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ImageIcon, Link2, Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { Button } from "@/components/ui/button";
import type { CartlyCollection } from "@/lib/cartly-data";
import { normalizeProduct } from "@/lib/cartly-data";
import {
  readLocalCollections,
  readLocalPicks,
  writeLocalPicks
} from "@/lib/client-storage";

type ScrapeResult = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  siteName: string;
  inStock: boolean;
  storeKey?: string;
  extractionMethod?: "store-adapter" | "structured-data" | "universal";
};

type ScrapeStatus = {
  stage: "idle" | "validating" | "detecting" | "connecting" | "reading" | "extracting" | "browser" | "complete" | "error";
  progress: number;
  message: string;
  storeName?: string;
  storeKey?: string;
};

const initialScrapeStatus: ScrapeStatus = {
  stage: "idle",
  progress: 0,
  message: "Paste a product link and Cartly will collect the details automatically."
};

function normalizeProductUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function AddProductForm() {
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [collections, setCollections] = useState<CartlyCollection[]>([]);
  const [usesClientStorage, setUsesClientStorage] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>(initialScrapeStatus);
  const lastScrapedUrl = useRef("");
  const scrapeController = useRef<AbortController | null>(null);
  const email = session?.user?.email;

  useEffect(() => {
    if (status === "loading") return;
    Promise.all([
      fetch("/api/user/limits", { cache: "no-store" }),
      fetch("/api/collections", { cache: "no-store" })
    ])
      .then(async ([limitsResponse, collectionsResponse]) => {
        const clientStorage = limitsResponse.headers.get("x-cartly-client-storage") === "true";
        setUsesClientStorage(clientStorage);
        const limits = await limitsResponse.json();

        if (clientStorage) {
          const picks = readLocalPicks(email);
          setCollections(readLocalCollections(email));
          if (limits.plan === "FREE" && picks.length >= limits.maxProducts) setUpgrade(true);
        } else {
          const collectionData = await collectionsResponse.json();
          setCollections(
            collectionData.map((collection: any) => ({
              id: String(collection.id),
              name: String(collection.name),
              emoji: String(collection.emoji ?? "✨")
            }))
          );
          if (limits.plan === "FREE" && limits.productCount >= limits.maxProducts) setUpgrade(true);
        }
      })
      .catch(() => undefined);
  }, [email, status]);

  const scrape = useCallback(async (requestedUrl: string, force = false) => {
    const normalizedUrl = normalizeProductUrl(requestedUrl);
    if (!normalizedUrl) {
      setScrapeStatus({
        stage: "error",
        progress: 100,
        message: "Enter a complete product link to continue."
      });
      return;
    }
    if (!force && lastScrapedUrl.current === normalizedUrl) return;

    scrapeController.current?.abort();
    const controller = new AbortController();
    scrapeController.current = controller;
    lastScrapedUrl.current = normalizedUrl;
    setLoading(true);
    setResult(null);
    setScrapeStatus({
      stage: "validating",
      progress: 8,
      message: "Checking the product link…"
    });

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/x-ndjson"
        },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "We couldn’t read that product page.");
      }
      if (!response.body) throw new Error("The store did not return any product data.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let collected: ScrapeResult | null = null;

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") {
            setScrapeStatus({
              stage: event.stage,
              progress: Number(event.progress),
              message: String(event.message),
              storeName: event.storeName ? String(event.storeName) : undefined,
              storeKey: event.storeKey ? String(event.storeKey) : undefined
            });
          } else if (event.type === "result") {
            collected = event.product as ScrapeResult;
          } else if (event.type === "error") {
            throw new Error(String(event.error));
          }
        }
        if (done) break;
      }

      if (!collected) throw new Error("Cartly couldn’t find product details on that page.");

      const missing = [
        collected.title === "Untitled pick" ? "title" : null,
        collected.price === null ? "price" : null,
        !collected.imageUrl ? "image" : null
      ].filter(Boolean);
      setUrl(normalizedUrl);
      setResult(collected);
      lastScrapedUrl.current = normalizedUrl;
      setScrapeStatus({
        stage: "complete",
        progress: 100,
        message: missing.length
          ? `Details collected. Please review the ${missing.join(", ")}.`
          : "Title, price, and image collected successfully.",
        storeName: collected.siteName,
        storeKey: collected.storeKey
      });
      if (missing.length) toast.warning("Product found — a few details need your review");
      else toast.success("Product details collected automatically");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setScrapeStatus({
        stage: "error",
        progress: 100,
        message: caught instanceof Error ? caught.message : "Could not collect product details."
      });
      toast.error(caught instanceof Error ? caught.message : "Could not scrape that URL");
    } finally {
      if (scrapeController.current === controller) {
        setLoading(false);
        scrapeController.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const normalizedUrl = normalizeProductUrl(url);
    if (!normalizedUrl || normalizedUrl === lastScrapedUrl.current || loading) return;
    const timer = window.setTimeout(() => {
      scrape(normalizedUrl);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [loading, scrape, url]);

  useEffect(() => {
    return () => scrapeController.current?.abort();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result) return;
    setSaving(true);
    const data = new FormData(event.currentTarget);
    const priceValue = String(data.get("price") ?? "").trim();
    const payload = {
      url,
      title: String(data.get("title") ?? ""),
      imageUrl: String(data.get("imageUrl") ?? ""),
      price: priceValue ? Number(priceValue) : null,
      priceCurrency: result.currency,
      siteName: result.siteName,
      inStock: result.inStock,
      personalNote: String(data.get("note") ?? ""),
      priority: String(data.get("priority") ?? "MEDIUM"),
      tags: [],
      collectionId: String(data.get("collectionId") ?? "") || null
    };

    try {
      const existing = usesClientStorage ? readLocalPicks(email) : [];
      if (usesClientStorage && session?.user?.plan !== "PRO" && existing.length >= 10) {
        setUpgrade(true);
        return;
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (response.status === 403 && body.error === "LIMIT_REACHED") {
        setUpgrade(true);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Could not save this pick");

      if (usesClientStorage || response.headers.get("x-cartly-client-storage") === "true") {
        const selectedCollection = collections.find((collection) => collection.id === payload.collectionId);
        const product = normalizeProduct({
          ...body,
          collection: selectedCollection
            ? {
                id: selectedCollection.id,
                name: selectedCollection.name,
                emoji: selectedCollection.emoji
              }
            : null
        });
        writeLocalPicks(email, [product, ...existing]);
      }

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
              onChange={(event) => {
                const nextUrl = event.target.value;
                setUrl(nextUrl);
                if (normalizeProductUrl(nextUrl) !== lastScrapedUrl.current) {
                  scrapeController.current?.abort();
                  setLoading(false);
                  setResult(null);
                  setScrapeStatus(initialScrapeStatus);
                }
              }}
              type="url"
              placeholder="https://store.com/the-perfect-thing"
              className="focus-ring h-12 w-full rounded-xl border border-line bg-card pl-11 pr-4 text-sm"
            />
          </div>
          <Button size="lg" onClick={() => scrape(url, true)} disabled={!url || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : result || scrapeStatus.stage === "error" ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Collecting…" : result ? "Refresh details" : scrapeStatus.stage === "error" ? "Try again" : "Get details"}
          </Button>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-ink/50 p-3">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                scrapeStatus.stage === "complete"
                  ? "bg-lime text-ink"
                  : scrapeStatus.stage === "error"
                    ? "bg-coral/15 text-coral"
                    : "bg-white/5 text-muted"
              }`}
            >
              {scrapeStatus.stage === "complete" ? (
                <Check className="h-3.5 w-3.5" />
              ) : scrapeStatus.stage === "error" ? (
                <TriangleAlert className="h-3.5 w-3.5" />
              ) : loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </span>
            <p
              className={`min-w-0 flex-1 truncate text-xs ${
                scrapeStatus.stage === "error" ? "text-coral" : scrapeStatus.stage === "complete" ? "text-white" : "text-muted"
              }`}
            >
              {scrapeStatus.message}
            </p>
            <span className="text-[10px] tabular-nums text-muted">
              {scrapeStatus.stage === "idle" ? "AUTO" : `${scrapeStatus.progress}%`}
            </span>
          </div>
          {scrapeStatus.storeName && (
            <div className="mt-2 flex items-center gap-2 pl-8 text-[10px] uppercase tracking-[.12em] text-muted">
              <span className="rounded-full border border-lime/20 bg-lime/[0.07] px-2 py-1 text-lime">
                {scrapeStatus.storeName}
              </span>
              <span>
                {result?.extractionMethod === "store-adapter"
                  ? "Store-specific extraction"
                  : result?.extractionMethod === "structured-data"
                    ? "Structured product data"
                    : scrapeStatus.stage === "detecting" || loading
                      ? "Selecting the right product layout"
                      : "Universal extraction"}
              </span>
            </div>
          )}
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-500 ${
                scrapeStatus.stage === "error" ? "bg-coral" : "bg-lime"
              }`}
              style={{ width: `${scrapeStatus.progress}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Collection starts automatically after you paste a valid link. Cartly only reads public product information.
        </p>
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
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.emoji} {collection.name}
                  </option>
                ))}
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
