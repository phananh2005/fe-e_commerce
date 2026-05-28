import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getDashboardOverview,
  getOrderStatistics,
  getRevenueReport,
  type DashboardOverview,
  type OrderStatistics,
  type RevenueReport,
} from "../../lib/adminApi";
import { formatCurrency, formatDate, formatNumber } from "../../lib/format";

const dateRange = (() => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 5);

  return {
    fromDate: formatDate(fromDate.toISOString().slice(0, 10)),
    toDate: formatDate(toDate.toISOString().slice(0, 10)),
    fromDateValue: fromDate.toISOString().slice(0, 10),
    toDateValue: toDate.toISOString().slice(0, 10),
  };
})();

function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {delta}
      </p>
    </article>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardMetrics = useMemo(
    () => [
      {
        label: "Users",
        value: formatNumber(overview?.totalUsers),
        delta: `${formatNumber(orderStats?.totalOrders ?? 0)} orders in range`,
        icon: Users,
      },
      {
        label: "Products",
        value: formatNumber(overview?.totalProducts),
        delta: `${formatNumber(orderStats?.paidOrders ?? 0)} paid orders`,
        icon: Boxes,
      },
      {
        label: "Orders",
        value: formatNumber(orderStats?.totalOrders),
        delta: `${formatNumber(orderStats?.pendingOrders ?? 0)} pending`,
        icon: ShoppingCart,
      },
      {
        label: "Revenue",
        value: formatCurrency(revenueReport?.totalRevenue ?? 0, "VND"),
        delta: `${revenueReport?.groupBy ?? "MONTH"} report`,
        icon: CircleDollarSign,
      },
    ],
    [orderStats, overview, revenueReport],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardOverview, statistics, revenue] = await Promise.all([
          getDashboardOverview(token),
          getOrderStatistics(token, {
            fromDate: dateRange.fromDateValue,
            toDate: dateRange.toDateValue,
          }),
          getRevenueReport(token, {
            fromDate: dateRange.fromDateValue,
            toDate: dateRange.toDateValue,
            groupBy: "MONTH",
          }),
        ]);

        if (!isActive) {
          return;
        }

        setOverview(dashboardOverview);
        setOrderStats(statistics);
        setRevenueReport(revenue);
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard",
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
              <Sparkles className="h-4 w-4" />
              Dashboard
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Dữ liệu vận hành thật từ backend.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Tổng quan người dùng, sản phẩm, đơn hàng và doanh thu đang được
              lấy từ các endpoint thống kê của backend.
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Range: {dateRange.fromDate} - {dateRange.toDate}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-slate-300">Số liệu hiện tại</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatNumber(orderStats?.deliveredOrders ?? 0)} delivered
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <ArrowUpRight className="h-4 w-4" />
              {formatCurrency(orderStats?.totalRevenue ?? 0, "VND")}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Order status
              </h2>
              <p className="text-sm text-slate-500">
                Thống kê đơn hàng theo trạng thái.
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(orderStats?.statusStatistics ?? []).map((item) => (
              <div
                key={item.status}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{item.status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatNumber(item.count)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Fulfillment
                </h2>
                <p className="text-sm text-slate-500">
                  {formatNumber(orderStats?.deliveredOrders ?? 0)} delivered /{" "}
                  {formatNumber(orderStats?.totalOrders ?? 0)} total.
                </p>
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((orderStats?.deliveredOrders ?? 0) /
                      Math.max(orderStats?.totalOrders ?? 1, 1)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Đơn hàng đã xử lý được tính trực tiếp từ endpoint thống kê.
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Revenue report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {revenueReport?.groupBy ?? "MONTH"} · {dateRange.fromDate} -{" "}
              {dateRange.toDate}
            </p>
            <div className="mt-4 space-y-3">
              {(revenueReport?.items ?? []).slice(0, 4).map((item) => (
                <div
                  key={item.period}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.period}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(item.orders)} orders
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">
                    {formatCurrency(item.revenue, "VND")}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Overview metrics
            </h2>
            <p className="text-sm text-slate-500">
              Dữ liệu tổng hợp từ /admin/statistics/overview.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {loading ? "Loading..." : "Synced from backend"}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total users", value: formatNumber(overview?.totalUsers) },
            {
              label: "Total products",
              value: formatNumber(overview?.totalProducts),
            },
            {
              label: "Paid orders",
              value: formatNumber(orderStats?.paidOrders ?? 0),
            },
            {
              label: "Total revenue",
              value: formatCurrency(revenueReport?.totalRevenue ?? 0, "VND"),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
