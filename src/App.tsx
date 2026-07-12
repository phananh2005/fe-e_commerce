import { useEffect, useState, type FormEvent } from "react";
import {
  Boxes,
  ChevronLeft,
  CircleUserRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

const API_URL = "http://localhost:8080/e-commerce";
const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type ApiResponse<T> = { code: number; message?: string; result: T };
type Product = {
  productId: number;
  productName: string;
  minPrice: number;
  avatarUrl?: string;
};
type ProductDetail = Product & {
  productDescription?: string;
  brandName?: string;
  categoryName?: string;
  maxPrice?: number;
  variants?: Array<{
    variantId: number;
    variantSkuCode: string;
    variantPrice: number;
    stockQuantity: number;
    attributes?: Array<{ attributeName: string; attributeValue: string }>;
  }>;
};
type CartItem = {
  cartItemId: number;
  productName: string;
  currentVariantId: string;
  variantSkuCode: string;
  variantImageUrl?: string;
  variantPrice: number;
  stockQuantity: number;
  cartItemQuantity: number;
};
type User = { username: string; roles: string[]; fullName?: string };
type Page<T> = { content: T[]; totalElements: number; totalPages: number };

async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...request } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...request,
    headers: {
      Accept: "application/json",
      ...(request.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? (JSON.parse(text) as ApiResponse<T>) : undefined;

  if (!response.ok || body?.code !== 1000) {
    throw new Error(body?.message || "Không thể hoàn tất yêu cầu.");
  }

  return body.result;
}

function useSession() {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("accessToken"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const value = sessionStorage.getItem("user");
    return value ? (JSON.parse(value) as User) : null;
  });

  const signOut = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  };

  return { token, user, setToken, setUser, signOut };
}

function App() {
  const session = useSession();

  return (
    <Routes>
      <Route path="/" element={<ShopLayout {...session} />}>
        <Route index element={<CatalogPage />} />
        <Route
          path="products/:id"
          element={<ProductPage token={session.token} />}
        />
        <Route path="cart" element={<CartPage token={session.token} />} />
        <Route path="login" element={<LoginPage {...session} />} />
        <Route
          path="account"
          element={<AccountPage token={session.token} user={session.user} />}
        />
      </Route>
      <Route
        path="/admin/*"
        element={
          <AdminGate token={session.token} user={session.user}>
            <AdminLayout signOut={session.signOut} />
          </AdminGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ShopLayout({ user, signOut }: ReturnType<typeof useSession>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Mono Store
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <Link to="/" className="hover:text-stone-500">
              Sản phẩm
            </Link>
            <Link to="/cart" className="hover:text-stone-500">
              Giỏ hàng
            </Link>
            {user?.roles.includes("ROLE_ADMIN") && (
              <Link to="/admin" className="hover:text-stone-500">
                Quản trị
              </Link>
            )}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="rounded-lg p-2 hover:bg-stone-100"
            >
              <ShoppingCart className="size-5" />
            </Link>
            {user ? (
              <>
                <Link to="/account" className="text-sm font-medium">
                  {user.fullName || user.username}
                </Link>
                <button
                  onClick={signOut}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                Đăng nhập
              </Link>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 sm:hidden"
            aria-label="Mở menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-stone-200 px-4 py-3 sm:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-medium">
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Sản phẩm
              </Link>
              <Link to="/cart" onClick={() => setMenuOpen(false)}>
                Giỏ hàng
              </Link>
              <Link
                to={user ? "/account" : "/login"}
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Tài khoản" : "Đăng nhập"}
              </Link>
            </div>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const brandId = searchParams.get("brandId") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ categoryId: number; categoryName: string }>
  >([]);
  const [brands, setBrands] = useState<
    Array<{ brandId: number; brandName: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<Page<Product>>(
        `/search?keyword=${encodeURIComponent(keyword)}&categoryId=${categoryId}&brandId=${brandId}&page=0&size=24`,
      ),
      api<Array<{ categoryId: number; categoryName: string }>>("/categories"),
      api<Array<{ brandId: number; brandName: string }>>("/brands"),
    ])
      .then(([page, loadedCategories, loadedBrands]) => {
        setProducts(page.content);
        setCategories(loadedCategories);
        setBrands(loadedBrands);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [keyword, categoryId, brandId]);

  const apply = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="border-b border-stone-200 pb-8">
        <p className="text-sm font-medium text-stone-500">Cửa hàng công nghệ</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Sản phẩm đơn giản, chọn đúng nhu cầu.
        </h1>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-4">
          <label className="text-sm font-semibold">Tìm kiếm</label>
          <input
            value={keyword}
            onChange={(event) => apply("keyword", event.target.value)}
            placeholder="Tên sản phẩm..."
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
          />
          <label className="mt-5 block text-sm font-semibold">Danh mục</label>
          <select
            value={categoryId}
            onChange={(event) => apply("categoryId", event.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {categories.map((item) => (
              <option key={item.categoryId} value={item.categoryId}>
                {item.categoryName}
              </option>
            ))}
          </select>
          <label className="mt-5 block text-sm font-semibold">
            Thương hiệu
          </label>
          <select
            value={brandId}
            onChange={(event) => apply("brandId", event.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {brands.map((item) => (
              <option key={item.brandId} value={item.brandId}>
                {item.brandName}
              </option>
            ))}
          </select>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sản phẩm</h2>
            <span className="text-sm text-stone-500">
              {products.length} kết quả
            </span>
          </div>
          {loading && (
            <p className="py-16 text-center text-stone-500">
              Đang tải sản phẩm...
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.productId}`}
      className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-stone-400"
    >
      <div className="aspect-square bg-stone-100">
        {product.avatarUrl ? (
          <img
            src={product.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="m-auto h-full w-10 text-stone-300" />
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold group-hover:underline">
          {product.productName}
        </h3>
        <p className="mt-2 text-sm font-bold">
          {money.format(product.minPrice || 0)}
        </p>
      </div>
    </Link>
  );
}

function ProductPage({ token }: { token: string | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<ProductDetail>(`/product/${id}`)
      .then(setProduct)
      .catch((error: Error) => setMessage(error.message));
  }, [id]);

  const addToCart = async () => {
    const variant = product?.variants?.[selected];
    if (!token) return navigate("/login");
    if (!variant) return setMessage("Sản phẩm chưa có biến thể để mua.");
    try {
      await api("/cart-item/add", {
        method: "POST",
        token,
        body: JSON.stringify({ variantId: variant.variantId, quantity: 1 }),
      });
      setMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  if (!product)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-stone-500">
        {message || "Đang tải..."}
      </div>
    );
  const variant = product.variants?.[selected];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Quay lại
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-stone-100">
          {product.avatarUrl ? (
            <img
              src={product.avatarUrl}
              alt={product.productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="m-auto h-full w-16 text-stone-300" />
          )}
        </div>
        <div>
          <p className="text-sm text-stone-500">
            {product.brandName} · {product.categoryName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {product.productName}
          </h1>
          <p className="mt-4 text-2xl font-bold">
            {money.format(variant?.variantPrice ?? product.minPrice)}
          </p>
          <p className="mt-6 whitespace-pre-line text-sm leading-6 text-stone-600">
            {product.productDescription || "Chưa có mô tả cho sản phẩm này."}
          </p>
          {!!product.variants?.length && (
            <div className="mt-7">
              <p className="text-sm font-semibold">Chọn phiên bản</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((item, index) => (
                  <button
                    key={item.variantId}
                    onClick={() => setSelected(index)}
                    className={`rounded-lg border px-3 py-2 text-sm ${selected === index ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}
                  >
                    {item.attributes
                      ?.map((a) => a.attributeValue)
                      .join(" · ") || item.variantSkuCode}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-stone-500">
            {variant ? `Còn ${variant.stockQuantity} sản phẩm` : ""}
          </p>
          <button
            onClick={addToCart}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white hover:bg-stone-700"
          >
            <ShoppingCart className="size-5" />
            Thêm vào giỏ hàng
          </button>
          {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

function CartPage({ token }: { token: string | null }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState("");

  const load = () =>
    token &&
    api<CartItem[] | null>("/cart-item/my-cart", { token })
      .then((data) => setItems(data || []))
      .catch((reason: Error) => setError(reason.message));
  useEffect(() => {
    if (!token) navigate("/login");
    else load();
  }, [token]);

  const update = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return;
    try {
      await api("/cart-item/update", {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({
          cartItemId: item.cartItemId,
          variantId: Number(item.currentVariantId),
          quantity,
        }),
      });
      load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  };
  const remove = async (id: number) => {
    try {
      await api(`/cart-item/remove/${id}`, { method: "DELETE", token: token! });
      load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.variantPrice * item.cartItemQuantity,
    0,
  );
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Giỏ hàng</h1>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {!items.length ? (
        <p className="mt-8 text-stone-500">Giỏ hàng đang trống.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {item.variantImageUrl && (
                    <img
                      src={item.variantImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{item.productName}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {item.variantSkuCode}
                  </p>
                  <p className="mt-2 font-semibold">
                    {money.format(item.variantPrice)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => remove(item.cartItemId)}
                    className="text-sm text-stone-500 hover:text-red-600"
                  >
                    Xóa
                  </button>
                  <div className="flex items-center rounded-lg border border-stone-300">
                    <button
                      onClick={() => update(item, item.cartItemQuantity - 1)}
                      className="p-2"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.cartItemQuantity}
                    </span>
                    <button
                      onClick={() => update(item, item.cartItemQuantity + 1)}
                      className="p-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">Tạm tính</p>
            <p className="mt-2 text-2xl font-bold">{money.format(total)}</p>
            <button className="mt-5 w-full rounded-lg bg-stone-900 py-3 font-semibold text-white hover:bg-stone-700">
              Thanh toán
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function LoginPage({ setToken, setUser, user }: ReturnType<typeof useSession>) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            username: values.get("username"),
            password: values.get("password"),
          }),
        },
      );
      const profile = await api<User>("/users/my-info", {
        token: tokens.accessToken,
      });
      sessionStorage.setItem("accessToken", tokens.accessToken);
      sessionStorage.setItem("user", JSON.stringify(profile));
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setToken(tokens.accessToken);
      setUser(profile);
      navigate(profile.roles.includes("ROLE_ADMIN") ? "/admin" : "/");
    } catch (reason) {
      setError((reason as Error).message);
    }
  };
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <form
        onSubmit={submit}
        className="w-full rounded-xl border border-stone-200 bg-white p-6"
      >
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="mt-2 text-sm text-stone-500">
          Dùng tài khoản đã được cấp.
        </p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="mt-6 block text-sm font-medium">
          Tên đăng nhập
          <input
            required
            name="username"
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Mật khẩu
          <input
            required
            type="password"
            name="password"
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-3 font-semibold text-white">
          <LogIn className="size-5" />
          Đăng nhập
        </button>
      </form>
    </div>
  );
}

function AccountPage({
  token,
  user,
}: {
  token: string | null;
  user: User | null;
}) {
  if (!token || !user) return <Navigate to="/login" replace />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Tài khoản</h1>
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <CircleUserRound className="size-10 text-stone-400" />
        <h2 className="mt-4 font-semibold">{user.fullName || user.username}</h2>
        <p className="mt-1 text-sm text-stone-500">{user.username}</p>
        <p className="mt-5 text-sm text-stone-600">
          Trang hồ sơ, đổi mật khẩu và lịch sử đơn hàng dùng các API `/users/*`
          và `/orders/my-orders` theo tài liệu backend.
        </p>
      </div>
    </div>
  );
}

function AdminGate({
  token,
  user,
  children,
}: {
  token: string | null;
  user: User | null;
  children: React.ReactNode;
}) {
  if (!token || !user?.roles.includes("ROLE_ADMIN"))
    return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const adminNav = [
  ["/admin", "Tổng quan", LayoutDashboard],
  ["/admin/products", "Sản phẩm", Boxes],
  ["/admin/orders", "Đơn hàng", ShoppingBag],
  ["/admin/users", "Người dùng", Users],
] as const;

function AdminLayout({ signOut }: { signOut: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-stone-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-stone-900 text-stone-100 transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <span className="font-bold">Mono Admin</span>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X />
          </button>
        </div>
        <nav className="flex-1 p-3">
          {adminNav.map(([path, label, Icon]) => (
            <NavLink
              end={path === "/admin"}
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-white text-stone-900" : "text-stone-300 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="m-3 flex items-center justify-center gap-2 rounded-lg border border-white/20 py-2.5 text-sm font-medium hover:bg-white/10"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
      </aside>
      <div className="md:pl-64">
        <header className="flex h-16 items-center border-b border-stone-200 bg-white px-4">
          <button onClick={() => setOpen(true)} className="mr-4 md:hidden">
            <Menu />
          </button>
          <Link to="/" className="ml-auto text-sm font-medium">
            Xem cửa hàng
          </Link>
        </header>
        <main className="p-4 sm:p-6">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route
              path="products"
              element={
                <AdminTable
                  title="Sản phẩm"
                  path="/management/product/search"
                  columns={["name", "status", "createdAt"]}
                />
              }
            />
            <Route
              path="orders"
              element={
                <AdminTable
                  title="Đơn hàng"
                  path="/management/order/search?page=0&size=10"
                  columns={["orderId", "fullName", "status", "totalPrice"]}
                />
              }
            />
            <Route
              path="users"
              element={
                <AdminTable
                  title="Người dùng"
                  path="/management/users?page=0&size=10"
                  columns={["username", "fullName", "roles", "isEnabled"]}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardPage() {
  const token = sessionStorage.getItem("accessToken")!;
  const [overview, setOverview] = useState<{
    totalUsers: number;
    totalProducts: number;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ totalUsers: number; totalProducts: number }>(
      "/management/statistics/overview",
      { token },
    )
      .then(setOverview)
      .catch((reason: Error) => setError(reason.message));
  }, [token]);
  return (
    <section>
      <p className="text-sm font-medium text-stone-500">Quản trị hệ thống</p>
      <h1 className="mt-1 text-2xl font-bold">Tổng quan</h1>
      {error && (
        <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: "Người dùng", value: overview?.totalUsers, icon: Users },
          { label: "Sản phẩm", value: overview?.totalProducts, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <Icon className="size-5 text-stone-500" />
            <p className="mt-5 text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value ?? "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminTable({
  title,
  path,
  columns,
}: {
  title: string;
  path: string;
  columns: string[];
}) {
  const token = sessionStorage.getItem("accessToken")!;
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Page<Record<string, unknown>>>(path, { token })
      .then((page) => setData(page.content))
      .catch((reason: Error) => setError(reason.message));
  }, [path, token]);
  const display = (value: unknown) =>
    Array.isArray(value)
      ? value.join(", ")
      : typeof value === "number" && columns.includes("totalPrice")
        ? money.format(value)
        : String(value ?? "—");
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        {error ? (
          <p className="p-5 text-sm text-red-700">{error}</p>
        ) : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-5 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={String(row.id || row.orderId || index)}
                  className="border-b border-stone-100 last:border-0"
                >
                  {columns.map((column) => (
                    <td key={column} className="px-5 py-4">
                      {display(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
              {!data.length && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-10 text-center text-stone-500"
                  >
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default App;
