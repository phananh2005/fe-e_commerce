import React, { useMemo, useState, useRef } from "react";
import { Minus, Plus, ShoppingCart, CreditCard, ZoomIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as customerApi from "../../lib/customerApi";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

// Mobile-first product detail page with image gallery, info, variants and actions
export default function ProductPage() {
  // Demo product data (replace with API fetch as needed)
  const product = useMemo(
    () => ({
      id: 101,
      name: "Điện thoại Mẫu X - Phiên bản 2026",
      images: [
        "https://picsum.photos/seed/p1/800/800",
        "https://picsum.photos/seed/p2/800/800",
        "https://picsum.photos/seed/p3/800/800",
        "https://picsum.photos/seed/p4/800/800",
      ],
      price: 7990000,
      originalPrice: 9990000,
      discountPercent: 20,
      rating: 4.7,
      reviews: 128,
      sold: 1500,
      variants: {
        colors: [
          { id: "black", label: "Đen", hex: "#111827", available: true },
          { id: "white", label: "Trắng", hex: "#f8fafc", available: true },
          { id: "gold", label: "Vàng", hex: "#f59e0b", available: false },
        ],
        storages: [
          { id: "128", label: "128GB", available: true, stock: 12 },
          { id: "256", label: "256GB", available: true, stock: 4 },
          { id: "512", label: "512GB", available: false, stock: 0 },
        ],
      },
    }),
    [],
  );

  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [zoomed, setZoomed] = useState(false);

  const [selectedColor, setSelectedColor] = useState(
    product.variants.colors.find((c) => c.available)?.id ?? null,
  );
  const [selectedStorage, setSelectedStorage] = useState(
    product.variants.storages.find((s) => s.available)?.id ?? null,
  );

  const getStockForSelected = () => {
    const s = product.variants.storages.find((x) => x.id === selectedStorage);
    return s?.stock ?? 0;
  };

  const [quantity, setQuantity] = useState(1);

  const navigate = useNavigate();
  const { status, session } = useAuth();
  const cartCtx = useCart();
  const toast = useToast();
  const [btnAnim, setBtnAnim] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const animateFlyToCart = async () => {
    const duration = 700; // ms
    const endScale = 0.18;
    const easing = "cubic-bezier(.25,.8,.25,1)";
    try {
      const imgEl = imgRef.current;
      const cartBtn = document.getElementById("cart-btn");
      if (!imgEl || !cartBtn) return;
      const imgRect = imgEl.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();

      const clone = imgEl.cloneNode(true) as HTMLImageElement;
      clone.style.position = "fixed";
      clone.style.left = `${imgRect.left}px`;
      clone.style.top = `${imgRect.top}px`;
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.transition = `transform ${duration}ms ${easing}, opacity ${Math.floor(duration * 0.9)}ms linear`;
      clone.style.zIndex = "9999";
      clone.style.borderRadius = "8px";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);

      const translateX =
        cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
      const translateY =
        cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

      requestAnimationFrame(() => {
        const rotateDeg = 18;
        clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${endScale}) rotate(${rotateDeg}deg)`;
        clone.style.opacity = "0.65";
      });

      await new Promise((res) => setTimeout(res, duration + 40));
      clone.remove();

      // small bounce on cart button to emphasize arrival
      try {
        const cartBtn = document.getElementById("cart-btn");
        const reduce =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (cartBtn && !reduce) {
          cartBtn.classList.add("cart-bounce");
          setTimeout(() => cartBtn.classList.remove("cart-bounce"), 460);
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  };

  const formatVND = (v: number) => `₫${v.toLocaleString("vi-VN")}`;

  const handleAddToCart = async () => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }

    const token = session?.tokens?.accessToken;
    if (!token) {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }

    // Choose a variant id to send to the API. Demo product uses storage id as variant key.
    const variantId = selectedStorage ?? selectedColor ?? product.id;
    const ok = await customerApi.addToCart(token, variantId, quantity);
    if (ok) {
      // animate image flying to cart, refresh count, show toast, then go to cart
      await animateFlyToCart();
      try {
        await cartCtx.refresh();
      } catch (e) {
        // ignore
      }
      setBtnAnim(true);
      toast.show("Đã thêm vào giỏ hàng");
      setTimeout(() => setBtnAnim(false), 700);
      setTimeout(() => navigate("/cart"), 300);
    } else {
      toast.show("Không thể thêm vào giỏ — vui lòng thử lại", "error");
    }
  };

  const handleBuyNow = async () => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }

    const token = session?.tokens?.accessToken;
    if (!token) {
      navigate("/login", { state: { from: `/product/${product.id}` } });
      return;
    }

    const variantId = Number(selectedStorage ?? selectedColor ?? product.id);
    const ok = await customerApi.addToCart(token, variantId, quantity);
    if (ok) {
      navigate("/checkout");
    } else {
      toast.show("Không thể mua ngay — vui lòng thử lại", "error");
    }
  };

  const max = getStockForSelected();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Image gallery */}
        <div>
          <div
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            className="relative overflow-hidden rounded-2xl bg-slate-50"
          >
            <img
              ref={imgRef}
              src={selectedImage}
              alt={product.name}
              className={`w-full object-cover transition-transform duration-300 ${zoomed ? "scale-110" : "scale-100"}`}
              style={{ height: 420 }}
            />
            <div className="absolute right-3 top-3 rounded-full bg-white/80 p-2 shadow-sm">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto touch-scroll">
            {product.images.map((img) => (
              <button
                key={img}
                onClick={() => setSelectedImage(img)}
                onMouseEnter={() => setSelectedImage(img)}
                className={`flex-shrink-0 rounded-lg border ${selectedImage === img ? "border-indigo-500" : "border-transparent"} overflow-hidden bg-white`}
                style={{ width: 92, height: 92 }}
              >
                <img
                  src={img}
                  alt="thumb"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info & actions */}
        <div>
          <h1 className="text-lg font-extrabold leading-tight text-slate-900 sm:text-2xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1 font-medium text-amber-500">
              <span className="text-base">{product.rating}</span>
              <svg
                className="h-4 w-4 text-amber-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.201 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
              </svg>
            </div>
            <div className="text-sm text-slate-500">
              {product.reviews} đánh giá
            </div>
            <div className="text-sm text-slate-500">{product.sold} đã bán</div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="text-2xl font-extrabold text-orange-600">
              {formatVND(product.price)}
            </div>
            <div className="text-sm text-slate-400 line-through">
              {formatVND(product.originalPrice)}
            </div>
            <div className="ml-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              -{product.discountPercent}%
            </div>
          </div>

          {/* Variants */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-700">Màu sắc</div>
            <div className="mt-2 flex items-center gap-2">
              {product.variants.colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.available && setSelectedColor(c.id)}
                  disabled={!c.available}
                  className={`h-9 w-9 rounded-full ring-1 ring-inset ${selectedColor === c.id ? "ring-indigo-500" : "ring-white/0"} ${!c.available ? "opacity-40 pointer-events-none" : ""}`}
                  title={c.label}
                  style={{ background: c.hex }}
                />
              ))}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-700">
                Dung lượng
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {product.variants.storages.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => s.available && setSelectedStorage(s.id)}
                    disabled={!s.available}
                    className={`rounded-2xl border px-3 py-2 text-sm ${selectedStorage === s.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"} ${!s.available ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity & actions */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="inline-flex h-10 w-10 items-center justify-center px-2 text-slate-600"
                  aria-label="Giảm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="inline-flex h-10 w-16 items-center justify-center text-sm font-medium">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity((q) => Math.min(max || 1, q + 1))}
                  className="inline-flex h-10 w-10 items-center justify-center px-2 text-slate-600"
                  aria-label="Tăng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm text-slate-500">Kho: {max}</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 touch-friendly ${btnAnim ? "scale-95 shadow-lg" : ""}`}
              >
                <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
              </button>
              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 touch-friendly"
              >
                <CreditCard className="h-4 w-4" /> Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
