import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { scrapeProduct } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

const localRefreshSchema = z.object({
  url: z.string().url().optional(),
  currentPrice: z.number().nonnegative().nullable().optional(),
  priceHistory: z
    .array(z.object({ price: z.number().nonnegative(), date: z.string() }))
    .default([])
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  const limit = rateLimit(`refresh:${user.id}`, 1, 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Please wait a moment before refreshing another price." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  const body = localRefreshSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!body.success) {
    return NextResponse.json({ error: "Invalid refresh request." }, { status: 400 });
  }

  const localMode = !process.env.DATABASE_URL || user.id === "demo-user";
  const product = localMode
    ? body.data.url
      ? {
          id: params.id,
          url: body.data.url,
          price: body.data.currentPrice ?? null,
          priceHistory: body.data.priceHistory
        }
      : null
    : await prisma.product.findFirst({
        where: { id: params.id, userId: user.id },
        select: {
          id: true,
          url: true,
          price: true,
          priceHistory: true
        }
      });

  if (!product) {
    return NextResponse.json({ error: "Pick not found." }, { status: 404 });
  }

  const scraped = await scrapeProduct(product.url);
  if (scraped.price === null) {
    return NextResponse.json(
      { error: "PRICE_NOT_FOUND", message: "Price not detected." },
      { status: 422 }
    );
  }

  const previousPrice =
    product.price === null || product.price === undefined
      ? null
      : Number(product.price);
  const changed = previousPrice !== scraped.price;
  const rawHistory: unknown[] = Array.isArray(product.priceHistory)
    ? product.priceHistory
    : [];
  const history: Array<{ price: number; date: string }> = rawHistory.flatMap(
    (point) => {
      if (
        !point ||
        typeof point !== "object" ||
        !("price" in point) ||
        !("date" in point) ||
        !Number.isFinite(Number(point.price))
      ) {
        return [];
      }
      return [{ price: Number(point.price), date: String(point.date) }];
    }
  );

  if (changed) {
    history.push({ price: scraped.price, date: new Date().toISOString() });
  }

  const result = {
    id: product.id,
    price: scraped.price,
    priceCurrency: scraped.currency,
    priceHistory: history,
    inStock: scraped.inStock,
    lastCheckedAt: new Date().toISOString(),
    changed
  };

  if (localMode) {
    return NextResponse.json(result, {
      headers: { "x-cartly-client-storage": "true" }
    });
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      price: scraped.price,
      priceCurrency: scraped.currency,
      priceHistory: history as Prisma.InputJsonValue,
      inStock: scraped.inStock,
      lastCheckedAt: new Date()
    }
  });

  return NextResponse.json(result);
}
