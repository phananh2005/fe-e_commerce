import { useEffect, useMemo, useState } from "react";
import { useNavigate, useBlocker, useLocation } from "react-router-dom";
import { PencilLine } from "lucide-react";
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
import { updateUserRole } from "../../lib/adminApi";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { Modal } from "../../components/Modal";

type Tab = "profile" | "password" | "orders";

function AccountContent() {
  const { session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const token = session?.tokens?.accessToken;

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "tab" | "route";
    targetTab?: Tab;
  } | null>(null);

  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [saveRoleError, setSaveRoleError] = useState("");

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
        setEditRoles(data.roles || []);
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
  }, [token, navigate, refreshTick]);

  const hasProfileChanges = profile && (
    fullName !== (profile.fullName || "") ||
    phoneNumber !== (profile.phoneNumber || "") ||
    email !== (profile.email || "") ||
    address !== (profile.address || "")
  );

  const hasRoleChanges = profile && (
    editRoles.length !== (profile.roles?.length || 0) ||
    !editRoles.every(r => profile.roles?.includes(r))
  );

  const isDirty = Boolean(hasProfileChanges || hasRoleChanges);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !pendingNavigation) {
      if (isAdminPage) {
        setPendingNavigation({ type: "route" });
      } else {
        const confirm = window.confirm("Bạn có thay đổi chưa lưu. Bạn có muốn bỏ qua các thay đổi này và rời khỏi trang không?");
        if (confirm) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }
    }
  }, [blocker.state, pendingNavigation, isAdminPage]);

  const handleSaveAll = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!token) return;

    let successCount = 0;
    let hasError = false;

    if (hasProfileChanges) {
      setSavingProfile(true);
      try {
        await updateMyInfo(token, {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        });
        successCount++;
      } catch (err) {
        hasError = true;
        toast.show(
          err instanceof Error ? err.message : "Cập nhật thông tin thất bại",
          "error",
        );
      } finally {
        setSavingProfile(false);
      }
    }

    if (hasRoleChanges && profile) {
      if (profile.roles.includes("ROLE_ADMIN") && !editRoles.includes("ROLE_ADMIN")) {
        setSaveRoleError("Không thể xóa quyền Admin của tài khoản này.");
        hasError = true;
      } else {
        setSavingRoles(true);
        setSaveRoleError("");
        try {
          await updateUserRole(token, { userId: profile.id, roleNames: editRoles });
          successCount++;
        } catch (err) {
          hasError = true;
          setSaveRoleError(err instanceof Error ? err.message : "Cập nhật role thất bại");
        } finally {
          setSavingRoles(false);
        }
      }
    }

    if (successCount > 0 && !hasError) {
      toast.show("Lưu thay đổi thành công");
      setRefreshTick(t => t + 1);
      return true;
    } else if (successCount > 0 && hasError) {
      toast.show("Lưu thành công một phần", "error");
      setRefreshTick(t => t + 1);
      return false;
    }

    return !hasError;
  };

  const handleUndo = () => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhoneNumber(profile.phoneNumber || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
      setEditRoles(profile.roles || []);
      setSaveRoleError("");
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

  const handleTabChange = (newTab: Tab) => {
    if (isDirty) {
      if (isAdminPage) {
        setPendingNavigation({ type: "tab", targetTab: newTab });
      } else {
        if (!window.confirm("Bạn có thay đổi chưa lưu. Bạn có muốn bỏ qua các thay đổi này và chuyển tab không?")) {
          return;
        }
        handleUndo(); // Revert changes if they confirm to switch tab
        setTab(newTab);
      }
      return;
    }
    setTab(newTab);
  };

  const handleConfirmNavigation = async (shouldSave: boolean) => {
    if (shouldSave) {
      const success = await handleSaveAll();
      if (!success) {
        setPendingNavigation(null);
        if (pendingNavigation?.type === "route") {
          blocker.reset?.();
        }
        return;
      }
    } else {
      handleUndo();
    }

    if (pendingNavigation?.type === "route") {
      blocker.proceed?.();
    } else if (pendingNavigation?.type === "tab" && pendingNavigation.targetTab) {
      setTab(pendingNavigation.targetTab);
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    if (pendingNavigation?.type === "route") {
      blocker.reset?.();
    }
    setPendingNavigation(null);
  };

  const tabs = useMemo(() => {
    const list = [
      { key: "profile", label: "Thông tin cá nhân" },
      { key: "password", label: "Đổi mật khẩu" },
    ];
    if (!session?.user.roles?.includes("ROLE_ADMIN")) {
      list.push({ key: "orders", label: "Đơn hàng" });
    }
    return list;
  }, [session?.user.roles]);

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
      {!isAdminPage && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
          <button
            onClick={handleLogout}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Đăng xuất
          </button>
        </div>
      )}

      <div className={`card p-2 ${isAdminPage ? "" : "mt-6"}`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key as Tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.key
                ? "bg-[var(--color-primary)] text-white"
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
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Thông tin cá nhân
              </h2>
            </div>

            {profileError && (
              <p className="mt-3 text-sm text-red-700">{profileError}</p>
            )}
            {loadingProfile ? (
              <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
            ) : (
              <div className="mt-4 space-y-6">
                <form onSubmit={handleSaveAll} className="space-y-6">
                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Họ tên
                      </span>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </label>

                    <div className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">Vai trò</span>
                      {saveRoleError && (
                        <p className="mt-1 text-sm text-red-700">{saveRoleError}</p>
                      )}
                      {session?.user.roles?.includes("ROLE_ADMIN") ? (
                        <div className="flex flex-wrap gap-3">
                          {["ROLE_CUSTOMER", "ROLE_STAFF", "ROLE_ADMIN"].map((role) => {
                            const isAdminAndTryingToRemoveSelf = profile?.roles?.includes("ROLE_ADMIN") && role === "ROLE_ADMIN";
                            const isChecked = editRoles.includes(role);
                            const isDisabled = isAdminAndTryingToRemoveSelf || savingRoles;

                            return (
                              <label
                                key={role}
                                className={`flex cursor-pointer select-none items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${isChecked
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                  } ${isDisabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={(e) => {
                                    if (e.target.checked) setEditRoles([...editRoles, role]);
                                    else setEditRoles(editRoles.filter((r) => r !== role));
                                  }}
                                />
                                <span>{role.replace("ROLE_", "")}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile?.roles?.map((r) => (
                            <span key={r} className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {r.replace("ROLE_", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Hoàn tác
                    </button>
                    <button
                      type="submit"
                      disabled={!isDirty || savingProfile || savingRoles}
                      className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(savingProfile || savingRoles) ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {tab === "password" && (
          <section className="card p-6">
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </label>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-primary px-4 py-2.5 text-sm"
                >
                  {savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === "orders" && (
          <section className="card p-6">
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
                    className="cursor-pointer rounded-xl border border-slate-200 p-4 transition hover:border-[var(--color-primary)]/50"
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

      <Modal
        open={pendingNavigation !== null}
        onClose={handleCancelNavigation}
        title="Thay đổi chưa được lưu"
        description="Bạn có muốn lưu các thay đổi trước khi rời khỏi không?"
        className="max-w-fit min-w-[400px]"
      >
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={handleCancelNavigation}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Hủy
          </button>
          <button
            onClick={() => handleConfirmNavigation(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Bỏ qua thay đổi
          </button>
          <button
            onClick={() => handleConfirmNavigation(true)}
            disabled={savingProfile || savingRoles}
            className="btn-primary px-4 py-2 text-sm transition"
          >
            {(savingProfile || savingRoles) ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </Modal>
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
