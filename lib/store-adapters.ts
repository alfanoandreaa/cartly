export type StoreKey =
  | "amazon"
  | "temu"
  | "aliexpress"
  | "ebay"
  | "etsy"
  | "walmart"
  | "zalando"
  | "shein"
  | "asos"
  | "zara"
  | "ikea"
  | "nike"
  | "generic";

export type StoreAdapter = {
  key: StoreKey;
  name: string;
  domains: RegExp[];
  titleSelectors: string[];
  priceSelectors: string[];
  imageSelectors: string[];
  currencySelectors?: string[];
  availabilitySelectors?: string[];
  embeddedTitleKeys?: string[];
  embeddedPriceKeys?: string[];
  embeddedImageKeys?: string[];
  browserPreferred?: boolean;
  defaultCurrency?: (hostname: string) => string | null;
};

function amazonCurrency(hostname: string) {
  if (hostname.endsWith(".it") || hostname.endsWith(".de") || hostname.endsWith(".fr") || hostname.endsWith(".es") || hostname.endsWith(".nl")) return "EUR";
  if (hostname.endsWith(".co.uk")) return "GBP";
  if (hostname.endsWith(".co.jp")) return "JPY";
  if (hostname.endsWith(".ca")) return "CAD";
  if (hostname.endsWith(".com.au")) return "AUD";
  return "USD";
}

function marketplaceCurrency(hostname: string) {
  if (hostname.endsWith(".it") || hostname.endsWith(".de") || hostname.endsWith(".fr") || hostname.endsWith(".es") || hostname.endsWith(".nl")) return "EUR";
  if (hostname.endsWith(".co.uk")) return "GBP";
  if (hostname.endsWith(".ca")) return "CAD";
  if (hostname.endsWith(".com.au")) return "AUD";
  if (hostname.endsWith(".ch")) return "CHF";
  if (hostname.endsWith(".pl")) return "PLN";
  return "USD";
}

export const STORE_ADAPTERS: StoreAdapter[] = [
  {
    key: "amazon",
    name: "Amazon",
    domains: [/(^|\.)amazon\.[a-z.]+$/i, /(^|\.)amzn\.(to|eu)$/i],
    titleSelectors: ["#productTitle", "#title span", "h1#title"],
    priceSelectors: [
      "#corePrice_feature_div .a-price .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
      ".apexPriceToPay .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#price_inside_buybox"
    ],
    imageSelectors: [
      "#landingImage",
      "#imgBlkFront",
      "#ebooksImgBlkFront",
      "#main-image"
    ],
    currencySelectors: [".a-price-symbol"],
    availabilitySelectors: ["#availability", "#outOfStock", "#merchant-info"],
    embeddedTitleKeys: ["productTitle", "title"],
    embeddedPriceKeys: ["priceAmount", "displayPrice", "price"],
    embeddedImageKeys: ["hiRes", "large", "mainUrl", "imageUrl"],
    defaultCurrency: amazonCurrency
  },
  {
    key: "temu",
    name: "Temu",
    domains: [/(^|\.)temu\.com$/i],
    titleSelectors: [
      '[data-testid="product-title"]',
      '[data-test="product-title"]',
      '[class*="product-title"]',
      'h1[class*="title"]'
    ],
    priceSelectors: [
      '[data-testid="product-price"]',
      '[data-test="product-price"]',
      '[class*="sale-price"]',
      '[class*="product-price"]',
      '[class*="price"]'
    ],
    imageSelectors: [
      '[data-testid="product-image"] img',
      '[class*="goods-image"] img',
      '[class*="product-image"] img',
      'picture img'
    ],
    availabilitySelectors: ['[class*="stock"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["goodsName", "productName", "title"],
    embeddedPriceKeys: ["salePrice", "price", "minPrice"],
    embeddedImageKeys: ["goodsImage", "imageUrl", "thumbUrl"],
    browserPreferred: true
  },
  {
    key: "aliexpress",
    name: "AliExpress",
    domains: [/(^|\.)aliexpress\.(com|us)$/i],
    titleSelectors: [
      'h1[data-pl="product-title"]',
      ".product-title-text",
      '[class*="title--wrap"] h1',
      'h1[class*="title"]'
    ],
    priceSelectors: [
      ".product-price-value",
      '[class*="price--current"]',
      '[class*="price--originalText"]',
      '[class*="price"]'
    ],
    imageSelectors: [
      ".images-view-item img",
      '[class*="slider--img"]',
      '[class*="image-view"] img',
      'picture img'
    ],
    availabilitySelectors: ['[class*="quantity"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["subject", "productTitle", "title"],
    embeddedPriceKeys: ["formattedPrice", "minActivityAmount", "minAmount", "price"],
    embeddedImageKeys: ["imagePathList", "imageUrl", "mainImage"],
    browserPreferred: true,
    defaultCurrency: () => "USD"
  },
  {
    key: "ebay",
    name: "eBay",
    domains: [/(^|\.)ebay\.[a-z.]+$/i],
    titleSelectors: [
      "h1.x-item-title__mainTitle",
      ".x-item-title__mainTitle span",
      "#itemTitle"
    ],
    priceSelectors: [
      ".x-price-primary span",
      ".x-bin-price__content .ux-textspans",
      "#prcIsum",
      "#mm-saleDscPrc"
    ],
    imageSelectors: [
      ".ux-image-carousel-item.active img",
      ".ux-image-carousel-item img",
      "#icImg"
    ],
    availabilitySelectors: [".x-quantity__availability", "#qtySubTxt", ".d-quantity__availability"],
    embeddedTitleKeys: ["title"],
    embeddedPriceKeys: ["price", "value"],
    embeddedImageKeys: ["imageUrl", "zoomUrl"],
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "etsy",
    name: "Etsy",
    domains: [/(^|\.)etsy\.com$/i],
    titleSelectors: [
      'h1[data-buy-box-listing-title]',
      'h1[data-listing-title]',
      "h1.wt-text-body-01"
    ],
    priceSelectors: [
      '[data-buy-box-region="price"]',
      "p.wt-text-title-larger",
      '[class*="price"]'
    ],
    imageSelectors: [
      'img[data-index="0"]',
      '[data-carousel-pane] img',
      '.listing-page-image-carousel img'
    ],
    availabilitySelectors: ['[data-selector="listing-page-quantity-select"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["title"],
    embeddedPriceKeys: ["price", "amount"],
    embeddedImageKeys: ["url_fullxfull", "imageUrl"],
    defaultCurrency: () => "EUR"
  },
  {
    key: "walmart",
    name: "Walmart",
    domains: [/(^|\.)walmart\.(com|ca)$/i],
    titleSelectors: ['h1[itemprop="name"]', '[data-testid="product-title"]', "h1"],
    priceSelectors: [
      '[itemprop="price"]',
      '[data-testid="price-wrap"]',
      '[data-automation-id="product-price"]'
    ],
    imageSelectors: [
      'img[data-testid="hero-image"]',
      '[data-testid="media-thumbnail"] img',
      'img[itemprop="image"]'
    ],
    availabilitySelectors: ['[data-testid="fulfillment-shipping-text"]', '[data-testid*="stock"]'],
    embeddedTitleKeys: ["productName", "title"],
    embeddedPriceKeys: ["currentPrice", "price"],
    embeddedImageKeys: ["imageUrl", "image"],
    defaultCurrency: (hostname) => (hostname.endsWith(".ca") ? "CAD" : "USD")
  },
  {
    key: "zalando",
    name: "Zalando",
    domains: [/(^|\.)zalando\.[a-z.]+$/i, /(^|\.)zalando-lounge\.[a-z.]+$/i],
    titleSelectors: ['h1[data-testid="product-name"]', 'h1[class*="name"]', "main h1"],
    priceSelectors: ['[data-testid="product-price"]', '[class*="price"]'],
    imageSelectors: ['[data-testid="pdp-gallery"] img', 'main picture img', 'main img'],
    availabilitySelectors: ['[data-testid*="size"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["name", "productName"],
    embeddedPriceKeys: ["price", "currentPrice"],
    embeddedImageKeys: ["media", "imageUrl"],
    browserPreferred: true,
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "shein",
    name: "SHEIN",
    domains: [/(^|\.)shein\.[a-z.]+$/i],
    titleSelectors: [".product-intro__head-name", '[class*="product-intro"] h1', "main h1"],
    priceSelectors: [
      ".product-intro__head-mainprice",
      ".product-intro__head-price",
      '[class*="mainprice"]'
    ],
    imageSelectors: [
      ".crop-image-container img",
      ".product-intro__thumbs-item img",
      'main picture img'
    ],
    availabilitySelectors: ['[class*="product-intro__size"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["goods_name", "goodsName", "productName"],
    embeddedPriceKeys: ["salePrice", "retailPrice", "amount"],
    embeddedImageKeys: ["goods_img", "imageUrl"],
    browserPreferred: true,
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "asos",
    name: "ASOS",
    domains: [/(^|\.)asos\.com$/i],
    titleSelectors: ['h1[data-testid="product-title"]', "h1"],
    priceSelectors: ['[data-testid="current-price"]', '[data-testid="product-price"]'],
    imageSelectors: ['[data-testid="image-gallery"] img', 'main picture img'],
    availabilitySelectors: ['[data-testid="size-section"]', '[class*="outOfStock"]'],
    embeddedTitleKeys: ["name", "productName"],
    embeddedPriceKeys: ["current", "price"],
    embeddedImageKeys: ["imageUrl", "url"],
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "zara",
    name: "Zara",
    domains: [/(^|\.)zara\.com$/i],
    titleSelectors: [
      ".product-detail-info__header-name",
      '[data-qa-qualifier="product-detail-info-name"]',
      "main h1"
    ],
    priceSelectors: [
      ".money-amount__main",
      '[data-qa-qualifier="product-detail-info-price"]',
      '[class*="price"]'
    ],
    imageSelectors: [
      ".media-image__image",
      ".product-detail-images__image img",
      'main picture img'
    ],
    availabilitySelectors: ['[class*="size-selector"]', '[class*="out-of-stock"]'],
    embeddedTitleKeys: ["name", "productName"],
    embeddedPriceKeys: ["price", "amount"],
    embeddedImageKeys: ["url", "imageUrl"],
    browserPreferred: true,
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "ikea",
    name: "IKEA",
    domains: [/(^|\.)ikea\.[a-z.]+$/i],
    titleSelectors: [
      ".pip-header-section__title--big",
      ".pip-header-section__title",
      'h1[data-testid="product-name"]'
    ],
    priceSelectors: [
      ".pip-temp-price__integer",
      ".pip-price__integer",
      '[data-testid="product-price"]'
    ],
    imageSelectors: [
      ".pip-image img",
      ".pip-product-gallery img",
      'img[itemprop="image"]'
    ],
    availabilitySelectors: ['[data-testid*="availability"]', ".pip-stockcheck"],
    embeddedTitleKeys: ["name", "productName"],
    embeddedPriceKeys: ["price", "currentPrice"],
    embeddedImageKeys: ["imageUrl", "url"],
    defaultCurrency: marketplaceCurrency
  },
  {
    key: "nike",
    name: "Nike",
    domains: [/(^|\.)nike\.com$/i],
    titleSelectors: ['h1[data-testid="product-title"]', "#pdp_product_title", "main h1"],
    priceSelectors: ['[data-testid="product-price"]', ".product-price", '[class*="price"]'],
    imageSelectors: ['[data-testid="HeroImg"] img', "#pdp-6-up img", 'main picture img'],
    availabilitySelectors: ['[data-testid="size-selector"]', '[class*="sold-out"]'],
    embeddedTitleKeys: ["title", "productName"],
    embeddedPriceKeys: ["currentPrice", "price"],
    embeddedImageKeys: ["squarishURL", "portraitURL", "imageUrl"],
    browserPreferred: true,
    defaultCurrency: marketplaceCurrency
  }
];

export const GENERIC_STORE: StoreAdapter = {
  key: "generic",
  name: "Online store",
  domains: [],
  titleSelectors: ['[itemprop="name"]', "main h1", "h1"],
  priceSelectors: [
    '[itemprop="price"]',
    '[data-testid*="price"]',
    '[data-test*="price"]',
    ".price_color",
    ".product-price",
    ".sale-price",
    ".current-price",
    '[class~="price"]',
    'main [class*="price"]',
    'main [id*="price"]',
    '[class*="Price"]'
  ],
  imageSelectors: [
    'img[itemprop="image"]',
    'main img[data-testid*="product"]',
    'main img[class*="product"]',
    'main picture img',
    "#product_gallery img",
    ".product-gallery img",
    ".product-image img",
    "main img"
  ],
  availabilitySelectors: [
    '[data-testid*="availability"]',
    '[data-testid*="stock"]',
    '[class*="availability"]',
    '[class*="stock"]'
  ],
  embeddedTitleKeys: ["productName", "goodsName", "title", "name"],
  embeddedPriceKeys: ["salePrice", "currentPrice", "price", "amount"],
  embeddedImageKeys: ["imageUrl", "mainImage", "image", "url"]
};

export function detectStore(input: string | URL) {
  const url = input instanceof URL ? input : new URL(input);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  return STORE_ADAPTERS.find((adapter) => adapter.domains.some((domain) => domain.test(hostname))) ?? GENERIC_STORE;
}
