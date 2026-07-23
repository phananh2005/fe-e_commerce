import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const token = session?.tokens?.accessToken;

  const stateSelectedItems = location.state?.selectedItems as CartItem[] | undefined;

  const [cartItems, setCartItems] = useState<CartItem[]>(stateSelectedItems || []);
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

    if (stateSelectedItems) return; // If we already have selected items from state, don't fetch all

    let mounted = true;
    (async () => {
      const items = await customerApi.getCartItems(token);
      if (!mounted) return;
      setCartItems(Array.isArray(items) ? (items as CartItem[]) : []);
    })();

    return () => {
      mounted = false;
    };
  }, [navigate, status, token, stateSelectedItems]);

  useEffect(() => {
    if (!token || cartItems.length === 0) return;

    let mounted = true;
    (async () => {
      const preview = await customerApi.previewOrder(
        token,
        cartItems.map((it) => ({
          variantId: it.currentVariantId ?? 0,
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
          variantId: it.currentVariantId ?? 0,
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
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Địa chỉ nhận hàng</h2>
              <button
                className="text-sm text-[var(--color-primary)]"
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

          <section className="card p-4">
            <h2 className="font-semibold">Sản phẩm ({cartItems.length})</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {cartItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Không có sản phẩm nào
                </p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      {item.variantImageUrl ? (
                        <img
                          src={item.variantImageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Ảnh
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.productName}
                      </p>
                      {item.variantSkuCode && (
                        <p className="text-xs text-slate-500">
                          SKU: {item.variantSkuCode}
                        </p>
                      )}
                      {(item.color || item.storage) && (
                        <p className="text-xs text-slate-500">
                          {[item.color, item.storage].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        ₫{((item.variantPrice ?? 0) * (item.cartItemQuantity ?? 0)).toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-slate-500">
                        x{item.cartItemQuantity ?? 0}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="font-semibold">Phương thức vận chuyển</h2>
            <div className="mt-3 space-y-2">
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${selectedShipping === opt.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : ""}`}
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

          <section className="card p-4">
            <h2 className="font-semibold">Phương thức thanh toán</h2>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${paymentMethod === method.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : ""}`}
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
          <div className="card p-4">
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
              className="mt-4 btn-primary w-full px-4 py-3 text-sm"
            >
              {submitting ? "Đang đặt hàng..." : "Thanh toán"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
