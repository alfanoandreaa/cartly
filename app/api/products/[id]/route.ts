import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  imageUrl: z.string().url().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  personalNote: z.string().max(500).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tags: z.array(z.string().max(30)).max(12).optional(),
  collectionId: z.string().nullable().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json(
      { clientStorage: true },
      { headers: { "x-cartly-client-storage": "true" } }
    );
  }
  const product = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id },
    include: { collection: true, alerts: true }
  });
  return product
    ? NextResponse.json(product)
    : NextResponse.json({ error: "Pick not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json(
      { id: params.id, ...parsed.data },
      { headers: { "x-cartly-client-storage": "true" } }
    );
  }

  const existing = await prisma.product.findFirst({ where: { id: params.id, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Pick not found." }, { status: 404 });

  const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return new NextResponse(null, {
      status: 204,
      headers: { "x-cartly-client-storage": "true" }
    });
  }

  const result = await prisma.product.deleteMany({ where: { id: params.id, userId: user.id } });
  return result.count
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Pick not found." }, { status: 404 });
}
