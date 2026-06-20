"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  Compass,
  FolderHeart,
  LayoutGrid,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { PlanBadge } from "@/components/layout/plan-badge";
import { UpgradeModal } from "@/components/layout/upgrade-modal";
import { Button } from "@/components/ui/button";
import type { CartlyCollection } from "@/lib/cartly-data";
import {
  CARTLY_STORAGE_EVENT,
  readLocalCollections,
  readLocalPicks
} from "@/lib/client-storage";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/app/dashboard", label: "All picks", icon: LayoutGrid },
  { href: "/app/dashboard/collections", label: "Collections", icon: FolderHeart },
  { href: "/app/dashboard/discover", label: "Discover", icon: Compass, pro: true }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [collections, setCollections] = useState<CartlyCollection[]>([]);
  const plan = session?.user?.plan ?? "FREE";
  const maxProducts = plan === "PRO" ? 20 : 5;
  const usage = Math.min(100, (productCount / maxProducts) * 100);
  const initials = (session?.user?.name || session?.user?.email || "Cartly user")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const loadSidebarData = useCallback(async () => {
    if (status === "loading") return;
    try {
      const [limitsResponse, collectionsResponse] = await Promise.all([
        fetch("/api/user/limits", { cache: "no-store" }),
        fetch("/api/collections", { cache: "no-store" })
      ]);
      if (!limitsResponse.ok || !collectionsResponse.ok) return;

      const usesClientStorage = limitsResponse.headers.get("x-cartly-client-storage") === "true";
      if (usesClientStorage) {
        const localPicks = readLocalPicks(session?.user?.email);
        const localCollections = readLocalCollections(session?.user?.email);
        setProductCount(localPicks.length);
        setCollections(
          localCollections.map((collection) => ({
            ...collection,
            count: localPicks.filter((product) => product.collectionId === collection.id).length
          }))
        );
        return;
      }

      const [limits, collectionData] = await Promise.all([
        limitsResponse.json(),
        collectionsResponse.json()
      ]);
      setProductCount(Number(limits.productCount ?? 0));
      setCollections(
        collectionData.map((collection: any) => ({
          id: String(collection.id),
          name: String(collection.name),
          emoji: String(collection.emoji ?? "✨"),
          count: Number(collection._count?.products ?? 0)
        }))
      );
    } catch {
      // Main screens own visible errors. The shell stays quiet if a summary request fails.
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData, pathname]);

  useEffect(() => {
    window.addEventListener(CARTLY_STORAGE_EVENT, loadSidebarData);
    window.addEventListener("storage", loadSidebarData);
    return () => {
      window.removeEventListener(CARTLY_STORAGE_EVENT, loadSidebarData);
      window.removeEventListener("storage", loadSidebarData);
    };
  }, [loadSidebarData]);

  const sidebar = (
    <aside className="flex h-full flex-col bg-[#141414]">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href="/app/dashboard" />
        <button className="text-muted lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-3 pt-4">
        <Button asChild className="w-full justify-start">
          <Link href="/app/dashboard/add-product" onClick={() => setMobileOpen(false)}>
            <Plus className="h-4 w-4" /> Add a pick
          </Link>
        </Button>
      </div>
      <nav className="mt-6 space-y-1 px-3">
        {mainLinks.map(({ href, label, icon: Icon, pro }) => {
          const active = href === "/app/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active ? "bg-white/[0.07] text-white" : "text-muted hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-lime")} />
              {label}
              {pro && <Sparkles className="ml-auto h-3.5 w-3.5 text-lime" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-7 px-5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.16em] text-muted">
          <span>Your collections</span>
          <Link href="/app/dashboard/collections" aria-label="Manage collections">
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 space-y-1">
          {collections.map((collection) => (
            <Link
              href="/app/dashboard/collections"
              key={collection.id}
              className="flex items-center gap-3 rounded-lg px-1 py-2 text-sm text-muted transition hover:text-white"
            >
              <span>{collection.emoji}</span>
              <span className="truncate">{collection.name}</span>
              <span className="ml-auto text-xs">{collection.count ?? 0}</span>
            </Link>
          ))}
          {collections.length === 0 && (
            <p className="px-1 py-2 text-xs leading-relaxed text-muted/70">No collections yet.</p>
          )}
        </div>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Picks used</span>
            <span className="text-xs text-muted">{productCount}/{maxProducts}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime to-[#7ee787] transition-[width]"
              style={{ width: `${usage}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {productCount >= maxProducts
              ? plan === "FREE"
                ? "Your free wishlist is full."
                : "You’ve reached the suggested Cartly Pro limit."
              : `${maxProducts - productCount} ${maxProducts - productCount === 1 ? "pick" : "picks"} available.`}
          </p>
          {plan === "FREE" && (
            <button onClick={() => setUpgradeOpen(true)} className="mt-3 text-xs font-semibold text-lime hover:underline">
              Upgrade to Cartly Pro →
            </button>
          )}
        </div>
        <Link
          href="/app/dashboard/settings"
          className="mt-3 flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:bg-white/[0.04] hover:text-white"
        >
          <Settings className="h-[18px] w-[18px]" /> Settings
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-ink">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[86%] max-w-xs border-r border-line">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur-xl sm:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-xl text-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-lg flex-1 sm:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search picks, tags, stores…"
              className="focus-ring h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-muted/70"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <PlanBadge plan={plan} />
            {plan === "FREE" && (
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => setUpgradeOpen(true)}>
                <Sparkles className="h-4 w-4 text-lime" /> Upgrade
              </Button>
            )}
            <button className="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-white/5 hover:text-white" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-2 transition hover:bg-white/5" aria-label="Account menu">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lime to-emerald-500 text-xs font-bold text-ink">
                {initials || "CU"}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" />
            </button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
