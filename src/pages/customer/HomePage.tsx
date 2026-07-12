import React, { useEffect, useState } from "react";
import CustomerSearchHeader from "../../components/CustomerSearchHeader";
import PromotionCarousel from "../../components/PromotionCarousel";
import QuickCategories from "../../components/QuickCategories";
import FlashSale from "../../components/FlashSale";
import ProductFeed from "../../components/ProductFeed";
import * as customerApi from "../../lib/customerApi";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export function HomePage() {
  const [banners, setBanners] = useState<
    Array<{ id: string; imageUrl: string }>
  >([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [flashProducts, setFlashProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const cartCtx = useCart();

  useEffect(() => {
    let mounted = true;

    // fetch categories & brands & products in parallel
    (async () => {
      const [cats, prods, flash] = await Promise.all([
        customerApi.getCategories(),
        customerApi.searchProducts("", 0, 20),
        customerApi.searchProducts("", 0, 6),
      ]);

      if (!mounted) return;

      setCategories(cats ?? []);
      setProducts(
        prods.map((p: any) => ({
          id: String(p.productId),
          image:
            p.avatarUrl || `https://picsum.photos/seed/p${p.productId}/400/400`,
          title: p.productName,
          price: p.minPrice
            ? `₫${Number(p.minPrice).toLocaleString("vi-VN")}`
            : "₫0",
          originalPrice: undefined,
          discountPercent: undefined,
          rating: 4.5,
          sold: 0,
        })),
      );

      setFlashProducts(
        (flash || []).map((p: any) => ({
          id: String(p.productId),
          image:
            p.avatarUrl || `https://picsum.photos/seed/p${p.productId}/400/400`,
          title: p.productName,
          price: p.minPrice
            ? `₫${Number(p.minPrice).toLocaleString("vi-VN")}`
            : "₫0",
          originalPrice: undefined,
          discountPercent: undefined,
          rating: 4.5,
          soldPercent: 10,
        })),
      );

      // suggestions from product names
      setSuggestions((prods || []).slice(0, 6).map((p: any) => p.productName));

      // banners: optional endpoint not documented — fallback to placeholder
      setBanners([
        { id: "b1", imageUrl: "/assets/banner1.jpg" },
        { id: "b2", imageUrl: "/assets/banner2.jpg" },
      ]);

      // cart count will be fetched by auth-aware effect
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const { status, session } = useAuth();

  useEffect(() => {
    // let CartContext handle fetching/updating count
    cartCtx.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  return (
    <div>
      <CustomerSearchHeader suggestions={suggestions} />
      <main className="pt-2">
        <PromotionCarousel banners={banners} />
        <QuickCategories categories={categories} />
        <FlashSale
          products={flashProducts}
          endsAt={new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString()}
        />
        <ProductFeed products={products} />
      </main>
    </div>
  );
}

export default HomePage;
