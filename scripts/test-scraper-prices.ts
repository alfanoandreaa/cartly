import assert from "node:assert/strict";
import { extractPriceByHierarchy, normalizePrice } from "../lib/scraper";

assert.equal(normalizePrice("€ 1.299,99"), 1299.99);
assert.equal(normalizePrice("$1,299.99"), 1299.99);
assert.equal(normalizePrice("£ 51.77"), 51.77);
assert.equal(normalizePrice("1 299,95 PLN"), 1299.95);

const jsonLd = extractPriceByHierarchy(
  `
    <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": {"@type":"Offer","price":"299,00","priceCurrency":"EUR"}
      }
    </script>
    <meta property="product:price:amount" content="399.00">
  `,
  "https://shop.example.com/product"
);
assert.deepEqual(jsonLd, { price: 299, currency: "EUR", source: "json-ld" });

// The featured offer is listed first; a cheaper alternate offer must not win.
const jsonLdArray = extractPriceByHierarchy(
  `
    <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": [
          {"@type":"Offer","price":"299.00","priceCurrency":"EUR"},
          {"@type":"Offer","price":"239.00","priceCurrency":"EUR"}
        ]
      }
    </script>
  `,
  "https://shop.example.com/product"
);
assert.deepEqual(jsonLdArray, { price: 299, currency: "EUR", source: "json-ld" });

const jsonLdLowPrice = extractPriceByHierarchy(
  `
    <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "149,95",
          "priceCurrency": "EUR"
        }
      }
    </script>
  `,
  "https://shop.example.com/product"
);
assert.deepEqual(jsonLdLowPrice, {
  price: 149.95,
  currency: "EUR",
  source: "json-ld"
});

const metaProduct = extractPriceByHierarchy(
  `
    <meta property="product:price:amount" content="189,90">
    <meta property="product:price:currency" content="EUR">
    <meta property="og:price:amount" content="210">
  `,
  "https://shop.example.com/product"
);
assert.deepEqual(metaProduct, { price: 189.9, currency: "EUR", source: "meta" });

const metaOpenGraph = extractPriceByHierarchy(
  `<meta property="og:price:amount" content="$79.99">`,
  "https://shop.example.com/product"
);
assert.deepEqual(metaOpenGraph, { price: 79.99, currency: "USD", source: "meta" });

const twitterMeta = extractPriceByHierarchy(
  `<meta name="twitter:data1" content="£51.77">`,
  "https://shop.example.com/product"
);
assert.deepEqual(twitterMeta, { price: 51.77, currency: "GBP", source: "meta" });

const amazon = extractPriceByHierarchy(
  `
    <div id="corePriceDisplay_desktop_feature_div">
      <span class="a-price"><span class="a-offscreen">€1.299,99</span></span>
      <span class="a-price"><span class="a-offscreen">€1.499,99</span></span>
    </div>
  `,
  "https://www.amazon.it/dp/example"
);
assert.deepEqual(amazon, { price: 1299.99, currency: "EUR", source: "domain-css" });

const temu = extractPriceByHierarchy(
  `
    <div class="goods-price__current-value">90% off · €120,49</div>
    <div class="goods-price__current-old">€124,90</div>
  `,
  "https://www.temu.com/example.html"
);
assert.deepEqual(temu, { price: 120.49, currency: "EUR", source: "domain-css" });

const aliexpress = extractPriceByHierarchy(
  `<div class="product-price-value">US $24.90 - US $30.00</div>`,
  "https://www.aliexpress.com/item/1.html"
);
assert.deepEqual(aliexpress, { price: 24.9, currency: "USD", source: "domain-css" });

const unknownStoreMustNotScanBody = extractPriceByHierarchy(
  `
    <h1>Product without structured price</h1>
    <p>Save €50 with coupon. Shipping €5. Monthly payment €20.</p>
  `,
  "https://unknown-shop.example/product"
);
assert.equal(unknownStoreMustNotScanBody, null);

console.info("Strict price hierarchy fixtures passed");
