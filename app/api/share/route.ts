import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { limitsFor } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.enum(["PRODUCT", "COLLECTION"]),
  targetId: z.string().min(1)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!limitsFor(user.plan).sharing) {
    return NextResponse.json({ error: "CARTLY_PRO_REQUIRED" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid share request." }, { status: 400 });
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json({ slug: nanoid(8), type: parsed.data.type, targetId: parsed.data.targetId }, { status: 201 });
  }

  const ownsTarget =
    parsed.data.type === "PRODUCT"
      ? await prisma.product.findFirst({ where: { id: parsed.data.targetId, userId: user.id }, select: { id: true } })
      : await prisma.collection.findFirst({ where: { id: parsed.data.targetId, userId: user.id }, select: { id: true } });
  if (!ownsTarget) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  const existing = await prisma.sharedLink.findFirst({
    where: { userId: user.id, type: parsed.data.type, targetId: parsed.data.targetId }
  });
  if (existing) return NextResponse.json(existing);

  return NextResponse.json(
    await prisma.sharedLink.create({
      data: { userId: user.id, ...parsed.data, slug: nanoid(8) }
    }),
    { status: 201 }
  );
}
