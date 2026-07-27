import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { CustomerSearchHeader } from "../components/CustomerSearchHeader";
import * as customerApi from "../lib/customerApi";

export function CustomerLayout() {
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
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <CustomerSearchHeader suggestions={suggestions} />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Về e-commerce</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Giới thiệu</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Tuyển dụng</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Chính sách bảo mật</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Điều khoản sử dụng</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Hỗ trợ khách hàng</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Trung tâm trợ giúp</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Hướng dẫn mua hàng</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Chính sách đổi trả</Link></li>
                <li><Link to="#" className="hover:text-[var(--color-primary)]">Bảo hành</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Theo dõi chúng tôi</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[var(--color-primary)]">Facebook</a></li>
                <li><a href="#" className="hover:text-[var(--color-primary)]">Instagram</a></li>
                <li><a href="#" className="hover:text-[var(--color-primary)]">Twitter</a></li>
                <li><a href="#" className="hover:text-[var(--color-primary)]">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Tải ứng dụng</h3>
              <div className="flex flex-col gap-3">
                <a href="#" className="inline-flex h-10 w-32 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition">
                  App Store
                </a>
                <a href="#" className="inline-flex h-10 w-32 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition">
                  Google Play
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-100 pt-8 text-center">
            <p className="text-sm text-slate-500">© 2026 e-commerce. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
