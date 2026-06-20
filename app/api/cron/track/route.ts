import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { sendCartlyEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { scrapeProduct } from "@/lib/scraper";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300;

async function trackOne(product: {
  id: string;
  userId: string;
  url: string;
  title: string;
  price: Prisma.Decimal | null;
  priceCurrency: string;
  priceHistory: Prisma.JsonValue;
  inStock: boolean;
  user: { email: string; plan: "FREE" | "PRO" };
  alerts: { id: string; targetPrice: Prisma.Decimal; isActive: boolean }[];
}) {
  try {
    const scraped = await scrapeProduct(product.url);
    const previousPrice = product.price === null ? null : Number(product.price);
    const priceChanged = scraped.price !== null && scraped.price !== previousPrice;
    const stockChanged = scraped.inStock !== product.inStock;
    const history = Array.isArray(product.priceHistory) ? [...product.priceHistory] : [];

    if (priceChanged) {
      history.push({ price: scraped.price, date: new Date().toISOString() });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: scraped.price,
        priceCurrency: scraped.currency,
        inStock: scraped.inStock,
        lastCheckedAt: new Date(),
        priceHistory: history as Prisma.InputJsonValue
      }
    });

    if (product.user.plan === "PRO") {
      const triggered = product.alerts.filter(
        (alert) => alert.isActive && scraped.price !== null && scraped.price <= Number(alert.targetPrice)
      );

      for (const alert of triggered) {
        await Promise.all([
          prisma.priceAlert.update({
            where: { id: alert.id },
            data: { isActive: false, triggeredAt: new Date() }
          }),
          prisma.notification.create({
            data: {
              userId: product.userId,
              type: "PRICE_DROP",
              title: `${product.title} hit your target`,
              body: `It is now ${formatPrice(scraped.price, scraped.currency)}.`,
              href: `/app/dashboard/product/${product.id}`
            }
          }),
          sendCartlyEmail({
            to: product.user.email,
            subject: `${product.title} hit your Cartly target`,
            title: "This might be the moment",
            body: `${product.title} is now ${formatPrice(scraped.price, scraped.currency)} — at or below the price you asked Cartly to watch for.`,
            cta: {
              label: "View your pick",
              href: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard/product/${product.id}`
            }
          })
        ]);
      }

      if (stockChanged) {
        const back = scraped.inStock;
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: product.userId,
              type: back ? "BACK_IN_STOCK" : "OUT_OF_STOCK",
              title: back ? `${product.title} is back in stock` : `${product.title} went out of stock`,
              body: back ? "It is available again. Cartly found it for you." : "Cartly will keep watching.",
              href: `/app/dashboard/product/${product.id}`
            }
          }),
          sendCartlyEmail({
            to: product.user.email,
            subject: back ? `${product.title} is back in stock` : `Stock changed for ${product.title}`,
            title: back ? "It’s back" : "A quick stock update",
            body: back
              ? `${product.title} is available again.`
              : `${product.title} is currently out of stock. Cartly will keep an eye on it.`,
            cta: {
              label: "View your pick",
              href: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard/product/${product.id}`
            }
          })
        ]);
      }
    }

    return { id: product.id, ok: true };
  } catch (error) {
    console.error(`Cartly tracking failed for ${product.id}`, error);
    await prisma.product.update({
      where: { id: product.id },
      data: { lastCheckedAt: new Date() }
    }).catch(() => undefined);
    return { id: product.id, ok: false };
  }
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization");
  if (process.env.CRON_SECRET && token !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ checked: 0, demo: true });

  const requestedCadence = new URL(request.url).searchParams.get("cadence");
  const cadence =
    requestedCadence === "free"
      ? "FREE"
      : requestedCadence === "pro"
        ? "PRO"
        : "ALL";
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const products = await prisma.product.findMany({
    where: {
      ...(cadence === "ALL" ? {} : { user: { plan: cadence } }),
      OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lte: cutoff } }]
    },
    include: {
      user: { select: { email: true, plan: true } },
      alerts: { where: { isActive: true } }
    },
    take: 100,
    orderBy: { lastCheckedAt: "asc" }
  });

  const results = [];
  for (let index = 0; index < products.length; index += 5) {
    results.push(...(await Promise.all(products.slice(index, index + 5).map(trackOne))));
  }

  return NextResponse.json({
    cadence,
    checked: results.length,
    succeeded: results.filter((result) => result.ok).length
  });
}
