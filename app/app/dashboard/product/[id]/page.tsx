import { ProductDetailLoader } from "@/components/product/product-detail";

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetailLoader id={params.id} />;
}
