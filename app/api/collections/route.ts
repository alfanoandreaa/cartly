import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { demoCollections } from "@/lib/demo-data";
import { limitsFor } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  emoji: z.string().max(8).default("✨"),
  isPublic: z.boolean().default(false)
});

export async function GET() {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") return NextResponse.json(demoCollections);

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { products: { take: 1, select: { imageUrl: true } }, _count: { select: { products: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const parsed = collectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Give your collection a name." }, { status: 400 });
  const count =
    !process.env.DATABASE_URL || user.id === "demo-user"
      ? demoCollections.length
      : await prisma.collection.count({ where: { userId: user.id } });

  if (count >= limitsFor(user.plan).collections) {
    return NextResponse.json({ error: "COLLECTION_LIMIT_REACHED" }, { status: 403 });
  }
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json({ id: crypto.randomUUID(), ...parsed.data }, { status: 201 });
  }

  return NextResponse.json(
    await prisma.collection.create({ data: { ...parsed.data, userId: user.id } }),
    { status: 201 }
  );
}
