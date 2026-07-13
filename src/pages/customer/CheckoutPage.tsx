import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as customerApi from "../../lib/customerApi";
import type { CartItem, OrderSummary } from "../../lib/cartTypes";

const SHIPPING_OPTIONS = [
  { id: "express", label: "Hỏa tốc", fee: 50000, eta: "1-2 ngày" },
  { id: "fast", label: "Nhanh", fee: 30000, eta: "2-4 ngày" },
  { id: "econ", label: "Tiết kiệm", fee: 15000, eta: "4-7 ngày" },
] as const;

const PAYMENT_METHODS = [
  { id: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { id: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
  { id: "MOMO", label: "Ví MoMo" },
  { id: "PAYPAL", label: "PayPal" },
] as const;

export default function CheckoutPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const token = session?.tokens?.accessToken;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  type ServerPreview = {
    fullName?: string;
    phoneNumber?: string;
    shippingAddress?: string;
    totalPrice?: number | string;
    shippingFee?: number | string;
  };

  const [serverPreview, setServerPreview] = useState<ServerPreview | null>(
    null,
  );
  const [selectedShipping, setSelectedShipping] = useState<
    (typeof SHIPPING_OPTIONS)[number]["id"]
  >(SHIPPING_OPTIONS[1].id);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["id"]>("COD");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "checking") return;
    if (status !== "authenticated" || !token) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    let mounted = true;
    (async () => {
      const items = await customerApi.getCartItems(token);
      if (!mounted) return;
      setCartItems(Array.isArray(items) ? (items as CartItem[]) : []);
    })();

    return () => {
      mounted = false;
    };
  }, [navigate, status, token]);

  useEffect(() => {
    if (!token || cartItems.length === 0) return;

    let mounted = true;
    (async () => {
      const preview = await customerApi.previewOrder(
        token,
        cartItems.map((it) => ({
          variantId: Number(it.currentVariantId ?? it.cartItemId),
          quantity: it.cartItemQuantity,
        })),
      );
      if (mounted) setServerPreview(preview);
    })();

    return () => {
      mounted = false;
    };
  }, [cartItems, token]);

  const itemsTotal = useMemo(
    () =>
      serverPreview?.totalPrice != null
        ? Number(serverPreview.totalPrice) -
          Number(serverPreview.shippingFee ?? 0)
        : cartItems.reduce(
            (sum, it) => sum + it.variantPrice * it.cartItemQuantity,
            0,
          ),
    [cartItems, serverPreview],
  );

  const shippingFee = useMemo(
    () =>
      serverPreview?.shippingFee != null
        ? Number(serverPreview.shippingFee)
        : (SHIPPING_OPTIONS.find((opt) => opt.id === selectedShipping)?.fee ??
          0),
    [selectedShipping, serverPreview],
  );

  const discount = useMemo(() => 0, []);

  const grandTotal = itemsTotal + shippingFee - discount;

  const orderSummary: OrderSummary = {
    itemsTotal,
    shippingFee,
    discount,
    grandTotal,
    totalQuantity: cartItems.reduce((sum, it) => sum + it.cartItemQuantity, 0),
  };

  const handleCheckout = async () => {
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await customerApi.checkout(token, {
        fullName: serverPreview?.fullName || "",
        phoneNumber: serverPreview?.phoneNumber || "",
        shippingAddress: serverPreview?.shippingAddress || "",
        paymentMethod,
        items: cartItems.map((it) => ({
          variantId: Number(it.currentVariantId ?? it.cartItemId),
          quantity: it.cartItemQuantity,
        })),
      });

      if (result !== null) {
        navigate("/orders");
        return;
      }

      window.alert("Đặt hàng thất bại. Vui lòng thử lại.");
    } catch {
      window.alert("Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-lg font-semibold">Thanh toán</h1>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Địa chỉ nhận hàng</h2>
              <button
                className="text-sm text-indigo-600"
                onClick={() => navigate("/account")}
              >
                Thay đổi
              </button>
            </div>
            <div className="mt-3 text-sm text-slate-700">
              {serverPreview?.fullName || "Chưa có thông tin"}
            </div>
            <div className="text-sm text-slate-500">
              {serverPreview?.phoneNumber || ""}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {serverPreview?.shippingAddress || "Vui lòng cập nhật địa chỉ"}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Phương thức vận chuyển</h2>
            <div className="mt-3 space-y-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${selectedShipping === opt.id ? "border-indigo-500" : ""}`}
                >
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-slate-500">{opt.eta}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      ₫{opt.fee.toLocaleString("vi-VN")}
                    </div>
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping === opt.id}
                      onChange={() => setSelectedShipping(opt.id)}
                    />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Phương thức thanh toán</h2>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${paymentMethod === method.id ? "border-indigo-500" : ""}`}
                >
                  <div>{method.label}</div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Tóm tắt đơn hàng</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                Tạm tính{" "}
                <span>₫{orderSummary.itemsTotal.toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex justify-between">
                Phí vận chuyển{" "}
                <span>₫{orderSummary.shippingFee.toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex justify-between">
                Giảm giá{" "}
                <span>-₫{orderSummary.discount.toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex justify-between font-semibold">
                Tổng thanh toán{" "}
                <span>₫{orderSummary.grandTotal.toLocaleString("vi-VN")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || cartItems.length === 0}
              className="mt-4 w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang đặt hàng..." : "Thanh toán"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
