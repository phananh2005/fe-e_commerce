import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as customerApi from "../../lib/customerApi";
import type { CartItem, ShopGroup } from "../../lib/cartTypes";

function groupByShop(items: CartItem[]): ShopGroup[] {
  const map = new Map<string, ShopGroup>();
  items.forEach((it) => {
    const key = it.shopId != null ? String(it.shopId) : "default";
    const shopName = it.shopName || "Cửa hàng của bạn";
    if (!map.has(key)) map.set(key, { shopId: it.shopId, shopName, items: [] });
    map.get(key)!.items.push(it);
  });
  return Array.from(map.values());
}

export default function CartPage() {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (status !== "authenticated") {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    let mounted = true;
    (async () => {
      const res = await customerApi.getCartItems(session?.tokens?.accessToken);
      if (!mounted) return;
      if (Array.isArray(res)) {
        setItems(res as CartItem[]);
        const initial: Record<number, boolean> = {};
        (res as CartItem[]).forEach((it) => (initial[it.cartItemId] = true));
        setSelected(initial);
      } else {
        setItems([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status, session]);

  const groups = useMemo(() => groupByShop(items), [items]);

  const allSelected = useMemo(
    () => items.length > 0 && items.every((it) => selected[it.cartItemId]),
    [items, selected],
  );

  const toggleSelectAll = () => {
    const next: Record<number, boolean> = {};
    if (!allSelected) {
      items.forEach((it) => (next[it.cartItemId] = true));
    }
    setSelected(next);
  };

  const updateQuantity = (cartItemId: number, qty: number) => {
    // optimistic update
    const prev = items;
    setItems((p) =>
      p.map((it) =>
        it.cartItemId === cartItemId ? { ...it, cartItemQuantity: qty } : it,
      ),
    );
    // call API
    (async () => {
      if (!session?.tokens?.accessToken) return;
      const it = items.find((i) => i.cartItemId === cartItemId);
      const variantId = it?.currentVariantId ?? it?.variantSkuCode ?? null;
      const ok = await customerApi.updateCartItem(
        session.tokens.accessToken,
        cartItemId,
        variantId ?? "",
        qty,
      );
      if (!ok) {
        // rollback
        setItems(prev);
        window.alert("Cập nhật số lượng thất bại.");
      }
    })();
  };

  const removeItem = (cartItemId: number) => {
    // call API to remove
    (async () => {
      if (!session?.tokens?.accessToken) return;
      const ok = await customerApi.removeCartItems(session.tokens.accessToken, [
        cartItemId,
      ]);
      if (ok) {
        setItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
        setSelected((prev) => {
          const n = { ...prev };
          delete n[cartItemId];
          return n;
        });
      } else {
        window.alert("Xóa sản phẩm thất bại");
      }
    })();
  };

  const summary = useMemo(() => {
    const selectedItems = items.filter((it) => selected[it.cartItemId]);
    const itemsTotal = selectedItems.reduce(
      (s, it) => s + (it.variantPrice ?? 0) * (it.cartItemQuantity ?? 0),
      0,
    );
    const totalQuantity = selectedItems.reduce(
      (s, it) => s + (it.cartItemQuantity ?? 0),
      0,
    );
    const shippingFee = itemsTotal > 0 ? 30000 : 0;
    const discount = 0;
    const grandTotal = itemsTotal + shippingFee - discount;
    return { itemsTotal, shippingFee, discount, grandTotal, totalQuantity };
  }, [items, selected]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-lg font-semibold">Giỏ hàng</h1>

      {items.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <svg className="h-20 w-20 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m14-9l2 9m-5-4a1 1 0 11-2 0 1 1 0 012 0zm-8 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <p className="mt-4 text-sm text-slate-500">Giỏ hàng của bạn đang trống.</p>
          <a href="/" className="mt-3 inline-flex rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">Tiếp tục mua sắm</a>
        </div>
      )}

      {items.length > 0 && (
        <>
      <div className="mt-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
          />
          <span>Chọn tất cả</span>
        </label>
      </div>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div
            key={group.shopId ?? group.shopName}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 text-sm font-semibold">{group.shopName}</div>
            <div className="space-y-3">
              {group.items.map((it) => (
                <div
                  key={it.cartItemId}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3"
                >
                  <input
                    type="checkbox"
                    checked={!!selected[it.cartItemId]}
                    onChange={() =>
                      setSelected((prev) => ({
                        ...prev,
                        [it.cartItemId]: !prev[it.cartItemId],
                      }))
                    }
                  />
                  <img
                    src={
                      it.variantImageUrl || "https://picsum.photos/seed/p/80/80"
                    }
                    alt={it.productName}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {it.productName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {it.variantSkuCode}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <div className="text-base font-semibold text-indigo-600">
                        ₫{it.variantPrice.toLocaleString("vi-VN")}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              it.cartItemId,
                              Math.max(1, it.cartItemQuantity - 1),
                            )
                          }
                          className="h-8 w-8 rounded border"
                        >
                          -
                        </button>
                        <div className="w-10 text-center">
                          {it.cartItemQuantity}
                        </div>
                        <button
                          onClick={() =>
                            updateQuantity(
                              it.cartItemId,
                              Math.min(
                                it.stockQuantity,
                                it.cartItemQuantity + 1,
                              ),
                            )
                          }
                          className="h-8 w-8 rounded border"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(it.cartItemId)}
                      className="text-sm text-red-500"
                    >
                      <Trash2 className="inline-block h-4 w-4" /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom summary */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white/90 border-t border-slate-200 p-4 backdrop-blur sm:relative sm:bottom-auto sm:bg-transparent sm:border-0">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">
                Đã chọn:{" "}
                <span className="font-semibold">{summary.totalQuantity}</span>{" "}
                sản phẩm
              </div>
              <div className="text-sm text-slate-500">
                Tạm tính:{" "}
                <span className="font-semibold">
                  ₫{summary.itemsTotal.toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-slate-500">Tổng</div>
                <div className="text-lg font-semibold">
                  ₫{summary.grandTotal.toLocaleString("vi-VN")}
                </div>
              </div>
              <button
                onClick={() => {
                  const selectedItemsList = items.filter((it) => selected[it.cartItemId]);
                  if (selectedItemsList.length > 0) {
                    navigate("/checkout", { state: { selectedItems: selectedItemsList } });
                  } else {
                    window.alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
                  }
                }}
                className="ml-4 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Mua hàng
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
