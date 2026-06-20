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
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 });
  }

  if (request.headers.get("accept")?.includes("application/x-ndjson")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (value: unknown) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        };

        try {
          const product = await scrapeProduct(parsed.data.url, (progress) => {
            send({ type: "progress", ...progress });
          });
          send({ type: "result", product });
        } catch (error) {
          console.error("Cartly scrape failed", error);
          send({
            type: "error",
            error: "Cartly couldn’t read that product page. You can still enter the details manually."
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-content-type-options": "nosniff"
      }
    });
  }

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
