import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStaffCustomerInfo, updateUserRole, type StaffCustomerInfo } from "../../lib/adminApi";
import { translateError } from "../../lib/i18n";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [user, setUser] = useState<StaffCustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [saveRoleError, setSaveRoleError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getStaffCustomerInfo(token, Number(id));
        if (active) {
          setUser(data);
          setEditRoles(data.roles);
        }
      } catch (e) {
        if (active) setError(translateError(e));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, id, refreshTick]);

  const hasRoleChanges = user && (
    editRoles.length !== user.roles.length || 
    !editRoles.every(r => user.roles.includes(r))
  );

  const handleSaveRoles = async () => {
    if (!token || !user) return;
    
    if (user.roles.includes("ROLE_ADMIN") && !editRoles.includes("ROLE_ADMIN")) {
      setSaveRoleError("Không thể xóa quyền Admin của tài khoản này.");
      return;
    }

    setSavingRoles(true);
    setSaveRoleError("");
    try {
      await updateUserRole(token, { userId: user.id, roleNames: editRoles });
      setRefreshTick(t => t + 1);
    } catch (err) {
      setSaveRoleError(translateError(err));
    } finally {
      setSavingRoles(false);
    }
  };

  const handleCancelRoles = () => {
    if (user) {
      setEditRoles(user.roles);
      setSaveRoleError("");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;
  if (!user) return <div className="p-8 text-center text-slate-500">Không tìm thấy người dùng</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/users" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Thông tin người dùng</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50/50 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.fullName || user.username}</h2>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
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
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {user.isEnabled ? "Hoạt động" : "Vô hiệu"}
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-sm font-medium text-slate-500 mb-3">Vai trò</div>
            {saveRoleError && (
              <p className="mb-3 text-sm text-red-700">{saveRoleError}</p>
            )}
            <div className="flex flex-wrap items-center gap-6">
              {["ROLE_CUSTOMER", "ROLE_STAFF", "ROLE_ADMIN"].map((role) => {
                const isAdminAndTryingToRemoveSelf = user.roles.includes("ROLE_ADMIN") && role === "ROLE_ADMIN";
                
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
                      {role.replace("ROLE_", "")}
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
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {savingRoles ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelRoles}
                  disabled={savingRoles}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
