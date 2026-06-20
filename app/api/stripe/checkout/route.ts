import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const interval = url.searchParams.get("interval") === "year" ? "year" : "month";
  const price =
    interval === "year"
      ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (!stripe || !price) {
    return NextResponse.redirect(`${baseUrl}/pricing?stripe=not-configured`);
  }

  let customer = undefined as string | undefined;
  if (process.env.DATABASE_URL && user.id !== "demo-user") {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    customer = dbUser?.stripeCustomerId ?? undefined;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    customer_email: customer ? undefined : user.email ?? undefined,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/app/dashboard/settings?upgraded=true`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    metadata: { userId: user.id, plan: "PRO" },
    subscription_data: { metadata: { userId: user.id } }
  });

  return NextResponse.redirect(session.url!);
}
