import { useCallback, useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, Power, UserCog } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  createUser,
  searchUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
  type PageResult,
} from "../../lib/adminApi";
import { formatDateTime } from "../../lib/format";
import { translateError } from "../../lib/i18n";

function roleBadge(role: string) {
  const labelMap: Record<string, string> = {
    ROLE_ADMIN: "bg-slate-100 text-slate-700",
    ROLE_STAFF: "bg-indigo-50 text-indigo-700",
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
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    username: "", password: "", email: "", fullName: "", phoneNumber: "", address: "", roles: ["ROLE_CUSTOMER"]
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null);
  const [editRoleData, setEditRoleData] = useState<string[]>([]);
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [editRoleError, setEditRoleError] = useState("");

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
          sortBy: "createdAt",
          sortType: "desc",
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
  }, [token, keyword, roleName, enabled, page, size, refreshTick]);

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

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingRoleUser) return;
    setEditRoleLoading(true);
    setEditRoleError("");
    try {
      await updateUserRole(token, { userId: editingRoleUser.id, roleNames: editRoleData });
      setEditingRoleUser(null);
      reload();
    } catch (err) {
      setEditRoleError(translateError(err));
    } finally {
      setEditRoleLoading(false);
    }
  };

  const toggleStatus = useCallback(async (user: AdminUser) => {
    if (!token) return;
    await updateUserStatus(token, user.id, user.isEnabled ? "inactive" : "active");
    reload();
  }, [reload, token]);

  const rows = useMemo(() => (result?.content ?? []).map((user) => ({
    id: String(user.id),
    name: (
      <div>
        <p className="font-semibold text-slate-950">{user.fullName || user.username}</p>
        <p className="text-xs text-slate-500">{user.email || "No email"}</p>
      </div>
    ),
    role: (
      <div className="flex flex-wrap gap-2">
        {user.roles.map((r) => <span key={r} className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(r)}`}>{r}</span>)}
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
        <button type="button" onClick={() => { setEditingRoleUser(user); setEditRoleData([...user.roles]); }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><PencilLine className="h-3.5 w-3.5" /> Sửa Role</button>
        <button type="button" onClick={() => void toggleStatus(user)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Power className="h-3.5 w-3.5" /> {user.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
      </div>
    ),
  })), [result, toggleStatus]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "User Management", description: "Theo dõi và điều phối tài khoản trong hệ thống.", icon: <UserCog className="h-5 w-5" /> }}
        headerActions={
          <button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Tạo user mới
          </button>
        }
      searchInput={
        <input value={keyword} onChange={(e) => { setPage(0); setKeyword(e.target.value); }} type="search" placeholder="Search user..." className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
      }
      filters={
        <div className="flex flex-wrap gap-3">
          <select value={roleName} onChange={(e) => { setPage(0); setRoleName(e.target.value); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
            <option value="">All roles</option>
            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
            <option value="ROLE_STAFF">ROLE_STAFF</option>
            <option value="ROLE_CUSTOMER">ROLE_CUSTOMER</option>
          </select>
          <select value={enabled} onChange={(e) => { setPage(0); setEnabled(e.target.value); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
          <select value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
            {[10, 20, 50].map((o) => <option key={o} value={o}>{o} / page</option>)}
          </select>
        </div>
      }
      columns={[
        { key: "name", label: "User" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "joinedAt", label: "Joined" },
        { key: "actions", label: "Actions" },
      ]}
      rows={rows}
      page={page}
      totalPages={result?.totalPages ?? 0}
      totalElements={result?.totalElements ?? 0}
      loading={loading}
      error={error}
      onPageChange={setPage}
      onRefresh={reload}
    />

    {/* Modal Tạo User */}
    <Modal open={isCreateOpen} onClose={() => !createLoading && setIsCreateOpen(false)} title="Tạo User Mới">
      <form onSubmit={handleCreateUser} className="space-y-4">
        {createError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Username *</label>
            <input required value={createData.username} onChange={(e) => setCreateData({ ...createData, username: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Password *</label>
            <input required type="password" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Email</label>
            <input type="email" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Full Name</label>
            <input value={createData.fullName} onChange={(e) => setCreateData({ ...createData, fullName: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Phone</label>
            <input value={createData.phoneNumber} onChange={(e) => setCreateData({ ...createData, phoneNumber: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Role</label>
            <select value={createData.roles[0]} onChange={(e) => setCreateData({ ...createData, roles: [e.target.value] })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
              <option value="ROLE_CUSTOMER">CUSTOMER</option>
              <option value="ROLE_STAFF">STAFF</option>
              <option value="ROLE_ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Address</label>
            <input value={createData.address} onChange={(e) => setCreateData({ ...createData, address: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={createLoading} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">Tạo mới</button>
        </div>
      </form>
    </Modal>

    {/* Modal Sửa Role */}
    <Modal open={!!editingRoleUser} onClose={() => !editRoleLoading && setEditingRoleUser(null)} title="Sửa Role">
      <form onSubmit={handleEditRole} className="space-y-4">
        {editRoleError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editRoleError}</div>}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">Roles</label>
          <div className="space-y-2">
            {["ROLE_CUSTOMER", "ROLE_STAFF", "ROLE_ADMIN"].map((role) => (
              <label key={role} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editRoleData.includes(role)}
                  onChange={(e) => {
                    if (e.target.checked) setEditRoleData([...editRoleData, role]);
                    else setEditRoleData(editRoleData.filter((r) => r !== role));
                  }}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span className="text-sm font-medium text-slate-700">{role.replace("ROLE_", "")}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setEditingRoleUser(null)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={editRoleLoading || editRoleData.length === 0} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">Lưu thay đổi</button>
        </div>
      </form>
    </Modal>
  </>
  );
}
