import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { StaffLayout } from "./layouts/StaffLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { OrdersPage } from "./pages/admin/OrdersPage";
import { ProductCatalogPage } from "./pages/admin/ProductCatalogPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { OrdersPage as StaffOrdersPage } from "./pages/staff/OrdersPage";
import { ProductsPage as StaffProductsPage } from "./pages/staff/ProductsPage";
import { UsersPage as StaffUsersPage } from "./pages/staff/UsersPage";
import { getHomePathForRoles, useAuth } from "./context/AuthContext";

function RootRedirect() {
  const { status } = useAuth();

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
          Đang khởi tạo ứng dụng...
        </div>
      </div>
    );
  }

  return (
    <Navigate
      to={
        status === "authenticated"
          ? getHomePathForRoles(session?.user.roles)
          : "/login"
      }
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["ROLE_ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="product-catalog" element={<ProductCatalogPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
        </Route>

        <Route
          element={<RoleRoute allowedRoles={["ROLE_STAFF", "ROLE_ADMIN"]} />}
        >
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<StaffProductsPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="users" element={<StaffUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
