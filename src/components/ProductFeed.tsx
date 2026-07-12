import React from "react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  rating?: number;
  sold?: number;
}

interface Props {
  products: Product[];
}

export function ProductFeed({ products = [] }: Props) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}

export default ProductFeed;
