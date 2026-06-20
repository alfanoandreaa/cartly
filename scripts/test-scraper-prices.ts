import assert from "node:assert/strict";
import { extractMetadata, normalizePrice } from "../lib/scraper";

assert.equal(normalizePrice("€ 1.299,99"), 1299.99);
assert.equal(normalizePrice("$1,299.99"), 1299.99);
assert.equal(normalizePrice("£ 51.77"), 51.77);
assert.equal(normalizePrice("1 299,95 PLN"), 1299.95);

const fixtures = [
  {
    name: "Amazon split price beats list price",
    url: "https://www.amazon.it/dp/example",
    html: `
      <h1 id="productTitle">Camera</h1>
      <div class="basisPrice"><span class="a-price"><span class="a-offscreen">Prezzo precedente: €1.499,99</span></span></div>
      <div id="corePrice_feature_div">
        <span class="a-price">
          <span class="a-price-whole">1.299,</span><span class="a-price-fraction">99</span>
        </span>
      </div>
      <img id="landingImage" data-old-hires="https://cdn.example/camera.jpg">
    `,
    expected: 1299.99
  },
  {
    name: "Temu ignores discount percentage and original price",
    url: "https://www.temu.com/example.html",
    html: `
      <h1 data-testid="product-title">Lamp</h1>
      <div class="sale-price">90% off · Now €12,49</div>
      <div class="product-price-original">Original €124,90</div>
      <div data-testid="product-image"><img src="https://cdn.example/lamp.jpg"></div>
    `,
    expected: 12.49
  },
  {
    name: "AliExpress chooses current range minimum",
    url: "https://www.aliexpress.com/item/1.html",
    html: `
      <h1 data-pl="product-title">Watch</h1>
      <div class="price--current">US $24.90 - US $30.00</div>
      <div class="price--originalText">US $49.90</div>
      <div class="images-view-item"><img src="https://cdn.example/watch.jpg"></div>
    `,
    expected: 24.9
  },
  {
    name: "Structured offer beats monthly installment",
    url: "https://shop.example.com/product",
    html: `
      <script type="application/ld+json">
        {"@type":"Product","name":"Chair","image":"https://cdn.example/chair.jpg","offers":{"@type":"Offer","price":"249.00","priceCurrency":"EUR"}}
      </script>
      <main><div class="price">€249 or 12 monthly payments of €20.75</div></main>
    `,
    expected: 249
  },
  {
    name: "Sale price beats crossed-out price",
    url: "https://shop.example.com/shoes",
    html: `
      <meta property="og:title" content="Shoes">
      <meta property="og:image" content="https://cdn.example/shoes.jpg">
      <main>
        <span class="price">Now €79,95</span>
        <span class="price">Was €119,95</span>
      </main>
    `,
    expected: 79.95
  }
];

for (const fixture of fixtures) {
  const result = extractMetadata(fixture.html, fixture.url);
  assert.equal(result.price, fixture.expected, fixture.name);
  assert.notEqual(result.priceConfidence, "low", `${fixture.name}: confidence`);
}

console.info(`Scraper price fixtures passed: ${fixtures.length}`);
