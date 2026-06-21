import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    accentColor: z.string().trim().max(20).optional(),
    locale: z.string().trim().max(8).optional()
  })
  .refine(
    (value) => value.name !== undefined || value.accentColor !== undefined || value.locale !== undefined,
    { message: "Nothing to update." }
  );

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide valid settings." }, { status: 400 });
  }

  // Only persist the fields that were actually sent.
  const data = parsed.data;

  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json(data, { headers: { "x-cartly-client-storage": "true" } });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, accentColor: true, locale: true }
  });
  return NextResponse.json(updated);
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json(
      { ok: true },
      { headers: { "x-cartly-client-storage": "true" } }
    );
  }

  // Picks, collections, alerts, shared links and notifications are removed via
  // the onDelete: Cascade relations in the Prisma schema.
  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
