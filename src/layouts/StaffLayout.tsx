import { useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  LogOut,
  Menu,
  ShoppingCart,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  getHomePathForRoles,
  setPreferredWorkspace,
  useAuth,
} from "../context/AuthContext";

const navigationItems = [
  { label: "Product", path: "/staff/products", icon: Boxes },
  { label: "Order", path: "/staff/orders", icon: ShoppingCart },
  { label: "User", path: "/staff/users", icon: Users },
];

function getPageTitle(pathname: string) {
  const current = navigationItems.find((item) =>
    pathname.startsWith(item.path),
  );
  return current?.label || "Staff";
}

export function StaffLayout() {
  const { session, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const username = session?.user.username ?? "Staff";
  const canSwitchToAdmin = session?.user.roles.includes("ROLE_ADMIN") ?? false;
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

  const handleSwitchWorkspace = () => {
    setPreferredWorkspace("admin");
    navigate(getHomePathForRoles(session?.user.roles, "admin"), {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-2xl md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Staff Panel
            </p>
            <h1 className="text-lg font-semibold text-white">fe_e-commerce</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
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

        <div className="border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 font-semibold text-white">
                {initials || "ST"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {username}
                </p>
                <p className="truncate text-xs text-slate-400">Staff member</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-red-500/15 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
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
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Staff Panel
              </p>
              <h2 className="text-base font-semibold text-white">
                fe_e-commerce
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-4 py-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
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

      <div className="md:pl-72">
        <header className="fixed inset-x-0 top-0 z-30 h-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl md:left-72 md:right-0">
          <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 md:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Overview
              </p>
              <div className="flex items-center gap-3">
                <h2 className="truncate text-xl font-semibold text-slate-900">
                  {pageTitle}
                </h2>
                <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 sm:inline-flex">
                  Live staff workspace
                </span>
              </div>
            </div>

            <label className="hidden w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm lg:flex">
              <span className="sr-only">Search</span>
              <input
                type="search"
                placeholder="Search products, orders, users..."
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            {canSwitchToAdmin ? (
              <button
                type="button"
                onClick={handleSwitchWorkspace}
                className="hidden items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 lg:inline-flex"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Chuyển sang Admin
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm xl:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white">
                {initials || "ST"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {username}
                </p>
                <p className="text-xs text-slate-500">Staff</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
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
