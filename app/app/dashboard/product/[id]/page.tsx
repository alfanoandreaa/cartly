import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { demoProducts } from "@/lib/demo-data";

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = demoProducts.find((item) => item.id === params.id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
