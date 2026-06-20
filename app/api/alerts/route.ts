import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { limitsFor } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string(),
  targetPrice: z.number().positive()
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!limitsFor(user.plan).alerts) return NextResponse.json({ error: "CARTLY_PRO_REQUIRED" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid target price." }, { status: 400 });
  if (!process.env.DATABASE_URL || user.id === "demo-user") return NextResponse.json({ id: crypto.randomUUID(), ...parsed.data }, { status: 201 });

  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, userId: user.id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Pick not found." }, { status: 404 });

  return NextResponse.json(
    await prisma.priceAlert.create({ data: { ...parsed.data, userId: user.id } }),
    { status: 201 }
  );
}
