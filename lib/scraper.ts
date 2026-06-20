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

export type ScrapeProgress = {
  stage: "validating" | "connecting" | "reading" | "extracting" | "browser" | "complete";
  progress: number;
  message: string;
};

type ProgressReporter = (progress: ScrapeProgress) => void | Promise<void>;

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

function inferCurrency(value?: string | null) {
  if (!value) return null;
  if (value.includes("€")) return "EUR";
  if (value.includes("£")) return "GBP";
  if (value.includes("¥")) return "JPY";
  if (value.includes("$")) return "USD";
  return null;
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function firstText($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const element = $(selector).first();
    const value = cleanText(element.attr("content") || element.attr("value") || element.text());
    if (value) return value;
  }
  return "";
}

function firstAttribute($: cheerio.CheerioAPI, selectors: string[], attribute: string) {
  for (const selector of selectors) {
    const value = cleanText($(selector).first().attr(attribute));
    if (value) return value;
  }
  return "";
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
  const priceSpecification = Array.isArray(offers?.priceSpecification)
    ? offers?.priceSpecification[0]
    : offers?.priceSpecification;
  const availability = String(offers?.availability ?? "");
  const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const imageValue = Array.isArray(json?.image) ? json?.image[0] : json?.image;
  const image =
    imageValue && typeof imageValue === "object"
      ? imageValue.url || imageValue.contentUrl
      : imageValue;

  const title =
    cleanText(String(json?.name ?? "")) ||
    firstText($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      '[itemprop="name"]',
      "main h1",
      "h1"
    ]) ||
    cleanText($("title").text()) ||
    "Untitled pick";
  const rawImageUrl =
    cleanText(String(image ?? "")) ||
    firstText($, [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]) ||
    firstAttribute($, [
      'link[rel="image_src"]'
    ], "href") ||
    firstAttribute($, [
      'img[itemprop="image"]',
      'main img[data-testid*="product"]',
      'main img[class*="product"]',
      'main picture img',
      '#product_gallery img',
      '.product-gallery img',
      '.product-image img',
      'main img'
    ], "src") ||
    null;
  let imageUrl: string | null = null;
  if (rawImageUrl) {
    try {
      imageUrl = new URL(rawImageUrl, sourceUrl).toString();
    } catch {
      imageUrl = null;
    }
  }
  const priceText = firstText($, [
    'meta[property="product:price:amount"]',
    'meta[name="price"]',
    '[itemprop="price"]',
    '[data-testid*="price"]',
    '[data-test*="price"]',
    '.price_color',
    '.product-price',
    '.sale-price',
    '.current-price',
    '[class~="price"]',
    'main [class*="price"]',
    'main [id*="price"]',
    '[class*="Price"]'
  ]);
  const price = normalizePrice(
    offers?.price ??
      offers?.lowPrice ??
      priceSpecification?.price ??
      priceText
  );
  const currency =
    cleanText(String(
      offers?.priceCurrency ??
        priceSpecification?.priceCurrency ??
        $('meta[property="product:price:currency"]').attr("content") ??
        $('[itemprop="priceCurrency"]').attr("content") ??
        inferCurrency(priceText) ??
        "EUR"
    )).toUpperCase();
  const siteName =
    cleanText($('meta[property="og:site_name"]').attr("content")) ||
    cleanText($('meta[name="application-name"]').attr("content")) ||
    host.split(".")[0].replace(/(^\w|-\w)/g, (match) => match.replace("-", " ").toUpperCase());
  const stockSignal = [
    availability,
    $('meta[property="product:availability"]').attr("content"),
    $('[itemprop="availability"]').attr("href"),
    $('[itemprop="availability"]').attr("content")
  ].filter(Boolean).join(" ");
  const pageStockText = firstText($, [
    '[data-testid*="availability"]',
    '[data-testid*="stock"]',
    '[class*="availability"]',
    '[class*="stock"]'
  ]);

  return {
    title: title.slice(0, 240),
    imageUrl,
    price,
    currency,
    siteName,
    inStock: !/OutOfStock|SoldOut|Discontinued|out of stock|sold out|unavailable/i.test(
      stockSignal || pageStockText || html.slice(0, 200_000)
    )
  };
}

async function fetchHtml(url: string, report?: ProgressReporter) {
  let current = (await assertPublicUrl(url)).toString();
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    await report?.({
      stage: "connecting",
      progress: Math.min(32 + redirects * 3, 44),
      message: redirects ? "Following the store link…" : "Connecting to the store…"
    });
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
    await report?.({
      stage: "reading",
      progress: 52,
      message: "Reading the product page…"
    });
    return response.text();
  }
  throw new Error("Too many redirects");
}

async function fetchRenderedHtml(url: string, report?: ProgressReporter) {
  await report?.({
    stage: "browser",
    progress: 82,
    message: "Opening the interactive product page…"
  });
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

export async function scrapeProduct(input: string, report?: ProgressReporter): Promise<ScrapedProduct> {
  await report?.({
    stage: "validating",
    progress: 12,
    message: "Checking the product link…"
  });
  const url = z.string().url().parse(input);
  await assertPublicUrl(url);

  const html = await fetchHtml(url, report);
  await report?.({
    stage: "extracting",
    progress: 68,
    message: "Finding the title, price, and image…"
  });
  const initial = extractMetadata(html, url);
  if (initial.title !== "Untitled pick" && initial.price !== null && initial.imageUrl) {
    await report?.({
      stage: "complete",
      progress: 100,
      message: "Product details ready"
    });
    return initial;
  }

  try {
    const rendered = extractMetadata(await fetchRenderedHtml(url, report), url);
    await report?.({
      stage: "complete",
      progress: 100,
      message: "Product details ready"
    });
    return rendered;
  } catch {
    await report?.({
      stage: "complete",
      progress: 100,
      message: "Product details ready to review"
    });
    return initial;
  }
}
