import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (!stripe || !process.env.DATABASE_URL || user.id === "demo-user") {
    return NextResponse.json({ error: "Stripe billing is not configured." }, { status: 503 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (!dbUser?.stripeCustomerId) return NextResponse.json({ error: "No billing account found." }, { status: 404 });

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${baseUrl}/app/dashboard/settings`
  });
  return NextResponse.json({ url: session.url });
}
