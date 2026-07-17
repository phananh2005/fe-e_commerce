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
        </div>
      </div>
    </header>
  );
}

export default CustomerSearchHeader;
