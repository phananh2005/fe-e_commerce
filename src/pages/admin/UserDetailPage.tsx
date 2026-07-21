import { useEffect, useState } from "react";
import { User as UserIcon, Power, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../../components/Modal";
import { getStaffCustomerInfo, updateUserRole, updateUserStatus, type StaffCustomerInfo } from "../../lib/adminApi";
import { translateError, translateRole } from "../../lib/i18n";

export function UserDetailModal({ userId, onClose, onRefreshList }: { userId: number; onClose: () => void; onRefreshList?: () => void }) {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();
  const [user, setUser] = useState<StaffCustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const toggleStatus = async () => {
    if (!token || !user) return;
    setUpdatingStatus(true);
    try {
      await updateUserStatus(token, user.id, user.isEnabled ? "inactive" : "active");
      toast.show(user.isEnabled ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản", "success");
      setRefreshTick(t => t + 1);
      if (onRefreshList) onRefreshList();
    } catch (err) {
      toast.show(translateError(err), "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (!token || !userId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getStaffCustomerInfo(token, userId);
        if (active) {
          setUser(data);
          setEditRoles(data.roles);
        }
      } catch (e: any) {
        if (e?.code === 403 || e?.status === 403) {
          if (active) {
            toast.show("Bạn không có quyền xem thông tin người dùng này", "error");
            onClose();
          }
        } else if (active) {
          setError(translateError(e));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, userId, refreshTick, onClose, toast]);

  const hasRoleChanges = user && (
    editRoles.length !== user.roles.length || 
    !editRoles.every(r => user.roles.includes(r))
  );

  const handleSaveRoles = async () => {
    if (!token || !user) return;
    
    if (user.roles.includes("ROLE_SUPER_ADMIN") && !editRoles.includes("ROLE_SUPER_ADMIN")) {
      toast.show("Không thể gỡ quyền SUPER ADMIN", "error");
      return;
    }

    setSavingRoles(true);
    try {
      await updateUserRole(token, { userId: user.id, roleNames: editRoles });
      toast.show("Cập nhật vai trò thành công", "success");
      setRefreshTick(t => t + 1);
      if (onRefreshList) onRefreshList();
    } catch (err) {
      const msg = translateError(err);
      toast.show(msg, "error");
    } finally {
      setSavingRoles(false);
    }
  };

  const handleCancelRoles = () => {
    if (user) {
      setEditRoles(user.roles);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Thông tin người dùng"
      className="max-w-4xl"
    >
      {loading && <div className="p-8 text-center text-slate-500">Đang tải...</div>}
      {error && <div className="p-8 text-center text-rose-500">{error}</div>}
      {!loading && !error && !user && <div className="p-8 text-center text-slate-500">Không tìm thấy người dùng</div>}
      
      {user && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50/50 p-6 -mx-6 -mt-6 mb-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.fullName || user.username}</h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-slate-500">Email</div>
            <div className="mt-1 font-medium text-slate-900">{user.email || "—"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Số điện thoại</div>
            <div className="mt-1 font-medium text-slate-900">{user.phoneNumber || "—"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-sm font-medium text-slate-500">Địa chỉ</div>
            <div className="mt-1 font-medium text-slate-900">{user.address || "—"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Trạng thái</div>
            <div className="mt-1 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {user.isEnabled ? "Hoạt động" : "Vô hiệu"}
              </span>
              {!user.roles.includes("ROLE_SUPER_ADMIN") && (
                <button
                  onClick={toggleStatus}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <Power className="h-3.5 w-3.5" /> {user.isEnabled ? "Vô hiệu hóa" : "Kích hoạt"}
                </button>
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-sm font-medium text-slate-500 mb-3">Vai trò</div>
            <div className="flex flex-wrap items-center gap-6">
              {["ROLE_CUSTOMER", "ROLE_DELIVERY_STAFF", "ROLE_STORE_ADMIN"]
                .filter((role) => {
                  if (role === "ROLE_STORE_ADMIN" && !session?.user?.roles?.includes("ROLE_SUPER_ADMIN")) return false;
                  return true;
                })
                .map((role) => {
                const isAdminAndTryingToRemoveSelf = user.roles.includes("ROLE_SUPER_ADMIN") && role === "ROLE_SUPER_ADMIN";
                
                return (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editRoles.includes(role)}
                      disabled={isAdminAndTryingToRemoveSelf || savingRoles}
                      onChange={(e) => {
                        if (e.target.checked) setEditRoles([...editRoles, role]);
                        else setEditRoles(editRoles.filter((r) => r !== role));
                      }}
                      className="h-5 w-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {translateRole(role)}
                    </span>
                    {isAdminAndTryingToRemoveSelf && (
                      <span className="text-xs text-slate-400">(Không thể xóa)</span>
                    )}
                  </label>
                );
              })}
            </div>
            {hasRoleChanges && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveRoles}
                  disabled={savingRoles || editRoles.length === 0}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {savingRoles && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={handleCancelRoles}
                  disabled={savingRoles}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </Modal>
  );
}
