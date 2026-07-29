import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrderDetail } from "../../lib/customerApi";
import { ApiError } from "../../lib/api";
import type { OrderDetailResponse } from "../../lib/customerApi";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { translateError, translateOrderStatus } from "../../lib/i18n";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-indigo-50 text-indigo-700",
  SHIPPING: "bg-cyan-50 text-cyan-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  RETURNED: "bg-slate-100 text-slate-700",
};

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Đặt hàng thành công" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Giao thành công" },
];

function getTimelineIndex(status: string) {
  if (status === "CANCELLED" || status === "RETURNED") return -1;
  return TIMELINE_STEPS.findIndex(s => s.key === status);
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const token = session?.tokens?.accessToken;
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    let active = true;
    (async () => {
      try {
        const data = await getOrderDetail(token, String(id));
        if (active) setOrder(data);
      } catch (err) {
        if (active) {
          if (err instanceof ApiError && err.status === 403) {
            setError("Bạn không có quyền xem đơn hàng này");
          } else {
            setError(translateError(err));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token, id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-8"></div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-5 h-64 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="space-y-6">
            <div className="card p-5 h-48 bg-slate-200 rounded-xl"></div>
            <div className="card p-5 h-48 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="rounded-lg border border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 p-4 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-500">
        Không tìm thấy đơn hàng.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate("/orders")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        ← Quay lại danh sách đơn
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Đơn hàng #{order.orderCode || order.orderUuid}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đặt lúc {order.createdAt ? formatDateTime(order.createdAt) : "-"}
            {order.modifiedAt && ` · Cập nhật lúc ${formatDateTime(order.modifiedAt)}`}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[order.status] || "bg-slate-100 text-slate-700"}`}
          title={order.status}
        >
          {translateOrderStatus(order.status)}
        </span>
      </div>

      {(order.status === "CANCELLED" || order.status === "RETURNED") && order.cancellationReason && (
        <div className="mt-6 card p-5">
          <h2 className="font-semibold text-slate-900">
            {order.status === "CANCELLED" ? "Lý do hủy đơn hàng" : "Lý do trả hàng"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{order.cancellationReason}</p>
        </div>
      )}

      {/* Timeline */}
      {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
        <div className="mt-6 card p-6">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-100"></div>
            <div 
              className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${(Math.max(0, getTimelineIndex(order.status)) / (TIMELINE_STEPS.length - 1)) * 100}%` }}
            ></div>
            
            {TIMELINE_STEPS.map((step, idx) => {
              const active = idx <= getTimelineIndex(order.status);
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-xs font-bold transition-colors ${
                    active 
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]" 
                      : "border-slate-200 text-slate-300"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className={`mt-2 text-xs font-medium ${active ? "text-slate-900" : "text-slate-400"}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Sản phẩm</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0"
                >
                  {item.variantImageUrl && (
                    <img
                      src={item.variantImageUrl}
                      alt={item.productName}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      SKU: {item.skuCode}
                    </p>
                    <p className="text-xs text-slate-500">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.price, "VND")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h3 className="font-semibold text-slate-900">Thông tin giao hàng</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium">Người nhận:</span> {order.addressInfo?.fullName || "-"}
              </p>
              <p>
                <span className="font-medium">SĐT:</span> {order.addressInfo?.phoneNumber || "-"}
              </p>
              <p>
                <span className="font-medium">Địa chỉ:</span> {order.addressInfo?.shippingAddress || "-"}
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-semibold text-slate-900">Thanh toán</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium">Trạng thái:</span>{" "}
                {order.isPaid ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
              </p>
              {order.paymentDate && (
                <p>
                  <span className="font-medium">Ngày thanh toán:</span>{" "}
                  {formatDateTime(order.paymentDate)}
                </p>
              )}
              <p>
                <span className="font-medium">Phương thức:</span> {order.paymentMethod}
              </p>
              <p>
                <span className="font-medium">Phí vận chuyển:</span>{" "}
                {formatCurrency(order.shippingFee, "VND")}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.totalPrice, "VND")}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
