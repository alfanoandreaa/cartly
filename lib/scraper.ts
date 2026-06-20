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
  priceConfidence: "high" | "medium" | "low";
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

type PriceCandidate = {
  value: number;
  currency: string | null;
  score: number;
  source: string;
  context: string;
};

const PRICE_TOKEN =
  /-?\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|-?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|-?\d+(?:[.,]\d{1,2})?/g;

function priceTokens(value: string) {
  return Array.from(value.replace(/\u00a0/g, " ").matchAll(PRICE_TOKEN))
    .map((match) => ({
      raw: match[0],
      index: match.index ?? 0
    }))
    .filter(({ raw }) => raw.length > 0);
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

function candidatePenalty(context: string, tokenIndex: number, tokenLength: number) {
  const lower = context.toLowerCase();
  const left = lower.slice(Math.max(0, tokenIndex - 30), tokenIndex);
  const right = lower.slice(tokenIndex + tokenLength, tokenIndex + tokenLength + 30);
  const nearby = `${left} ${right}`;
  let score = 0;

  if (/^\s*%/.test(right)) score -= 140;
  if (
    /\b(save|discount|coupon|promo|off|sconto|risparmia)\b/i.test(nearby) &&
    !inferCurrency(nearby)
  ) {
    score -= 48;
  }
  if (/\b(was|before|original|list price|rrp|msrp|retail|prezzo precedente|anzich[eé])\b/i.test(left)) score -= 45;
  if (
    /\b(month|monthly|installment|payment|rate|rata|mese|klarna|afterpay)\b/i.test(left) ||
    /^\s*(\/|per\s+)?(month|mese)\b/i.test(right) ||
    /^\s*(payments?|rate)\b/i.test(right)
  ) {
    score -= 52;
  }
  if (/\b(shipping|delivery|spedizione|consegna)\b/i.test(left)) score -= 65;
  if (/\b(current|now|sale price|our price|your price|oggi|ora|prezzo attuale)\b/i.test(left)) score += 18;
  if (inferCurrency(nearby)) score += 12;

  return score;
}

function candidatesFromText(
  text: string,
  score: number,
  source: string,
  explicitCurrency?: string | null
): PriceCandidate[] {
  const context = cleanText(text);
  if (!context) return [];

  return priceTokens(context)
    .map(({ raw, index }) => {
      const value = normalizePrice(raw);
      if (value === null || value <= 0 || value > 100_000_000) return null;
      const nearby = context.slice(Math.max(0, index - 24), index + raw.length + 24);
      return {
        value,
        currency: inferCurrency(nearby) || inferCurrency(context) || explicitCurrency || null,
        score: score + candidatePenalty(context, index, raw.length),
        source,
        context
      } satisfies PriceCandidate;
    })
    .filter((candidate): candidate is PriceCandidate => candidate !== null);
}

function elementPriceValues(element: cheerio.Cheerio<any>) {
  const values = [
    element.attr("content"),
    element.attr("value"),
    element.attr("data-price"),
    element.attr("data-product-price"),
    element.attr("data-sale-price"),
    element.attr("aria-label"),
    element.text()
  ];
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

function candidatesFromSelectors(
  $: cheerio.CheerioAPI,
  selectors: string[],
  baseScore: number,
  sourcePrefix: string,
  currency?: string | null
) {
  const candidates: PriceCandidate[] = [];
  selectors.forEach((selector, selectorIndex) => {
    $(selector)
      .slice(0, 10)
      .each((_, node) => {
        const element = $(node);
        elementPriceValues(element).forEach((value, valueIndex) => {
          candidates.push(
            ...candidatesFromText(
              value,
              baseScore - selectorIndex * 3 - valueIndex,
              `${sourcePrefix}:${selector}`,
              currency
            )
          );
        });
      });
  });
  return candidates;
}

function candidatesFromEmbeddedJson(
  html: string,
  keys: string[] = [],
  explicitCurrency?: string | null
) {
  const candidates: PriceCandidate[] = [];
  keys.forEach((key, keyIndex) => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `"${escaped}"\\s*:\\s*(?:"((?:\\\\.|[^"])*)"|(-?\\d+(?:\\.\\d+)?))`,
      "gi"
    );
    for (const match of Array.from(html.matchAll(regex))) {
      const value = cleanText(match[1] ? decodeEmbeddedString(match[1]) : match[2]);
      const keyLower = key.toLowerCase();
      let score = 103 - keyIndex * 2;
      if (/sale|current|activity|final|offer/.test(keyLower)) score += 18;
      if (/min/.test(keyLower)) score += 8;
      if (/original|retail|list|regular|was/.test(keyLower)) score -= 35;
      candidates.push(
        ...candidatesFromText(value, score, `embedded:${key}`, explicitCurrency)
      );
    }
  });
  return candidates;
}

function splitPriceCandidates(
  $: cheerio.CheerioAPI,
  adapter: StoreAdapter,
  currency?: string | null
) {
  const candidates: PriceCandidate[] = [];

  if (adapter.key === "amazon") {
    $(".a-price").slice(0, 8).each((_, node) => {
      const element = $(node);
      const accessible = cleanText(element.find(".a-offscreen").first().text());
      if (accessible) {
        candidates.push(...candidatesFromText(accessible, 148, "amazon:offscreen", currency));
        return;
      }
      const whole = cleanText(element.find(".a-price-whole").first().text()).replace(/[^\d.,]/g, "");
      const fraction = cleanText(element.find(".a-price-fraction").first().text()).replace(/\D/g, "");
      if (whole) {
        const combined = fraction
          ? `${whole.replace(/\D/g, "")}.${fraction.padEnd(2, "0").slice(0, 2)}`
          : whole;
        candidates.push(...candidatesFromText(combined, 144, "amazon:split", currency));
      }
    });
  }

  if (adapter.key === "ikea") {
    $('[class*="price"]').slice(0, 8).each((_, node) => {
      const element = $(node);
      const integer = cleanText(element.find('[class*="integer"]').first().text()).replace(/\D/g, "");
      const decimal = cleanText(element.find('[class*="decimal"]').first().text()).replace(/\D/g, "");
      if (integer) {
        candidates.push(
          ...candidatesFromText(
            decimal ? `${integer}.${decimal.padEnd(2, "0").slice(0, 2)}` : integer,
            138,
            "ikea:split",
            currency
          )
        );
      }
    });
  }

  return candidates;
}

function choosePrice(candidates: PriceCandidate[]) {
  if (!candidates.length) {
    return {
      price: null,
      currency: null,
      confidence: "low" as const
    };
  }

  const frequencies = new Map<string, number>();
  candidates.forEach((candidate) => {
    const key = candidate.value.toFixed(2);
    frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
  });

  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      finalScore:
        candidate.score +
        Math.min(16, Math.max(0, (frequencies.get(candidate.value.toFixed(2)) ?? 1) - 1) * 4)
    }))
    .filter((candidate) => candidate.finalScore > 20)
    .sort((a, b) => b.finalScore - a.finalScore || a.value - b.value);

  const winner = ranked[0];
  if (!winner) {
    return {
      price: null,
      currency: null,
      confidence: "low" as const
    };
  }

  const runnerUp = ranked.find((candidate) => candidate.value !== winner.value);
  const margin = runnerUp ? winner.finalScore - runnerUp.finalScore : 30;
  const sameRange =
    Boolean(runnerUp) &&
    runnerUp?.source === winner.source &&
    runnerUp?.context === winner.context;
  const confidence: ScrapedProduct["priceConfidence"] =
    winner.finalScore >= 125 && margin >= 8
      ? "high"
      : winner.finalScore >= 95 && (margin >= 2 || sameRange)
        ? "medium"
        : "low";

  return {
    price: winner.value,
    currency: winner.currency,
    confidence
  };
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
  const offerList = Array.isArray(json?.offers)
    ? json.offers
    : json?.offers
      ? [json.offers]
      : [];
  const offers = offerList[0];
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
  const adapterImage =
    firstImage($, adapter.imageSelectors) ||
    embeddedValue(html, adapter.embeddedImageKeys);
  const adapterCurrency = firstText($, adapter.currencySelectors ?? []);

  const structuredTitle = cleanText(String(json?.name ?? ""));
  const universalPriceSelectors = [
    'meta[property="product:price:amount"]',
    'meta[name="price"]',
    '[itemprop="price"]',
    '[data-testid*="price"]',
    '[data-test*="price"]',
    '[class~="price"]'
  ];
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
  const visiblePriceText = firstText($, [
    ...adapter.priceSelectors,
    ...universalPriceSelectors
  ]);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  const pageCurrency =
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
    inferCurrency(visiblePriceText) ||
    adapter.defaultCurrency?.(hostname) ||
    "EUR";

  const priceCandidates: PriceCandidate[] = [
    ...splitPriceCandidates($, adapter, pageCurrency),
    ...candidatesFromSelectors(
      $,
      adapter.priceSelectors,
      adapter.key === "generic" ? 96 : 132,
      adapter.key,
      pageCurrency
    ),
    ...candidatesFromEmbeddedJson(
      html,
      adapter.embeddedPriceKeys,
      pageCurrency
    ),
    ...candidatesFromSelectors(
      $,
      universalPriceSelectors,
      112,
      "semantic",
      pageCurrency
    )
  ];

  offerList.slice(0, 12).forEach((offer: Record<string, any>, offerIndex: number) => {
    const specification = Array.isArray(offer?.priceSpecification)
      ? offer.priceSpecification[0]
      : offer?.priceSpecification;
    const structuredValues: Array<[unknown, number, string]> = [
      [offer?.price, 142 - offerIndex, "jsonld:offer-price"],
      [offer?.lowPrice, 136 - offerIndex, "jsonld:low-price"],
      [offer?.highPrice, 112 - offerIndex, "jsonld:high-price"],
      [specification?.price, 132 - offerIndex, "jsonld:price-specification"]
    ];
    structuredValues.forEach(([value, score, source]) => {
      if (value !== null && value !== undefined) {
        priceCandidates.push(
          ...candidatesFromText(
            String(value),
            score,
            source,
            cleanText(String(offer?.priceCurrency ?? specification?.priceCurrency ?? "")) ||
              pageCurrency
          )
        );
      }
    });
  });

  const chosenPrice = choosePrice(priceCandidates);
  const price = chosenPrice.price;
  const currency = chosenPrice.currency || pageCurrency;

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
    adapter.key !== "generic" &&
    Boolean(
      adapterTitle ||
      adapterImage ||
      priceCandidates.some((candidate) => candidate.source.startsWith(`${adapter.key}:`))
    );

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
        : "universal",
    priceConfidence: chosenPrice.confidence
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

  if (complete(initial) && !adapter.browserPreferred) {
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
