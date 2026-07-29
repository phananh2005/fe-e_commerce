import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../lib/customerApi";
import type { OrderSummaryResponse } from "../../lib/customerApi";
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

export function OrdersPage() {
  const { session } = useAuth();
  const token = session?.tokens?.accessToken;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const TABS = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;
    (async () => {
      try {
        const data = await getMyOrders(token);
        if (active) setOrders(data);
      } catch (err) {
        if (active)
          setError(translateError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, navigate]);

  const filteredOrders = filterStatus === "ALL" 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-200 rounded w-24"></div>)}
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded-full w-24"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>
      
      {/* Tabs */}
      <div className="mt-6 flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              filterStatus === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <svg className="h-32 w-32 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Không có đơn hàng nào</h3>
          <p className="mt-2 text-sm text-slate-500 mb-6">Bạn chưa có đơn hàng nào trong trạng thái này.</p>
          <button onClick={() => navigate("/")} className="btn-primary">Tiếp tục mua sắm</button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderUuid}
              onClick={() => navigate(`/orders/${order.orderUuid}`)}
              className="cursor-pointer card p-5 transition hover:border-[var(--color-primary)]/50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Đơn hàng #{order.orderCode || order.orderUuid}
                  </p>
                  {order.createdAt && (
                    <p className="text-xs text-slate-400 mt-0.5 mb-1">
                      {formatDateTime(order.createdAt)}
                    </p>
                  )}
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(order.totalPrice, "VND")}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] || "bg-slate-100 text-slate-700"}`}
                  title={order.status}
                >
                  {translateOrderStatus(order.status)}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3"
                  >
                    {item.variantImageUrl && (
                      <img
                        src={item.variantImageUrl}
                        alt={item.productName}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.productName}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
