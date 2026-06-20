import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { demoProducts } from "../lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@cartly.app";
  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email,
      passwordHash: await hash("cartly-demo", 12),
      plan: "FREE"
    }
  });

  const collections = await Promise.all([
    prisma.collection.create({ data: { userId: user.id, name: "Dream home", emoji: "🏡" } }),
    prisma.collection.create({ data: { userId: user.id, name: "Creative kit", emoji: "📷" } }),
    prisma.collection.create({ data: { userId: user.id, name: "Everyday rotation", emoji: "👟" } })
  ]);
  const collectionByName = new Map(collections.map((collection) => [collection.name, collection.id]));

  await prisma.product.createMany({
    data: demoProducts.map((product) => ({
      userId: user.id,
      collectionId: collectionByName.get(product.collection),
      url: product.url,
      title: product.title,
      imageUrl: product.imageUrl,
      siteName: product.siteName,
      price: product.price,
      priceCurrency: product.priceCurrency,
      priceHistory: product.history,
      inStock: product.inStock,
      personalNote: product.personalNote,
      priority: product.priority,
      tags: product.tags,
      lastCheckedAt: new Date()
    }))
  });

  console.info("Cartly seed complete");
  console.info("Demo login: demo@cartly.app / cartly-demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
