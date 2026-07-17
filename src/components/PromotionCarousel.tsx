import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Gift } from "lucide-react";

interface Banner {
  id: string;
  title?: string;
  imageUrl: string;
}

interface Props {
  banners: Banner[];
  autoplayMs?: number;
}

const FALLBACK_BANNERS = [
  {
    id: "promo-1",
    gradient: "from-[var(--color-primary)] via-emerald-500 to-teal-400",
    icon: Sparkles,
    title: "Khuyến mãi đặc biệt",
    subtitle: "Giảm đến 50% cho đơn hàng đầu tiên",
    cta: "Mua ngay →",
  },
  {
    id: "promo-2",
    gradient: "from-[var(--color-accent)] via-orange-500 to-rose-500",
    icon: Zap,
    title: "Flash Sale hôm nay",
    subtitle: "Hàng ngàn sản phẩm giá sốc — chỉ trong 24h",
    cta: "Khám phá →",
  },
  {
    id: "promo-3",
    gradient: "from-blue-600 via-indigo-500 to-purple-500",
    icon: Gift,
    title: "Miễn phí vận chuyển",
    subtitle: "Áp dụng cho đơn hàng từ ₫500.000",
    cta: "Xem chi tiết →",
  },
];

export function PromotionCarousel({ banners = [], autoplayMs = 4000 }: Props) {
  const hasRealBanners = banners.length > 0 && banners.some((b) => b.imageUrl && !b.imageUrl.includes("/assets/banner"));
  const effectiveBanners = hasRealBanners ? banners : [];
  const showFallback = !hasRealBanners;

  const totalSlides = showFallback ? FALLBACK_BANNERS.length : effectiveBanners.length;
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (totalSlides <= 1) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % totalSlides);
    }, autoplayMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [totalSlides, autoplayMs]);

  if (totalSlides === 0 && !showFallback) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 200 }}>
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {showFallback
            ? FALLBACK_BANNERS.map((fb) => {
                const Icon = fb.icon;
                return (
                  <div
                    key={fb.id}
                    className={`min-w-full flex-shrink-0 bg-gradient-to-r ${fb.gradient} flex items-center justify-center px-8 py-12 sm:px-16`}
                  >
                    <div className="flex flex-col items-center gap-4 text-center text-white sm:flex-row sm:text-left">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm sm:h-20 sm:w-20">
                        <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold sm:text-3xl">{fb.title}</h2>
                        <p className="mt-2 text-sm opacity-90 sm:text-base">{fb.subtitle}</p>
                        <span className="mt-3 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30">
                          {fb.cta}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            : effectiveBanners.map((b) => (
                <div key={b.id} className="min-w-full flex-shrink-0">
                  <img
                    src={b.imageUrl}
                    alt={b.title ?? "banner"}
                    className="w-full object-cover"
                    style={{ minHeight: 200 }}
                  />
                </div>
              ))}
        </div>

        {/* Controls */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + totalSlides) % totalSlides)}
              aria-label="Prev"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % totalSlides)}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-8 bg-white" : "w-4 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default PromotionCarousel;
