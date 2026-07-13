import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { CustomerSearchHeader } from "../components/CustomerSearchHeader";
import * as customerApi from "../lib/customerApi";

export function CustomerLayout() {
  const { status, session } = useAuth();
  const cartCtx = useCart();
  const [suggestions, setSuggestions] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 sm:px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            e-commerce
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link to="/" className="hover:text-indigo-600">
              Cửa hàng
            </Link>
            <Link to="/orders" className="hover:text-indigo-600">
              Đơn hàng
            </Link>
            <Link to="/account" className="hover:text-indigo-600">
              Tài khoản
            </Link>
          </nav>
        </div>
      </div>
      <CustomerSearchHeader suggestions={suggestions} />
      <Outlet />
    </div>
  );
}
