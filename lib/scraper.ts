import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import {
  detectStore,
  type StoreAdapter,
  type StoreKey
} from "@/lib/store-adapters";

export type ScrapedProduct = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  siteName: string;
  inStock: boolean;
  storeKey: StoreKey;
  extractionMethod: "store-adapter" | "structured-data" | "universal";
};

export type ScrapeProgress = {
  stage: "validating" | "detecting" | "connecting" | "reading" | "extracting" | "browser" | "complete";
  progress: number;
  message: string;
  storeName?: string;
  storeKey?: StoreKey;
};

type ProgressReporter = (progress: ScrapeProgress) => void | Promise<void>;

const headers = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9,it;q=0.8"
};

export function normalizePrice(value?: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;

  const match = value.replace(/\u00a0/g, " ").match(/-?\d[\d.,\s]*/);
  if (!match) return null;
  const clean = match[0].replace(/\s/g, "");
  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  let normalized = clean;

  if (lastComma > lastDot) {
    const decimalLength = clean.length - lastComma - 1;
    normalized =
      decimalLength === 3 && !clean.includes(".")
        ? clean.replace(/,/g, "")
        : clean.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1) {
    const decimalLength = clean.length - lastDot - 1;
    normalized =
      decimalLength === 3 && !clean.includes(",")
        ? clean.replace(/\./g, "")
        : clean.replace(/,/g, "");
  } else {
    normalized = clean.replace(/[,.]/g, "");
  }

  const result = Number.parseFloat(normalized);
  return Number.isFinite(result) ? result : null;
}

function inferCurrency(value?: string | null) {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper.includes("EUR") || value.includes("€")) return "EUR";
  if (upper.includes("GBP") || value.includes("£")) return "GBP";
  if (upper.includes("JPY") || value.includes("¥")) return "JPY";
  if (upper.includes("CAD")) return "CAD";
  if (upper.includes("AUD")) return "AUD";
  if (upper.includes("USD") || value.includes("$")) return "USD";
  if (upper.includes("CHF")) return "CHF";
  if (upper.includes("PLN") || upper.includes("ZŁ")) return "PLN";
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

function firstImage($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const element = $(selector).first();
    const dynamicImages = element.attr("data-a-dynamic-image");
    if (dynamicImages) {
      try {
        const urls = Object.keys(JSON.parse(dynamicImages));
        if (urls[0]) return urls[0];
      } catch {
        // Continue with ordinary image attributes.
      }
    }

    const srcset = element.attr("srcset");
    const value =
      element.attr("data-old-hires") ||
      element.attr("data-zoom-image") ||
      element.attr("data-src") ||
      element.attr("data-lazy-src") ||
      element.attr("src") ||
      (srcset ? srcset.split(",").at(-1)?.trim().split(/\s+/)[0] : null);
    if (cleanText(value)) return cleanText(value);
  }
  return "";
}

function decodeEmbeddedString(value: string) {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value.replace(/\\u002F/g, "/").replace(/\\\//g, "/").replace(/\\"/g, '"');
  }
}

function embeddedValue(html: string, keys: string[] = []) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stringMatch = html.match(new RegExp(`"${escaped}"\\s*:\\s*"((?:\\\\.|[^"])*)"`, "i"));
    if (stringMatch?.[1]) return cleanText(decodeEmbeddedString(stringMatch[1]));

    const numberMatch = html.match(new RegExp(`"${escaped}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
    if (numberMatch?.[1]) return numberMatch[1];

    const arrayMatch = html.match(new RegExp(`"${escaped}"\\s*:\\s*\\[\\s*"((?:\\\\.|[^"])*)"`, "i"));
    if (arrayMatch?.[1]) return cleanText(decodeEmbeddedString(arrayMatch[1]));
  }
  return "";
}

function isPrivateAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (
    address.startsWith("10.") ||
    address.startsWith("127.") ||
    address.startsWith("169.254.") ||
    address.startsWith("192.168.")
  ) {
    return true;
  }
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
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private hosts are not supported");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network addresses are not supported");
  }
  return url;
}

function findProductJsonLd(value: unknown): Record<string, any> | null {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findProductJsonLd(child);
      if (match) return match;
    }
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, any>;
    const type = object["@type"];
    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return object;
    for (const key of ["@graph", "mainEntity", "itemListElement"]) {
      if (object[key]) {
        const match = findProductJsonLd(object[key]);
        if (match) return match;
      }
    }
  }
  return null;
}

function readProductJsonLd($: cheerio.CheerioAPI): Record<string, any> | null {
  let product: Record<string, any> | null = null;
  $('script[type="application/ld+json"]').each((_, element) => {
    if (product) return;
    try {
      product = findProductJsonLd(JSON.parse($(element).text()));
    } catch {
      // Retailer JSON-LD is often malformed. Store adapters and OpenGraph remain available.
    }
  });
  return product as Record<string, any> | null;
}

function resolveImage(raw: string, sourceUrl: string) {
  if (!raw) return null;
  try {
    const value = new URL(raw, sourceUrl);
    return ["http:", "https:"].includes(value.protocol) ? value.toString() : null;
  } catch {
    return null;
  }
}

export function extractMetadata(
  html: string,
  sourceUrl: string,
  adapter = detectStore(sourceUrl)
): ScrapedProduct {
  const $ = cheerio.load(html);
  const json = readProductJsonLd($);
  const offers = Array.isArray(json?.offers) ? json.offers[0] : json?.offers;
  const priceSpecification = Array.isArray(offers?.priceSpecification)
    ? offers.priceSpecification[0]
    : offers?.priceSpecification;
  const jsonImageValue = Array.isArray(json?.image) ? json.image[0] : json?.image;
  const jsonImage =
    jsonImageValue && typeof jsonImageValue === "object"
      ? jsonImageValue.url || jsonImageValue.contentUrl
      : jsonImageValue;

  const adapterTitle =
    firstText($, adapter.titleSelectors) ||
    embeddedValue(html, adapter.embeddedTitleKeys);
  const adapterPriceText =
    firstText($, adapter.priceSelectors) ||
    embeddedValue(html, adapter.embeddedPriceKeys);
  const adapterImage =
    firstImage($, adapter.imageSelectors) ||
    embeddedValue(html, adapter.embeddedImageKeys);
  const adapterCurrency = firstText($, adapter.currencySelectors ?? []);

  const structuredTitle = cleanText(String(json?.name ?? ""));
  const structuredPrice =
    offers?.price ??
    offers?.lowPrice ??
    priceSpecification?.price ??
    null;
  const universalPriceText = firstText($, [
    'meta[property="product:price:amount"]',
    'meta[name="price"]',
    '[itemprop="price"]'
  ]);
  const title =
    adapterTitle ||
    structuredTitle ||
    firstText($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    cleanText($("title").text()) ||
    "Untitled pick";
  const rawImage =
    adapterImage ||
    cleanText(String(jsonImage ?? "")) ||
    firstText($, [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]);
  const price = normalizePrice(adapterPriceText || structuredPrice || universalPriceText);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  const currency =
    inferCurrency(adapterCurrency) ||
    cleanText(
      String(
        offers?.priceCurrency ??
          priceSpecification?.priceCurrency ??
          $('meta[property="product:price:currency"]').attr("content") ??
          $('[itemprop="priceCurrency"]').attr("content") ??
          ""
      )
    ).toUpperCase() ||
    inferCurrency(adapterPriceText || universalPriceText) ||
    adapter.defaultCurrency?.(hostname) ||
    "EUR";

  const availabilityText = [
    String(offers?.availability ?? ""),
    firstText($, adapter.availabilitySelectors ?? []),
    $('meta[property="product:availability"]').attr("content"),
    $('[itemprop="availability"]').attr("href"),
    $('[itemprop="availability"]').attr("content")
  ]
    .filter(Boolean)
    .join(" ");
  const detectedName =
    adapter.key === "generic"
      ? firstText($, ['meta[property="og:site_name"]', 'meta[name="application-name"]']) ||
        hostname.replace(/^www\./, "").split(".")[0]
      : adapter.name;
  const usedAdapter =
    adapter.key !== "generic" && Boolean(adapterTitle || adapterPriceText || adapterImage);

  return {
    title: title.slice(0, 240),
    imageUrl: resolveImage(rawImage, sourceUrl),
    price,
    currency,
    siteName: detectedName,
    inStock: !/OutOfStock|SoldOut|Discontinued|out of stock|sold out|unavailable|esaurito/i.test(
      availabilityText || html.slice(0, 200_000)
    ),
    storeKey: adapter.key,
    extractionMethod: usedAdapter
      ? "store-adapter"
      : json
        ? "structured-data"
        : "universal"
  };
}

function complete(product: ScrapedProduct) {
  return product.title !== "Untitled pick" && product.price !== null && Boolean(product.imageUrl);
}

async function fetchHtml(url: string, report?: ProgressReporter) {
  let current = (await assertPublicUrl(url)).toString();
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    await report?.({
      stage: "connecting",
      progress: Math.min(34 + redirects * 3, 46),
      message: redirects ? "Following the store link…" : "Connecting to the store…"
    });
    const response = await fetch(current, {
      headers,
      signal: AbortSignal.timeout(15_000),
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
      progress: 54,
      message: "Reading the product page…"
    });
    return { html: await response.text(), finalUrl: current };
  }
  throw new Error("Too many redirects");
}

async function fetchRenderedHtml(
  url: string,
  adapter: StoreAdapter,
  report?: ProgressReporter
) {
  await report?.({
    stage: "browser",
    progress: 82,
    message: `${adapter.name} uses an interactive page. Opening it now…`,
    storeName: adapter.name,
    storeKey: adapter.key
  });
  const [{ default: puppeteer }, chromium] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium")
  ]);
  const executablePath =
    process.env.CHROME_EXECUTABLE_PATH || (await chromium.default.executablePath());
  const browser = await puppeteer.launch({
    args: chromium.default.args,
    executablePath,
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(headers["user-agent"]);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    const readySelectors = [
      ...adapter.titleSelectors,
      ...adapter.priceSelectors,
      ...adapter.imageSelectors
    ].slice(0, 12);
    if (readySelectors.length) {
      await page.waitForSelector(readySelectors.join(","), { timeout: 8_000 }).catch(() => undefined);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function scrapeProduct(
  input: string,
  report?: ProgressReporter
): Promise<ScrapedProduct> {
  await report?.({
    stage: "validating",
    progress: 10,
    message: "Checking the product link…"
  });
  const url = z.string().url().parse(input);
  const publicUrl = await assertPublicUrl(url);
  let adapter = detectStore(publicUrl);

  await report?.({
    stage: "detecting",
    progress: 22,
    message:
      adapter.key === "generic"
        ? "Store recognized. Preparing universal extraction…"
        : `${adapter.name} detected. Loading its product layout…`,
    storeName: adapter.name,
    storeKey: adapter.key
  });

  const fetched = await fetchHtml(url, report);
  const redirectedAdapter = detectStore(fetched.finalUrl);
  if (redirectedAdapter.key !== adapter.key) {
    adapter = redirectedAdapter;
    await report?.({
      stage: "detecting",
      progress: 62,
      message: `${adapter.name} detected after following the link.`,
      storeName: adapter.name,
      storeKey: adapter.key
    });
  }

  await report?.({
    stage: "extracting",
    progress: 70,
    message:
      adapter.key === "generic"
        ? "Finding the title, price, and image…"
        : `Reading ${adapter.name}’s title, price, and image fields…`,
    storeName: adapter.name,
    storeKey: adapter.key
  });
  const initial = extractMetadata(fetched.html, fetched.finalUrl, adapter);
  const detectedStoreName = adapter.key === "generic" ? initial.siteName : adapter.name;

  if (complete(initial)) {
    await report?.({
      stage: "complete",
      progress: 100,
      message: `${detectedStoreName} product details ready`,
      storeName: detectedStoreName,
      storeKey: adapter.key
    });
    return initial;
  }

  try {
    const renderedHtml = await fetchRenderedHtml(fetched.finalUrl, adapter, report);
    const rendered = extractMetadata(renderedHtml, fetched.finalUrl, adapter);
    const result = complete(rendered) ? rendered : {
      ...rendered,
      title: rendered.title !== "Untitled pick" ? rendered.title : initial.title,
      imageUrl: rendered.imageUrl || initial.imageUrl,
      price: rendered.price ?? initial.price,
      currency: rendered.currency || initial.currency
    };
    const renderedStoreName = adapter.key === "generic" ? result.siteName : adapter.name;
    await report?.({
      stage: "complete",
      progress: 100,
      message: complete(result)
        ? `${renderedStoreName} product details ready`
        : `${renderedStoreName} details collected — review the missing fields`,
      storeName: renderedStoreName,
      storeKey: adapter.key
    });
    return result;
  } catch {
    await report?.({
      stage: "complete",
      progress: 100,
      message: `${detectedStoreName} details collected — review the missing fields`,
      storeName: detectedStoreName,
      storeKey: adapter.key
    });
    return initial;
  }
}
