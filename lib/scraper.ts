import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import { detectStore, type StoreAdapter, type StoreKey } from "@/lib/store-adapters";

export type PriceSource = "json-ld" | "meta" | "domain-css" | "manual";

export type ScrapedProduct = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  siteName: string;
  inStock: boolean;
  storeKey: StoreKey;
  extractionMethod: "store-adapter" | "structured-data" | "universal";
  priceSource: PriceSource;
};

export type ScrapeProgress = {
  stage:
    | "validating"
    | "detecting"
    | "connecting"
    | "reading"
    | "extracting"
    | "browser"
    | "complete";
  progress: number;
  message: string;
  storeName?: string;
  storeKey?: StoreKey;
};

type ProgressReporter = (progress: ScrapeProgress) => void | Promise<void>;

type ExtractedPrice = {
  price: number;
  currency: string | null;
  source: Exclude<PriceSource, "manual">;
};

const headers = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9,it;q=0.8"
};

// Optional third-party scraping service (ScraperAPI). When configured, requests
// are routed through it so retailers like Amazon don't block the server's IP.
// Without a key we fall back to a direct fetch (fine for local development).
const SCRAPER_API_KEY = process.env.SCRAPERAPI_KEY?.trim();

function scraperApiEndpoint(targetUrl: string, render: boolean) {
  const params = new URLSearchParams({ api_key: SCRAPER_API_KEY!, url: targetUrl });
  if (render) params.set("render", "true");
  return `https://api.scraperapi.com/?${params.toString()}`;
}

// ScraperAPI structured data endpoint — returns parsed JSON for supported
// retailers (Amazon, eBay, Walmart, …) instead of raw HTML.
function scraperApiStructuredEndpoint(targetUrl: string) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY!,
    url: targetUrl,
    autoparse: "true"
  });
  return `https://api.scraperapi.com/?${params.toString()}`;
}

// Retailers whose structured-data endpoint returns reliable price/title/image.
const AUTOPARSE_DOMAINS = [/amazon\./i, /ebay\./i, /walmart\./i];

function supportsAutoparse(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return AUTOPARSE_DOMAINS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

async function fetchStructuredProduct(
  url: string,
  adapter: StoreAdapter,
  report?: ProgressReporter
): Promise<ScrapedProduct | null> {
  if (!SCRAPER_API_KEY || !supportsAutoparse(url)) return null;

  await report?.({
    stage: "connecting",
    progress: 35,
    message: `Connecting to ${adapter.name}…`
  });

  const response = await fetch(scraperApiStructuredEndpoint(url), {
    signal: AbortSignal.timeout(25_000),
    cache: "no-store"
  });
  if (!response.ok) return null;

  await report?.({ stage: "extracting", progress: 70, message: "Reading product data…" });

  const data = (await response.json()) as Record<string, any>;

  // ScraperAPI returns different shapes for different retailers.
  const rawPrice =
    data.pricing ??
    data.price ??
    data.sale_price ??
    data.buybox_winner?.price ??
    null;
  const price = normalizePrice(typeof rawPrice === "string" ? rawPrice : String(rawPrice ?? ""));

  // Original / list price (the struck-through "was" price) for discount display.
  const rawListPrice =
    data.list_price ?? data.original_price ?? data.buybox_winner?.rrp ?? null;
  const listPrice = normalizePrice(
    typeof rawListPrice === "string" ? rawListPrice : String(rawListPrice ?? "")
  );
  const oldPrice =
    listPrice !== null && price !== null && listPrice > price ? listPrice : null;

  const title =
    cleanText(data.name ?? data.title ?? data.product_name ?? "") || "Untitled pick";

  const rawImages: unknown[] = Array.isArray(data.images)
    ? data.images
    : data.image
      ? [data.image]
      : [];
  const imageUrl =
    rawImages
      .map((img) =>
        typeof img === "string" ? img : (img as any)?.link ?? (img as any)?.url ?? ""
      )
      .find((src) => typeof src === "string" && src.startsWith("http")) ?? null;

  const hostname = new URL(url).hostname.toLowerCase();

  return {
    title: title.slice(0, 240),
    imageUrl,
    price,
    oldPrice,
    currency: inferCurrency(String(rawPrice ?? "")) ?? adapter.defaultCurrency?.(hostname) ?? "EUR",
    siteName: adapter.name,
    inStock: true,
    storeKey: adapter.key,
    extractionMethod: "structured-data",
    priceSource: "json-ld"
  };
}

export function normalizePrice(value?: string | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (!value) return null;

  const normalizedSpaces = value.replace(/\u00a0/g, " ").trim();
  const numericPart = normalizedSpaces.match(/\d[\d.,\s]*/)?.[0]?.replace(/\s/g, "");
  if (!numericPart) return null;

  const lastComma = numericPart.lastIndexOf(",");
  const lastDot = numericPart.lastIndexOf(".");
  let normalized = numericPart;

  if (lastComma > lastDot) {
    const decimals = numericPart.length - lastComma - 1;
    normalized =
      decimals === 1 || decimals === 2
        ? numericPart.replace(/\./g, "").replace(",", ".")
        : numericPart.replace(/,/g, "");
  } else if (lastDot > lastComma) {
    const decimals = numericPart.length - lastDot - 1;
    normalized =
      decimals === 1 || decimals === 2
        ? numericPart.replace(/,/g, "")
        : numericPart.replace(/\./g, "");
  } else {
    normalized = numericPart.replace(/[.,]/g, "");
  }

  const result = Number.parseFloat(normalized);
  return Number.isFinite(result) && result >= 0 ? result : null;
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

function priceValuesFromText(value: string) {
  const normalized = value.replace(/\u00a0/g, " ");
  const candidates = Array.from(normalized.matchAll(/\d[\d.,\s]*/g)).flatMap(
    (match) => {
      const raw = match[0].trim();
      const index = match.index ?? 0;
      const after = normalized.slice(index + match[0].length);
      if (/^\s*%/.test(after)) return [];

      const price = normalizePrice(raw);
      if (price === null || price <= 0) return [];

      const nearby = normalized.slice(
        Math.max(0, index - 6),
        Math.min(normalized.length, index + match[0].length + 6)
      );
      return [{ price, hasCurrency: inferCurrency(nearby) !== null }];
    }
  );

  const currencyPrices = candidates.filter((candidate) => candidate.hasCurrency);
  return (currencyPrices.length ? currencyPrices : candidates).map(
    (candidate) => candidate.price
  );
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

function findProducts(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value.flatMap(findProducts);
  if (!value || typeof value !== "object") return [];

  const object = value as Record<string, any>;
  const type = object["@type"];
  const matches =
    type === "Product" || (Array.isArray(type) && type.includes("Product")) ? [object] : [];

  return [
    ...matches,
    ...["@graph", "mainEntity", "itemListElement"]
      .filter((key) => object[key])
      .flatMap((key) => findProducts(object[key]))
  ];
}

function jsonLdProducts($: cheerio.CheerioAPI) {
  const products: Record<string, any>[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      products.push(...findProducts(JSON.parse($(element).text())));
    } catch {
      // Ignore invalid JSON-LD and continue with the next script.
    }
  });
  return products;
}

function currencyFromOffer(offer: Record<string, any>, fallback?: string | null) {
  return cleanText(String(offer.priceCurrency ?? offer.priceSpecification?.priceCurrency ?? "")) || fallback || null;
}

// Step 1: Schema.org Product JSON-LD.
export function extractPriceFromJsonLd($: cheerio.CheerioAPI): ExtractedPrice | null {
  for (const product of jsonLdProducts($)) {
    const offers = product.offers;

    if (Array.isArray(offers)) {
      const values = offers
        .map((offer) => ({
          price: normalizePrice(offer?.price),
          currency: currencyFromOffer(offer ?? {})
        }))
        .filter((entry): entry is { price: number; currency: string | null } => entry.price !== null);

      // Sites list the featured offer first; trust it instead of the cheapest.
      if (values.length) {
        return { ...values[0], source: "json-ld" };
      }
      continue;
    }

    if (offers && typeof offers === "object") {
      const availablePrices = [offers.price, offers.lowPrice]
        .map(normalizePrice)
        .filter((price): price is number => price !== null);
      // Prefer the explicit `price` over the aggregate `lowPrice`.
      if (availablePrices.length) {
        return {
          price: availablePrices[0],
          currency: currencyFromOffer(offers),
          source: "json-ld"
        };
      }
    }
  }
  return null;
}

// Step 2: ordered product/OpenGraph/Twitter meta tags.
export function extractPriceFromMeta($: cheerio.CheerioAPI): ExtractedPrice | null {
  const currency =
    cleanText(
      $('meta[property="product:price:currency"]').attr("content") ||
        $('meta[property="og:price:currency"]').attr("content")
    ) || null;
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="twitter:data1"]'
  ];

  for (const selector of selectors) {
    const content = cleanText($(selector).first().attr("content"));
    const price = normalizePrice(content);
    if (price !== null) {
      return {
        price,
        currency: inferCurrency(content) || currency,
        source: "meta"
      };
    }
  }
  return null;
}

function valuesFromPriceElement(
  $: cheerio.CheerioAPI,
  element: cheerio.Cheerio<any>,
  adapter: StoreAdapter
) {
  const values = [
    element.attr("content"),
    element.attr("value"),
    element.attr("data-price"),
    element.attr("data-product-price"),
    element.attr("data-sale-price"),
    element.attr("aria-label"),
    element.text()
  ];

  if (adapter.key === "ikea" && element.is(".pip-price__integer")) {
    const parentText = cleanText(element.closest('[class*="pip-price"]').text());
    if (parentText) values.unshift(parentText);
  }

  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

// Step 3: domain-specific CSS selectors, in declared order.
export function extractPriceFromDomainSelectors(
  $: cheerio.CheerioAPI,
  adapter: StoreAdapter,
  hostname: string
): ExtractedPrice | null {
  if (adapter.key === "generic") return null;

  // Selectors are ordered by priority and the DOM lists the primary price
  // first, so return the first match instead of the cheapest one.
  for (const selector of adapter.priceSelectors) {
    for (const node of $(selector).slice(0, 12).toArray()) {
      const element = $(node);
      for (const value of valuesFromPriceElement($, element, adapter)) {
        const [price] = priceValuesFromText(value);
        if (price === undefined) continue;
        const currency =
          inferCurrency(value) ||
          inferCurrency(firstText($, adapter.currencySelectors ?? [])) ||
          adapter.defaultCurrency?.(hostname) ||
          null;
        return { price, currency, source: "domain-css" };
      }
    }
  }
  return null;
}

export function extractPriceByHierarchy(
  html: string,
  sourceUrl: string,
  adapter = detectStore(sourceUrl)
) {
  const $ = cheerio.load(html);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  return (
    extractPriceFromJsonLd($) ||
    extractPriceFromMeta($) ||
    extractPriceFromDomainSelectors($, adapter, hostname)
  );
}

// Common markup for the original / struck-through price across retailers.
const LIST_PRICE_SELECTORS = [
  ".basisPrice .a-offscreen",
  ".a-text-price .a-offscreen",
  '[data-a-strike="true"] .a-offscreen',
  '[class*="list-price"]',
  '[class*="listPrice"]',
  '[class*="old-price"]',
  '[class*="oldPrice"]',
  '[class*="was-price"]',
  '[class*="original-price"]',
  '[class*="originalPrice"]',
  '[class*="price--old"]',
  '[class*="strikethrough"]',
  "del",
  "s"
];

// The original price (for discount display). Only returned when it is higher
// than the current price, which filters out unrelated struck-through text.
function extractListPrice($: cheerio.CheerioAPI, currentPrice: number | null) {
  for (const product of jsonLdProducts($)) {
    const offers = product.offers;
    if (offers && typeof offers === "object" && !Array.isArray(offers)) {
      const high = normalizePrice(offers.highPrice);
      if (high !== null && (currentPrice === null || high > currentPrice)) return high;
    }
  }

  for (const selector of LIST_PRICE_SELECTORS) {
    for (const node of $(selector).slice(0, 8).toArray()) {
      const element = $(node);
      const text = cleanText(element.attr("content") || element.text());
      const [price] = priceValuesFromText(text);
      if (price !== undefined && (currentPrice === null || price > currentPrice)) {
        return price;
      }
    }
  }
  return null;
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

function extractMetadata(
  html: string,
  sourceUrl: string,
  adapter: StoreAdapter,
  extractedPrice: ExtractedPrice | null
): ScrapedProduct {
  const $ = cheerio.load(html);
  const product = jsonLdProducts($)[0];
  const imageValue = Array.isArray(product?.image) ? product.image[0] : product?.image;
  const jsonImage =
    imageValue && typeof imageValue === "object"
      ? imageValue.url || imageValue.contentUrl
      : imageValue;
  const title =
    firstText($, adapter.titleSelectors) ||
    cleanText(String(product?.name ?? "")) ||
    firstText($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    cleanText($("title").text()) ||
    "Untitled pick";
  const image =
    firstImage($, adapter.imageSelectors) ||
    cleanText(String(jsonImage ?? "")) ||
    firstText($, [
      'meta[property="og:image:secure_url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  const siteName =
    adapter.key === "generic"
      ? firstText($, ['meta[property="og:site_name"]', 'meta[name="application-name"]']) ||
        hostname.replace(/^www\./, "").split(".")[0]
      : adapter.name;
  const availability = [
    firstText($, adapter.availabilitySelectors ?? []),
    $('meta[property="product:availability"]').attr("content"),
    $('[itemprop="availability"]').attr("href"),
    $('[itemprop="availability"]').attr("content")
  ]
    .filter(Boolean)
    .join(" ");

  const oldPrice = extractedPrice
    ? extractListPrice($, extractedPrice.price)
    : null;

  return {
    title: title.slice(0, 240),
    imageUrl: resolveImage(image, sourceUrl),
    price: extractedPrice?.price ?? null,
    oldPrice,
    currency:
      extractedPrice?.currency ||
      adapter.defaultCurrency?.(hostname) ||
      "EUR",
    siteName,
    inStock: !/OutOfStock|SoldOut|Discontinued|out of stock|sold out|unavailable|esaurito/i.test(
      availability
    ),
    storeKey: adapter.key,
    extractionMethod:
      extractedPrice?.source === "json-ld"
        ? "structured-data"
        : adapter.key !== "generic"
          ? "store-adapter"
          : "universal",
    priceSource: extractedPrice?.source ?? "manual"
  };
}

async function fetchHtml(url: string, report?: ProgressReporter, render = false) {
  const target = (await assertPublicUrl(url)).toString();

  // Preferred path: route through the scraping service to avoid IP blocks.
  if (SCRAPER_API_KEY) {
    await report?.({
      stage: render ? "browser" : "connecting",
      progress: render ? 60 : 40,
      message: render
        ? "Opening the page in a real browser…"
        : "Connecting to the store…"
    });
    const response = await fetch(scraperApiEndpoint(target, render), {
      signal: AbortSignal.timeout(render ? 40_000 : 25_000),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Scraping service returned ${response.status}`);
    await report?.({ stage: "reading", progress: 70, message: "Reading the product page…" });
    return { html: await response.text(), finalUrl: target };
  }

  // Fallback: direct request (works locally, often blocked from a server).
  let current = target;
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
    await report?.({ stage: "reading", progress: 54, message: "Reading the product page…" });
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
    message: `The price is loaded by ${adapter.name} in the browser. Waiting for it…`,
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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
    if (adapter.priceSelectors.length) {
      await page
        .waitForSelector(adapter.priceSelectors.join(","), { timeout: 8_000 })
        .catch(() => undefined);
    }
    return await page.content();
  } finally {
    await browser.close();
  }
}

function manualFallback(url: string, adapter: StoreAdapter): ScrapedProduct {
  const hostname = new URL(url).hostname.toLowerCase();
  return {
    title: "Untitled pick",
    imageUrl: null,
    price: null,
    oldPrice: null,
    currency: adapter.defaultCurrency?.(hostname) || "EUR",
    siteName: adapter.key === "generic" ? hostname.replace(/^www\./, "").split(".")[0] : adapter.name,
    inStock: true,
    storeKey: adapter.key,
    extractionMethod: adapter.key === "generic" ? "universal" : "store-adapter",
    priceSource: "manual"
  };
}

export async function scrapeProduct(input: string, report?: ProgressReporter): Promise<ScrapedProduct> {
  await report?.({ stage: "validating", progress: 10, message: "Checking the product link…" });
  const url = z.string().url().parse(input);
  const publicUrl = await assertPublicUrl(url);
  let adapter = detectStore(publicUrl);

  await report?.({
    stage: "detecting",
    progress: 22,
    message:
      adapter.key === "generic"
        ? "Store recognized. Reading standard product data…"
        : `${adapter.name} detected. Loading its product layout…`,
    storeName: adapter.name,
    storeKey: adapter.key
  });

  // Step 1: for supported retailers use ScraperAPI's structured-data parser —
  // it returns pre-parsed price/title/image directly, bypassing HTML fragility.
  let structuredPartial: ScrapedProduct | null = null;
  try {
    const structured = await fetchStructuredProduct(url, adapter, report);
    if (structured?.price != null) {
      await report?.({
        stage: "complete",
        progress: 100,
        message: `${structured.siteName} product details ready`,
        storeName: structured.siteName,
        storeKey: adapter.key
      });
      return structured;
    }
    // No price yet — keep any title/image so the manual form is pre-filled,
    // then fall through to HTML scraping which may still find the price.
    structuredPartial = structured;
  } catch {
    // Fall through to HTML scraping.
  }

  // Step 2: fetch the page HTML. When ScraperAPI is active we always start
  // without JS rendering (their proxy already bypasses most blocks); rendering
  // is only used as a fallback when the plain fetch yields no price.
  let initialHtml = "";
  let finalUrl = url;
  try {
    const fetched = await fetchHtml(url, report, false);
    initialHtml = fetched.html;
    finalUrl = fetched.finalUrl;
    adapter = detectStore(finalUrl);
  } catch {
    // Step 3 can still recover.
  }

  if (initialHtml) {
    await report?.({
      stage: "extracting",
      progress: 78,
      message: "Checking structured data, product meta tags, and store selectors…",
      storeName: adapter.name,
      storeKey: adapter.key
    });
    const initialPrice = extractPriceByHierarchy(initialHtml, finalUrl, adapter);
    if (initialPrice) {
      const result = extractMetadata(initialHtml, finalUrl, adapter, initialPrice);
      await report?.({
        stage: "complete",
        progress: 100,
        message: `${result.siteName} product details ready`,
        storeName: result.siteName,
        storeKey: adapter.key
      });
      return result;
    }
  }

  // Step 3: retry with JS rendering for stores that load prices dynamically.
  try {
    const renderedHtml = SCRAPER_API_KEY
      ? (await fetchHtml(finalUrl, report, true)).html
      : await fetchRenderedHtml(finalUrl, adapter, report);
    const renderedPrice = extractPriceByHierarchy(renderedHtml, finalUrl, adapter);
    const result = extractMetadata(renderedHtml, finalUrl, adapter, renderedPrice);
    await report?.({
      stage: "complete",
      progress: 100,
      message: renderedPrice
        ? `${result.siteName} product details ready`
        : "Price not detected — enter it manually",
      storeName: result.siteName,
      storeKey: adapter.key
    });
    return result;
  } catch {
    // Fall through to the manual-entry result below.
  }

  // Nothing worked — return the richest metadata we have for manual completion.
  const result =
    structuredPartial ??
    (initialHtml
      ? extractMetadata(initialHtml, finalUrl, adapter, null)
      : manualFallback(finalUrl, adapter));
  await report?.({
    stage: "complete",
    progress: 100,
    message: "Price not detected — enter it manually",
    storeName: result.siteName,
    storeKey: adapter.key
  });
  return result;
}
