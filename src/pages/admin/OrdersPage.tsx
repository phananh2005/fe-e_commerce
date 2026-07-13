import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, RefreshCw, Truck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  searchOrders,
  updateOrderStatus,
  type PageResult,
  type StaffOrder,
  type OrderStatus,
} from "../../lib/adminApi";
import { formatCurrency, formatDateTime, formatNumber } from "../../lib/format";
import { translateError } from "../../lib/i18n";

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

export function OrdersPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortType] = useState<"asc" | "desc">("desc");
  const [result, setResult] = useState<PageResult<StaffOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const handleStatusUpdate = useCallback(async (orderId: number, status: OrderStatus) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, orderId, status);
      setRefreshTick((t) => t + 1);
    } catch (e) {
      setError(translateError(e));
    }
  }, [token, setError]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await searchOrders(token, {
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
              translateError(loadError),
            );
          }
        } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, [token, page, size, sortBy, sortType, refreshTick]);

  const rows = useMemo(
    () =>
      (result?.content ?? []).map((order) => ({
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
          >
            {order.status}
          </span>
        ),
        actions: (
          <div className="flex flex-wrap gap-2">
            {order.status === "PENDING" && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, "CONFIRMED")}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
              >
                Xác nhận
              </button>
            )}
            {order.status === "CONFIRMED" && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, "SHIPPING")}
                className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-600 hover:bg-cyan-100"
              >
                Giao hàng
              </button>
            )}
            {order.status === "SHIPPING" && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, "DELIVERED")}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
              >
                Hoàn tất
              </button>
            )}
            {["PENDING", "CONFIRMED"].includes(order.status) && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, "CANCELLED")}
                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                Hủy
              </button>
            )}
          </div>
        ),
        createdAt: formatDateTime(order.createdAt),
      })),
    [result, handleStatusUpdate],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Tổng đơn",
        value: formatNumber(result?.totalElements ?? 0),
        description: "Kết quả từ /management/search",
      },
      {
        label: "Trang hiện tại",
        value: `${(result?.pageable?.pageNumber ?? page) + 1}`,
        description: "API này bắt đầu từ 0",
      },
      {
        label: "Kích thước trang",
        value: formatNumber(result?.pageable?.pageSize ?? size),
        description: "Số bản ghi mỗi trang",
      },
      {
        label: "Delivered on page",
        value: formatNumber(
          (result?.content ?? []).filter(
            (order) => order.status === "DELIVERED",
          ).length,
        ),
        description: "Đơn giao thành công trong trang",
      },
    ],
    [page, result, size],
  );

  const toolbar = (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
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
        onClick={() => setRefreshTick((currentTick) => currentTick + 1)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" />
        Làm mới
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
          Trước
        </button>
        <button
          type="button"
          disabled={Boolean(result?.last) || loading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tiếp
        </button>
      </div>
    </div>
  );

  const columns = [
    { key: "order", label: "Order" },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount" },
    { key: "payment", label: "Payment" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Quản lí Order</p>
          <p className="text-sm text-slate-500">
            Dữ liệu được lấy trực tiếp từ /management/search.
          </p>
        </div>
        <Truck className="ml-auto h-5 w-5 text-slate-400" />
      </div>

      <ManagementPage
        title="Order Management"
        description="Quản lý vòng đời đơn hàng và thanh toán."
        actionLabel="Tạo order"
        metrics={metrics}
        columns={columns}
        rows={rows}
        toolbar={toolbar}
        footer={footer}
        loading={loading}
        error={error}
      />
    </div>
  );
}
