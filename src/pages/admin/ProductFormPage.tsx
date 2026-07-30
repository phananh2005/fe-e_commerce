import { useCallback, useEffect, useState, useRef } from "react";
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
import { translateError, translateProductStatus } from "../../lib/i18n";
import { Modal } from "../../components/Modal";
// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftVariant {
  /** undefined = not saved yet (draft) */
  variantUuid?: string;
  skuCode: string;
  price: number;
  stockQuantity: number;
  attrs: Array<{ key: string; value: string }>;
  variantAvatarUrl: string;      // URL avatar hiện tại (từ API hoặc preview)
  avatarFile?: File | null;      // File avatar mới chọn (nếu có)
  imageFiles?: File[];           // Ảnh chi tiết mới
  deletedImageUuids?: string[];    // ID ảnh cũ bị xóa
  status: "ACTIVE" | "INACTIVE"; // Trạng thái variant
  /** from API — schema: Image (api-docs.json) */
  attributes?: Array<{ attributeId?: number; attributeName: string; attributeValue: string }>;
  variantImageUrl?: Array<{ imageUuid: string; imageUrl: string; avatar: boolean }>;
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
    avatarFile: null,
    imageFiles: [],
    deletedImageUuids: [],
    status: "ACTIVE",
    expanded: true,
    saving: false,
    saved: false,
  };
}

function apiVariantToDraft(v: AdminVariant): DraftVariant {
  const isAvatarTrue = (i: { avatar?: boolean }) => i.avatar === true;
  const avatarImg = v.variantImageUrl?.find(isAvatarTrue);

  return {
    // API trả về 'id', không phải 'variantId'
    variantUuid: v.uuid,
    skuCode: v.skuCode,
    price: v.price,
    stockQuantity: v.stockQuantity,
    attrs: (v.attributes ?? []).map(a => ({ key: a.attributeName, value: a.attributeValue })).concat(
      v.attributes?.length ? [] : [{ key: "", value: "" }]
    ),
    variantAvatarUrl: avatarImg?.imageUrl ?? "",
    avatarFile: null,
    imageFiles: [],
    deletedImageUuids: [],
    variantImageUrl: v.variantImageUrl,
    attributes: v.attributes,
    status: v.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
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
  onChange,
  onRemove,
}: {
  v: DraftVariant;
  index: number;
  onChange: (patch: Partial<DraftVariant>) => void;
  onRemove: () => void;
}) {
  const variantInputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div
      className={`rounded-xl border transition-all ${
        v.saved
          ? v.status === "INACTIVE" ? "border-slate-200 bg-slate-50/50 grayscale opacity-80" : "border-emerald-200 bg-emerald-50/30"
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
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              {v.status === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu'}
            </span>
          )}
          {!v.saved && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Chưa lưu
            </span>
          )}
          {!v.saved ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="rounded-lg p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                onChange({ status: v.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                v.status === 'ACTIVE' ? 'bg-[var(--color-primary)]' : 'bg-slate-300'
              }`}
              title={v.status === "ACTIVE" ? "Đang bật" : "Đã tắt"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  v.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          )}
          {v.expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Body */}
      {v.expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200/50">
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div>
              <FieldLabel required={!v.variantUuid}>SKU Code</FieldLabel>
              {v.variantUuid ? (
                <div className="flex h-[38px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  {v.skuCode}
                </div>
              ) : (
                <>
                  <input
                    value={v.skuCode}
                    onChange={(e) => onChange({ skuCode: e.target.value })}
                    className={variantInputCls}
                    placeholder="VD: SKU-RED-L"
                  />
                  <p className="mt-1 text-[11px] text-amber-600/80 italic">* Không thể sửa đổi sau khi lưu</p>
                </>
              )}
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

          {/* Avatar UI */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <FieldLabel>Ảnh đại diện (Avatar)</FieldLabel>
            <div className="flex items-start gap-4 mt-2">
              <div className="relative group shrink-0">
                {(v.avatarFile || v.variantAvatarUrl) ? (
                  <>
                    <img
                      src={v.avatarFile ? URL.createObjectURL(v.avatarFile) : v.variantAvatarUrl}
                      alt="Avatar"
                      className="h-24 w-24 rounded-lg object-cover border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ avatarFile: null, variantAvatarUrl: "" })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Trống</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onChange({ avatarFile: e.target.files[0] });
                    }
                  }}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ảnh đại diện chính của phân loại này (VD: hiển thị khi người dùng chọn màu sắc). Chỉ hỗ trợ 1 ảnh.
                </p>
              </div>
            </div>
          </div>

          {/* Variant Detail images UI */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <FieldLabel>Ảnh chi tiết (Gallery)</FieldLabel>
            <div className="space-y-4 mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files);
                    const currentFiles = v.imageFiles || [];
                    onChange({
                      imageFiles: [...currentFiles, ...newFiles],
                    });
                  }
                }}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 cursor-pointer"
              />
              <div className="flex flex-wrap gap-3">
                {/* Existing Images from API (excluding avatar) */}
                {v.variantImageUrl && v.variantImageUrl
                  .filter(img => !img.avatar && !v.deletedImageUuids?.includes(img.imageUuid))
                  .map((img) => (
                    <div key={img.imageUuid} className="relative group">
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentDeleted = v.deletedImageUuids || [];
                          onChange({ deletedImageUuids: [...currentDeleted, img.imageUuid] });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                {/* Newly selected detail images */}
                {v.imageFiles && v.imageFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newFiles = [...(v.imageFiles || [])];
                        newFiles.splice(idx, 1);
                        onChange({ imageFiles: newFiles });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Brands & categories
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Product fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [brandId, setBrandId] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialAvatarUrl, setInitialAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const createSubmitStatusRef = useRef<ProductStatus>("ACTIVE");
  const [productDbUuid, setProductDbId] = useState("");
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
      setVariantsLoading(true);
      try {
        const [p, vList] = await Promise.all([
          getProductDetail(token, id),
          getProductVariants(token, id)
        ]);

        if (!active) return;
        
        setProductDbId(p.uuid);
        setProductUuid(p.uuid);
        setName(p.name);
        setDescription(p.description ?? "");
        setAvatarUrl(p.avatarUrl ?? "");
        setInitialAvatarUrl(p.avatarUrl ?? "");
        setStatus(p.status as ProductStatus);
        if (p.categoryId) setCategoryId(p.categoryId);
        if (p.brandId) setBrandId(p.brandId);
        setCreatedAt(p.createdAt);
        setCreatedBy(p.createdBy);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);

        setVariants((vList ?? []).map(apiVariantToDraft));
      } catch (e) {
        toast.show(translateError(e), "error");
      } finally {
        if (active) { 
          setPageLoading(false); 
          setVariantsLoading(false); 
        }
      }
    };
    void load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, token]);

  // ── Patch single variant field
  const patchVariant = useCallback((index: number, patch: Partial<DraftVariant>) => {
    setIsDirty(true);
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }, []);

  // ── Remove variant from local list
  // Dùng ref để đọc variant hiện tại mà không tạo side effect trong updater
  const variantsRef = useRef<DraftVariant[]>([]);
  useEffect(() => { variantsRef.current = variants; }, [variants]);

  const removeVariant = useCallback((index: number) => {
    setIsDirty(true);
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Toggle product status
  const handleToggleStatus = useCallback(async () => {
    if (!token || !productDbUuid) return;
    const next: ProductStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateProductStatus(token, productDbUuid, next);
      setStatus(next);
      toast.show(`Đã chuyển trạng thái thành "${translateProductStatus(next)}"`, "success");
    } catch (e) {
      toast.show(translateError(e), "error");
    }
  }, [token, productDbUuid, status, toast]);

  // ── Submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      // Upload product avatar if new file selected
      let finalProductAvatarUrl: string | null = null;
      if (avatarFile) {
        const uploaded = await uploadImageToCloudinary(avatarFile, token, "product");
        if (uploaded) finalProductAvatarUrl = uploaded;
      } else if (isEdit) {
        if (!avatarUrl && initialAvatarUrl) {
          finalProductAvatarUrl = ""; // removed
        } else if (avatarUrl && avatarUrl !== initialAvatarUrl) {
          finalProductAvatarUrl = avatarUrl;
        } else {
          finalProductAvatarUrl = null; // keep existing
        }
      } else {
        finalProductAvatarUrl = avatarUrl || ""; // create mode
      }

      // Upload images for all variants
      const processedVariants = await Promise.all(
        variants
          .filter((v) => v.skuCode.trim())
          .map(async (v) => {
            let finalVarAvatarUrl = v.variantAvatarUrl;
            let finalVarImageUrls: string[] = [];

            // Upload avatar mới nếu có
            if (v.avatarFile) {
              const uploaded = await uploadImageToCloudinary(v.avatarFile, token, "variant");
              if (uploaded) finalVarAvatarUrl = uploaded;
            }

            // Upload ảnh chi tiết mới
            if (v.imageFiles && v.imageFiles.length > 0) {
              const uploadedUrls = await Promise.all(
                v.imageFiles.map(file => uploadImageToCloudinary(file, token, "variant"))
              );
              finalVarImageUrls = uploadedUrls.filter(Boolean) as string[];
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
        const existingVariants = processedVariants.filter(v => v.variantUuid).map(v => {
          // API semantics: null=giữ nguyên, ""=xóa, string=cập nhật mới
          const originalAvatarUrl = v.variantImageUrl?.find(img => img.avatar === true)?.imageUrl || "";
          const currentAvatarUrl = v.finalVarAvatarUrl || "";

          let resolvedAvatarUrl: string | null;
          if (!currentAvatarUrl && originalAvatarUrl) {
            resolvedAvatarUrl = ""; // removed
          } else if (currentAvatarUrl && currentAvatarUrl !== originalAvatarUrl) {
            resolvedAvatarUrl = currentAvatarUrl; // updated
          } else {
            resolvedAvatarUrl = null; // keep existing
          }

          return {
            variantUuid: v.variantUuid as string,
            price: v.price,
            stockQuantity: v.stockQuantity,
            status: v.status,
            attributes: v.attributes,
            variantAvatarUrl: resolvedAvatarUrl,
            variantDetailImageUuidsToDelete: v.deletedImageUuids?.length ? v.deletedImageUuids : undefined,
            // V1.4.3: variantImagesUrlsToAdd → variantDetailImageUrlsToAdd
            variantDetailImageUrlsToAdd: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
          };
        });

        const newVariants = processedVariants.filter(v => !v.variantUuid).map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          status: v.status,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          // V1.4.3: variantImageUrls → variantDetailImageUrls
          variantDetailImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        // Cập nhật product + existing variants + tạo new variants (V1.4.3)
        await updateProduct(token, {
          productUuid: productDbUuid,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl !== null ? finalProductAvatarUrl : null,
          // V1.4.3: variants → existVariants
          existVariants: existingVariants.length ? existingVariants : undefined,
          newVariants: newVariants.length ? newVariants : undefined,
        });

        toast.show("Cập nhật sản phẩm thành công", "success");

        // Reset transient state
        setAvatarFile(null);

        // Reload data
        const p = await getProductDetail(token, productDbUuid);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);
        const vList = await getProductVariants(token, productDbUuid);
        setVariants((vList ?? []).map(apiVariantToDraft));
        setIsDirty(false);
      } else {
        const variantPayload = processedVariants.map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantDetailImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        await createProduct(token, {
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || undefined,
          productStatus: createSubmitStatusRef.current,
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

  const handleBack = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      navigate("/admin/products");
    }
  };

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="min-h-screen bg-slate-50/60">
      {/* Top bar */}
      <div className="sticky top-0 z-10 px-6 py-3 pt-6">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
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
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <>
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarUrl("");
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
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
                    <p className="font-mono text-xs">#{productDbUuid}</p>
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
                onClick={() => {
                  if (!isEdit) createSubmitStatusRef.current = "ACTIVE";
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>

              {isEdit ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowCancelModal(true)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              )}

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

    <Modal
      open={showCancelModal}
      onClose={() => setShowCancelModal(false)}
      title={isEdit ? "Hủy các thay đổi?" : "Lưu bản nháp?"}
      description={
        isEdit 
          ? "Bạn có thay đổi chưa lưu. Nếu rời khỏi trang này, mọi dữ liệu bạn vừa nhập sẽ bị mất."
          : "Sản phẩm của bạn sẽ được lưu lại dưới dạng bản nháp để tiếp tục chỉnh sửa sau này."
      }
      className="w-[90vw] sm:w-[450px]"
    >
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={() => setShowCancelModal(false)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Tiếp tục chỉnh sửa
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Hủy bỏ thay đổi
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              createSubmitStatusRef.current = "DRAFT";
              setShowCancelModal(false);
              formRef.current?.requestSubmit();
            }}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Lưu bản nháp
          </button>
        )}
      </div>
    </Modal>
    </>
  );
}
