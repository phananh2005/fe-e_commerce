import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, ReceiptText } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  getOrderDetail,
  searchOrders,
  updateOrderStatus,
  type PageResult,
  type StaffOrder,
  type OrderStatus,
} from "../../lib/adminApi";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { translateError, translateOrderStatus } from "../../lib/i18n";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-indigo-50 text-indigo-700",
    SHIPPING: "bg-cyan-50 text-cyan-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-rose-50 text-rose-700",
    RETURNED: "bg-slate-100 text-slate-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Giao thành công" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "RETURNED", label: "Trả hàng / Hoàn tiền" },
];

export function OrdersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<StaffOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Order detail modal state
  const [detailOrder, setDetailOrder] = useState<StaffOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (orderId: number) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const data = await getOrderDetail(token, orderId);
      setDetailOrder(data);
    } catch (e) {
      setError(translateError(e));
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  const handleStatusUpdate = useCallback(async (orderId: number, status: OrderStatus) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, orderId, status);
      setRefreshTick((t) => t + 1);
      // If detail modal is showing this order, refresh it
      if (detailOrder?.orderId === orderId) {
        const updated = await getOrderDetail(token, orderId);
        setDetailOrder(updated);
      }
    } catch (e) {
      setError(translateError(e));
    }
  }, [token, detailOrder?.orderId]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchOrders(token, {
          keyword: keyword.trim() || undefined,
          status: statusFilter || undefined,
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
  }, [token, keyword, statusFilter, page, size, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const rows = useMemo(() => (result?.content ?? []).map((order) => ({
    id: String(order.orderId),
    order: (
      <div>
        <p className="font-semibold text-slate-950">ORD-{order.orderId}</p>
        <p className="text-xs text-slate-500">User #{order.userId}</p>
      </div>
    ),
    customer: (
      <div>
        <p className="font-semibold text-slate-950">{order.fullName}</p>
        <p className="text-xs text-slate-500">{order.phoneNumber}</p>
      </div>
    ),
    amount: formatCurrency(order.totalPrice, "VND"),
    payment: order.paymentMethod,
    status: (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.status)}`}
        title={order.status}
      >
        {translateOrderStatus(order.status)}
      </span>
    ),
    actions: (
      <div className="flex flex-wrap gap-2">
        <button onClick={() => openDetail(order.orderId)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition" title="Xem chi tiết">
          <Eye className="inline-block h-3.5 w-3.5 mr-1" />Xem
        </button>
        {order.status === "PENDING" && <button onClick={() => handleStatusUpdate(order.orderId, "CONFIRMED")} className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition">Xác nhận</button>}
        {order.status === "CONFIRMED" && <button onClick={() => handleStatusUpdate(order.orderId, "SHIPPING")} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-600 hover:bg-cyan-100 transition">Giao hàng</button>}
        {order.status === "SHIPPING" && <button onClick={() => handleStatusUpdate(order.orderId, "DELIVERED")} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition">Hoàn tất</button>}
        {["PENDING", "CONFIRMED"].includes(order.status) && <button onClick={() => handleStatusUpdate(order.orderId, "CANCELLED")} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition">Hủy</button>}
      </div>
    ),
    createdAt: formatDateTime(order.createdAt),
  })), [result, handleStatusUpdate, openDetail]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Order Management", description: "Quản lý vòng đời đơn hàng và thanh toán.", icon: <ReceiptText className="h-5 w-5" /> }}
        searchInput={
          <input
            value={keyword}
            onChange={(e) => { setPage(0); setKeyword(e.target.value); }}
            type="search"
            placeholder="Tìm theo tên, SĐT, mã đơn..."
            className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
          />
        }
        filters={
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={size}
              onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            >
              {[10, 20, 50].map((o) => <option key={o} value={o}>{o} / page</option>)}
            </select>
          </div>
        }
        columns={[
          { key: "order", label: "Đơn hàng" },
          { key: "customer", label: "Khách hàng" },
          { key: "amount", label: "Giá trị" },
          { key: "payment", label: "Thanh toán" },
          { key: "status", label: "Trạng thái" },
          { key: "actions", label: "Hành động" },
          { key: "createdAt", label: "Ngày tạo" },
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

      {/* Order Detail Modal */}
      <Modal
        open={!!detailOrder || detailLoading}
        title={detailOrder ? `Chi tiết đơn hàng #${detailOrder.orderId}` : "Đang tải..."}
        description={detailOrder ? `Tạo lúc ${formatDateTime(detailOrder.createdAt)}` : undefined}
        onClose={() => setDetailOrder(null)}
      >
        {detailLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
          </div>
        )}
        {detailOrder && !detailLoading && (
          <div className="space-y-6">
            {/* Status & Payment */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(detailOrder.status)}`}>
                {translateOrderStatus(detailOrder.status)}
              </span>
              <span className="text-sm text-slate-500">
                {detailOrder.paymentMethod} · {detailOrder.isPaid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
              </span>
            </div>

            {/* Customer Info */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-700">Thông tin khách hàng</p>
              <p className="text-sm text-slate-600">{detailOrder.fullName} · {detailOrder.phoneNumber}</p>
              <p className="text-sm text-slate-500">{detailOrder.shippingAddress}</p>
            </div>

            {/* Price Summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phí ship</span>
                <span className="font-medium text-slate-700">{formatCurrency(detailOrder.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2">
                <span className="text-slate-700">Tổng cộng</span>
                <span className="text-[var(--color-primary)]">{formatCurrency(detailOrder.totalPrice)}</span>
              </div>
            </div>

            {/* Order Items — only show if order has items (via StaffOrder type, which may not include items) */}
            {(detailOrder as StaffOrder & { items?: Array<{ productName: string; skuCode: string; quantity: number; price: number; variantImageUrl?: string }> }).items && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Sản phẩm</p>
                {((detailOrder as StaffOrder & { items?: Array<{ productName: string; skuCode: string; quantity: number; price: number; variantImageUrl?: string }> }).items ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    {item.variantImageUrl && (
                      <img src={item.variantImageUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.skuCode} · x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Tạo: {formatDateTime(detailOrder.createdAt)} · Bởi: {detailOrder.createdBy ?? "-"}</p>
              <p>Cập nhật: {formatDateTime(detailOrder.modifiedAt)} · Bởi: {detailOrder.modifiedBy ?? "-"}</p>
              {detailOrder.paymentDate && <p>Thanh toán: {formatDateTime(detailOrder.paymentDate)}</p>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
