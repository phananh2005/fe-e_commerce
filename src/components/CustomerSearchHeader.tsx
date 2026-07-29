import React, { useMemo, useState } from "react";
import { Search, ShoppingCart, User as UserIcon, LogOut, ShieldCheck, ClipboardList } from "lucide-react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

interface Props {
  cartCount?: number;
  suggestions?: string[];
}

export function CustomerSearchHeader({
  cartCount,
  suggestions = [],
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { status, session, signOut } = useAuth();
  const cartCtx = useCart();
  const effectiveCount = cartCount ?? cartCtx.count;
  const [query, setQuery] = useState(searchParams.get("keyword") ?? "");
  const [isFocused, setIsFocused] = useState(false);
  
  const roles = session?.user.roles || [];
  const hasCustomerRole = roles.includes("ROLE_CUSTOMER");
  const hasAdminRole = roles.some((r) => ["ROLE_SUPER_ADMIN", "ROLE_STORE_ADMIN"].includes(r));

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-primary)] text-white shadow-md">
      {/* Top Bar */}
      <div className="hidden sm:block border-b border-white/10 text-xs font-medium">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-4 text-white/80">
            <Link to="#" className="hover:text-white transition">Kênh người bán</Link>
            <span className="h-3 w-px bg-white/20"></span>
            <Link to="#" className="hover:text-white transition">Tải ứng dụng</Link>
            <span className="h-3 w-px bg-white/20"></span>
            <div className="flex items-center gap-2">
              Kết nối 
              <a href="#" className="hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className="hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            {status === "authenticated" ? (
              <>
                {hasAdminRole && hasCustomerRole && (
                  <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-white transition">
                    <ShieldCheck className="h-3.5 w-3.5" /> Quản trị
                  </Link>
                )}
                <Link to="/orders" className="flex items-center gap-1 hover:text-white transition">
                  <ClipboardList className="h-3.5 w-3.5" /> Đơn hàng
                </Link>
                <Link to="/account" className="flex items-center gap-1 hover:text-white transition">
                  <UserIcon className="h-3.5 w-3.5" /> {session?.user.username}
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-1 hover:text-white transition">
                  <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="hover:text-white transition">Đăng ký</Link>
                <span className="h-3 w-px bg-white/20"></span>
                <Link to="/login" className="hover:text-white transition">Đăng nhập</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 sm:py-5 sm:gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex-shrink-0 text-2xl font-bold tracking-tight text-white hover:opacity-90 transition"
        >
          e-commerce
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-4xl relative mx-4 sm:mx-8">
          <div className="flex items-center bg-white rounded-lg p-1 shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-accent)] transition-all">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm sản phẩm, danh mục, thương hiệu..."
              className="w-full bg-transparent px-3 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSearch(query)}
              className="flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-1.5 text-white hover:bg-[var(--color-primary)]/90 transition"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          
          {/* Autocomplete Dropdown */}
          {open ? (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg bg-white shadow-xl border border-slate-100 overflow-hidden text-slate-800">
              <ul className="max-h-64 overflow-auto touch-scroll">
                {filtered.map((s) => (
                  <li
                    key={s}
                    onMouseDown={() => {
                      setQuery(s);
                      handleSearch(s);
                    }}
                    className="flex cursor-pointer items-center px-4 py-2.5 text-sm hover:bg-slate-50 transition"
                  >
                    <Search className="mr-3 h-4 w-4 text-slate-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Cart */}
        <div className="relative group flex-shrink-0">
          <button
            onClick={() => {
              if (status !== "authenticated") {
                navigate("/login", { state: { from: location.pathname } });
                return;
              }
              navigate("/cart");
            }}
            id="cart-btn"
            className="relative flex items-center p-2 text-white hover:opacity-80 transition"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
              {effectiveCount > 0 ? (
                <span className="absolute -bottom-1 -right-2 inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 border-[1.5px] border-[var(--color-primary)] text-[9px] font-bold text-white leading-none shadow-sm min-w-[16px]">
                  {effectiveCount > 99 ? '99+' : effectiveCount}
                </span>
              ) : null}
            </div>
          </button>

          {/* Mini Cart Dropdown */}
          {status === "authenticated" && cartCtx.items && cartCtx.items.length > 0 && (
            <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-96">
              <div className="rounded-xl bg-white p-3 shadow-2xl border border-slate-100 text-slate-800 relative before:absolute before:right-4 before:-top-2 before:h-4 before:w-4 before:rotate-45 before:bg-white before:border-l before:border-t before:border-slate-100">
                <h4 className="text-sm font-semibold text-slate-400 mb-3 px-1 uppercase tracking-wider">Sản phẩm mới thêm</h4>
                <ul className="max-h-72 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {cartCtx.items.slice(0, 5).map((item: any) => (
                    <li key={item.cartItemId || Math.random()} className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-lg transition cursor-pointer" onClick={() => navigate("/cart")}>
                      <img src={item.variantImageUrl || item.productAvatarUrl} alt={item.productName} className="w-12 h-12 rounded object-cover border border-slate-200 bg-slate-50" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-slate-700 truncate">{item.productName}</h5>
                        <div className="text-sm text-[var(--color-primary)] font-semibold mt-0.5">{item.variantPrice ? `₫${Number(item.variantPrice).toLocaleString("vi-VN")}` : ""}</div>
                      </div>
                      <div className="text-sm text-slate-500 font-medium whitespace-nowrap">x {item.cartItemQuantity ?? item.quantity ?? 1}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center px-1">
                  <span className="text-sm text-slate-500">{cartCtx.items.length > 5 ? `Còn ${cartCtx.items.length - 5} sản phẩm trong giỏ` : ""}</span>
                  <button onClick={() => navigate("/cart")} className="btn-primary text-sm py-2 px-5 hover:scale-105 active:scale-95 transition-transform">Xem Giỏ Hàng</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default CustomerSearchHeader;
