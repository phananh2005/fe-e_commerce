import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { CustomerSearchHeader } from "../components/CustomerSearchHeader";
import * as customerApi from "../lib/customerApi";

export function CustomerLayout() {
  const { status, session, signOut } = useAuth();
  const cartCtx = useCart();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const roles = session?.user.roles || [];
  const hasCustomerRole = roles.includes("ROLE_CUSTOMER");
  const hasAdminRole = roles.some((r) => ["ROLE_SUPER_ADMIN", "ROLE_STORE_ADMIN"].includes(r));

  useEffect(() => {
    customerApi
      .searchProducts({ page: 0, size: 6 })
      .then((products) =>
        setSuggestions(
          (products ?? []).map((p) => p.productName).filter(Boolean),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    cartCtx.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 sm:px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[var(--color-primary)]"
          >
            e-commerce
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link to="/" className="hover:text-[var(--color-primary)] transition">
              Cửa hàng
            </Link>
            
            {status === "authenticated" && (
              <>
                {hasAdminRole && hasCustomerRole && (
                  <Link to="/admin/dashboard" className="hover:text-[var(--color-primary)] transition">
                    Trang quản trị
                  </Link>
                )}
                <Link to="/orders" className="hover:text-[var(--color-primary)] transition">
                  Đơn hàng
                </Link>
                <Link to="/account" className="hover:text-[var(--color-primary)] transition">
                  <UserIcon className="inline-block h-4 w-4 mr-1" />
                  {session?.user.username}
                </Link>
              </>
            )}

            <Link to="/cart" className="relative hover:text-[var(--color-primary)] flex items-center transition">
              <ShoppingCart className="h-5 w-5" />
              {cartCtx.count > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                  {cartCtx.count}
                </span>
              )}
            </Link>

            <div className="h-4 w-px bg-slate-300"></div>

            {status === "authenticated" ? (
              <button onClick={handleSignOut} className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition">
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition">
                <LogIn className="h-4 w-4" /> Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </div>
      <CustomerSearchHeader suggestions={suggestions} />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm text-slate-500">© 2026 e-commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
