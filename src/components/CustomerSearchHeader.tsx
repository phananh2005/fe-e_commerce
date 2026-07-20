import React, { useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

interface Props {
  cartCount?: number;
  suggestions?: string[];
}

export function CustomerSearchHeader({
  cartCount = 0,
  suggestions = [],
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { status } = useAuth();
  const cartCtx = useCart();
  const effectiveCount = cartCount ?? cartCtx.count;
  const [query, setQuery] = useState(searchParams.get("keyword") ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const filtered = useMemo(() => {
    if (!query) return [];
    return suggestions
      .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  }, [query, suggestions]);

  const open = isFocused && filtered.length > 0;

  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      navigate("/");
      return;
    }
    navigate(`/?keyword=${encodeURIComponent(trimmed)}`);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm sản phẩm, danh mục, thương hiệu..."
                className="input pl-10 py-3 touch-friendly"
              />
              {open ? (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 card overflow-hidden p-0">
                  <ul className="max-h-48 overflow-auto touch-scroll">
                    {filtered.map((s) => (
                      <li
                        key={s}
                        onMouseDown={() => {
                          setQuery(s);
                          handleSearch(s);
                        }}
                        className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition"
                      >
                        <Search className="mr-2 inline h-3.5 w-3.5 text-slate-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </label>
          </div>

          <div className="relative group">
            <button
              onClick={() => {
                if (status !== "authenticated") {
                  navigate("/login", { state: { from: location.pathname } });
                  return;
                }
                navigate("/cart");
              }}
              id="cart-btn"
              className="relative inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] touch-friendly"
            >
              <ShoppingCart className="h-5 w-5" />
              {effectiveCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-xs font-semibold text-white">
                  {effectiveCount}
                </span>
              ) : null}
            </button>

            {/* Mini Cart Dropdown */}
            {status === "authenticated" && cartCtx.items && cartCtx.items.length > 0 && (
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-80">
                <div className="card p-3 shadow-xl border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2 px-1">Sản phẩm mới thêm</h4>
                  <ul className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {cartCtx.items.slice(0, 5).map((item: any) => (
                      <li key={item.cartItemId || Math.random()} className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg transition cursor-pointer" onClick={() => navigate("/cart")}>
                        <img src={item.variantImageUrl || item.productAvatarUrl} alt={item.productName} className="w-12 h-12 rounded object-cover border border-slate-200 bg-slate-50" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-slate-800 truncate">{item.productName}</h5>
                          <div className="text-xs text-[var(--color-primary)] font-bold">{item.variantPrice ? `₫${Number(item.variantPrice).toLocaleString("vi-VN")}` : ""}</div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">x{item.cartItemQuantity ?? item.quantity ?? 1}</div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500">{cartCtx.items.length > 5 ? `Còn ${cartCtx.items.length - 5} sản phẩm khác` : ""}</span>
                    <button onClick={() => navigate("/cart")} className="btn-primary text-xs py-2 px-4 shadow-sm hover:scale-105 active:scale-95 transition-transform">Xem giỏ hàng</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default CustomerSearchHeader;
