import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedCollectionView, SharedView } from "@/components/share/shared-view";
import { demoProducts } from "@/lib/demo-data";
import type { DemoProduct } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "A shared pick",
  description: "Someone shared a product from their Cartly wishlist."
};

export default async function SharePage({ params }: { params: { slug: string } }) {
  if (process.env.DATABASE_URL) {
    const link = await prisma.sharedLink.findUnique({ where: { slug: params.slug } });
    if (!link) notFound();

    await prisma.sharedLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } }
    });

    if (link.type === "PRODUCT") {
      const product = await prisma.product.findUnique({ where: { id: link.targetId } });
      if (!product) notFound();
      return (
        <SharedView
          product={{
            id: product.id,
            title: product.title,
            siteName: product.siteName ?? new URL(product.url).hostname,
            url: product.url,
            imageUrl: product.imageUrl ?? "",
            price: Number(product.price ?? 0),
            priceCurrency: product.priceCurrency,
            inStock: product.inStock,
            priority: product.priority,
            collection: "",
            tags: product.tags,
            personalNote: product.personalNote ?? undefined,
            history: []
          }}
        />
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: link.targetId },
      include: { products: true }
    });
    if (!collection) notFound();
    const products: DemoProduct[] = collection.products.map((product) => ({
      id: product.id,
      title: product.title,
      siteName: product.siteName ?? new URL(product.url).hostname,
      url: product.url,
      imageUrl: product.imageUrl ?? "",
      price: Number(product.price ?? 0),
      priceCurrency: product.priceCurrency,
      inStock: product.inStock,
      priority: product.priority,
      collection: collection.name,
      tags: product.tags,
      personalNote: product.personalNote ?? undefined,
      history: []
    }));
    return <SharedCollectionView name={collection.name} emoji={collection.emoji} products={products} />;
  }

  const index = params.slug.split("").reduce((total, letter) => total + letter.charCodeAt(0), 0) % demoProducts.length;
  return <SharedView product={demoProducts[index]} />;
}
