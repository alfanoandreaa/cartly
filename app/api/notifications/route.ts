import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json([
      {
        id: "demo-notification",
        type: "PRICE_DROP",
        title: "The Arc Lounge Chair dropped €41",
        body: "It is now €649 and still in stock.",
        href: "/app/dashboard/product/arc-chair",
        readAt: null,
        createdAt: new Date().toISOString()
      }
    ]);
  }
  return NextResponse.json(
    await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  );
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (process.env.DATABASE_URL && user.id !== "demo-user") {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() }
    });
  }
  return new NextResponse(null, { status: 204 });
}
