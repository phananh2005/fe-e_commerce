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
import { uploadImageToCloudinary } from "../../lib/uploadApi";
import {
  createProduct,
  getProductDetail,
  getProductVariants,
  searchBrands,
  searchCategories,
  updateProduct,
  updateProductStatus,
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
  attrs: Array<{ key: string; value: string }>;
  variantAvatarUrl: string;
  imageFiles?: File[];
  avatarIndex?: number;
  deletedImageIds?: number[];
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
    attrs: [{ key: "", value: "" }],
    variantAvatarUrl: "",
    imageFiles: [],
    avatarIndex: 0,
    deletedImageIds: [],
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
    attrs: (v.attributes ?? []).map(a => ({ key: a.attributeName, value: a.attributeValue })).concat(
      v.attributes?.length ? [] : [{ key: "", value: "" }]
    ),
    variantAvatarUrl: v.variantImageUrl?.find((i) => i.isAvatar)?.imageUrl ?? "",
    imageFiles: [],
    avatarIndex: v.variantImageUrl ? v.variantImageUrl.findIndex(i => i.isAvatar) : 0,
    deletedImageIds: [],
    variantImageUrl: v.variantImageUrl,
    attributes: v.attributes,
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
}: {
  v: DraftVariant;
  index: number;
  isEdit: boolean;
  onChange: (patch: Partial<DraftVariant>) => void;
  onRemove: () => void;
}) {
  const variantInputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-slate-50 disabled:text-slate-500";

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
                className={variantInputCls}
                placeholder="VD: SKU-RED-L"
              />
            </div>
            <div>
              <FieldLabel required>Giá (VNĐ)</FieldLabel>
              <input
                type="number"
                min={0}
                value={v.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                className={variantInputCls}
              />
            </div>
            <div>
              <FieldLabel required>Số lượng kho</FieldLabel>
              <input
                type="number"
                min={0}
                value={v.stockQuantity}
                onChange={(e) => onChange({ stockQuantity: Number(e.target.value) })}
                className={variantInputCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Thuộc tính</FieldLabel>
              <button
                type="button"
                onClick={() => onChange({ attrs: [...(v.attrs ?? []), { key: "", value: "" }] })}
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Thêm thuộc tính
              </button>
            </div>
            {(v.attrs ?? [{ key: "", value: "" }]).map((attr, ai) => (
              <div key={ai} className="flex gap-2 items-center">
                <input
                  value={attr.key}
                  onChange={(e) => {
                    const next = (v.attrs ?? []).map((a, i) => i === ai ? { ...a, key: e.target.value } : a);
                    onChange({ attrs: next });
                  }}
                  className={variantInputCls}
                  placeholder="VD: Màu sắc, Size..."
                />
                <input
                  value={attr.value}
                  onChange={(e) => {
                    const next = (v.attrs ?? []).map((a, i) => i === ai ? { ...a, value: e.target.value } : a);
                    onChange({ attrs: next });
                  }}
                  className={variantInputCls}
                  placeholder="VD: Đỏ, XL..."
                />
                {(v.attrs ?? []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange({ attrs: (v.attrs ?? []).filter((_, i) => i !== ai) })}
                    className="flex-shrink-0 rounded-lg p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Variant images UI */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <FieldLabel>Ảnh biến thể</FieldLabel>
            <div className="space-y-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files);
                    const currentFiles = v.imageFiles || [];
                    const existingApiImages = (v.variantImageUrl ?? []).filter(img => !v.deletedImageIds?.includes(img.imageId));
                    const hasNoImages = currentFiles.length === 0 && existingApiImages.length === 0;
                    onChange({
                      imageFiles: [...currentFiles, ...newFiles],
                      // Tự chọn ảnh đầu tiên làm avatar nếu chưa có ảnh nào
                      ...(hasNoImages ? { avatarIndex: 0, variantAvatarUrl: "" } : {}),
                    });
                  }
                }}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
              />
              <div className="flex flex-wrap gap-3">
                {/* Existing Images from API */}
                {v.variantImageUrl && v.variantImageUrl
                  .filter(img => !v.deletedImageIds?.includes(img.imageId))
                  .map((img) => {
                    const isCurrentAvatar = v.variantAvatarUrl === img.imageUrl;
                    return (
                      <div key={img.imageId} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt=""
                          className={`h-16 w-16 rounded-lg object-cover border-2 transition cursor-pointer ${
                            isCurrentAvatar ? "border-[var(--color-primary)] shadow-md" : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => onChange({ variantAvatarUrl: img.imageUrl, avatarIndex: -1 })}
                        />
                        {isCurrentAvatar && (
                          <div className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                            Avatar
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentDeleted = v.deletedImageIds || [];
                            onChange({ deletedImageIds: [...currentDeleted, img.imageId] });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                {/* Newly selected images */}
                {v.imageFiles && v.imageFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  const isCurrentAvatar = v.avatarIndex === idx && (!v.variantAvatarUrl || v.variantAvatarUrl === "");
                  return (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className={`h-16 w-16 rounded-lg object-cover border-2 transition cursor-pointer ${
                          isCurrentAvatar ? "border-[var(--color-primary)] shadow-md" : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => onChange({ avatarIndex: idx, variantAvatarUrl: "" })}
                      />
                      {isCurrentAvatar && (
                        <div className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                          Avatar
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFiles = [...(v.imageFiles || [])];
                          newFiles.splice(idx, 1);
                          let newAvatarIndex = v.avatarIndex || 0;
                          if (newAvatarIndex === idx) newAvatarIndex = 0;
                          else if (newAvatarIndex > idx) newAvatarIndex--;
                          onChange({ imageFiles: newFiles, avatarIndex: newAvatarIndex });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Lưu ý: Click vào ảnh để chọn làm Avatar của biến thể.
              </p>
            </div>
          </div>
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
        if (p.categoryId) setCategoryId(p.categoryId);
        if (p.brandId) setBrandId(p.brandId);
        setCreatedAt(p.createdAt);
        setCreatedBy(p.createdBy);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);

        setVariantsLoading(true);
        const vList = await getProductVariants(token, p.id);
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
      // Upload product avatar if new file selected
      let finalProductAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadImageToCloudinary(avatarFile, token, "product");
        if (uploaded) finalProductAvatarUrl = uploaded;
      }

      // Upload images for all variants
      const processedVariants = await Promise.all(
        variants
          .filter((v) => v.skuCode.trim())
          .map(async (v) => {
            let finalVarAvatarUrl = v.variantAvatarUrl;
            let finalVarImageUrls: string[] = [];

            if (v.imageFiles && v.imageFiles.length > 0) {
              const uploadedUrls = await Promise.all(
                v.imageFiles.map(file => uploadImageToCloudinary(file, token, "variant"))
              );
              finalVarImageUrls = uploadedUrls.filter(Boolean) as string[];
              if (v.avatarIndex !== undefined && v.avatarIndex >= 0 && finalVarImageUrls.length > 0) {
                finalVarAvatarUrl = finalVarImageUrls[v.avatarIndex] || finalVarImageUrls[0];
              }
            }

            const attributes: Record<string, string> = {};
            (v.attrs ?? []).forEach(a => { if (a.key.trim() && a.value.trim()) attributes[a.key.trim()] = a.value.trim(); });

            return {
              ...v,
              finalVarAvatarUrl,
              finalVarImageUrls,
              attributes: Object.keys(attributes).length ? attributes : undefined,
            };
          })
      );

      if (isEdit) {
        // Tách variants cũ (có variantId) và mới
        const existingVariants = processedVariants.filter(v => v.variantId).map(v => {
          // API imageUrl semantics: null=keep existing, ""=remove, non-empty=set new
          const avatarIsDeleted = v.variantImageUrl?.some(
            img => img.isAvatar && v.deletedImageIds?.includes(img.imageId)
          );
          const resolvedAvatarUrl = avatarIsDeleted ? "" : (v.finalVarAvatarUrl || null);
          return {
            variantId: v.variantId,
            skuCode: v.skuCode,
            price: v.price,
            stockQuantity: v.stockQuantity,
            attributes: v.attributes,
            variantAvatarUrl: resolvedAvatarUrl,
            variantImageIdsToDelete: v.deletedImageIds?.length ? v.deletedImageIds : undefined,
            variantImagesUrlsToAdd: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
          };
        });

        const newVariants = processedVariants.filter(v => !v.variantId).map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        // Cập nhật product + existing variants + tạo new variants (V1.3.9: single request)
        await updateProduct(token, {
          productId: productDbId,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || null,
          variants: existingVariants.length ? existingVariants : undefined,
          newVariants: newVariants.length ? newVariants : undefined,
        });

        toast.show("Cập nhật sản phẩm thành công", "success");

        // Reload data
        const p = await getProductDetail(token, productDbId);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);
        const vList = await getProductVariants(token, productDbId);
        setVariants((vList ?? []).map(apiVariantToDraft));
      } else {
        const variantPayload = processedVariants.map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        await createProduct(token, {
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || undefined,
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
            {isEdit ? `Chỉnh sửa #${productUuid}` : "Tạo sản phẩm mới"}
          </h1>
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
                  <FieldLabel>Ảnh đại diện sản phẩm</FieldLabel>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAvatarFile(e.target.files[0]);
                        setAvatarUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
                  />
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
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-500">Trạng thái:</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[status] ?? statusBadge.DRAFT}`}>
                      {status === "ACTIVE" ? "Đang hoạt động" : status === "INACTIVE" ? "Vô hiệu" : "Nháp"}
                    </span>
                  </div>
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
                <p>Click vào ảnh biến thể để chọn làm Avatar. Nhấn "Lưu thay đổi" để áp dụng tất cả.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
