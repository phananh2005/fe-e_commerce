import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingCart,
  CreditCard,
  ZoomIn,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as customerApi from "../../lib/customerApi";
import type { ProductDetail, ProductVariant } from "../../lib/customerApi";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../lib/format";

interface AttributeGroup {
  name: string;
  values: string[];
}

function buildAttributeGroups(variants: ProductVariant[]): AttributeGroup[] {
  const order: string[] = [];
  const map = new Map<string, string[]>();

  variants.forEach((variant) => {
    (variant.attributes ?? []).forEach((attr) => {
      if (!map.has(attr.attributeName)) {
        map.set(attr.attributeName, []);
        order.push(attr.attributeName);
      }
      const values = map.get(attr.attributeName)!;
      if (!values.includes(attr.attributeValue)) {
        values.push(attr.attributeValue);
      }
    });
  });

  return order.map((name) => ({ name, values: map.get(name)! }));
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { status, session } = useAuth();
  const cartCtx = useCart();
  const toast = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    {},
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [btnAnim, setBtnAnim] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await customerApi.getProduct(id as string);
        if (!active) return;
        setProduct(data);
        const firstVariant = data?.variants?.[0];
        const init: Record<string, string> = {};
        firstVariant?.attributes?.forEach((attr) => {
          init[attr.attributeName] = attr.attributeValue;
        });
        setSelectedAttrs(init);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Không thể tải sản phẩm");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const variants = useMemo(() => product?.variants ?? [], [product]);
  const attrGroups = useMemo(
    () => buildAttributeGroups(variants),
    [variants],
  );

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((variant) =>
        (variant.attributes ?? []).every(
          (attr) => selectedAttrs[attr.attributeName] === attr.attributeValue,
        ),
      ) ?? null
    );
  }, [variants, selectedAttrs]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.variantImageUrl?.length) {
      return selectedVariant.variantImageUrl.map((img) => img.imageUrl);
    }
    if (product?.avatarUrl) return [product.avatarUrl];
    return [];
  }, [selectedVariant, product]);

  // When the resolved variant changes, reset the focused image + quantity.
  useEffect(() => {
    const imgs = selectedVariant?.variantImageUrl?.length
      ? selectedVariant.variantImageUrl
      : product?.avatarUrl
        ? [{ imageUrl: product.avatarUrl, imageId: -1, isAvatar: true }]
        : [];
    const avatar = imgs.find((img) => img.isAvatar) ?? imgs[0];
    setSelectedImage(avatar?.imageUrl ?? "");
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant]);

  const stock = selectedVariant?.stockQuantity ?? 0;
  const price =
    selectedVariant?.variantPrice ?? product?.minPrice ?? 0;
  const maxPrice = product?.maxPrice;

  const isValueAvailable = (groupName: string, value: string) => {
    return variants.some((variant) => {
      const attrs = variant.attributes ?? [];
      const matchesThis = attrs.some(
        (attr) => attr.attributeName === groupName && attr.attributeValue === value,
      );
      if (!matchesThis) return false;
      return Object.entries(selectedAttrs).every(([key, val]) => {
        if (key === groupName) return true;
        return attrs.find((attr) => attr.attributeName === key)?.attributeValue === val;
      });
    });
  };

  const requireAuth = () => {
    if (status !== "authenticated" || !session?.tokens?.accessToken) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!requireAuth()) return;
    if (!selectedVariant) {
      toast.show("Vui lòng chọn phân loại sản phẩm", "error");
      return;
    }
    if (stock <= 0) {
      toast.show("Sản phẩm tạm hết hàng", "error");
      return;
    }

    const token = session!.tokens!.accessToken;
    const ok = await customerApi.addToCart(
      token,
      selectedVariant.variantId,
      quantity,
    );

    if (ok) {
      try {
        await cartCtx.refresh();
      } catch {
        // ignore refresh failures
      }
      setBtnAnim(true);
      toast.show("Đã thêm vào giỏ hàng");
      setTimeout(() => setBtnAnim(false), 700);
      setTimeout(() => navigate("/cart"), 300);
    } else {
      toast.show("Không thể thêm vào giỏ — vui lòng thử lại", "error");
    }
  };

  const handleBuyNow = async () => {
    if (!requireAuth()) return;
    if (!selectedVariant) {
      toast.show("Vui lòng chọn phân loại sản phẩm", "error");
      return;
    }
    if (stock <= 0) {
      toast.show("Sản phẩm tạm hết hàng", "error");
      return;
    }

    const token = session!.tokens!.accessToken;
    const ok = await customerApi.addToCart(
      token,
      selectedVariant.variantId,
      quantity,
    );

    if (ok) {
      navigate("/checkout");
    } else {
      toast.show("Không thể mua ngay — vui lòng thử lại", "error");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500">
        Đang tải sản phẩm...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Không tìm thấy sản phẩm."}
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-900"
      >
        ← Quay lại
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Image gallery */}
        <div>
          <div
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            className="relative overflow-hidden rounded-2xl bg-slate-50"
          >
            <img
              ref={imgRef}
              src={selectedImage || product.avatarUrl}
              alt={product.productName}
              className={`w-full object-cover transition-transform duration-300 ${zoomed ? "scale-110" : "scale-100"}`}
              style={{ height: 420 }}
            />
            <div className="absolute right-3 top-3 rounded-full bg-white/80 p-2 shadow-sm">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto touch-scroll">
              {galleryImages.map((img) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  onMouseEnter={() => setSelectedImage(img)}
                  className={`flex-shrink-0 overflow-hidden rounded-lg border bg-white ${selectedImage === img ? "border-[var(--color-primary)]" : "border-transparent"}`}
                  style={{ width: 92, height: 92 }}
                >
                  <img src={img} alt="thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & actions */}
        <div className="sticky top-24 self-start">
          <h1 className="text-lg font-extrabold leading-tight text-slate-900 sm:text-2xl">
            {product.productName}
          </h1>

          {(product.brandName || product.categoryName) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {product.brandName && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  {product.brandName}
                </span>
              )}
              {product.categoryName && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  {product.categoryName}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex items-end gap-3">
            <div className="text-2xl font-extrabold text-[var(--color-primary)]">
              {formatCurrency(price, "VND")}
            </div>
            {maxPrice && maxPrice !== price && (
              <div className="text-sm text-slate-400 line-through">
                {formatCurrency(maxPrice, "VND")}
              </div>
            )}
          </div>

          {product.productDescription && (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
              {product.productDescription}
            </p>
          )}

          {/* Variant selectors */}
          {attrGroups.map((group) => (
            <div key={group.name} className="mt-6">
              <div className="text-sm font-semibold text-slate-700">
                {group.name}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {group.values.map((value) => {
                  const activeValue = selectedAttrs[group.name] === value;
                  const available = isValueAvailable(group.name, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        setSelectedAttrs((prev) => ({
                          ...prev,
                          [group.name]: value,
                        }))
                      }
                      onMouseEnter={() => {
                        if (available) {
                          const v = variants.find(v => (v.attributes ?? []).some(a => a.attributeName === group.name && a.attributeValue === value));
                          if (v && v.variantImageUrl && v.variantImageUrl.length > 0) {
                            setSelectedImage(v.variantImageUrl[0].imageUrl);
                          }
                        }
                      }}
                      className={`rounded-2xl border px-3 py-2 text-sm transition font-medium ${
                        activeValue
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md ring-2 ring-[var(--color-primary)]/20 scale-105"
                          : "border-slate-200 bg-white text-slate-700"
                      } ${!available ? "cursor-not-allowed opacity-40 line-through" : "hover:border-[var(--color-primary)]/50 hover:bg-slate-50"}`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity & actions */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="inline-flex h-10 w-10 items-center justify-center px-2 text-slate-600"
                  aria-label="Giảm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="inline-flex h-10 w-16 items-center justify-center text-sm font-medium">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(stock || 1, q + 1))
                  }
                  className="inline-flex h-10 w-10 items-center justify-center px-2 text-slate-600"
                  aria-label="Tăng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm text-slate-500">
                {stock > 0 ? `Kho: ${stock}` : "Hết hàng"}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant || stock <= 0}
                className={`btn-secondary flex w-full sm:w-auto items-center justify-center gap-2 transition-all duration-300 ${btnAnim ? "scale-95 shadow-inner bg-slate-200" : "hover:scale-105 active:scale-95 hover:shadow-md"}`}
              >
                <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!selectedVariant || stock <= 0}
                className="btn-primary flex w-full sm:w-auto items-center justify-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                <CreditCard className="h-4 w-4" /> Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
