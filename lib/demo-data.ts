export type DemoProduct = {
  id: string;
  title: string;
  siteName: string;
  url: string;
  imageUrl: string;
  price: number;
  oldPrice?: number;
  priceCurrency: string;
  inStock: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  collection: string;
  tags: string[];
  personalNote?: string;
  history: { date: string; price: number }[];
};

export const demoProducts: DemoProduct[] = [
  {
    id: "arc-chair",
    title: "Arc Lounge Chair",
    siteName: "HAY",
    url: "https://example.com/arc-chair",
    imageUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
    price: 649,
    oldPrice: 790,
    priceCurrency: "EUR",
    inStock: true,
    priority: "HIGH",
    collection: "Dream home",
    tags: ["living room", "design"],
    personalNote: "Would look perfect by the window. Wait for it to dip below €620.",
    history: [
      { date: "Jan", price: 790 },
      { date: "Feb", price: 760 },
      { date: "Mar", price: 760 },
      { date: "Apr", price: 710 },
      { date: "May", price: 689 },
      { date: "Jun", price: 649 }
    ]
  },
  {
    id: "camera",
    title: "X100VI Digital Camera",
    siteName: "Fujifilm",
    url: "https://example.com/camera",
    imageUrl: "https://images.unsplash.com/photo-1606980707986-d142cbd6f6ec?auto=format&fit=crop&w=1200&q=85",
    price: 1799,
    priceCurrency: "EUR",
    inStock: false,
    priority: "HIGH",
    collection: "Creative kit",
    tags: ["camera", "travel"],
    history: [
      { date: "Jan", price: 1849 },
      { date: "Feb", price: 1849 },
      { date: "Mar", price: 1799 },
      { date: "Apr", price: 1799 },
      { date: "May", price: 1799 },
      { date: "Jun", price: 1799 }
    ]
  },
  {
    id: "sneakers",
    title: "XT-6 Expanse Sneakers",
    siteName: "Salomon",
    url: "https://example.com/sneakers",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85",
    price: 145,
    oldPrice: 180,
    priceCurrency: "EUR",
    inStock: true,
    priority: "MEDIUM",
    collection: "Everyday rotation",
    tags: ["shoes", "outdoor"],
    history: [
      { date: "Jan", price: 180 },
      { date: "Feb", price: 180 },
      { date: "Mar", price: 172 },
      { date: "Apr", price: 165 },
      { date: "May", price: 165 },
      { date: "Jun", price: 145 }
    ]
  },
  {
    id: "lamp",
    title: "Akari 10A Floor Lamp",
    siteName: "Vitra",
    url: "https://example.com/lamp",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
    price: 689,
    priceCurrency: "EUR",
    inStock: true,
    priority: "LOW",
    collection: "Dream home",
    tags: ["lighting"],
    history: [
      { date: "Jan", price: 689 },
      { date: "Feb", price: 689 },
      { date: "Mar", price: 689 },
      { date: "Apr", price: 689 },
      { date: "May", price: 689 },
      { date: "Jun", price: 689 }
    ]
  },
  {
    id: "headphones",
    title: "QuietComfort Ultra",
    siteName: "Bose",
    url: "https://example.com/headphones",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
    price: 379,
    oldPrice: 449,
    priceCurrency: "EUR",
    inStock: true,
    priority: "MEDIUM",
    collection: "Creative kit",
    tags: ["audio", "travel"],
    history: [
      { date: "Jan", price: 449 },
      { date: "Feb", price: 429 },
      { date: "Mar", price: 429 },
      { date: "Apr", price: 399 },
      { date: "May", price: 399 },
      { date: "Jun", price: 379 }
    ]
  }
];

export const demoCollections = [
  { id: "home", name: "Dream home", emoji: "🏡", count: 2, imageUrl: demoProducts[0].imageUrl },
  { id: "creative", name: "Creative kit", emoji: "📷", count: 2, imageUrl: demoProducts[1].imageUrl },
  { id: "rotation", name: "Everyday rotation", emoji: "👟", count: 1, imageUrl: demoProducts[2].imageUrl }
];
