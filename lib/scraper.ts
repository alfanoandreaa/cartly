import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";

export type ScrapedProduct = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  siteName: string;
  inStock: boolean;
};

const headers = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9"
};

function normalizePrice(value?: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const clean = value.replace(/[^\d,.-]/g, "").trim();
  if (!clean) return null;
  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  let normalized = clean;

  if (lastComma > lastDot) normalized = clean.replace(/\./g, "").replace(",", ".");
  else normalized = clean.replace(/,/g, "");

  const result = Number.parseFloat(normalized);
  return Number.isFinite(result) ? result : null;
}

function isPrivateAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("10.") || address.startsWith("127.") || address.startsWith("169.254.") || address.startsWith("192.168.")) return true;
  if (address.startsWith("172.")) {
    const second = Number(address.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  const normalized = address.toLowerCase();
  return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

async function assertPublicUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported URL protocol");
  if (url.username || url.password) throw new Error("Authenticated URLs are not supported");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Private hosts are not supported");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network addresses are not supported");
  }
  return url;
}

function findProductJsonLd(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findProductJsonLd(child);
      if (match) return match;
    }
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    const type = object["@type"];
    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return object;
    if (object["@graph"]) return findProductJsonLd(object["@graph"]);
  }
  return null;
}

export function extractMetadata(html: string, sourceUrl: string): ScrapedProduct {
  const $ = cheerio.load(html);
  let jsonProduct: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_, element) => {
    if (jsonProduct) return;
    try {
      jsonProduct = findProductJsonLd(JSON.parse($(element).text()));
    } catch {
      // Retailer JSON-LD is often malformed; OpenGraph still provides a useful fallback.
    }
  });

  const json = jsonProduct as Record<string, any> | null;
  const offers = Array.isArray(json?.offers) ? json?.offers[0] : json?.offers;
  const availability = String(offers?.availability ?? "");
  const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const image = Array.isArray(json?.image) ? json?.image[0] : json?.image;

  const title =
    String(json?.name ?? "") ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Untitled pick";
  const rawImageUrl =
    String(image ?? "") ||
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;
  let imageUrl: string | null = null;
  if (rawImageUrl) {
    try {
      imageUrl = new URL(rawImageUrl, sourceUrl).toString();
    } catch {
      imageUrl = null;
    }
  }
  const price = normalizePrice(
    offers?.price ??
      offers?.lowPrice ??
      $('meta[property="product:price:amount"]').attr("content") ??
      $('[itemprop="price"]').attr("content")
  );
  const currency =
    String(
      offers?.priceCurrency ??
        $('meta[property="product:price:currency"]').attr("content") ??
        $('[itemprop="priceCurrency"]').attr("content") ??
        "EUR"
    ).toUpperCase();
  const siteName =
    $('meta[property="og:site_name"]').attr("content") ||
    host.split(".")[0].replace(/(^\w|-\w)/g, (match) => match.replace("-", " ").toUpperCase());

  return {
    title: title.slice(0, 240),
    imageUrl,
    price,
    currency,
    siteName,
    inStock: !/OutOfStock|SoldOut|Discontinued/i.test(availability || html.slice(0, 200_000))
  };
}

async function fetchHtml(url: string) {
  let current = (await assertPublicUrl(url)).toString();
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetch(current, {
      headers,
      signal: AbortSignal.timeout(12_000),
      redirect: "manual",
      cache: "no-store"
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Retailer returned an invalid redirect");
      current = (await assertPublicUrl(new URL(location, current).toString())).toString();
      continue;
    }
    if (!response.ok) throw new Error(`Retailer returned ${response.status}`);
    return response.text();
  }
  throw new Error("Too many redirects");
}

async function fetchRenderedHtml(url: string) {
  const [{ default: puppeteer }, chromium] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium")
  ]);
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (await chromium.default.executablePath());
  const browser = await puppeteer.launch({
    args: chromium.default.args,
    executablePath,
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(headers["user-agent"]);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 25_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function scrapeProduct(input: string): Promise<ScrapedProduct> {
  const url = z.string().url().parse(input);
  await assertPublicUrl(url);

  const html = await fetchHtml(url);
  const initial = extractMetadata(html, url);
  if (initial.title !== "Untitled pick" && initial.price !== null && initial.imageUrl) return initial;

  try {
    return extractMetadata(await fetchRenderedHtml(url), url);
  } catch {
    return initial;
  }
}
