import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, PencilLine, Plus, Power, Tag } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  createBrand,
  createCategory,
  searchBrands,
  searchCategories,
  updateBrand,
  updateBrandStatus,
  updateCategory,
  updateCategoryStatus,
  type Brand,
  type Category,
  type PageResult,
} from "../../lib/adminApi";
import { formatDateTime } from "../../lib/format";

function statusBadge(enabled: boolean) {
  return enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700";
}

export function ProductCatalogPage({ section }: { section: "brands" | "categories" }) {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;

  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [brandResult, setBrandResult] = useState<PageResult<Brand> | null>(null);
  const [categoryResult, setCategoryResult] = useState<PageResult<Category> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: "", description: "", imageUrl: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (section === "brands") {
          const data = await searchBrands(token, { keyword: keyword.trim() || undefined, page, size, sortBy: "createdAt", sortType: "desc" });
          if (active) setBrandResult(data);
        } else {
          const data = await searchCategories(token, { keyword: keyword.trim() || undefined, page, size, sortBy: "createdAt", sortType: "desc" });
          if (active) setCategoryResult(data);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : `Failed to load ${section}`);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, keyword, page, size, refreshTick, section]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleOpenCreate = () => {
    setFormData({ id: 0, name: "", description: "", imageUrl: "" });
    setIsEdit(false);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((item: Brand | Category) => {
    if (section === "brands") {
      const b = item as Brand;
      setFormData({ id: b.brandId, name: b.brandName, description: b.brandDescription || "", imageUrl: b.brandImage || "" });
    } else {
      const c = item as Category;
      setFormData({ id: c.categoryId, name: c.categoryName, description: c.categoryDescription || "", imageUrl: c.imageUrl || "" });
    }
    setIsEdit(true);
    setFormError("");
    setIsModalOpen(true);
  }, [section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setFormError("");
    try {
      if (section === "brands") {
        if (isEdit) {
          await updateBrand(token, { brandId: formData.id, name: formData.name, description: formData.description, imageUrl: formData.imageUrl });
        } else {
          await createBrand(token, { name: formData.name, description: formData.description, imageUrl: formData.imageUrl });
        }
      } else {
        if (isEdit) {
          await updateCategory(token, { categoryId: formData.id, categoryName: formData.name, categoryDescription: formData.description, imageUrl: formData.imageUrl });
        } else {
          await createCategory(token, { categoryName: formData.name, categoryDescription: formData.description, imageUrl: formData.imageUrl });
        }
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = useCallback(async (item: Brand | Category) => {
    if (!token) return;
    if (section === "brands") {
      await updateBrandStatus(token, (item as Brand).brandId, item.isEnabled ? "inactive" : "active");
    } else {
      await updateCategoryStatus(token, (item as Category).categoryId, item.isEnabled ? "inactive" : "active");
    }
    reload();
  }, [reload, section, token]);

  const rows = useMemo(() => {
    if (section === "brands") {
      return (brandResult?.content ?? []).map((brand) => ({
        id: String(brand.brandId),
        brand: (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {brand.brandImage ? <img src={brand.brandImage} alt={brand.brandName} className="h-10 w-10 rounded-2xl object-cover" /> : <Tag className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold text-slate-950">{brand.brandName}</p>
              <p className="text-xs text-slate-500">ID #{brand.brandId}</p>
            </div>
          </div>
        ),
        description: brand.brandDescription || "-",
        status: <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(brand.isEnabled)}`}>{brand.isEnabled ? "Enabled" : "Disabled"}</span>,
        updatedAt: formatDateTime(brand.modifiedAt),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleOpenEdit(brand)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><PencilLine className="h-3.5 w-3.5" /> Sửa</button>
            <button type="button" onClick={() => void toggleStatus(brand)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Power className="h-3.5 w-3.5" /> {brand.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
          </div>
        ),
      }));
    }
    return (categoryResult?.content ?? []).map((cat) => ({
      id: String(cat.categoryId),
      category: (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><FolderTree className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold text-slate-950">{cat.categoryName}</p>
            <p className="text-xs text-slate-500">ID #{cat.categoryId}</p>
          </div>
        </div>
      ),
      description: cat.categoryDescription || "-",
      status: <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(cat.isEnabled)}`}>{cat.isEnabled ? "Enabled" : "Disabled"}</span>,
      updatedAt: formatDateTime(cat.modifiedAt),
      actions: (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => handleOpenEdit(cat)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><PencilLine className="h-3.5 w-3.5" /> Sửa</button>
          <button type="button" onClick={() => void toggleStatus(cat)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Power className="h-3.5 w-3.5" /> {cat.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
        </div>
      ),
    }));
  }, [section, brandResult, categoryResult, toggleStatus, handleOpenEdit]);

  const columns = section === "brands" 
    ? [{ key: "brand", label: "Brand" }, { key: "description", label: "Description" }, { key: "status", label: "Status" }, { key: "updatedAt", label: "Updated" }, { key: "actions", label: "Actions" }]
    : [{ key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "status", label: "Status" }, { key: "updatedAt", label: "Updated" }, { key: "actions", label: "Actions" }];

  const result = section === "brands" ? brandResult : categoryResult;

  return (
    <>
      <CrudPageTemplate
        header={{ title: section === "brands" ? "Brand Management" : "Category Management", description: `Quản lý ${section === "brands" ? "thương hiệu" : "danh mục"} trong hệ thống.`, icon: section === "brands" ? <Tag className="h-5 w-5" /> : <FolderTree className="h-5 w-5" /> }}
        headerActions={
          <button type="button" onClick={handleOpenCreate} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
            <Plus className="h-4 w-4" /> Tạo {section === "brands" ? "Brand" : "Category"}
          </button>
        }
        searchInput={<input value={keyword} onChange={(e) => { setPage(0); setKeyword(e.target.value); }} type="search" placeholder={`Search ${section}...`} className="min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />}
      filters={<select value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10">{[10, 20, 50].map((o) => <option key={o} value={o}>{o} / page</option>)}</select>}
      columns={columns}
      rows={rows}
      page={page}
      totalPages={result?.totalPages ?? 0}
      totalElements={result?.totalElements ?? 0}
      loading={loading}
      error={error}
      onPageChange={setPage}
      onRefresh={reload}
    />

    <Modal open={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)} title={`${isEdit ? "Sửa" : "Tạo"} ${section === "brands" ? "Thương hiệu" : "Danh mục"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
        
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Tên {section === "brands" ? "thương hiệu" : "danh mục"} *</label>
          <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Mô tả</label>
          <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">Image URL</label>
          <input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={formLoading} className="btn-primary px-5 py-2.5 text-sm">Lưu thay đổi</button>
        </div>
      </form>
    </Modal>
  </>
  );
}
