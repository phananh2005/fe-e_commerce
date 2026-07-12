import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PencilLine,
  Power,
  RefreshCw,
  ShieldUser,
  UserCog,
} from "lucide-react";
import { ManagementPage } from "./ManagementPage";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  searchUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
  type PageResult,
  type UserStatus,
} from "../../lib/adminApi";
import { formatDateTime, formatNumber } from "../../lib/format";

const roleOptions = ["ROLE_ADMIN", "ROLE_STAFF", "ROLE_CUSTOMER"] as const;

function roleBadge(role: string) {
  const labelMap: Record<string, string> = {
    ROLE_ADMIN: "bg-slate-100 text-slate-700",
    ROLE_STAFF: "bg-indigo-50 text-indigo-700",
    ROLE_CUSTOMER: "bg-emerald-50 text-emerald-700",
  };

  return labelMap[role] ?? "bg-slate-100 text-slate-700";
}

type UserDraft = {
  userId: number;
  roles: string[];
  status: UserStatus;
};

export function UsersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [keyword, setKeyword] = useState("");
  const [roleName, setRoleName] = useState("");
  const [enabled, setEnabled] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortType] = useState<"asc" | "desc">("desc");
  const [result, setResult] = useState<PageResult<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UserDraft>({
    userId: 0,
    roles: ["ROLE_CUSTOMER"],
    status: "active",
  });

  useEffect(() => {
    if (!token) return;

    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await searchUsers(token, {
          keyword: keyword.trim() || undefined,
          roleNames: roleName ? [roleName] : undefined,
          enabled: enabled === "" ? null : enabled === "true" ? true : false,
          page,
          size,
          sortBy,
          sortType,
        });

        if (active) {
          setResult(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load users",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, [
    token,
    keyword,
    roleName,
    enabled,
    page,
    size,
    sortBy,
    sortType,
    refreshTick,
  ]);

  const reload = useCallback(() => {
    setRefreshTick((currentTick) => currentTick + 1);
  }, []);

  const openEdit = useCallback((user: AdminUser) => {
    setDraft({
      userId: user.id,
      roles: user.roles.length ? user.roles : ["ROLE_CUSTOMER"],
      status: user.isEnabled ? "active" : "inactive",
    });
    setModalOpen(true);
  }, []);

  const toggleStatus = useCallback(
    async (user: AdminUser) => {
      if (!token) return;

      await updateUserStatus(
        token,
        user.id,
        user.isEnabled ? "inactive" : "active",
      );
      reload();
    },
    [reload, token],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      await updateUserRole(token, {
        userId: draft.userId,
        roleNames: draft.roles,
      });
      await updateUserStatus(token, draft.userId, draft.status);
      setModalOpen(false);
      reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save user",
      );
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(
    () =>
      (result?.content ?? []).map((user) => ({
        id: String(user.id),
        name: (
          <div>
            <p className="font-semibold text-slate-950">
              {user.fullName || user.username}
            </p>
            <p className="text-xs text-slate-500">{user.email || "No email"}</p>
          </div>
        ),
        role: (
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(role)}`}
              >
                {role}
              </span>
            ))}
          </div>
        ),
        status: (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
          >
            {user.isEnabled ? "Active" : "Disabled"}
          </span>
        ),
        joinedAt: formatDateTime(user.createdAt),
        activity: formatDateTime(user.modifiedAt),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEdit(user)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PencilLine className="h-3.5 w-3.5" /> Sửa
            </button>
            <button
              type="button"
              onClick={() => void toggleStatus(user)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-3.5 w-3.5" />{" "}
              {user.isEnabled ? "Vô hiệu" : "Kích hoạt"}
            </button>
          </div>
        ),
      })),
    [openEdit, result, toggleStatus],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total users",
        value: formatNumber(result?.totalElements ?? 0),
        description: "Kết quả từ /admin/users",
      },
      {
        label: "Current page",
        value: `${(result?.pageable?.pageNumber ?? page) + 1}`,
        description: "Trang hiện tại",
      },
      {
        label: "Page size",
        value: formatNumber(result?.pageable?.pageSize ?? size),
        description: "Số bản ghi mỗi trang",
      },
      {
        label: "Active on page",
        value: formatNumber(
          (result?.content ?? []).filter((user) => user.isEnabled).length,
        ),
        description: "Tài khoản đang hoạt động trong trang",
      },
    ],
    [page, result, size],
  );

  const toolbar = (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
      <input
        value={keyword}
        onChange={(event) => {
          setPage(0);
          setKeyword(event.target.value);
        }}
        type="search"
        placeholder="Search username, email, full name..."
        className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
      <select
        value={roleName}
        onChange={(event) => {
          setPage(0);
          setRoleName(event.target.value);
        }}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        <option value="">All roles</option>
        <option value="ROLE_ADMIN">ROLE_ADMIN</option>
        <option value="ROLE_STAFF">ROLE_STAFF</option>
        <option value="ROLE_CUSTOMER">ROLE_CUSTOMER</option>
      </select>
      <select
        value={enabled}
        onChange={(event) => {
          setPage(0);
          setEnabled(event.target.value);
        }}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        <option value="">All status</option>
        <option value="true">Active</option>
        <option value="false">Disabled</option>
      </select>
      <select
        value={size}
        onChange={(event) => {
          setPage(0);
          setSize(Number(event.target.value));
        }}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        {[10, 20, 50].map((option) => (
          <option key={option} value={option}>
            {option} / page
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={reload}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" /> Refresh
      </button>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing page {(result?.pageable?.pageNumber ?? page) + 1} of{" "}
        {formatNumber(result?.totalPages ?? 0)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0 || loading}
          onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={Boolean(result?.last) || loading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const columns = [
    { key: "name", label: "User" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "joinedAt", label: "Joined" },
    { key: "activity", label: "Last active" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Quản lý Người dùng
          </p>
          <p className="text-sm text-slate-500">
            Dữ liệu được lấy trực tiếp từ /admin/users.
          </p>
        </div>
        <ShieldUser className="ml-auto h-5 w-5 text-indigo-500" />
      </div>

      <ManagementPage
        title="User Management"
        description="Theo dõi và điều phối tài khoản trong hệ thống."
        actionLabel="Mời user"
        metrics={metrics}
        columns={columns}
        rows={rows}
        toolbar={toolbar}
        footer={footer}
        loading={loading}
        error={error}
      />

      <Modal
        open={modalOpen}
        title="Edit user"
        description="Cập nhật role và trạng thái người dùng."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            User ID: {draft.userId}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Roles</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {roleOptions.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={draft.roles.includes(role)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        roles: event.target.checked
                          ? [...current.roles, role]
                          : current.roles.filter((item) => item !== role),
                      }))
                    }
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as UserStatus,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save user"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
