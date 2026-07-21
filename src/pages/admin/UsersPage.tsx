import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Power, UserCog, Eye, X, RefreshCw, ReceiptText } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createUser,
  searchUsers,
  updateUserStatus,
  getRoleOptions,
  type AdminUser,
  type PageResult,
  type RoleOption,
} from "../../lib/adminApi";
import { formatDateTime } from "../../lib/format";
import { translateError, translateRole } from "../../lib/i18n";
import { UserDetailModal } from "./UserDetailPage";

const roleWeight: Record<string, number> = {
  ROLE_SUPER_ADMIN: 1,
  ROLE_STORE_ADMIN: 2,
  ROLE_DELIVERY_STAFF: 3,
  ROLE_CUSTOMER: 4,
};

function roleBadge(role: string) {
  const labelMap: Record<string, string> = {
    ROLE_SUPER_ADMIN: "bg-rose-100 text-rose-700",
    ROLE_STORE_ADMIN: "bg-indigo-100 text-indigo-700",
    ROLE_DELIVERY_STAFF: "bg-sky-100 text-sky-700",
    ROLE_CUSTOMER: "bg-emerald-50 text-emerald-700",
  };
  return labelMap[role] ?? "bg-slate-100 text-slate-700";
}

export function UsersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const navigate = useNavigate();
  const toast = useToast();
  const [userIdentifier, setUserIdentifier] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleName, setRoleName] = useState("");
  const [enabled, setEnabled] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [refreshTick, setRefreshTick] = useState(0);

  const handleSort = useCallback((key: string) => {
    if (sortBy === key) {
      setSortType((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortType("desc");
    }
    setPage(0);
  }, [sortBy]);

  const handleResetFilters = useCallback(() => {
    setUserIdentifier("");
    setKeyword("");
    setRoleName("");
    setEnabled("");
    setPage(0);
    setSortBy("createdAt");
    setSortType("desc");
  }, []);

  const [result, setResult] = useState<PageResult<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const [createData, setCreateData] = useState({
    username: "", password: "", email: "", fullName: "", phoneNumber: "", address: "", roles: ["ROLE_CUSTOMER"]
  });
  const [createLoading, setCreateLoading] = useState(false);



  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getRoleOptions(token).then((res) => {
      if (active) {
        const isSuperAdmin = session?.user?.roles?.includes("ROLE_SUPER_ADMIN");
        setRoleOptions(res.filter((r) => {
          if (r.roleName === "ROLE_SUPER_ADMIN") return false;
          if (!isSuperAdmin && r.roleName === "ROLE_STORE_ADMIN") return false;
          return true;
        }));
      }
    }).catch(console.error);
    return () => { active = false; };
  }, [token, session?.user?.roles]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchUsers(token, {
          userIdentifier: userIdentifier.trim() || undefined,
          keyword: keyword.trim() || undefined,
          roleNames: roleName ? [roleName] : undefined,
          enabled: enabled === "" ? null : enabled === "true",
          page,
          size,
          sortBy,
          sortType,
        });
        if (active) setResult(data);
      } catch (e) {
        if (active) setError(translateError(e));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, userIdentifier, keyword, roleName, enabled, page, size, sortBy, sortType, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateLoading(true);
    if (createData.roles.length === 0) {
      toast.show("Vui lòng chọn ít nhất một vai trò.", "error");
      setCreateLoading(false);
      return;
    }
    try {
      await createUser(token, createData);
      toast.show("Tạo người dùng thành công", "success");
      setIsCreateOpen(false);
      setCreateData({ username: "", password: "", email: "", fullName: "", phoneNumber: "", address: "", roles: ["ROLE_CUSTOMER"] });
      reload();
    } catch (err) {
      const msg = translateError(err);
      toast.show(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  };



  const toggleStatus = useCallback(async (user: AdminUser) => {
    if (!token) return;
    try {
      await updateUserStatus(token, user.id, user.isEnabled ? "inactive" : "active");
      toast.show(`Đã ${user.isEnabled ? "vô hiệu hóa" : "kích hoạt"} tài khoản`, "success");
      reload();
    } catch (err) {
      toast.show(translateError(err), "error");
    }
  }, [reload, token, toast]);

  const rows = useMemo(() => (result?.content ?? []).map((user) => {
    const canViewDetails = 
      (session?.user?.roles?.includes("ROLE_SUPER_ADMIN")) ||
      (session?.user?.roles?.includes("ROLE_STORE_ADMIN") && (user.roles.includes("ROLE_DELIVERY_STAFF") || user.roles.includes("ROLE_CUSTOMER")));

    return {
      id: String(user.id),
      name: (
        <div>
          <p className="font-semibold text-slate-950">{user.fullName || "---"}</p>
          <p className="text-xs text-slate-500">{user.email || "---"}</p>
        </div>
      ),
      username: <span className="text-slate-600">{user.username}</span>,
      contact: <span className="text-slate-600 text-sm">{user.phoneNumber || "---"}</span>,

      role: (
        <div className="flex flex-col items-start gap-1.5">
          {[...user.roles]
            .sort((a, b) => (roleWeight[a] ?? 99) - (roleWeight[b] ?? 99))
            .map((r) => (
              <span key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(r)}`}>
                {translateRole(r)}
              </span>
            ))}
        </div>
      ),
      status: (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {user.isEnabled ? "Active" : "Disabled"}
        </span>
      ),
      joinedAt: formatDateTime(user.createdAt),
      actions: (
        <div className="flex flex-wrap gap-2">
          {canViewDetails && (
            <button type="button" onClick={() => setDetailUserId(Number(user.id))} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Eye className="h-3.5 w-3.5" /> Chi tiết</button>
          )}
          {user.roles.includes("ROLE_CUSTOMER") && (
            <button type="button" onClick={() => navigate(`/admin/orders?userId=${user.id}`)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><ReceiptText className="h-3.5 w-3.5" /> Đơn hàng</button>
          )}
          {!user.roles.includes("ROLE_SUPER_ADMIN") && (
            <button type="button" onClick={() => void toggleStatus(user)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Power className="h-3.5 w-3.5" /> {user.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
          )}
        </div>
      ),
    };
  }), [result, toggleStatus, navigate, session?.user?.roles]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "User Management", description: "Theo dõi và điều phối tài khoản trong hệ thống.", icon: <UserCog className="h-5 w-5" /> }}
      searchInput={
        <div className="w-full space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 sm:pb-0">
            <div className="overflow-x-auto custom-scrollbar w-full sm:w-auto">
              <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl w-fit border border-slate-200/50">
              <button
                onClick={() => { setPage(0); setRoleName(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  roleName === ""
                    ? "bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                Tất cả vai trò
              </button>
              {[...roleOptions]
                .sort((a, b) => (roleWeight[a.roleName] ?? 99) - (roleWeight[b.roleName] ?? 99))
                .map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setPage(0); setRoleName(opt.roleName); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    roleName === opt.roleName
                      ? "bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {translateRole(opt.roleName)}
                </button>
              ))}
              </div>
            </div>
            <button type="button" onClick={() => setIsCreateOpen(true)} className="btn-primary whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl">
              <Plus className="h-4 w-4" /> Tạo user mới
            </button>
          </div>

          <div className="w-full flex flex-col lg:flex-row gap-4 items-center">
            <input
              value={userIdentifier}
              onChange={(e) => { setPage(0); setUserIdentifier(e.target.value); }}
              type="search"
              placeholder="Nhập ID hoặc username"
              className="w-full lg:w-56 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            />

            <input
              value={keyword}
              onChange={(e) => { setPage(0); setKeyword(e.target.value); }}
              type="search"
              placeholder="Tìm theo họ tên, email, số điện thoại"
              className="w-full lg:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            />
            
            <select
              value={enabled}
              onChange={(e) => { setPage(0); setEnabled(e.target.value); }}
              className="w-full lg:w-48 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>

            <div className="w-full lg:w-auto lg:ml-auto flex justify-end gap-3 items-center">
              <select
                value={size}
                onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
              >
                {[10, 20, 50].map((o) => <option key={o} value={o}>{o} / trang</option>)}
              </select>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 outline-none transition hover:bg-rose-100 focus:ring-4 focus:ring-rose-100"
                title="Xóa bộ lọc"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Xóa lọc</span>
              </button>
              <button
                onClick={reload}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)] outline-none transition hover:bg-[var(--color-primary)]/20 focus:ring-4 focus:ring-[var(--color-primary)]/10 disabled:opacity-50"
                title="Tải lại"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Tải lại</span>
              </button>
            </div>
          </div>
        </div>
      }
      filters={undefined}
      columns={[
        { key: "name", label: "Tên & Email", sortable: true, sortByField: "fullName", className: "min-w-[200px]" },
        { key: "username", label: "Username", className: "whitespace-nowrap" },
        { key: "contact", label: "Số điện thoại", className: "whitespace-nowrap" },
        { key: "role", label: "Vai trò", className: "min-w-[150px]" },
        { key: "status", label: "Trạng thái", sortable: true, sortByField: "isEnabled", className: "whitespace-nowrap" },
        { key: "joinedAt", label: "Ngày tham gia", sortable: true, sortByField: "createdAt", className: "whitespace-nowrap" },
        { key: "actions", label: "Hành động", className: "min-w-[320px]" },
      ]}
      rows={rows}
      sortBy={sortBy}
      sortType={sortType}
      onSort={handleSort}
      page={page}
      totalPages={result?.totalPages ?? 0}
      totalElements={result?.totalElements ?? 0}
      loading={loading}
      error={error}
      onPageChange={setPage}
    />

    {/* Modal Tạo User */}
    <Modal open={isCreateOpen} onClose={() => !createLoading && setIsCreateOpen(false)} title="Tạo User Mới" className="max-w-4xl">
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Username *</label>
            <input required value={createData.username} onChange={(e) => setCreateData({ ...createData, username: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Mật khẩu *</label>
            <input required type="password" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
            <input type="email" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Họ và tên *</label>
            <input required value={createData.fullName} onChange={(e) => setCreateData({ ...createData, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Số điện thoại *</label>
            <input required value={createData.phoneNumber} onChange={(e) => setCreateData({ ...createData, phoneNumber: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Địa chỉ</label>
            <input value={createData.address} onChange={(e) => setCreateData({ ...createData, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div className="col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Vai trò *</label>
            <div className="flex flex-wrap items-center gap-6">
              {[...roleOptions]
                .sort((a, b) => (roleWeight[a.roleName] ?? 99) - (roleWeight[b.roleName] ?? 99))
                .map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createData.roles.includes(r.roleName)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateData({ ...createData, roles: [...createData.roles, r.roleName] });
                      } else {
                        setCreateData({ ...createData, roles: createData.roles.filter((role) => role !== r.roleName) });
                      }
                    }}
                    className="h-5 w-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/10"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {translateRole(r.roleName)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={createLoading} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            {createLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            Tạo mới
          </button>
        </div>
      </form>
    </Modal>
    {detailUserId && (
      <UserDetailModal
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onRefreshList={() => setRefreshTick(t => t + 1)}
      />
    )}
  </>
  );
}
