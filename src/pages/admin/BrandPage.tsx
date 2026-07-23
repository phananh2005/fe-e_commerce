import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Power, Tag, RefreshCw, X } from "lucide-react";
import { CrudPageTemplate } from "../../components/CrudPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createBrand,
  searchBrands,
  updateBrand,
  updateBrandStatus,
  type Brand,
  type PageResult,
} from "../../lib/adminApi";
import { uploadImageToCloudinary } from "../../lib/uploadApi";
import { formatDateTime } from "../../lib/format";
import { useDebounce } from "../../hooks/useDebounce";

function statusBadge(enabled: boolean) {
  return enabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
}

export function BrandPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const toast = useToast();

  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [refreshTick, setRefreshTick] = useState(0);
  const [brandResult, setBrandResult] = useState<PageResult<Brand> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setKeyword("");
    setEnabled(null);
    setPage(0);
    setSortBy("createdAt");
    setSortType("desc");
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: "", description: "", imageUrl: "" });
  const [initialFormData, setInitialFormData] = useState({ id: 0, name: "", description: "", imageUrl: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchBrands(token, { name: debouncedKeyword.trim() || undefined, enabled, page, size, sortBy, sortType });
        if (active) setBrandResult(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load brands");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token, debouncedKeyword, enabled, page, size, sortBy, sortType, refreshTick]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const handleOpenCreate = () => {
    const defaultData = { id: 0, name: "", description: "", imageUrl: "" };
    setFormData(defaultData);
    setInitialFormData(defaultData);
    setImageFile(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((item: Brand) => {
    const defaultData = { id: item.brandId, name: item.brandName, description: item.brandDescription || "", imageUrl: item.brandImage || "" };
    setFormData(defaultData);
    setInitialFormData(defaultData);
    setImageFile(null);
    setIsEdit(true);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImageToCloudinary(imageFile, token, "brand");
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      if (isEdit) {
        await updateBrand(token, { brandId: formData.id, name: formData.name, description: formData.description, imageUrl: finalImageUrl });
        toast.show("Cập nhật thương hiệu thành công", "success");
      } else {
        await createBrand(token, { name: formData.name, description: formData.description, imageUrl: finalImageUrl });
        toast.show("Tạo thương hiệu thành công", "success");
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.show(msg, "error");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = useCallback(async (item: Brand) => {
    if (!token) return;
    try {
      await updateBrandStatus(token, item.brandId, item.isEnabled ? "inactive" : "active");
      toast.show(`Đã ${item.isEnabled ? "vô hiệu hóa" : "kích hoạt"} thương hiệu`, "success");
      reload();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    }
  }, [reload, token, toast]);

  const rows = useMemo(() => {
    return (brandResult?.content ?? []).map((brand) => ({
      id: String(brand.brandId),
      brandName: (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {brand.brandImage ? <img src={brand.brandImage} alt={brand.brandName} className="h-10 w-10 rounded-2xl object-cover" /> : <Tag className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-semibold text-slate-950">{brand.brandName}</p>
            <p className="text-xs text-slate-500">#{brand.brandId}</p>
          </div>
        </div>
      ),
      brandDescription: brand.brandDescription || "-",
      isEnabled: <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(brand.isEnabled)}`}>{brand.isEnabled ? "Hoạt động" : "Vô hiệu"}</span>,
      createdAt: (
        <div>
          <p className="text-sm font-medium text-slate-900">{formatDateTime(brand.createdAt)}</p>
          <p className="text-xs text-slate-500">Bởi: {brand.createdBy || "-"}</p>
        </div>
      ),
      modifiedAt: (
        <div>
          <p className="text-sm font-medium text-slate-900">{formatDateTime(brand.modifiedAt)}</p>
          <p className="text-xs text-slate-500">Bởi:{brand.modifiedBy || "-"}</p>
        </div>
      ),
      actions: (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => handleOpenEdit(brand)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Eye className="h-3.5 w-3.5" /> Chi tiết</button>
          <button type="button" onClick={() => void toggleStatus(brand)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><Power className="h-3.5 w-3.5" /> {brand.isEnabled ? "Vô hiệu" : "Kích hoạt"}</button>
        </div>
      ),
    }));
  }, [brandResult, toggleStatus, handleOpenEdit]);

  const columns = [
    { key: "brandName", label: "Tên thương hiệu", sortable: true, sortByField: "name" }, 
    { key: "brandDescription", label: "Mô tả" }, 
    { key: "isEnabled", label: "Trạng thái" }, 
    { key: "createdAt", label: "Ngày tạo", sortable: true },
    { key: "modifiedAt", label: "Ngày cập nhật", sortable: true },
    { key: "actions", label: "Hành động" }
  ];

  return (
    <>
      <CrudPageTemplate
        header={{ title: "Brand Management", description: "Quản lý thương hiệu trong hệ thống.", icon: <Tag className="h-5 w-5" /> }}
        searchInput={
          <div className="w-full flex flex-col lg:flex-row gap-4 items-center">
            <input
              value={keyword}
              onChange={(e) => { setPage(0); setKeyword(e.target.value); }}
              type="search"
              placeholder="Nhập tên thương hiệu..."
              className="w-full lg:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            />
            <select
              value={enabled === null ? "" : enabled ? "true" : "false"}
              onChange={(e) => {
                setPage(0);
                const val = e.target.value;
                setEnabled(val === "" ? null : val === "true");
              }}
              className="w-full lg:w-48 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Đã vô hiệu</option>
            </select>
            
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
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl"
              >
                <Plus className="h-4 w-4" /> Tạo thương hiệu mới
              </button>
            </div>
          </div>
        }
        columns={columns}
        rows={rows}
        sortBy={sortBy}
        sortType={sortType}
        onSort={handleSort}
        page={page}
        totalPages={brandResult?.totalPages ?? 0}
        totalElements={brandResult?.totalElements ?? 0}
        loading={loading}
        error={error}
        onPageChange={setPage}
      />

      <Modal className="max-w-4xl" open={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)} title={isEdit ? `Chi tiết thương hiệu #${formData.id}` : "Tạo thương hiệu"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {(() => {
            const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData) || !!imageFile;
            return (
              <>
          
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Tên thương hiệu *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Mô tả</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">Hình ảnh</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setImageFile(e.target.files[0]);
                  setFormData({ ...formData, imageUrl: URL.createObjectURL(e.target.files[0]) });
                }
              }} 
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20" 
            />
            {formData.imageUrl && (
              <div className="mt-3 relative inline-block">
                <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setFormData({ ...formData, imageUrl: "" });
                  }}
                  className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-white p-1 text-slate-400 shadow-sm border border-slate-200 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setFormData(initialFormData); setImageFile(null); }} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hoàn tác</button>
            <button type="submit" disabled={formLoading || !hasChanges} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
              {formLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
          </>
          );})()}
        </form>
      </Modal>
    </>
  );
}
