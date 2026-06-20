import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { discoverProducts } from "@/lib/demo-data";
import { limitsFor } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!limitsFor(user.plan).discover) {
    return NextResponse.json({ error: "CARTLY_PRO_REQUIRED", preview: discoverProducts.slice(0, 3) }, { status: 403 });
  }
  if (!process.env.DATABASE_URL || user.id === "demo-user") return NextResponse.json(discoverProducts);

  return NextResponse.json(
    await prisma.discoverProduct.findMany({ orderBy: [{ saves: "desc" }, { createdAt: "desc" }] })
  );
}
