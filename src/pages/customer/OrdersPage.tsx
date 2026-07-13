import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../lib/customerApi";
import type { OrderSummaryResponse } from "../../lib/customerApi";
import { formatCurrency } from "../../lib/format";
import { translateError } from "../../lib/i18n";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-500">
        Đang tải đơn hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <p className="mt-8 text-slate-500">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => navigate(`/orders/${order.orderId}`)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Đơn hàng #{order.orderId}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(order.totalPrice, "VND")}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] || "bg-slate-100 text-slate-700"}`}
                >
                  {order.status}
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
