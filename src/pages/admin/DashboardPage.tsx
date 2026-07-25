import { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  XCircle,
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
import { formatCurrency, formatNumber, formatPercent } from "../../lib/format";

type Tab = "overview" | "orders" | "revenue";
const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Tổng quan", icon: BarChart3 },
  { id: "orders",   label: "Đơn hàng",   icon: ShoppingCart },
  { id: "revenue",  label: "Doanh thu",  icon: CircleDollarSign },
];

type DateFilter = "6_MONTHS" | "THIS_MONTH" | "THIS_YEAR" | "LAST_YEAR";
const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "6_MONTHS", label: "6 tháng gần đây" },
  { value: "THIS_MONTH", label: "Tháng này" },
  { value: "THIS_YEAR", label: "Năm nay" },
  { value: "LAST_YEAR", label: "Năm ngoái" },
];

function getDateRange(filter: DateFilter) {
  const today = new Date();
  let fromDate = new Date();
  let toDate = new Date();

  if (filter === "6_MONTHS") {
    fromDate.setMonth(today.getMonth() - 5);
  } else if (filter === "THIS_MONTH") {
    fromDate.setDate(1);
  } else if (filter === "THIS_YEAR") {
    fromDate.setMonth(0, 1);
  } else if (filter === "LAST_YEAR") {
    fromDate = new Date(today.getFullYear() - 1, 0, 1);
    toDate = new Date(today.getFullYear() - 1, 11, 31);
  }

  const from = fromDate.toISOString().slice(0, 10);
  const to = toDate.toISOString().slice(0, 10);
  const label = fromDate.toLocaleDateString("vi-VN") + " → " + toDate.toLocaleDateString("vi-VN");
  
  return { from, to, label };
}

function formatPeriod(period: string, groupBy: string) {
  if (!period) return period;
  if (groupBy === "DAY") {
    const parts = period.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (groupBy === "MONTH") {
    const parts = period.split("-");
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  }
  if (groupBy === "QUARTER") {
    const parts = period.split("-");
    if (parts.length === 2) return `${parts[1].replace('Q', 'Quý ')}, ${parts[0]}`;
  }
  return period;
}

function StatCard({ label, value, sub, icon: Icon, accent = "primary" }: {
  label: string; value: string; sub?: string;
  icon: typeof Users; accent?: "primary" | "emerald" | "amber" | "rose" | "sky" | "violet";
}) {
  const colors: Record<string, string> = {
    primary: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    rose:    "bg-rose-50 text-rose-600",
    sky:     "bg-sky-50 text-sky-600",
    violet:  "bg-violet-50 text-violet-600",
  };
  return (
    <article className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
    </article>
  );
}

function ProgressBar({ value, max, color = "emerald" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-600",
    amber:   "from-amber-400 to-amber-500",
    rose:    "from-rose-400 to-rose-500",
    sky:     "from-sky-400 to-sky-500",
    violet:  "from-violet-400 to-violet-500",
    indigo:  "from-indigo-400 to-indigo-600",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[color] ?? colors.emerald} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// === TAB 1: TỔNG QUAN ===
function OverviewSection({ overview, orders, revenue, rangeLabel }: {
  overview: DashboardOverview | null;
  orders: OrderStatistics | null;
  revenue: RevenueReport | null;
  rangeLabel: string;
}) {
  const deliverRate = orders && orders.totalOrders > 0
    ? (orders.deliveredOrders / orders.totalOrders) * 100 : 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Người dùng" value={formatNumber(overview?.totalUsers)} sub="Tổng tài khoản" icon={Users} accent="primary" />
        <StatCard label="Sản phẩm" value={formatNumber(overview?.totalProducts)} sub="Đang quản lý" icon={Boxes} accent="violet" />
        <StatCard label="Tổng đơn hàng" value={formatNumber(orders?.totalOrders)} sub={`Từ ${rangeLabel}`} icon={ShoppingCart} accent="sky" />
        <StatCard label="Doanh thu" value={formatCurrency(revenue?.totalRevenue ?? 0, "VND")} sub={`${formatNumber(revenue?.paidOrders)} đơn đã thanh toán`} icon={CircleDollarSign} accent="emerald" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <article className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Tỷ lệ hoàn thành</h3>
              <p className="text-xs text-slate-400">Đơn đã giao / Tổng đơn</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-emerald-600">{formatPercent(deliverRate)}</span>
          </div>
          <ProgressBar value={orders?.deliveredOrders ?? 0} max={orders?.totalOrders ?? 1} color="emerald" />
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { label: "Đã giao",        value: orders?.deliveredOrders ?? 0, color: "text-emerald-600" },
              { label: "Đã thanh toán",  value: orders?.paidOrders ?? 0, color: "text-sky-600" },
              { label: "Đang xử lý",     value: (orders?.confirmedOrders ?? 0) + (orders?.shippingOrders ?? 0), color: "text-amber-600" },
              { label: "Huỷ / Hoàn",      value: (orders?.cancelledOrders ?? 0) + (orders?.returnedOrders ?? 0), color: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className={`mt-1 text-lg font-bold ${item.color}`}>{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Xu hướng doanh thu</h3>
              <p className="text-xs text-slate-400">Theo {
                revenue?.groupBy === "DAY" ? "Ngày" :
                revenue?.groupBy === "QUARTER" ? "Quý" :
                revenue?.groupBy === "YEAR" ? "Năm" : "Tháng"
              }</p>
            </div>
          </div>
          <div className="space-y-2">
            {(revenue?.items ?? []).slice(-4).reverse().map((item) => {
              const maxRev = Math.max(...(revenue?.items ?? []).map((i) => i.revenue), 1);
              return (
                <div key={item.period} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">{formatPeriod(item.period, revenue?.groupBy ?? "MONTH")}</span>
                    <span className="text-slate-900 font-semibold">{formatCurrency(item.revenue, "VND")}</span>
                  </div>
                  <ProgressBar value={item.revenue} max={maxRev} color="violet" />
                </div>
              );
            })}
            {(revenue?.items ?? []).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

// === TAB 2: ĐỚN HÀNG ===
function OrdersSection({ orders }: { orders: OrderStatistics | null }) {
  const statusConfig: Record<string, { label: string; color: string; accent: string; barColor: string; icon: typeof Clock }> = {
    PENDING:   { label: "Chờ xác nhận", color: "text-amber-700",  accent: "bg-amber-50",  barColor: "amber",  icon: Clock },
    CONFIRMED: { label: "Đã xác nhận",  color: "text-sky-700",    accent: "bg-sky-50",    barColor: "sky",    icon: CheckCircle2 },
    SHIPPING:  { label: "Đang giao",    color: "text-violet-700", accent: "bg-violet-50", barColor: "violet", icon: Truck },
    DELIVERED: { label: "Đã giao",      color: "text-emerald-700",accent: "bg-emerald-50",barColor: "emerald",icon: PackageCheck },
    CANCELLED: { label: "Đã huỷ",       color: "text-rose-700",   accent: "bg-rose-50",   barColor: "rose",   icon: XCircle },
    RETURNED:  { label: "Hoàn hàng",    color: "text-orange-700", accent: "bg-orange-50", barColor: "rose",   icon: RotateCcw },
  };
  const summaryFields = [
    { label: "Tổng đơn",      value: orders?.totalOrders,     accent: "sky" as const,     icon: ShoppingCart },
    { label: "Đã thanh toán",  value: orders?.paidOrders,      accent: "emerald" as const, icon: CircleDollarSign },
    { label: "Đang chờ",       value: orders?.pendingOrders,   accent: "amber" as const,   icon: Clock },
    { label: "Đã xác nhận",    value: orders?.confirmedOrders, accent: "primary" as const, icon: CheckCircle2 },
    { label: "Đang giao",      value: orders?.shippingOrders,  accent: "violet" as const,  icon: Truck },
    { label: "Đã giao",        value: orders?.deliveredOrders, accent: "emerald" as const, icon: PackageCheck },
    { label: "Đã huỷ",         value: orders?.cancelledOrders, accent: "rose" as const,    icon: XCircle },
    { label: "Hoàn hàng",      value: orders?.returnedOrders,  accent: "rose" as const,    icon: RotateCcw },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryFields.slice(0, 4).map((f) => (
          <StatCard key={f.label} label={f.label} value={formatNumber(f.value)} icon={f.icon} accent={f.accent} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryFields.slice(4).map((f) => (
          <StatCard key={f.label} label={f.label} value={formatNumber(f.value)} icon={f.icon} accent={f.accent} />
        ))}
      </div>
      <article className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Chi tiết theo trạng thái</h3>
        <div className="space-y-3">
          {(orders?.statusStatistics ?? []).length > 0
            ? (orders?.statusStatistics ?? []).map((item) => {
                const cfg = statusConfig[item.status] ?? { label: item.status, color: "text-slate-700", accent: "bg-slate-50", barColor: "sky", icon: ShoppingCart };
                const Icon = cfg.icon;
                const pct = (orders?.totalOrders ?? 0) > 0 ? (item.count / (orders?.totalOrders ?? 1)) * 100 : 0;
                return (
                  <div key={item.status} className={`flex items-center gap-4 rounded-2xl ${cfg.accent} px-4 py-3`}>
                    <Icon className={`h-4 w-4 ${cfg.color} shrink-0`} />
                    <span className={`text-sm font-medium w-36 ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex-1">
                      <ProgressBar value={item.count} max={orders?.totalOrders ?? 1} color={cfg.barColor} />
                    </div>
                    <span className={`text-sm font-bold w-16 text-right ${cfg.color}`}>{formatNumber(item.count)}</span>
                    <span className="text-xs text-slate-400 w-12 text-right">{formatPercent(pct)}</span>
                  </div>
                );
              })
            : <p className="text-sm text-slate-400 py-6 text-center">Chưa có dữ liệu thống kê trạng thái</p>
          }
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
          <span className="text-sm font-medium">Tổng doanh thu (đơn đã thanh toán)</span>
          <span className="text-lg font-bold">{formatCurrency(orders?.totalRevenue ?? 0, "VND")}</span>
        </div>
      </article>
    </div>
  );
}

// === TAB 3: DOANH THU ===
function RevenueSection({
  revenue,
  rangeLabel,
  onGroupByChange,
}: {
  revenue: RevenueReport | null;
  rangeLabel: string;
  onGroupByChange: (g: "DAY" | "MONTH" | "QUARTER" | "YEAR") => void;
}) {
  const groupOptions: Array<{ value: "DAY" | "MONTH" | "QUARTER" | "YEAR"; label: string }> = [
    { value: "DAY",     label: "Ngày" },
    { value: "MONTH",   label: "Tháng" },
    { value: "QUARTER", label: "Quý" },
    { value: "YEAR",    label: "Năm" },
  ];
  const maxRevenue = Math.max(...(revenue?.items ?? []).map((i) => i.revenue), 1);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(revenue?.totalRevenue ?? 0, "VND")}
          sub={rangeLabel}
          icon={CircleDollarSign}
          accent="emerald"
        />
        <StatCard
          label="Tổng đơn hàng"
          value={formatNumber(revenue?.totalOrders)}
          sub="Trong kỳ"
          icon={ShoppingCart}
          accent="sky"
        />
        <StatCard
          label="Đơn đã thanh toán"
          value={formatNumber(revenue?.paidOrders)}
          sub={
            revenue && revenue.totalOrders > 0
              ? `${formatPercent((revenue.paidOrders / revenue.totalOrders) * 100)} tỷ lệ`
              : "-"
          }
          icon={CheckCircle2}
          accent="primary"
        />
      </div>
      <article className="card p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Biểu đồ doanh thu</h3>
            <p className="text-xs text-slate-400">Nhóm theo: {groupOptions.find(o => o.value === (revenue?.groupBy ?? "MONTH"))?.label}</p>
          </div>
          <div className="flex gap-2">
            {groupOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onGroupByChange(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  revenue?.groupBy === opt.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 min-w-max" style={{ minHeight: 180 }}>
            {(revenue?.items ?? []).map((item) => {
              const h = maxRevenue > 0 ? (item.revenue / maxRevenue) * 160 : 4;
              return (
                <div key={item.period} className="flex flex-col items-center gap-1 group" style={{ minWidth: 52 }}>
                  <div className="relative flex flex-col items-center">
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
                        <p className="font-semibold">{formatPeriod(item.period, revenue?.groupBy ?? "MONTH")}</p>
                        <p>{formatCurrency(item.revenue, "VND")}</p>
                        <p className="text-slate-300">{formatNumber(item.orders)} đơn</p>
                        <p className="text-slate-300">{formatNumber(item.paidOrders)} đã TT</p>
                      </div>
                      <div className="h-2 w-2 rotate-45 bg-slate-900 -mt-1" />
                    </div>
                    <div
                      className="w-10 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 cursor-pointer transition-all duration-500"
                      style={{ height: Math.max(h, 4) }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">{formatPeriod(item.period, revenue?.groupBy ?? "MONTH")}</span>
                </div>
              );
            })}
            {(revenue?.items ?? []).length === 0 && (
              <p className="text-sm text-slate-400 py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Kỳ</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Tổng đơn</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Đã TT</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Doanh thu</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">% Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(revenue?.items ?? []).map((item) => {
                const pct = revenue && revenue.totalRevenue > 0
                  ? (item.revenue / revenue.totalRevenue) * 100 : 0;
                return (
                  <tr key={item.period} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{formatPeriod(item.period, revenue?.groupBy ?? "MONTH")}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(item.orders)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(item.paidOrders)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.revenue, "VND")}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatPercent(pct)}</td>
                  </tr>
                );
              })}
              {(revenue?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

// === MAIN ===
export function DashboardPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  const [dateFilter, setDateFilter] = useState<DateFilter>("6_MONTHS");
  const [groupBy, setGroupBy] = useState<"DAY" | "MONTH" | "QUARTER" | "YEAR">("MONTH");
  
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  // Handle default groupBy based on filter
  useEffect(() => {
    if (dateFilter === "THIS_MONTH") setGroupBy("DAY");
    else if (dateFilter === "LAST_YEAR" || dateFilter === "THIS_YEAR") setGroupBy("MONTH");
  }, [dateFilter]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        const [ov, os, rr] = await Promise.all([
          overview === null ? getDashboardOverview(token) : Promise.resolve(overview),
          getOrderStatistics(token, { fromDate: range.from, toDate: range.to }),
          getRevenueReport(token, { fromDate: range.from, toDate: range.to, groupBy }),
        ]);
        if (!active) return;
        setOverview(ov);
        setOrderStats(os);
        setRevenueReport(rr);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range.from, range.to, groupBy]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h1>
          <p className="mt-1 text-sm text-slate-500">Dữ liệu thống kê · {range.label}</p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:ring-2 focus:ring-indigo-600/20"
        >
          {DATE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </header>

      <nav className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {activeTab === "overview" && (
            <OverviewSection overview={overview} orders={orderStats} revenue={revenueReport} rangeLabel={range.label} />
          )}
          {activeTab === "orders" && <OrdersSection orders={orderStats} />}
          {activeTab === "revenue" && (
            <RevenueSection revenue={revenueReport} onGroupByChange={setGroupBy} rangeLabel={range.label} />
          )}
        </>
      )}
    </div>
  );
}
