import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, ReceiptText, X, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { DateRangePicker } from "../../components/DateRangePicker";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  getOrderDetail,
  searchOrders,
  updateOrderStatus,
  type PageResult,
  type StaffOrder,
  type OrderStatus,
  type StaffOrderItem,
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

function OrderItemsList({ items }: { items: StaffOrderItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, 1);
  const hasMore = items.length > 1;

  return (
    <div className="flex flex-col gap-2">
      {displayItems.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {item.variantImageUrl ? (
            <img src={item.variantImageUrl} alt="" className="h-8 w-8 rounded-md object-cover flex-shrink-0 border border-slate-100" />
          ) : (
            <div className="h-8 w-8 rounded-md bg-slate-100 flex-shrink-0"></div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate" title={item.productName}>{item.productName}</p>
            <p className="text-[10px] text-slate-500">x{item.quantity} · {formatCurrency(item.price)}</p>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[var(--color-primary)] font-semibold hover:underline text-left mt-1"
        >
          {expanded ? "Thu gọn" : `+${items.length - 1} sản phẩm khác`}
        </button>
      )}
    </div>
  );
}

export function OrdersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createdFromDate, setCreatedFromDate] = useState("");
  const [createdToDate, setCreatedToDate] = useState("");
  const [userIdFilter, setUserIdFilter] = useState(searchParams.get("userId") || "");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("modifiedAt");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<StaffOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cancel/Return modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelOrderStatus, setCancelOrderStatus] = useState<OrderStatus>("CANCELLED");
  const [cancelReason, setCancelReason] = useState("");

  // Order detail modal state
  const [detailOrder, setDetailOrder] = useState<StaffOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | "CANCELLED_MODAL" | null>(null);

  const openDetail = useCallback(async (orderId: number) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const data = await getOrderDetail(token, orderId);
      setDetailOrder(data);
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setDetailLoading(false);
    }
  }, [token, toast]);

  const handleStatusUpdate = useCallback(async (orderId: number, status: OrderStatus, reason?: string) => {
    if (!token) return;
    if ((status === "CANCELLED" || status === "RETURNED") && !reason) {
      setCancelOrderId(orderId);
      setCancelOrderStatus(status);
      setCancelReason("");
      setCancelModalOpen(true);
      return;
    }
    setUpdatingStatus(reason ? "CANCELLED_MODAL" : status);
    try {
      await updateOrderStatus(token, orderId, status, reason);
      toast.show("Cập nhật trạng thái đơn hàng thành công");
      setCancelModalOpen(false);
      setCancelOrderId(null);
      setRefreshTick((t) => t + 1);
      // If detail modal is showing this order, refresh it
      if (detailOrder?.orderId === orderId) {
        const updated = await getOrderDetail(token, orderId);
        setDetailOrder(updated);
      }
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setUpdatingStatus(null);
    }
  }, [token, detailOrder, toast]);

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
    setOrderCode("");
    setStatusFilter("");
    setCreatedFromDate("");
    setCreatedToDate("");
    setUserIdFilter("");
    setPage(0);
    setSortBy("modifiedAt");
    setSortType("desc");
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await searchOrders(token, {
          orderCode: orderCode.trim() || undefined,
          status: statusFilter || undefined,
          createdFromDate: createdFromDate ? (createdFromDate.length === 16 ? `${createdFromDate}:00` : createdFromDate) : undefined,
          createdToDate: createdToDate ? (createdToDate.length === 16 ? `${createdToDate}:00` : createdToDate) : undefined,
          userId: userIdFilter && !isNaN(parseInt(userIdFilter, 10)) ? parseInt(userIdFilter, 10) : undefined,
          page,
          size,
          sortBy,
          sortType,
        });
        if (active) setResult(data);
      } catch (e) {
        if (active) toast.show(translateError(e), "error");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, orderCode, statusFilter, createdFromDate, createdToDate, userIdFilter, page, size, sortBy, sortType, refreshTick, toast]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const rows = useMemo(() => (result?.content ?? []).map((order) => {
    const currentStatus = (order as any).orderStatus || order.status || "";
    return {
      id: String(order.orderId),
      order: (
        <div>
          <p className="font-semibold text-slate-950">ORD-{order.orderId}</p>
          <p className="text-xs text-slate-500">{order.username ?? order.userId}</p>
        </div>
      ),
      products: <OrderItemsList items={order.items ?? []} />,
      totalPrice: <span className="font-semibold text-[var(--color-primary)]">{formatCurrency(order.totalPrice)}</span>,
      status: (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(currentStatus)}`}
          title={currentStatus}
        >
          {translateOrderStatus(currentStatus)}
        </span>
      ),
      actions: (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openDetail(order.orderId)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
            <Eye className="h-3.5 w-3.5" /> Chi tiết
          </button>
        </div>
      ),
      createdAt: order.createdAt ? formatDateTime(order.createdAt) : "-",
      modifiedAt: order.modifiedAt ? formatDateTime(order.modifiedAt) : "-",
    };
  }), [result, openDetail]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Order Management", description: "Quản lý vòng đời đơn hàng và thanh toán.", icon: <ReceiptText className="h-5 w-5" /> }}
        searchInput={
          <div className="w-full space-y-5">
            <div className="overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
              <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl w-fit border border-slate-200/50">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPage(0); setStatusFilter(opt.value); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      statusFilter === opt.value
                        ? "bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-4 items-center">
              <input
                value={orderCode}
                onChange={(e) => { setPage(0); setOrderCode(e.target.value); }}
                type="search"
                placeholder="Mã đơn hàng"
                className="w-full lg:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
              <input
                value={userIdFilter}
                onChange={(e) => { setPage(0); setUserIdFilter(e.target.value); }}
                type="text"
                placeholder="ID Khách hàng"
                className="w-full lg:w-48 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
              <div className="w-full lg:w-72">
                <DateRangePicker
                  startDate={createdFromDate}
                  endDate={createdToDate}
                  placeholder="Ngày đặt đơn"
                  onChange={(start, end) => {
                    setPage(0);
                    setCreatedFromDate(start);
                    setCreatedToDate(end);
                  }}
                />
              </div>
            
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
          { key: "order", label: "Đơn hàng", sortable: true, sortByField: "id" },
          { key: "products", label: "Sản phẩm" },
          { key: "totalPrice", label: "Tổng tiền", sortable: true },
          { key: "status", label: "Trạng thái", sortable: true },
          { key: "createdAt", label: "Ngày đặt", sortable: true },
          { key: "modifiedAt", label: "Cập nhật", sortable: true },
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
        onPageChange={setPage}
      />

      {/* Order Detail Modal */}
      <Modal
        open={!!detailOrder || detailLoading}
        title={detailOrder ? `Chi tiết đơn hàng ${detailOrder.orderCode ? '#' + detailOrder.orderCode : '#' + detailOrder.orderId}` : "Đang tải..."}
        description={detailOrder?.createdAt ? `Tạo lúc ${formatDateTime(detailOrder.createdAt as string)}` : undefined}
        onClose={() => setDetailOrder(null)}
        className="max-w-5xl"
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
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(detailOrder.status ?? "")}`}>
                {translateOrderStatus(detailOrder.status ?? "")}
              </span>
              <span className="text-sm text-slate-500">
                {detailOrder.paymentMethod} · {detailOrder.isPaid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
              </span>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-700">Thông tin khách hàng</p>
                <p className="text-sm text-slate-600">ID Khách hàng: {detailOrder.userId}</p>
                {detailOrder.username && <p className="text-sm text-slate-600">Tài khoản: {detailOrder.username}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-700">Thông tin nhận hàng</p>
                <p className="text-sm text-slate-600">{detailOrder.addressInfo?.fullName || detailOrder.fullName} · {detailOrder.addressInfo?.phoneNumber || detailOrder.phoneNumber}</p>
                <p className="text-sm text-slate-500">{detailOrder.addressInfo?.shippingAddress || detailOrder.shippingAddress}</p>
              </div>
            </div>

            {detailOrder.items && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Sản phẩm</p>
                {detailOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    {item.variantImageUrl ? (
                      <img src={item.variantImageUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate" title={item.productName}>{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.skuCode} · x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Price Summary */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phí ship</span>
                <span className="font-medium text-slate-700">{formatCurrency(detailOrder.shippingFee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2">
                <span className="text-slate-700">Tổng cộng</span>
                <span className="text-[var(--color-primary)]">{formatCurrency(detailOrder.totalPrice)}</span>
              </div>
            </div>
            
            {detailOrder.cancellationReason && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {detailOrder.status === "CANCELLED" ? "Lý do hủy đơn hàng" : "Lý do trả hàng"}
                </p>
                <p className="text-sm text-slate-600">{detailOrder.cancellationReason}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Tạo: {detailOrder.createdAt ? formatDateTime(detailOrder.createdAt as string) : "-"} · Bởi: {detailOrder.createdBy ?? "-"}</p>
              <p>Cập nhật: {detailOrder.modifiedAt ? formatDateTime(detailOrder.modifiedAt as string) : "-"} · Bởi: {detailOrder.modifiedBy ?? "-"}</p>
              {detailOrder.paymentDate && <p>Thanh toán: {formatDateTime(detailOrder.paymentDate)}</p>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setDetailOrder(null)} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Đóng</button>
              {detailOrder.status === "PENDING" && <button disabled={updatingStatus === "CONFIRMED"} onClick={() => handleStatusUpdate(detailOrder.orderId, "CONFIRMED")} className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary)]/90 transition disabled:opacity-50">{updatingStatus === "CONFIRMED" && <RefreshCw className="h-4 w-4 animate-spin" />} Xác nhận đơn hàng</button>}
              {detailOrder.status === "CONFIRMED" && <button disabled={updatingStatus === "SHIPPING"} onClick={() => handleStatusUpdate(detailOrder.orderId, "SHIPPING")} className="flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 transition disabled:opacity-50">{updatingStatus === "SHIPPING" && <RefreshCw className="h-4 w-4 animate-spin" />} Giao hàng</button>}
              {detailOrder.status === "SHIPPING" && <button disabled={updatingStatus === "DELIVERED"} onClick={() => handleStatusUpdate(detailOrder.orderId, "DELIVERED")} className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50">{updatingStatus === "DELIVERED" && <RefreshCw className="h-4 w-4 animate-spin" />} Hoàn tất giao hàng</button>}
              {["PENDING", "CONFIRMED"].includes(detailOrder.status ?? "") && <button disabled={updatingStatus === "CANCELLED"} onClick={() => handleStatusUpdate(detailOrder.orderId, "CANCELLED")} className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50">{updatingStatus === "CANCELLED" && <RefreshCw className="h-4 w-4 animate-spin" />} Hủy đơn hàng</button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Reason Modal */}
      <Modal
        open={cancelModalOpen}
        title={cancelOrderStatus === "RETURNED" ? "Xác nhận trả hàng" : "Xác nhận hủy đơn hàng"}
        description={cancelOrderStatus === "RETURNED" ? "Vui lòng nhập lý do trả hàng (bắt buộc)." : "Vui lòng nhập lý do hủy đơn hàng (bắt buộc)."}
        onClose={() => setCancelModalOpen(false)}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            rows={3}
            placeholder={cancelOrderStatus === "RETURNED" ? "Nhập lý do trả hàng..." : "Nhập lý do hủy đơn hàng..."}
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Quay lại
            </button>
            <button
              disabled={!cancelReason.trim() || updatingStatus === "CANCELLED_MODAL"}
              onClick={() => {
                if (cancelOrderId) {
                  void handleStatusUpdate(cancelOrderId, cancelOrderStatus, cancelReason.trim());
                }
              }}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
            >
              {updatingStatus === "CANCELLED_MODAL" && <RefreshCw className="h-4 w-4 animate-spin" />}
              Xác nhận {cancelOrderStatus === "RETURNED" ? "trả hàng" : "hủy"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
