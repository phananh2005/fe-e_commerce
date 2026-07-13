import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ToastProvider, useToast } from "../../context/ToastContext";
import {
  changePassword,
  getMyInfo,
  getMyOrders,
  updateMyInfo,
  type UserProfile,
  type OrderSummaryResponse,
} from "../../lib/customerApi";
import { formatCurrency, formatDateTime } from "../../lib/format";

type Tab = "profile" | "password" | "orders";

function AccountContent() {
  const { session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const token = session?.tokens?.accessToken;

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await getMyInfo(token);
        if (!active) return;
        setProfile(data);
        setFullName(data.fullName || "");
        setPhoneNumber(data.phoneNumber || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
      } catch (err) {
        if (active)
          setProfileError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
      } finally {
        if (active) setLoadingProfile(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, navigate]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    try {
      await updateMyInfo(token, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.show("Cập nhật thông tin thành công");
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "Cập nhật thất bại",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới không trùng khớp.");
      return;
    }
    if (!token) return;
    setSavingPassword(true);
    try {
      await changePassword(token, {
        oldPassword,
        newPassword,
      });
      toast.show("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    setOrdersError("");
    try {
      setOrders(await getMyOrders(token));
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Thông tin cá nhân" },
      { key: "password", label: "Đổi mật khẩu" },
      { key: "orders", label: "Đơn hàng" },
    ],
    [],
  );

  const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-indigo-50 text-indigo-700",
    SHIPPING: "bg-cyan-50 text-cyan-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-rose-50 text-rose-700",
    RETURNED: "bg-slate-100 text-slate-700",
  };

  if (!token) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Đăng xuất
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "profile" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Thông tin cá nhân
            </h2>
            {profileError && (
              <p className="mt-3 text-sm text-red-700">{profileError}</p>
            )}
            {loadingProfile ? (
              <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
            ) : (
              <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Họ tên
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Username
                  </span>
                  <input
                    value={profile?.username || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Số điện thoại
                  </span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Địa chỉ
                  </span>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </label>
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {tab === "password" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Đổi mật khẩu
            </h2>
            {passwordError && (
              <p className="mt-3 text-sm text-red-700">{passwordError}</p>
            )}
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Mật khẩu cũ
                </span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Mật khẩu mới
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Nhập lại mật khẩu mới
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === "orders" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Đơn hàng của tôi
              </h2>
              <button
                onClick={loadOrders}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Làm mới
              </button>
            </div>
            {ordersError && (
              <p className="mt-3 text-sm text-red-700">{ordersError}</p>
            )}
            {loadingOrders ? (
              <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
            ) : orders.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Bạn chưa có đơn hàng nào.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    className="cursor-pointer rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Đơn #{order.orderId}
                        </p>
                        <p className="text-base font-semibold text-slate-900">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] || "bg-slate-100 text-slate-700"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {order.items?.[0]?.variantImageUrl && (
                        <img
                          src={order.items[0].variantImageUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-900 truncate">
                          {order.items?.[0]?.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.items?.length} sản phẩm
                        </p>
                      </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(order.totalPrice, "VND")}
                        </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Wrapper() {
  return (
    <ToastProvider>
      <AccountContent />
    </ToastProvider>
  );
}

export default Wrapper;
