import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageSearch, Eye, Plus, Power, RefreshCw, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { SearchableMultiSelect } from "../../components/ui/SearchableMultiSelect";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  searchBrands,
  searchCategories,
  searchProducts,
  updateProductStatus,
  getProductVariantsSummary,
  updateVariantStockAndPrice,
  type AdminProduct,
  type Brand,
  type Category,
  type PageResult,
  type ProductStatus,
} from "../../lib/adminApi";
import { formatDateTime } from "../../lib/format";
import { translateError, translateProductStatus } from "../../lib/i18n";
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

function ProductVariantsRow({ productUuid, token }: { productUuid: string, token: string }) {
  const [variants, setVariants] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<number, { stockQuantity: number, price: number, status?: "ACTIVE" | "INACTIVE" }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  
  const loadVariants = useCallback(() => {
    setLoading(true);
    getProductVariantsSummary(token, productUuid)
      .then(res => {
        setVariants(res.variants);
        const initEdits: Record<number, any> = {};
        res.variants.forEach((v: any) => initEdits[v.variantUuid] = { stockQuantity: v.stockQuantity, price: v.price, status: v.status });
        setEdits(initEdits);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, productUuid]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const hasChanges = variants.some(v => 
    edits[v.variantUuid]?.stockQuantity !== v.stockQuantity || 
    edits[v.variantUuid]?.price !== v.price ||
    (edits[v.variantUuid]?.status && edits[v.variantUuid]?.status !== v.status)
  );

  const handleSaveAll = async () => {
    const changed = variants.filter(v => 
      edits[v.variantUuid]?.stockQuantity !== v.stockQuantity || 
      edits[v.variantUuid]?.price !== v.price ||
      (edits[v.variantUuid]?.status && edits[v.variantUuid]?.status !== v.status)
    );
    if (!changed.length) return;
    
    setSaving(true);
    try {
      await Promise.all(changed.map(v => 
        updateVariantStockAndPrice(token, String(v.variantUuid), edits[v.variantUuid])
      ));
      toast.show("Cập nhật thành công", "success");
      
      setVariants(prev => prev.map(v => ({
        ...v,
        stockQuantity: edits[v.variantUuid]?.stockQuantity ?? v.stockQuantity,
        price: edits[v.variantUuid]?.price ?? v.price,
        status: edits[v.variantUuid]?.status ?? v.status
      })));
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    const initEdits: Record<number, any> = {};
    variants.forEach(v => initEdits[v.variantUuid] = { stockQuantity: v.stockQuantity, price: v.price });
    setEdits(initEdits);
  };

  if (loading) return <div className="p-4 text-center text-sm text-slate-500 animate-pulse">Đang tải biến thể...</div>;
  if (!variants.length) return <div className="p-4 text-center text-sm text-slate-500">Chưa có biến thể nào</div>;

  return (
    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 m-2">
       <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
         <table className="min-w-full text-left text-sm divide-y divide-slate-200">
           <thead className="bg-slate-50 text-slate-500 font-medium">
             <tr>
               <th className="px-4 py-3">Tên biến thể</th>
               <th className="px-4 py-3 w-32">Số lượng</th>
               <th className="px-4 py-3 w-40">Giá (VNĐ)</th>
               <th className="px-4 py-3 w-28">Trạng thái</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {variants.map(v => (
               <tr key={v.variantUuid} className="hover:bg-slate-50/50">
                 <td className="px-4 py-2 flex items-center gap-3">
                   {v.avatarImageUrl ? (
                      <img src={v.avatarImageUrl} alt={v.skuCode} className="w-8 h-8 rounded object-cover border border-slate-200" />
                   ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <PackageSearch className="w-4 h-4" />
                      </div>
                   )}
                   <span className="font-medium text-slate-700 truncate">
                     {v.skuCode || <span className="italic text-slate-400">Trống</span>}
                   </span>
                 </td>
                 <td className="px-4 py-2">
                   <input 
                     type="number" min={0} 
                     value={edits[v.variantUuid]?.stockQuantity ?? v.stockQuantity} 
                     onChange={e => setEdits(prev => ({ ...prev, [v.variantUuid]: { ...prev[v.variantUuid], stockQuantity: Number(e.target.value) } }))} 
                     className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-[var(--color-primary)] outline-none" 
                   />
                 </td>
                 <td className="px-4 py-2">
                   <input 
                     type="number" min={0} 
                     value={edits[v.variantUuid]?.price ?? v.price} 
                     onChange={e => setEdits(prev => ({ ...prev, [v.variantUuid]: { ...prev[v.variantUuid], price: Number(e.target.value) } }))} 
                     className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-[var(--color-primary)] outline-none" 
                   />
                 </td>
                 <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = edits[v.variantUuid]?.status ?? v.status;
                        const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                        setEdits(prev => ({ ...prev, [v.variantUuid]: { ...prev[v.variantUuid], status: next } }));
                      }}
                      className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                        (edits[v.variantUuid]?.status ?? v.status) === "ACTIVE" 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {(edits[v.variantUuid]?.status ?? v.status) === "ACTIVE" ? "Kích hoạt" : "Vô hiệu"}
                    </button>
                  </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
       
       <div className="mt-3 flex justify-end gap-2">
          <button 
            type="button" 
            onClick={handleUndo} 
            disabled={saving} 
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Hoàn tác
          </button>
          <button 
            type="button" 
            onClick={handleSaveAll} 
            disabled={!hasChanges || saving} 
            className="btn-primary px-4 py-2 text-xs flex justify-center items-center disabled:opacity-50 min-w-[100px]"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Lưu thay đổi"}
          </button>
       </div>
    </div>
  )
}

export function ProductsPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 500);
  const [categoryIdFilter, setCategoryIdFilter] = useState<number[]>([]);
  const [brandIdFilter, setBrandIdFilter] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<PageResult<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);


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
    setCategoryIdFilter([]);
    setBrandIdFilter([]);
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
          categoryId: categoryIdFilter.length === 0 ? undefined : categoryIdFilter,
          brandId: brandIdFilter.length === 0 ? undefined : brandIdFilter,
          status: statusFilter === "" ? undefined : statusFilter,
          page,
          size,
          sortBy,
          sortType,
        });
        if (active) setResult(data);
      } catch (e) {
        if (active) setError(translateError(e));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, debouncedProductSearch, categoryIdFilter, brandIdFilter, statusFilter, page, size, sortBy, sortType, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const toggleStatus = useCallback(async (product: AdminProduct) => {
    if (!token) return;
    try {
      const nextStatus: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateProductStatus(token, product.uuid, nextStatus);
      toast.show(`Đã chuyển trạng thái sản phẩm thành "${translateProductStatus(nextStatus)}"`, "success");
      reload();
    } catch (err) {
      toast.show(translateError(err), "error");
    }
  }, [reload, token, toast]);




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
        <button
          type="button"
          onClick={() => setExpandedRows(prev => ({ ...prev, [product.uuid]: !prev[product.uuid] }))}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${expandedRows[product.uuid] ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}
        >
          <Zap className="h-3.5 w-3.5" />
          Sửa nhanh
        </button>
        <Link to={`/admin/products/${product.id}/edit`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Eye className="h-3.5 w-3.5" /> Chỉnh sửa</Link>
        <button type="button" onClick={() => void toggleStatus(product)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Power className="h-3.5 w-3.5" /> {product.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}</button>
      </div>
    ),
    expandedContent: expandedRows[product.uuid] && token ? <ProductVariantsRow productUuid={product.uuid} token={token} /> : undefined,
  })), [result, toggleStatus, expandedRows, token]);

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Quản lý sản phẩm", description: "Quản lý sản phẩm trong hệ thống.", icon: <PackageSearch className="h-5 w-5" /> }}
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
              
              <SearchableMultiSelect
                value={categoryIdFilter}
                onChange={(val) => { setPage(0); setCategoryIdFilter(val as number[]); }}
                options={categories.map((c) => ({ value: c.categoryId, label: c.categoryName }))}
                placeholder="Tất cả danh mục"
                className="w-full lg:w-56"
              />
              
              <SearchableMultiSelect
                value={brandIdFilter}
                onChange={(val) => { setPage(0); setBrandIdFilter(val as number[]); }}
                options={brands.map((b) => ({ value: b.brandId, label: b.brandName }))}
                placeholder="Tất cả thương hiệu"
                className="w-full lg:w-56"
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
                <Link
                  to="/admin/products/new"
                  className="btn-primary whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Tạo sản phẩm
                </Link>
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

  </>
  );
}
