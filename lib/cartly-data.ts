export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type CartlyCollection = {
  id: string;
  name: string;
  emoji: string;
  count?: number;
  imageUrl?: string | null;
};

export type PricePoint = {
  date: string;
  price: number;
};

export type CartlyProduct = {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  siteName: string;
  price: number | null;
  oldPrice?: number;
  priceCurrency: string;
  inStock: boolean;
  priority: Priority;
  tags: string[];
  personalNote?: string;
  collectionId?: string | null;
  collection?: Pick<CartlyCollection, "id" | "name" | "emoji"> | null;
  priceHistory: PricePoint[];
  createdAt?: string;
};

export function normalizeProduct(value: Record<string, any>): CartlyProduct {
  const history = Array.isArray(value.priceHistory)
    ? value.priceHistory
    : Array.isArray(value.history)
      ? value.history
      : [];

  return {
    id: String(value.id),
    url: String(value.url ?? ""),
    title: String(value.title ?? "Untitled pick"),
    imageUrl: String(value.imageUrl ?? ""),
    siteName: String(value.siteName ?? "Online store"),
    price: value.price === null || value.price === undefined ? null : Number(value.price),
    oldPrice: value.oldPrice === undefined ? undefined : Number(value.oldPrice),
    priceCurrency: String(value.priceCurrency ?? value.currency ?? "EUR"),
    inStock: value.inStock !== false,
    priority: value.priority === "LOW" || value.priority === "HIGH" ? value.priority : "MEDIUM",
    tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
    personalNote: value.personalNote ? String(value.personalNote) : undefined,
    collectionId: value.collectionId ?? value.collection?.id ?? null,
    collection:
      value.collection && typeof value.collection === "object"
        ? {
            id: String(value.collection.id),
            name: String(value.collection.name),
            emoji: String(value.collection.emoji ?? "✨")
          }
        : typeof value.collection === "string" && value.collection
          ? { id: value.collection, name: value.collection, emoji: "✨" }
          : null,
    priceHistory: history
      .filter((point: any) => point && Number.isFinite(Number(point.price)))
      .map((point: any) => ({ date: String(point.date), price: Number(point.price) })),
    createdAt: value.createdAt ? String(value.createdAt) : undefined
  };
}
