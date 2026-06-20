import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().max(8).optional(),
  isPublic: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid collection update." }, { status: 400 });
  if (!process.env.DATABASE_URL || user.id === "demo-user") return NextResponse.json({ id: params.id, ...parsed.data });

  const result = await prisma.collection.updateMany({
    where: { id: params.id, userId: user.id },
    data: parsed.data
  });
  return result.count
    ? NextResponse.json(await prisma.collection.findUnique({ where: { id: params.id } }))
    : NextResponse.json({ error: "Collection not found." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") return new NextResponse(null, { status: 204 });
  const result = await prisma.collection.deleteMany({ where: { id: params.id, userId: user.id } });
  return result.count
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Collection not found." }, { status: 404 });
}
