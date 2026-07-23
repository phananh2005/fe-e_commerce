import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { CustomerLayout } from "./layouts/CustomerLayout";

// Customer Pages
import HomePage from "./pages/customer/HomePage";
import ProductPage from "./pages/customer/ProductPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import AccountPage from "./pages/shared/AccountPage";
import { OrdersPage as CustomerOrdersPage } from "./pages/customer/OrdersPage";
import { OrderDetailPage } from "./pages/customer/OrderDetailPage";

// Auth Pages
import { LoginPage } from "./pages/shared/LoginPage";
import { RegisterPage } from "./pages/shared/RegisterPage";

// Admin Pages
import { DashboardPage } from "./pages/admin/DashboardPage";
import { UsersPage } from "./pages/admin/UsersPage";

import { BrandPage } from "./pages/admin/BrandPage";
import { CategoryPage } from "./pages/admin/CategoryPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { OrdersPage as AdminOrdersPage } from "./pages/admin/OrdersPage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
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
      <Route element={<RoleRoute allowedRoles={["ROLE_SUPER_ADMIN", "ROLE_STORE_ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="brands" element={<BrandPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);
