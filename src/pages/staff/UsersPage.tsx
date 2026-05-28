import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldUser, UserCog } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getStaffCustomerInfo,
  type StaffCustomerInfo,
} from "../../lib/adminApi";
import { formatDateTime } from "../../lib/format";

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
  const [customerId, setCustomerId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [result, setResult] = useState<StaffCustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!token || !submittedId) {
      return;
    }

    let active = true;

    const loadCustomer = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getStaffCustomerInfo(token, Number(submittedId));
        if (active) {
          setResult(data);
        }
      } catch (loadError) {
        if (active) {
          setResult(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load customer info",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCustomer();

    return () => {
      active = false;
    };
  }, [submittedId, token, refreshTick]);

  const roleChips = useMemo(
    () =>
      (result?.roles ?? []).map((role) => (
        <span
          key={role}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(role)}`}
        >
          {role}
        </span>
      )),
    [result?.roles],
  );

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = customerId.trim();

    if (!normalized) {
      setError("Nhập customer ID để tra cứu");
      return;
    }

    setSubmittedId(normalized);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Quản lí User</p>
          <p className="text-sm text-slate-500">
            Staff chỉ xem được thông tin khách hàng theo ID.
          </p>
        </div>
        <ShieldUser className="ml-auto h-5 w-5 text-indigo-500" />
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
              Staff user lookup
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Tra cứu thông tin khách hàng
            </h1>
            <p className="text-sm text-slate-500">
              Sử dụng API /staff/users/customer/info/{"{id}"} để xem thông tin
              chi tiết.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              type="number"
              min="1"
              placeholder="Customer ID"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Search className="h-4 w-4" />
              Tra cứu
            </button>
          </form>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Customer #{result.id}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {result.fullName || result.username}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  @{result.username}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${result.isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
              >
                {result.isEnabled ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {result.email || "-"}
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {result.phoneNumber || "-"}
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2 xl:col-span-1">
                <p className="text-sm text-slate-500">Address</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {result.address || "-"}
                </p>
              </article>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Roles</p>
              <div className="mt-3 flex flex-wrap gap-2">{roleChips}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Latest status</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {result.isEnabled ? "Active" : "Disabled"}
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Lookup time</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatDateTime(new Date().toISOString())}
                </p>
              </article>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Nhập customer ID và bấm tra cứu để xem thông tin.
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setRefreshTick((currentTick) => currentTick + 1)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" /> Refresh lookup
      </button>
    </div>
  );
}
