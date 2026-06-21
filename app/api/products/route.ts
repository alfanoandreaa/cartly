import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { productLimitState } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  url: z.string().url(),
  title: z.string().trim().min(1).max(240),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  siteName: z.string().max(100).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  oldPrice: z.number().nonnegative().nullable().optional(),
  priceCurrency: z.string().length(3).default("EUR"),
  inStock: z.boolean().default(true),
  personalNote: z.string().max(500).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  tags: z.array(z.string().max(30)).max(12).default([]),
  collectionId: z.string().nullable().optional()
});

export async function GET() {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json([], { headers: { "x-cartly-client-storage": "true" } });
  }

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    include: { collection: { select: { id: true, name: true, emoji: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check the product details." }, { status: 400 });

  const count =
    !process.env.DATABASE_URL || user.id === "demo-user"
      ? 0
      : await prisma.product.count({ where: { userId: user.id } });
  const state = productLimitState(user.plan, count);
  if (state.blocked) return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });

  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        ...parsed.data,
        priceHistory: parsed.data.price
          ? [{ price: parsed.data.price, date: new Date().toISOString() }]
          : [],
        createdAt: new Date().toISOString(),
        warning: state.warning ? "APPROACHING_LIMIT" : undefined
      },
      { status: 201, headers: { "x-cartly-client-storage": "true" } }
    );
  }

  if (parsed.data.collectionId) {
    const ownsCollection = await prisma.collection.findFirst({
      where: { id: parsed.data.collectionId, userId: user.id },
      select: { id: true }
    });
    if (!ownsCollection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      priceHistory: parsed.data.price
        ? [{ price: parsed.data.price, date: new Date().toISOString() }]
        : [],
      userId: user.id
    }
  });

  return NextResponse.json(
    { ...product, warning: state.warning ? "APPROACHING_LIMIT" : undefined },
    { status: 201 }
  );
}
