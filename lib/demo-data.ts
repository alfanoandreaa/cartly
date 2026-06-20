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

const discoverSeed = [
  ["Stoneware Pour-over Set", "Kinto", "HOME", 72, "photo-1495474472287-4d71bcdd2085"],
  ["Nothing Phone (3)", "Nothing", "TECH", 799, "photo-1598327105666-5b89351aff97"],
  ["Linen Overshirt", "Arket", "FASHION", 89, "photo-1598033129183-c4f50c736f10"],
  ["The Creative Act", "Penguin", "BOOKS", 24, "photo-1544947950-fa07a98d237f"],
  ["Ceramic Table Lamp", "Ferm Living", "HOME", 199, "photo-1540932239986-30128078f3c5"],
  ["Barrier Repair Serum", "Byoma", "BEAUTY", 18, "photo-1611930022073-b7a4ba5fcccd"],
  ["Organic Matcha Kit", "Ippodo", "FOOD", 48, "photo-1515823064-d6e0c04616a7"],
  ["Mechanical Keyboard", "Keychron", "TECH", 129, "photo-1587829741301-dc798b83add3"],
  ["Trail Running Vest", "Satisfy", "FASHION", 210, "photo-1551698618-1dfe5d97d256"],
  ["Field Notes Archive", "Field Notes", "OTHER", 34, "photo-1531346878377-a5be20888e57"],
  ["Stacking Glasses", "HAY", "HOME", 39, "photo-1513558161293-cdaf765ed2fd"],
  ["E-reader Paper Pro", "reMarkable", "TECH", 649, "photo-1544716278-ca5e3f4abd8c"],
  ["Aesop Hand Balm", "Aesop", "BEAUTY", 31, "photo-1556228720-195a672e8a03"],
  ["Tokyo Stories", "Monocle", "BOOKS", 42, "photo-1543002588-bfa74002ed7e"],
  ["Single-origin Coffee", "April", "FOOD", 22, "photo-1447933601403-0c6688de566e"],
  ["Studio Tote", "Baggu", "FASHION", 58, "photo-1553062407-98eeb64c6a62"],
  ["Portable Projector", "Xgimi", "TECH", 599, "photo-1601944179066-29786cb9d32a"],
  ["Wool Throw", "Muuto", "HOME", 119, "photo-1583845112203-454c2254edce"],
  ["Mineral Sunscreen", "Salt & Stone", "BEAUTY", 32, "photo-1556229010-6c3f2c9ca5f8"],
  ["Travel Chess Set", "Printworks", "OTHER", 49, "photo-1586165368502-1bad197a6461"]
] as const;

export const discoverProducts = discoverSeed.map((item, index) => ({
  id: `discover-${index + 1}`,
  title: item[0],
  siteName: item[1],
  category: item[2],
  price: item[3],
  currency: "EUR",
  url: "https://example.com",
  saves: 91 + index * 13,
  imageUrl: `https://images.unsplash.com/${item[4]}?auto=format&fit=crop&w=900&q=85`
}));
