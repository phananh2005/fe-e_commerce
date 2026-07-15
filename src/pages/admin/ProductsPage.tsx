import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, PackageSearch, PencilLine, Plus, Power } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-amber-50 text-amber-700",
    DRAFT: "bg-slate-100 text-slate-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

export function ProductsPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: "", description: "", categoryId: 0, brandId: 0, productAvatarUrl: "", price: 0, stockQuantity: 0 });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Variant management state
  const [variantProductId, setVariantProductId] = useState<number | null>(null);
  const [variantProductName, setVariantProductName] = useState("");
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState("");
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({ skuCode: "", price: 0, stockQuantity: 0, attrKey: "", attrValue: "" });
  const [addVariantLoading, setAddVariantLoading] = useState(false);
  // Stock edit inline
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingStockValue, setEditingStockValue] = useState(0);

  useEffect(() => {
    if (!token) return;
    searchBrands(token, { size: 100 }).then(res => setBrands(res.content)).catch(console.error);
    searchCategories(token, { size: 100 }).then(res => setCategories(res.content)).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchProducts(token, {
          keyword: keyword.trim() || undefined,
          page,
          size,
          sortBy: "createdAt",
          sortType: "desc",
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
  }, [token, keyword, page, size, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleOpenCreate = () => {
    setFormData({ id: 0, name: "", description: "", categoryId: categories[0]?.categoryId || 0, brandId: brands[0]?.brandId || 0, productAvatarUrl: "", price: 0, stockQuantity: 0 });
    setIsEdit(false);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: AdminProduct) => {
    setFormData({ 
      id: product.id, 
      name: product.name, 
      description: product.description || "", 
      categoryId: Number(product.categoryName) || 0,
      brandId: Number(product.brandName) || 0,
      productAvatarUrl: product.avatarUrl || "",
      price: 0, stockQuantity: 0
    });
    setIsEdit(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setFormError("");
    try {
      if (isEdit) {
        await updateProduct(token, { productId: formData.id, name: formData.name, description: formData.description, categoryId: formData.categoryId || undefined, brandId: formData.brandId || undefined, productAvatarUrl: formData.productAvatarUrl });
      } else {
        await createProduct(token, { 
          name: formData.name, 
          description: formData.description, 
          categoryId: formData.categoryId || undefined, 
          brandId: formData.brandId || undefined, 
          productAvatarUrl: formData.productAvatarUrl,
          variants: [{ skuCode: `SKU-${Date.now()}`, price: formData.price, stockQuantity: formData.stockQuantity }]
        });
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = useCallback(async (product: AdminProduct) => {
    if (!token) return;
    const nextStatus: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateProductStatus(token, product.id, nextStatus);
    reload();
  }, [reload, token]);

  // --- Variant management ---
  const openVariants = useCallback(async (product: AdminProduct) => {
    if (!token) return;
    setVariantProductId(product.id);
    setVariantProductName(product.name);
    setVariantsLoading(true);
    setVariantsError("");
    setShowAddVariant(false);
    setEditingStockId(null);
    try {
      const data = await getProductVariants(token, product.id);
      setVariants(data ?? []);
    } catch (e) {
      setVariantsError(translateError(e));
    } finally {
      setVariantsLoading(false);
    }
  }, [token]);

  const handleAddVariant = async () => {
    if (!token || !variantProductId) return;
    setAddVariantLoading(true);
    setVariantsError("");
    try {
      const attributes: Record<string, string> = {};
      if (newVariant.attrKey.trim() && newVariant.attrValue.trim()) {
        attributes[newVariant.attrKey.trim()] = newVariant.attrValue.trim();
      }
      await addProductVariant(token, variantProductId, {
        skuCode: newVariant.skuCode,
        price: newVariant.price,
        stockQuantity: newVariant.stockQuantity,
        attributes: Object.keys(attributes).length ? attributes : undefined,
      });
      // Refresh variants list
      const data = await getProductVariants(token, variantProductId);
      setVariants(data ?? []);
      setShowAddVariant(false);
      setNewVariant({ skuCode: "", price: 0, stockQuantity: 0, attrKey: "", attrValue: "" });
    } catch (e) {
      setVariantsError(translateError(e));
    } finally {
      setAddVariantLoading(false);
    }
  };

  const handleStockUpdate = async (variantId: number) => {
    if (!token || !variantProductId) return;
    try {
      await updateVariantStock(token, variantId, editingStockValue);
      const data = await getProductVariants(token, variantProductId);
      setVariants(data ?? []);
      setEditingStockId(null);
    } catch (e) {
      setVariantsError(translateError(e));
    }
  };

  const rows = useMemo(() => (result?.content ?? []).map((product) => ({
    id: String(product.id),
    product: (
      <div>
        <p className="font-semibold text-slate-950">{product.name}</p>
        <p className="line-clamp-2 text-xs text-slate-500">{product.description || "No description"}</p>
      </div>
    ),
    status: <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(product.status)}`}>{product.status}</span>,
    updatedAt: formatDateTime(product.modifiedAt),
    actions: (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openVariants(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"><Boxes className="h-3.5 w-3.5" /> Variants</button>
        <button type="button" onClick={() => handleOpenEdit(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><PencilLine className="h-3.5 w-3.5" /> Sửa</button>
        <button type="button" onClick={() => void toggleStatus(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Power className="h-3.5 w-3.5" /> {product.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}</button>
      </div>
    ),
  })), [result, toggleStatus, openVariants]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Product Management", description: "Quản lý sản phẩm trong hệ thống.", icon: <PackageSearch className="h-5 w-5" /> }}
        headerActions={
          <button type="button" onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Tạo sản phẩm
          </button>
        }
      searchInput={
        <input value={keyword} onChange={(e) => { setPage(0); setKeyword(e.target.value); }} type="search" placeholder="Search products..." className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
      }
      filters={
        <select value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
          {[10, 20, 50].map((o) => <option key={o} value={o}>{o} / page</option>)}
        </select>
      }
      columns={[
        { key: "product", label: "Product" },
        { key: "status", label: "Status" },
        { key: "updatedAt", label: "Updated" },
        { key: "actions", label: "Actions" },
      ]}
      rows={rows}
      page={page}
      totalPages={result?.totalPages ?? 0}
      totalElements={result?.totalElements ?? 0}
      loading={loading}
      error={error}
      onPageChange={setPage}
      onRefresh={reload}
    />

    {/* Create / Edit Product Modal */}
    <Modal open={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)} title={`${isEdit ? "Sửa" : "Tạo"} Sản phẩm`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Tên sản phẩm *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Mô tả</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Category</label>
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
              <option value={0}>-- Chọn Category --</option>
              {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Brand</label>
            <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
              <option value={0}>-- Chọn Brand --</option>
              {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-900">Image URL</label>
            <input value={formData.productAvatarUrl} onChange={(e) => setFormData({ ...formData, productAvatarUrl: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          
          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Giá cơ bản *</label>
                <input required type="number" min={0} value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">Số lượng kho *</label>
                <input required type="number" min={0} value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={formLoading} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">Lưu thay đổi</button>
        </div>
      </form>
    </Modal>

    {/* Variant Management Modal */}
    <Modal
      open={variantProductId !== null}
      onClose={() => { setVariantProductId(null); setVariants([]); }}
      title={`Variants — ${variantProductName}`}
      description="Quản lý biến thể sản phẩm: xem, thêm, cập nhật tồn kho."
    >
      {variantsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      )}

      {variantsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{variantsError}</div>
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
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4">
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
                  {editingStockId === v.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editingStockValue}
                        onChange={(e) => setEditingStockValue(Number(e.target.value))}
                        className="w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-sm text-right outline-none focus:border-indigo-500"
                      />
                      <button onClick={() => handleStockUpdate(v.id)} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">OK</button>
                      <button onClick={() => setEditingStockId(null)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingStockId(v.id); setEditingStockValue(v.stockQuantity); }}
                      className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
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
                    <img key={img.imageId} src={img.imageUrl} alt="" className={`h-10 w-10 rounded-lg object-cover ${img.isAvatar ? "ring-2 ring-indigo-400" : ""}`} />
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
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          <Plus className="inline-block h-4 w-4 mr-1" /> Thêm biến thể
        </button>
      ) : (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-900">Thêm biến thể mới</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">SKU Code *</label>
              <input value={newVariant.skuCode} onChange={(e) => setNewVariant({ ...newVariant, skuCode: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="SKU-001" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Giá *</label>
              <input type="number" min={0} value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Số lượng *</label>
              <input type="number" min={0} value={newVariant.stockQuantity} onChange={(e) => setNewVariant({ ...newVariant, stockQuantity: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Thuộc tính (key)</label>
              <input value={newVariant.attrKey} onChange={(e) => setNewVariant({ ...newVariant, attrKey: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Màu sắc" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Giá trị</label>
              <input value={newVariant.attrValue} onChange={(e) => setNewVariant({ ...newVariant, attrValue: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Đỏ" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddVariant(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
            <button
              onClick={handleAddVariant}
              disabled={addVariantLoading || !newVariant.skuCode}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
