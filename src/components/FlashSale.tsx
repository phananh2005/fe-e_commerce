import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";

interface FlashProduct {
  id: string;
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  soldPercent?: number; // 0-100
}

interface Props {
  products: FlashProduct[];
  endsAt: string; // ISO date
}

function useCountdown(endIso: string) {
  const end = useMemo(() => new Date(endIso).getTime(), [endIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const diff = Math.max(0, end - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds, diff };
}

export function FlashSale({ products = [], endsAt }: Props) {
  const { hours, minutes, seconds } = useCountdown(endsAt);

  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flash Sale</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
          <div className="rounded-2xl bg-[var(--color-primary)]/10 px-3 py-1 font-semibold">{`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}</div>
        </div>
      </div>

      <div className="-mx-4 touch-scroll overflow-x-auto px-4 pb-2">
        <div className="flex gap-3">
          {products.map((p) => (
            <div key={p.id} className="w-56 flex-shrink-0">
              <ProductCard {...p} />
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-[var(--color-destructive)]"
                  style={{ width: `${p.soldPercent ?? 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Đã bán {p.soldPercent ?? 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FlashSale;
