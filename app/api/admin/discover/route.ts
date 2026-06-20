import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).max(240),
  url: z.string().url(),
  imageUrl: z.string().url(),
  siteName: z.string().min(1).max(100),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default("EUR"),
  category: z.enum(["FASHION", "HOME", "BEAUTY", "TECH", "BOOKS", "FOOD", "OTHER"])
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid Discover product." }, { status: 400 });
  return NextResponse.json(await prisma.discoverProduct.create({ data: parsed.data }), { status: 201 });
}
