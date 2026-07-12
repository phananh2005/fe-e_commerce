import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title?: string;
  imageUrl: string;
}

interface Props {
  banners: Banner[];
  autoplayMs?: number;
}

export function PromotionCarousel({ banners = [], autoplayMs = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const len = banners.length;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (len <= 1) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, autoplayMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [len, autoplayMs]);

  if (!len) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b) => (
            <div key={b.id} className="min-w-full flex-shrink-0">
              <img
                src={b.imageUrl}
                alt={b.title ?? "banner"}
                className="w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={() => setIndex((i) => (i - 1 + len) % len)}
          aria-label="Prev"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % len)}
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 w-8 rounded-full ${i === index ? "bg-indigo-600" : "bg-white/60"}`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PromotionCarousel;
