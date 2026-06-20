"use client";

import type { CartlyCollection, CartlyProduct } from "@/lib/cartly-data";
import { normalizeProduct } from "@/lib/cartly-data";

export const CARTLY_STORAGE_EVENT = "cartly:storage-updated";

function identityKey(email?: string | null) {
  return encodeURIComponent((email || "local-user").trim().toLowerCase());
}

export function picksStorageKey(email?: string | null) {
  return `cartly:picks:${identityKey(email)}`;
}

export function collectionsStorageKey(email?: string | null) {
  return `cartly:collections:${identityKey(email)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readLocalPicks(email?: string | null) {
  return readJson<Record<string, any>[]>(picksStorageKey(email), []).map(normalizeProduct);
}

export function writeLocalPicks(email: string | null | undefined, products: CartlyProduct[]) {
  window.localStorage.setItem(picksStorageKey(email), JSON.stringify(products));
  notifyStorageUpdated();
}

export function readLocalCollections(email?: string | null) {
  return readJson<CartlyCollection[]>(collectionsStorageKey(email), []);
}

export function writeLocalCollections(email: string | null | undefined, collections: CartlyCollection[]) {
  window.localStorage.setItem(collectionsStorageKey(email), JSON.stringify(collections));
  notifyStorageUpdated();
}

export function notifyStorageUpdated() {
  window.dispatchEvent(new Event(CARTLY_STORAGE_EVENT));
}
