import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { CustomerLayout } from "./layouts/CustomerLayout";

// Customer Pages
import HomePage from "./pages/customer/HomePage";
import ProductPage from "./pages/customer/ProductPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import AccountPage from "./pages/customer/AccountPage";
import { OrdersPage as CustomerOrdersPage } from "./pages/customer/OrdersPage";
import { OrderDetailPage } from "./pages/customer/OrderDetailPage";

// Auth Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

// Admin Pages
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { ProductCatalogPage } from "./pages/admin/ProductCatalogPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { OrdersPage as AdminOrdersPage } from "./pages/admin/OrdersPage";

export default function App() {
  return (
    <Routes>
      {/* Public shop routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Customer Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/orders" element={<CustomerOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<RoleRoute allowedRoles={["ROLE_ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="product-catalog" element={<ProductCatalogPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
