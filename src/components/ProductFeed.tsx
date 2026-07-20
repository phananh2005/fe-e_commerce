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
  loading?: boolean;
}

export function ProductFeed({ products = [], loading = false }: Props) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="block card p-3 border-transparent shadow-sm">
              <div className="relative mb-2 overflow-hidden rounded-lg bg-slate-200 animate-pulse h-44 w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse mb-3 mt-1"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse mb-4"></div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          ))
        ) : products.length > 0 ? (
          products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="mb-2">Không có sản phẩm nào.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductFeed;
