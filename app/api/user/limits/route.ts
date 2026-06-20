import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { demoCollections, demoProducts } from "@/lib/demo-data";
import { limitsFor } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  const limits = limitsFor(user.plan);

  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json({
      plan: user.plan,
      productCount: demoProducts.length,
      maxProducts: limits.products,
      collectionCount: demoCollections.length,
      maxCollections: Number.isFinite(limits.collections) ? limits.collections : null
    });
  }

  const [productCount, collectionCount] = await Promise.all([
    prisma.product.count({ where: { userId: user.id } }),
    prisma.collection.count({ where: { userId: user.id } })
  ]);

  return NextResponse.json({
    plan: user.plan,
    productCount,
    maxProducts: limits.products,
    collectionCount,
    maxCollections: Number.isFinite(limits.collections) ? limits.collections : null
  });
}
