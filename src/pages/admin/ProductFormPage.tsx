import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  PackageSearch,
  Plus,
  Power,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  addProductVariant,
  createProduct,
  getProductDetail,
  getProductVariants,
  searchBrands,
  searchCategories,
  updateProduct,
  updateProductStatus,
  updateVariantStockAndPrice,
  type AdminVariant,
  type Brand,
  type Category,
  type ProductStatus,
} from "../../lib/adminApi";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { translateError } from "../../lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftVariant {
  /** undefined = not saved yet (draft) */
  variantId?: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  attrKey: string;
  attrValue: string;
  variantAvatarUrl: string;
  /** from API */
  attributes?: Array<{ attributeId?: number; attributeName: string; attributeValue: string }>;
  variantImageUrl?: Array<{ imageId: number; imageUrl: string; isAvatar: boolean }>;
  /** ui state */
  expanded: boolean;
  saving: boolean;
  saved: boolean;
}

function makeDraftVariant(): DraftVariant {
  return {
    skuCode: "",
    price: 0,
    stockQuantity: 0,
    attrKey: "",
    attrValue: "",
    variantAvatarUrl: "",
    expanded: true,
    saving: false,
    saved: false,
  };
}

function apiVariantToDraft(v: AdminVariant): DraftVariant {
  const firstAttr = v.attributes?.[0];
  return {
    variantId: v.variantId,
    skuCode: v.skuCode,
    price: v.price,
    stockQuantity: v.stockQuantity,
    attrKey: firstAttr?.attributeName ?? "",
    attrValue: firstAttr?.attributeValue ?? "",
    variantAvatarUrl: v.variantImageUrl?.find((i) => i.isAvatar)?.imageUrl ?? "",
    attributes: v.attributes,
    variantImageUrl: v.variantImageUrl,
    expanded: false,
    saving: false,
    saved: true,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        {icon && <span className="text-[var(--color-primary)]">{icon}</span>}
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10";

// ─── Variant Card ─────────────────────────────────────────────────────────────

function VariantCard({
  v,
  index,
  isEdit,
  onChange,
  onRemove,
  onSave,
  onUpdateVariant,
}: {
  v: DraftVariant;
  index: number;
  isEdit: boolean;
  onChange: (patch: Partial<DraftVariant>) => void;
  onRemove: () => void;
  onSave: () => void;
  onUpdateVariant: (data: { stockQuantity?: number; price?: number }) => void;
}) {
  const [editStock, setEditStock] = useState(false);
  const [stockVal, setStockVal] = useState(v.stockQuantity);
  const [editPrice, setEditPrice] = useState(false);
  const [priceVal, setPriceVal] = useState(v.price);

  return (
    <div
      className={`rounded-xl border transition-all ${
        v.saved
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => onChange({ expanded: !v.expanded })}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {v.skuCode || <span className="text-slate-400 italic">Chưa nhập SKU</span>}
          </p>
          {v.saved && (
            <p className="text-xs text-slate-500">
              {formatCurrency(v.price)} · Kho: {v.stockQuantity}
              {v.attributes?.map((a) => ` · ${a.attributeName}: ${a.attributeValue}`)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {v.saved && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Đã lưu
            </span>
          )}
          {!v.saved && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Chưa lưu
            </span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="rounded-lg p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
            title="Xóa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {v.expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Body */}
      {v.expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200/50">
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div>
              <FieldLabel required>SKU Code</FieldLabel>
              <input
                value={v.skuCode}
                onChange={(e) => onChange({ skuCode: e.target.value })}
                className={inputCls}
                placeholder="VD: SKU-RED-L"
                disabled={v.saved && isEdit}
              />
            </div>
            <div>
              <FieldLabel required>Giá (VNĐ)</FieldLabel>
              {v.saved && isEdit ? (
                <div>
                  {editPrice ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={priceVal}
                        onChange={(e) => setPriceVal(Number(e.target.value))}
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => { onUpdateVariant({ price: priceVal }); setEditPrice(false); }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPrice(false)}
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPriceVal(v.price); setEditPrice(true); }}
                      className={`${inputCls} text-left cursor-pointer hover:border-[var(--color-primary)] bg-white`}
                    >
                      {formatCurrency(v.price)} <span className="text-slate-400 text-xs">· click để sửa</span>
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={v.price}
                  onChange={(e) => onChange({ price: Number(e.target.value) })}
                  className={inputCls}
                />
              )}
            </div>
            <div>
              <FieldLabel required>Số lượng kho</FieldLabel>
              {v.saved && isEdit ? (
                <div>
                  {editStock ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={stockVal}
                        onChange={(e) => setStockVal(Number(e.target.value))}
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => { onUpdateVariant({ stockQuantity: stockVal }); setEditStock(false); }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditStock(false)}
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setStockVal(v.stockQuantity); setEditStock(true); }}
                      className={`${inputCls} text-left cursor-pointer hover:border-[var(--color-primary)] bg-white`}
                    >
                      {v.stockQuantity} <span className="text-slate-400 text-xs">· click để sửa</span>
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={v.stockQuantity}
                  onChange={(e) => onChange({ stockQuantity: Number(e.target.value) })}
                  className={inputCls}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Thuộc tính (key)</FieldLabel>
              <input
                value={v.attrKey}
                onChange={(e) => onChange({ attrKey: e.target.value })}
                className={inputCls}
                placeholder="VD: Màu sắc, Size..."
                disabled={v.saved && isEdit}
              />
            </div>
            <div>
              <FieldLabel>Giá trị</FieldLabel>
              <input
                value={v.attrValue}
                onChange={(e) => onChange({ attrValue: e.target.value })}
                className={inputCls}
                placeholder="VD: Đỏ, XL..."
                disabled={v.saved && isEdit}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Avatar URL biến thể</FieldLabel>
            <input
              value={v.variantAvatarUrl}
              onChange={(e) => onChange({ variantAvatarUrl: e.target.value })}
              className={inputCls}
              placeholder="https://..."
              disabled={v.saved && isEdit}
            />
          </div>

          {/* Variant images (view only from API) */}
          {v.variantImageUrl && v.variantImageUrl.length > 0 && (
            <div>
              <FieldLabel>Ảnh biến thể</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {v.variantImageUrl.map((img) => (
                  <div key={img.imageId} className="relative group">
                    <img
                      src={img.imageUrl}
                      alt=""
                      className={`h-16 w-16 rounded-lg object-cover border-2 transition ${
                        img.isAvatar ? "border-[var(--color-primary)]" : "border-slate-200"
                      }`}
                    />
                    {img.isAvatar && (
                      <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full px-1 py-0.5">
                        AVT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button for new variants in edit mode */}
          {!v.saved && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onSave}
                disabled={v.saving || !v.skuCode}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                {v.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {v.saving ? "Đang lưu..." : "Lưu biến thể này"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();

  const [pageLoading, setPageLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Brands & categories
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Product fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [brandId, setBrandId] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [productDbId, setProductDbId] = useState(0);
  const [productUuid, setProductUuid] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [modifiedAt, setModifiedAt] = useState<string | null>(null);
  const [modifiedBy, setModifiedBy] = useState<string | null>(null);

  // Variants
  const [variants, setVariants] = useState<DraftVariant[]>([makeDraftVariant()]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // ── Load brands/categories
  useEffect(() => {
    if (!token) return;
    searchBrands(token, { size: 200 }).then((r) => setBrands(r.content)).catch(console.error);
    searchCategories(token, { size: 200 }).then((r) => setCategories(r.content)).catch(console.error);
  }, [token]);

  // ── Load product + variants (edit mode)
  useEffect(() => {
    if (!isEdit || !id || !token) return;
    let active = true;
    const load = async () => {
      setPageLoading(true);
      try {
        const p = await getProductDetail(token, Number(id));
        if (!active) return;
        setProductDbId(p.id);
        setProductUuid(p.uuid);
        setName(p.name);
        setDescription(p.description ?? "");
        setAvatarUrl(p.avatarUrl ?? "");
        setStatus(p.status as ProductStatus);
        setCreatedAt(p.createdAt);
        setCreatedBy(p.createdBy);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);

        // Find categoryId/brandId from lists — may not be loaded yet, will use name fallback
        // variants
        setVariantsLoading(true);
        const vList = await getProductVariants(token, p.uuid);
        if (!active) return;
        setVariants((vList ?? []).map(apiVariantToDraft));
      } catch (e) {
        toast.show(translateError(e), "error");
      } finally {
        if (active) { setPageLoading(false); setVariantsLoading(false); }
      }
    };
    void load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, token]);

  // ── Patch single variant field
  const patchVariant = useCallback((index: number, patch: Partial<DraftVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }, []);

  // ── Remove variant from local list
  const removeVariant = useCallback((index: number) => {
    setVariants((prev) => {
      if (prev[index].saved) {
        toast.show("Xóa variant đã lưu chưa được hỗ trợ từ API.", "error");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [toast]);

  // ── Save a new draft variant (edit mode only)
  const saveVariant = useCallback(async (index: number) => {
    if (!token || !productUuid) return;
    const v = variants[index];
    patchVariant(index, { saving: true });
    try {
      const attributes: Record<string, string> = {};
      if (v.attrKey.trim() && v.attrValue.trim()) attributes[v.attrKey.trim()] = v.attrValue.trim();
      await addProductVariant(token, productUuid, {
        skuCode: v.skuCode,
        price: v.price,
        stockQuantity: v.stockQuantity,
        attributes: Object.keys(attributes).length ? attributes : undefined,
        variantAvatarUrl: v.variantAvatarUrl || undefined,
      });
      toast.show("Đã thêm biến thể", "success");
      // Reload variants from API
      const fresh = await getProductVariants(token, productUuid);
      setVariants((fresh ?? []).map(apiVariantToDraft));
    } catch (e) {
      toast.show(translateError(e), "error");
      patchVariant(index, { saving: false });
    }
  }, [token, productUuid, variants, patchVariant, toast]);

  // ── Update variant of saved variant
  const handleVariantUpdate = useCallback(async (index: number, data: { stockQuantity?: number; price?: number }) => {
    if (!token || !productUuid) return;
    const v = variants[index];
    if (!v.variantId) return;
    try {
      await updateVariantStockAndPrice(token, String(v.variantId), data);
      toast.show("Cập nhật biến thể thành công", "success");
      const fresh = await getProductVariants(token, productUuid);
      setVariants((fresh ?? []).map(apiVariantToDraft));
    } catch (e) {
      toast.show(translateError(e), "error");
    }
  }, [token, productUuid, variants, toast]);

  // ── Toggle product status
  const handleToggleStatus = useCallback(async () => {
    if (!token || !productDbId) return;
    const next: ProductStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateProductStatus(token, productDbId, next);
      setStatus(next);
      toast.show(`Đã chuyển trạng thái thành ${next}`, "success");
    } catch (e) {
      toast.show(translateError(e), "error");
    }
  }, [token, productDbId, status, toast]);

  // ── Submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(token, {
          productId: productDbId,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: avatarUrl || null,
        });
        toast.show("Cập nhật sản phẩm thành công", "success");
        // Reload
        const p = await getProductDetail(token, productDbId);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);
      } else {
        const variantPayload = variants
          .filter((v) => v.skuCode.trim())
          .map((v) => {
            const attributes: Record<string, string> = {};
            if (v.attrKey.trim() && v.attrValue.trim()) attributes[v.attrKey.trim()] = v.attrValue.trim();
            return {
              skuCode: v.skuCode,
              price: v.price,
              stockQuantity: v.stockQuantity,
              attributes: Object.keys(attributes).length ? attributes : undefined,
              variantAvatarUrl: v.variantAvatarUrl || undefined,
            };
          });

        await createProduct(token, {
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: avatarUrl || undefined,
          variants: variantPayload.length ? variantPayload : undefined,
        });
        toast.show("Tạo sản phẩm thành công", "success");
        navigate("/admin/products");
      }
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-rose-100 text-rose-700",
    DRAFT: "bg-slate-100 text-slate-600",
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-slate-50/60">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-3">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách sản phẩm
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-semibold text-slate-800">
            {isEdit ? `Chỉnh sửa #${productUuid.substring(0, 8)}` : "Tạo sản phẩm mới"}
          </h1>
          {isEdit && (
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[status] ?? statusBadge.DRAFT}`}>
              {status === "ACTIVE" ? "Đang hoạt động" : status === "INACTIVE" ? "Vô hiệu" : "Nháp"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Basic info */}
            <SectionCard title="Thông tin sản phẩm" icon={<PackageSearch className="h-4 w-4" />}>
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Tên sản phẩm</FieldLabel>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="Nhập tên sản phẩm..."
                  />
                </div>
                <div>
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputCls}
                    placeholder="Mô tả chi tiết sản phẩm..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Danh mục</FieldLabel>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className={inputCls}
                    >
                      <option value={0}>-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Thương hiệu</FieldLabel>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(Number(e.target.value))}
                      className={inputCls}
                    >
                      <option value={0}>-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.brandId} value={b.brandId}>{b.brandName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Avatar / Images */}
            <SectionCard title="Ảnh sản phẩm" icon={<ImageIcon className="h-4 w-4" />}>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                      <PackageSearch className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <FieldLabel>URL ảnh đại diện sản phẩm</FieldLabel>
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className={inputCls}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">Nhập URL ảnh để xem preview bên trái.</p>
                </div>
              </div>
            </SectionCard>

            {/* Variants */}
            <SectionCard title="Biến thể sản phẩm" icon={<Boxes className="h-4 w-4" />}>
              {variantsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <VariantCard
                      key={i}
                      v={v}
                      index={i}
                      isEdit={isEdit}
                      onChange={(patch) => patchVariant(i, patch)}
                      onRemove={() => removeVariant(i)}
                      onSave={() => saveVariant(i)}
                      onUpdateVariant={(data) => handleVariantUpdate(i, data)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setVariants((prev) => [...prev, makeDraftVariant()])}
                    className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm biến thể
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Metadata (edit only) */}
            {isEdit && (
              <SectionCard title="Thông tin hệ thống">
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">Tạo lúc</p>
                    <p>{createdAt ? formatDateTime(createdAt) : "—"}</p>
                    <p className="text-xs text-slate-400">Bởi: {createdBy ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">Cập nhật lúc</p>
                    <p>{modifiedAt ? formatDateTime(modifiedAt) : "—"}</p>
                    <p className="text-xs text-slate-400">Bởi: {modifiedBy ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">UUID</p>
                    <p className="font-mono text-xs">{productUuid}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">ID</p>
                    <p className="font-mono text-xs">#{productDbId}</p>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── Right sticky column ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-[57px] space-y-4">

            {/* Action panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Thao tác</h3>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Hủy
              </button>

              {isEdit && (
                <>
                  <hr className="border-slate-100" />
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                      status === "ACTIVE"
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                    {status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </>
              )}
            </div>

            {/* Summary card (edit) */}
            {isEdit && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Tóm tắt</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Biến thể</span>
                    <span className="font-semibold text-slate-800">{variants.filter((v) => v.saved).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tổng kho</span>
                    <span className="font-semibold text-slate-800">
                      {variants.filter((v) => v.saved).reduce((s, v) => s + v.stockQuantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giá thấp nhất</span>
                    <span className="font-semibold text-slate-800">
                      {variants.filter((v) => v.saved).length
                        ? formatCurrency(Math.min(...variants.filter((v) => v.saved).map((v) => v.price)))
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 space-y-2">
              <div className="flex items-start gap-2">
                <RefreshCw className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
                <p>Biến thể chưa lưu (màu vàng) sẽ không được tạo khi tạo mới nếu SKU trống.</p>
              </div>
              <div className="flex items-start gap-2">
                <Boxes className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
                <p>Khi chỉnh sửa, nhấn "Lưu biến thể này" riêng cho từng variant chưa lưu.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
