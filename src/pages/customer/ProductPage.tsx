import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingCart,
  CreditCard,
  ZoomIn,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as customerApi from "../../lib/customerApi";
import type { ProductDetail, ProductVariant } from "../../lib/customerApi";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../lib/format";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { status, session } = useAuth();
  const cartCtx = useCart();
  const toast = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariantUuid, setSelectedVariantUuid] = useState<string | null>(null);
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
        if (firstVariant) {
          setSelectedVariantUuid(firstVariant.variantUuid);
        }
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

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((v) => v.variantUuid === selectedVariantUuid) ?? variants[0];
  }, [variants, selectedVariantUuid]);

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
      selectedVariant.variantUuid,
      quantity,
    );

    if (ok) {
      try {
        await cartCtx.refresh();
      } catch {
        // ignore refresh failures
      }
      
      // Flying image animation
      if (imgRef.current) {
        const cartIcon = document.getElementById("cart-btn");
        if (cartIcon) {
          const imgRect = imgRef.current.getBoundingClientRect();
          const cartRect = cartIcon.getBoundingClientRect();

          const clone = imgRef.current.cloneNode(true) as HTMLImageElement;
          clone.style.position = "fixed";
          clone.style.top = `${imgRect.top}px`;
          clone.style.left = `${imgRect.left}px`;
          clone.style.width = `${imgRect.width}px`;
          clone.style.height = `${imgRect.height}px`;
          clone.style.zIndex = "9999";
          clone.style.borderRadius = "16px";
          clone.style.transition = "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          clone.style.pointerEvents = "none";
          document.body.appendChild(clone);

          // Force reflow
          void clone.offsetWidth;

          clone.style.top = `${cartRect.top}px`;
          clone.style.left = `${cartRect.left}px`;
          clone.style.width = `24px`;
          clone.style.height = `24px`;
          clone.style.opacity = "0.5";
          clone.style.borderRadius = "50%";

          setTimeout(() => {
            clone.remove();
          }, 800);
        }
      }

      setBtnAnim(true);
      toast.show("Đã thêm vào giỏ hàng");
      setTimeout(() => setBtnAnim(false), 300);
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
      selectedVariant.variantUuid,
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
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="h-[420px] bg-slate-200 rounded-2xl mb-3"></div>
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-[92px] w-[92px] bg-slate-200 rounded-lg"></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
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
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center text-sm text-slate-500">
        <Link to="/" className="hover:text-[var(--color-primary)]">Trang chủ</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        {product.categoryName && (
          <>
            <Link to={`/?categoryId=${product.categoryId}`} className="hover:text-[var(--color-primary)]">
              {product.categoryName}
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
          </>
        )}
        <span className="text-slate-900 truncate max-w-[200px] sm:max-w-xs">{product.productName}</span>
      </nav>

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

          {/* Selected variant attributes table */}
          {selectedVariant?.attributes && selectedVariant.attributes.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-700 mb-2">
                Thuộc tính chi tiết
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <tbody className="divide-y divide-slate-200">
                    {selectedVariant.attributes.map((attr, idx) => (
                      <tr key={idx} className="even:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700 w-1/3 border-r border-slate-200">
                          {attr.attributeName}
                        </td>
                        <td className="px-4 py-2">
                          {attr.attributeValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          {/* Variant selectors */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-700">
              Phân loại (SKU)
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {variants.map((variant) => {
                const activeValue = selectedVariantUuid === variant.variantUuid;
                return (
                  <button
                    key={variant.variantUuid}
                    type="button"
                    onClick={() => setSelectedVariantUuid(variant.variantUuid)}
                    onMouseEnter={() => {
                      if (variant.variantImageUrl && variant.variantImageUrl.length > 0) {
                        setSelectedImage(variant.variantImageUrl[0].imageUrl);
                      }
                    }}
                    className={`rounded-2xl border px-3 py-2 text-sm transition font-medium ${
                      activeValue
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md ring-2 ring-[var(--color-primary)]/20 scale-105"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/50 hover:bg-slate-50"
                    }`}
                  >
                    {variant.variantSkuCode || `Phiên bản ${variant.variantUuid}`}
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Tabs for description / reviews */}
          <div className="mt-8">
            <div className="flex border-b border-slate-200">
              <button className="border-b-2 border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
                Mô tả sản phẩm
              </button>
              <button className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
                Đánh giá (0)
              </button>
            </div>
            <div className="pt-4">
              {product.productDescription ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {product.productDescription}
                </p>
              ) : (
                <p className="text-sm text-slate-500 italic">Sản phẩm chưa có mô tả.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
