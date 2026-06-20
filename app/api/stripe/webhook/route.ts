import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendCartlyEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) return NextResponse.json({ received: true, demo: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && userId !== "demo-user") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            subscriptionStatus: "active"
          }
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: subscription.status === "active" || subscription.status === "trialing" ? "PRO" : "FREE",
          subscriptionStatus: subscription.status,
          subscriptionEnd: new Date(subscription.current_period_end * 1000)
        }
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: "FREE",
          subscriptionStatus: "cancelled",
          subscriptionEnd: new Date(subscription.current_period_end * 1000)
        }
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: String(invoice.customer) },
        select: { email: true }
      });
      if (user) {
        await sendCartlyEmail({
          to: user.email,
          subject: "A quick note about your Cartly Pro payment",
          title: "Your payment needs a little attention",
          body: "Stripe couldn’t process your latest Cartly Pro payment. Update your billing details to keep alerts, sharing, and Discover running.",
          cta: { label: "Manage billing", href: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard/settings` }
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
