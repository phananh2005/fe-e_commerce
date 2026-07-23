import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, PackageSearch, Eye, Plus, Power, RefreshCw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  addProductVariant,
  createProduct,
  getProductVariants,
  searchBrands,
  searchCategories,
  searchProducts,
  updateProduct,
  updateProductStatus,
  updateVariantStock,
  type AdminProduct,
  type AdminVariant,
  type Brand,
  type Category,
  type PageResult,
  type ProductStatus,
} from "../../lib/adminApi";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { translateError } from "../../lib/i18n";
import { useDebounce } from "../../hooks/useDebounce";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-rose-50 text-rose-700",
    DRAFT: "bg-slate-100 text-slate-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Đã vô hiệu" },
  { value: "DRAFT", label: "Nháp" },
];

export function ProductsPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 500);
  const [categoryIdFilter, setCategoryIdFilter] = useState<number | "">("");
  const [brandIdFilter, setBrandIdFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ productId: 0, uuid: "", name: "", description: "", categoryId: 0, brandId: 0, productAvatarUrl: "", price: 0, stockQuantity: 0, createdAt: null as string|null, createdBy: null as string|null, modifiedAt: null as string|null, modifiedBy: null as string|null });
  const [initialFormData, setInitialFormData] = useState({ productId: 0, uuid: "", name: "", description: "", categoryId: 0, brandId: 0, productAvatarUrl: "", price: 0, stockQuantity: 0, createdAt: null as string|null, createdBy: null as string|null, modifiedAt: null as string|null, modifiedBy: null as string|null });
  const [formLoading, setFormLoading] = useState(false);

  // Variant management state
  const [variantProductUuid, setVariantProductUuid] = useState<string | null>(null);
  const [variantProductName, setVariantProductName] = useState("");
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState("");
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({ skuCode: "", price: 0, stockQuantity: 0, attrKey: "", attrValue: "" });
  const [addVariantLoading, setAddVariantLoading] = useState(false);
  // Stock edit inline
  const [editingStockUuid, setEditingStockUuid] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState(0);

  useEffect(() => {
    if (!token) return;
    searchBrands(token, { size: 100 }).then(res => setBrands(res.content)).catch(console.error);
    searchCategories(token, { size: 100 }).then(res => setCategories(res.content)).catch(console.error);
  }, [token]);

  const handleSort = useCallback((key: string) => {
    if (sortBy === key) {
      setSortType((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortType("desc");
    }
    setPage(0);
  }, [sortBy]);

  const handleResetFilters = useCallback(() => {
    setProductSearch("");
    setCategoryIdFilter("");
    setBrandIdFilter("");
    setStatusFilter("");
    setPage(0);
    setSortBy("createdAt");
    setSortType("desc");
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchProducts(token, {
          productSearch: debouncedProductSearch.trim() || undefined,
          categoryId: categoryIdFilter === "" ? undefined : categoryIdFilter,
          brandId: brandIdFilter === "" ? undefined : brandIdFilter,
          status: statusFilter === "" ? undefined : statusFilter,
          page,
          size,
          sortBy,
          sortType,
        });
        if (active) setResult(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, debouncedProductSearch, categoryIdFilter, brandIdFilter, statusFilter, page, size, sortBy, sortType, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleOpenCreate = () => {
    const defaultData = { productId: 0, uuid: "", name: "", description: "", categoryId: categories[0]?.categoryId || 0, brandId: brands[0]?.brandId || 0, productAvatarUrl: "", price: 0, stockQuantity: 0, createdAt: null, createdBy: null, modifiedAt: null, modifiedBy: null };
    setFormData(defaultData);
    setInitialFormData(defaultData);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (isEdit) {
        await updateProduct(token, { productId: formData.productId, name: formData.name, description: formData.description, categoryId: formData.categoryId || undefined, brandId: formData.brandId || undefined, productAvatarUrl: formData.productAvatarUrl });
        toast.show("Cập nhật sản phẩm thành công", "success");
      } else {
        await createProduct(token, { 
          name: formData.name, 
          description: formData.description, 
          categoryId: formData.categoryId || undefined, 
          brandId: formData.brandId || undefined, 
          productAvatarUrl: formData.productAvatarUrl,
          variants: [{ skuCode: `SKU-${Date.now()}`, price: formData.price, stockQuantity: formData.stockQuantity }]
        });
        toast.show("Tạo sản phẩm thành công", "success");
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.show(msg, "error");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = useCallback(async (product: AdminProduct) => {
    if (!token) return;
    try {
      const nextStatus: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateProductStatus(token, product.id, nextStatus);
      toast.show(`Đã chuyển trạng thái sản phẩm thành ${nextStatus}`, "success");
      reload();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    }
  }, [reload, token, toast]);

  // --- Variant management ---
  const openVariants = useCallback(async (product: AdminProduct) => {
    if (!token) return;
    setVariantProductUuid(product.uuid);
    setVariantProductName(product.name);
    setVariantsLoading(true);
    setVariantsError("");
    setShowAddVariant(false);
    setEditingStockUuid(null);
    try {
      const data = await getProductVariants(token, product.uuid);
      setVariants(data ?? []);
    } catch (e) {
      setVariantsError(translateError(e));
    } finally {
      setVariantsLoading(false);
    }
  }, [token]);

  const handleAddVariant = async () => {
    if (!token || !variantProductUuid) return;
    setAddVariantLoading(true);
    setVariantsError("");
    try {
      const attributes: Record<string, string> = {};
      if (newVariant.attrKey.trim() && newVariant.attrValue.trim()) {
        attributes[newVariant.attrKey.trim()] = newVariant.attrValue.trim();
      }
      await addProductVariant(token, variantProductUuid, {
        skuCode: newVariant.skuCode,
        price: newVariant.price,
        stockQuantity: newVariant.stockQuantity,
        attributes: Object.keys(attributes).length ? attributes : undefined,
      });
      toast.show("Thêm biến thể thành công", "success");
      // Refresh variants list
      const data = await getProductVariants(token, variantProductUuid);
      setVariants(data ?? []);
      setShowAddVariant(false);
      setNewVariant({ skuCode: "", price: 0, stockQuantity: 0, attrKey: "", attrValue: "" });
    } catch (e) {
      const err = translateError(e);
      setVariantsError(err);
      toast.show(err, "error");
    } finally {
      setAddVariantLoading(false);
    }
  };

  const handleStockUpdate = async (variantUuid: string) => {
    if (!token || !variantProductUuid) return;
    try {
      await updateVariantStock(token, variantUuid, editingStockValue);
      toast.show("Cập nhật tồn kho thành công", "success");
      const data = await getProductVariants(token, variantProductUuid);
      setVariants(data ?? []);
      setEditingStockUuid(null);
    } catch (e) {
      const err = translateError(e);
      setVariantsError(err);
      toast.show(err, "error");
    }
  };

  const rows = useMemo(() => (result?.content ?? []).map((product) => ({
    id: product.uuid,
    product: (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          {product.avatarUrl ? (
            <img src={product.avatarUrl} alt={product.name} className="h-10 w-10 rounded-2xl object-cover" />
          ) : (
            <PackageSearch className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-950 line-clamp-2 max-w-[200px]" title={product.name}>{product.name}</p>
          <p className="text-xs text-slate-500">#{product.uuid}</p>
        </div>
      </div>
    ),
    status: (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(product.status)}`}>
        {product.status === "ACTIVE" ? "Hoạt động" : product.status === "INACTIVE" ? "Vô hiệu" : "Nháp"}
      </span>
    ),
    createdAt: (
      <div>
        <p className="text-sm font-medium text-slate-900">{formatDateTime(product.createdAt)}</p>
        <p className="text-xs text-slate-500">Bởi: {product.createdBy || "-"}</p>
      </div>
    ),
    updatedAt: (
      <div>
        <p className="text-sm font-medium text-slate-900">{formatDateTime(product.modifiedAt)}</p>
        <p className="text-xs text-slate-500">Bởi: {product.modifiedBy || "-"}</p>
      </div>
    ),
    actions: (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openVariants(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"><Boxes className="h-3.5 w-3.5" /> Variants</button>
        <Link to={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Eye className="h-3.5 w-3.5" /> Chi tiết</Link>
        <button type="button" onClick={() => void toggleStatus(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Power className="h-3.5 w-3.5" /> {product.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}</button>
      </div>
    ),
  })), [result, toggleStatus, openVariants]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Product Management", description: "Quản lý sản phẩm trong hệ thống.", icon: <PackageSearch className="h-5 w-5" /> }}
        searchInput={
          <div className="w-full space-y-5">
            <div className="overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
              <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl w-fit border border-slate-200/50">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPage(0); setStatusFilter(opt.value as ProductStatus | ""); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      statusFilter === opt.value
                        ? "bg-white text-[var(--color-primary)] shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-4 items-center">
              <input
                value={productSearch}
                onChange={(e) => { setPage(0); setProductSearch(e.target.value); }}
                type="search"
                placeholder="Nhập mã hoặc tên sản phẩm..."
                className="w-full lg:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
              
              <SearchableSelect
                value={categoryIdFilter}
                onChange={(val) => { setPage(0); setCategoryIdFilter(val === "" ? "" : Number(val)); }}
                options={[
                  { value: "", label: "Tất cả danh mục" },
                  ...categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))
                ]}
                className="w-full lg:w-48"
              />
              
              <SearchableSelect
                value={brandIdFilter}
                onChange={(val) => { setPage(0); setBrandIdFilter(val === "" ? "" : Number(val)); }}
                options={[
                  { value: "", label: "Tất cả thương hiệu" },
                  ...brands.map((b) => ({ value: b.brandId, label: b.brandName }))
                ]}
                className="w-full lg:w-48"
              />

              <div className="w-full lg:w-auto lg:ml-auto flex flex-wrap justify-end gap-3 items-center">
                <select
                  value={size}
                  onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                >
                  {[10, 20, 50].map((o) => <option key={o} value={o}>{o} / trang</option>)}
                </select>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 outline-none transition hover:bg-rose-100 focus-visible:ring-4 focus-visible:ring-rose-100"
                  title="Xóa bộ lọc"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Xóa lọc</span>
                </button>
                <button
                  onClick={reload}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)] outline-none transition hover:bg-[var(--color-primary)]/20 focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/10 disabled:opacity-50"
                  title="Làm mới"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="btn-primary whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Tạo sản phẩm
                </button>
              </div>
            </div>
          </div>
        }
        columns={[
          { key: "product", label: "Sản phẩm", sortable: true, sortByField: "name" },
          { key: "status", label: "Trạng thái" },
          { key: "createdAt", label: "Ngày tạo", sortable: true, sortByField: "createdAt" },
          { key: "updatedAt", label: "Ngày cập nhật", sortable: true, sortByField: "modifiedAt" },
          { key: "actions", label: "Hành động" },
        ]}
        rows={rows}
        sortBy={sortBy}
        sortType={sortType}
        onSort={handleSort}
        page={page}
        totalPages={result?.totalPages ?? 0}
        totalElements={result?.totalElements ?? 0}
        loading={loading}
        error={error}
        onPageChange={setPage}
      />

    {/* Create / Edit Product Modal */}
    <Modal open={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)} title={isEdit ? `Chi tiết sản phẩm #${formData.uuid.substring(0,8)}` : "Tạo Sản phẩm"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {(() => {
          const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
          return (
            <>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Tên sản phẩm *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Mô tả</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Category</label>
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10">
              <option value={0}>-- Chọn Category --</option>
              {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Brand</label>
            <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10">
              <option value={0}>-- Chọn Brand --</option>
              {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Image URL</label>
            <input value={formData.productAvatarUrl} onChange={(e) => setFormData({ ...formData, productAvatarUrl: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          
          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Giá cơ bản *</label>
                <input required type="number" min={0} value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Số lượng kho *</label>
                <input required type="number" min={0} value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
              </div>
            </>
          )}
        </div>

        {isEdit && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Tạo: {formData.createdAt ? formatDateTime(formData.createdAt) : "-"} · Bởi: {formData.createdBy ?? "-"}</p>
              <p>Cập nhật: {formData.modifiedAt ? formatDateTime(formData.modifiedAt) : "-"} · Bởi: {formData.modifiedBy ?? "-"}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => { setFormData(initialFormData); }} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hoàn tác</button>
          <button type="submit" disabled={formLoading || !hasChanges} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            {formLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
        </>
        );})()}
      </form>
    </Modal>

    {/* Variant Management Modal */}
    <Modal
      open={variantProductUuid !== null}
      onClose={() => { setVariantProductUuid(null); setVariants([]); }}
      title={`Variants — ${variantProductName}`}
      description="Quản lý biến thể sản phẩm: xem, thêm, cập nhật tồn kho."
    >
      {variantsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      )}

      {!variantsLoading && variants.length === 0 && !variantsError && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Boxes className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Chưa có biến thể nào.</p>
        </div>
      )}

      {!variantsLoading && variants.length > 0 && (
        <div className="space-y-3 mb-4">
          {variants.map((v) => (
            <div key={v.variantId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{v.skuCode}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{formatCurrency(v.price)}</p>
                  {v.attributes && v.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {v.attributes.map((a, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {a.attributeName}: {a.attributeValue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {editingStockUuid === String(v.variantId) ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editingStockValue}
                        onChange={(e) => setEditingStockValue(Number(e.target.value))}
                        className="w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-sm text-right outline-none focus:border-[var(--color-primary)]"
                      />
                      <button onClick={() => handleStockUpdate(String(v.variantId))} className="btn-primary px-2.5 py-1.5 text-xs">OK</button>
                      <button onClick={() => setEditingStockUuid(null)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingStockUuid(String(v.variantId)); setEditingStockValue(v.stockQuantity); }}
                      className="text-sm font-medium text-slate-700 hover:text-[var(--color-primary)] transition"
                      title="Click để sửa tồn kho"
                    >
                      Kho: <span className="font-semibold">{v.stockQuantity}</span>
                    </button>
                  )}
                </div>
              </div>
              {/* Variant images */}
              {v.variantImageUrl && v.variantImageUrl.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {v.variantImageUrl.map((img) => (
                    <img key={img.imageId} src={img.imageUrl} alt="" className={`h-10 w-10 rounded-lg object-cover ${img.isAvatar ? "ring-2 ring-[var(--color-primary)]" : ""}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Variant Form */}
      {!showAddVariant ? (
        <button
          onClick={() => setShowAddVariant(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
        >
          <Plus className="inline-block h-4 w-4 mr-1" /> Thêm biến thể
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-900">Thêm biến thể mới</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">SKU Code *</label>
              <input value={newVariant.skuCode} onChange={(e) => setNewVariant({ ...newVariant, skuCode: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="SKU-001" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Giá *</label>
              <input type="number" min={0} value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Số lượng *</label>
              <input type="number" min={0} value={newVariant.stockQuantity} onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Thuộc tính (key)</label>
              <input value={newVariant.attrKey} onChange={(e) => setNewVariant({ ...newVariant, attrKey: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="Màu sắc" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Giá trị</label>
              <input value={newVariant.attrValue} onChange={(e) => setNewVariant({ ...newVariant, attrValue: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="Đỏ" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddVariant(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
            <button
              onClick={handleAddVariant}
              disabled={addVariantLoading || !newVariant.skuCode}
              className="btn-primary px-4 py-2 text-sm"
            >
              {addVariantLoading ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  </>
  );
}
