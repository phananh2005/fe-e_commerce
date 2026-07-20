import React from "react";
import { Link } from "react-router-dom";
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
  id,
  image,
  title,
  price,
  originalPrice,
  discountPercent,
  rating = 5,
  sold = 0,
}: Props) {
  return (
    <Link
      to={`/products/${id}`}
      className="block card p-3 transition hover:border-[var(--color-primary)]/50 group"
    >
      <div className="relative mb-2 overflow-hidden rounded-lg bg-slate-50">
        <img src={image} alt={title} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        {discountPercent ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-destructive)] px-2 py-1 text-xs font-semibold text-white shadow-sm">
            -{discountPercent}%
          </span>
        ) : null}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 pointer-events-none hidden sm:flex">
           <div className="bg-white/95 backdrop-blur text-sm font-semibold text-[var(--color-primary)] px-5 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto hover:bg-white hover:scale-105 active:scale-95">
             Xem nhanh
           </div>
        </div>
      </div>
      <h3 className="mb-1 text-sm font-semibold leading-tight max-h-10 overflow-hidden">
        {title}
      </h3>
      <div className="mb-2 flex items-center gap-2">
        <div className="text-lg font-bold text-[var(--color-primary)]">{price}</div>
        {originalPrice ? (
          <div className="text-sm text-slate-400 line-through">
            {originalPrice}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-[var(--color-accent)]" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div>{sold} đã bán</div>
      </div>
    </Link>
  );
}

export default ProductCard;
