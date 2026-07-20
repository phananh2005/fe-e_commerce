import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Boxes,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigationItems = [
  { label: "Bảng điều khiển", path: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Quản lý sản phẩm",
    icon: Boxes,
    subItems: [
      { label: "Sản phẩm", path: "/admin/products", icon: Boxes },
      { label: "Danh mục", path: "/admin/categories", icon: Layers3 },
      { label: "Thương hiệu", path: "/admin/brands", icon: Layers3 },
    ],
  },
  { label: "Người dùng", path: "/admin/users", icon: Users },
  { label: "Đơn hàng", path: "/admin/orders", icon: ReceiptText },
  { label: "Thông tin tài khoản", path: "/admin/account", icon: UserCog },
];

function getPageTitle(pathname: string) {
  for (const item of navigationItems) {
    if (item.subItems) {
      const subItem = item.subItems.find((sub) => pathname.startsWith(sub.path));
      if (subItem) {
        return (
          <span className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
            <span>{subItem.label}</span>
          </span>
        );
      }
    } else if (item.path && pathname.startsWith(item.path)) {
      return item.label;
    }
  }
  return "Admin";
}

export function AdminLayout() {
  const { session, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const pageTitle = getPageTitle(location.pathname);
  const username = session?.user.username ?? "Admin";
  const role = session?.user.roles?.[0] ?? "ROLE_STORE_ADMIN";
  const isCustomer = role === "customer" || role === "ROLE_CUSTOMER";
  const initials = username
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleProfileNavigate = (path: string) => {
    setProfileOpen(false);
    navigate(path);
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    if (startX === null || startY === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    touchStartX.current = null;
    touchStartY.current = null;

    // ignore mostly-vertical gestures
    if (Math.abs(dy) > 30) return;

    // swipe left -> close
    if (dx < -50) {
      setDrawerOpen(false);
      return;
    }

    // swipe right from the very left edge -> open
    if (dx > 50 && startX < 40) {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-2xl md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Trang quản trị
            </p>
            <h1 className="text-lg font-semibold text-white">e-commerce</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navigationItems.map((item) => {
            if (item.subItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => setProductMenuOpen(!productMenuOpen)}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Boxes className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        productMenuOpen ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  {productMenuOpen && (
                    <div className="mt-1 space-y-0.5 pl-4">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setDrawerOpen(false)}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly",
                              isActive
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "text-slate-300 hover:bg-white/5 hover:text-white",
                            ].join(" ")
                          }
                        >
                          <subItem.icon className="h-5 w-5 shrink-0" />
                          <span>{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly",
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
        />
      ) : null}

      <aside
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Trang quản trị
              </p>
              <h2 className="text-base font-semibold text-white">e-commerce</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white touch-friendly"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-4 py-6">
          {navigationItems.map((item) => {
            if (item.subItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => setProductMenuOpen(!productMenuOpen)}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Boxes className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        productMenuOpen ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                  {productMenuOpen && (
                    <div className="mt-1 space-y-0.5 pl-4">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setDrawerOpen(false)}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly",
                              isActive
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "text-slate-300 hover:bg-white/5 hover:text-white",
                            ].join(" ")
                          }
                        >
                          <subItem.icon className="h-5 w-5 shrink-0" />
                          <span>{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition touch-friendly",
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {!drawerOpen ? (
        <div
          aria-hidden
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="md:hidden fixed left-0 top-0 bottom-0 w-10 z-40"
        />
      ) : null}

      <div className="md:pl-72">
        <header
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-x-0 top-0 z-30 h-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl md:left-72 md:right-0"
        >
          <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 md:hidden touch-friendly"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-xl font-semibold text-slate-900">
                  {pageTitle}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-emerald-200"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white">
                  {initials || "AD"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {username}
                  </p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {username}
                    </p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProfileNavigate("/admin/account")}
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    Xem thông tin tài khoản
                  </button>
                  {isCustomer ? (
                    <button
                      type="button"
                      onClick={() => handleProfileNavigate("/")}
                      className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Đi tới trang bán hàng
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="pt-20">
          <div className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
