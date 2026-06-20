import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { scrapeProduct } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const limit = rateLimit(`${user.id}:${forwarded ?? "local"}`, 1, 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Please wait a moment before scraping another page." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  const parsed = z.object({ url: z.string().url() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 });

  try {
    return NextResponse.json(await scrapeProduct(parsed.data.url));
  } catch (error) {
    console.error("Cartly scrape failed", error);
    return NextResponse.json(
      { error: "Cartly couldn’t read that product page. You can still add the details manually." },
      { status: 422 }
    );
  }
}
