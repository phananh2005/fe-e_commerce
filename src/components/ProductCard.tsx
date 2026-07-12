import React from "react";
import { Star } from "lucide-react";

interface Props {
  id: string;
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  rating?: number;
  sold?: number;
}

export function ProductCard({
  image,
  title,
  price,
  originalPrice,
  discountPercent,
  rating = 5,
  sold = 0,
}: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="relative mb-2 overflow-hidden rounded-lg bg-slate-50">
        <img src={image} alt={title} className="h-44 w-full object-cover" />
        {discountPercent ? (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 text-sm font-semibold leading-tight max-h-10 overflow-hidden">
        {title}
      </h3>
      <div className="mb-2 flex items-center gap-2">
        <div className="text-lg font-bold text-indigo-600">{price}</div>
        {originalPrice ? (
          <div className="text-sm text-slate-400 line-through">
            {originalPrice}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div>{sold} đã bán</div>
      </div>
    </article>
  );
}

export default ProductCard;
