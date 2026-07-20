import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Power, UserCog, Eye, X, RefreshCw } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
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

function roleBadge(role: string) {
  const labelMap: Record<string, string> = {
    ROLE_SUPER_ADMIN: "bg-red-50 text-red-700",
    ROLE_STORE_ADMIN: "bg-slate-100 text-slate-700",
    ROLE_DELIVERY_STAFF: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    ROLE_CUSTOMER: "bg-emerald-50 text-emerald-700",
  };
  return labelMap[role] ?? "bg-slate-100 text-slate-700";
}

export function UsersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
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
  const [createData, setCreateData] = useState({
    username: "", password: "", email: "", fullName: "", phoneNumber: "", address: "", roles: ["ROLE_CUSTOMER"]
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");



  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getRoleOptions(token).then((res) => {
      if (active) setRoleOptions(res.filter((r) => r.roleName !== "ROLE_SUPER_ADMIN"));
    }).catch(console.error);
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchUsers(token, {
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
  }, [token, keyword, roleName, enabled, page, size, sortBy, sortType, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateLoading(true);
    setCreateError("");
    try {
      await createUser(token, createData);
      setIsCreateOpen(false);
      setCreateData({ username: "", password: "", email: "", fullName: "", phoneNumber: "", address: "", roles: ["ROLE_CUSTOMER"] });
      reload();
    } catch (err) {
      setCreateError(translateError(err));
    } finally {
      setCreateLoading(false);
    }
  };



  const toggleStatus = useCallback(async (user: AdminUser) => {
    if (!token) return;
    await updateUserStatus(token, user.id, user.isEnabled ? "inactive" : "active");
    reload();
  }, [reload, token]);

  const rows = useMemo(() => (result?.content ?? []).map((user) => {
    const canViewDetails = 
      (session?.user?.roles?.includes("ROLE_SUPER_ADMIN")) ||
      (session?.user?.roles?.includes("ROLE_STORE_ADMIN") && (user.roles.includes("ROLE_DELIVERY_STAFF") || user.roles.includes("ROLE_CUSTOMER")));

    return {
      id: String(user.id),
      name: (
        <div>
          <p className="font-semibold text-slate-950">{user.fullName || user.username}</p>
          <p className="text-xs text-slate-500">{user.email || "No email"}</p>
        </div>
      ),
      role: (
        <div className="flex flex-wrap gap-2">
          {user.roles.map((r) => <span key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(r)}`}>{translateRole(r)}</span>)}
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
            <Link to={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Chi tiết</Link>
          )}
          {!user.roles.includes("ROLE_SUPER_ADMIN") && (
            <button type="button" onClick={() => void toggleStatus(user)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Power className="h-3.5 w-3.5" /> {user.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
          )}
        </div>
      ),
    };
  }), [result, toggleStatus, session?.user?.roles]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "User Management", description: "Theo dõi và điều phối tài khoản trong hệ thống.", icon: <UserCog className="h-5 w-5" /> }}
        headerActions={
          <button type="button" onClick={() => setIsCreateOpen(true)} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
            <Plus className="h-4 w-4" /> Tạo user mới
          </button>
        }
      searchInput={
        <div className="w-full space-y-5">
          <div className="overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
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
              {roleOptions.map((opt) => (
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

          <div className="w-full flex flex-col lg:flex-row gap-4 items-center">
            <input
              value={keyword}
              onChange={(e) => { setPage(0); setKeyword(e.target.value); }}
              type="search"
              placeholder="Tìm kiếm người dùng..."
              className="w-full lg:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
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
        { key: "name", label: "Người dùng", sortable: true, sortByField: "fullName" },
        { key: "role", label: "Vai trò" },
        { key: "status", label: "Trạng thái", sortable: true, sortByField: "isEnabled" },
        { key: "joinedAt", label: "Ngày tham gia", sortable: true, sortByField: "createdAt" },
        { key: "actions", label: "Hành động" },
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
    <Modal open={isCreateOpen} onClose={() => !createLoading && setIsCreateOpen(false)} title="Tạo User Mới">
      <form onSubmit={handleCreateUser} className="space-y-4">
        {createError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Username *</label>
            <input required value={createData.username} onChange={(e) => setCreateData({ ...createData, username: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Password *</label>
            <input required type="password" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
            <input type="email" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Full Name</label>
            <input value={createData.fullName} onChange={(e) => setCreateData({ ...createData, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Phone</label>
            <input value={createData.phoneNumber} onChange={(e) => setCreateData({ ...createData, phoneNumber: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Role</label>
            <select value={createData.roles[0]} onChange={(e) => setCreateData({ ...createData, roles: [e.target.value] })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10">
              {roleOptions.map((r) => <option key={r.id} value={r.roleName}>{translateRole(r.roleName)}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Address</label>
            <input value={createData.address} onChange={(e) => setCreateData({ ...createData, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={createLoading} className="btn-primary px-5 py-2.5 text-sm">Tạo mới</button>
        </div>
      </form>
    </Modal>

  </>
  );
}
