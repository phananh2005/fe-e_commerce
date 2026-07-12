import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  FolderTree,
  PencilLine,
  Plus,
  Power,
  RefreshCw,
  Tag,
} from "lucide-react";
import { ManagementPage } from "./ManagementPage";
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
import { formatDateTime, formatNumber } from "../../lib/format";

function statusBadge(enabled: boolean) {
  return enabled
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-700";
}

type BrandMode = "create" | "edit";
type CategoryMode = "create" | "edit";

export function ProductCatalogPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;

  const [brandKeyword, setBrandKeyword] = useState("");
  const [brandPage, setBrandPage] = useState(0);
  const [brandSize, setBrandSize] = useState(10);
  const [brandRefreshTick, setBrandRefreshTick] = useState(0);
  const [brandResult, setBrandResult] = useState<PageResult<Brand> | null>(
    null,
  );
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandError, setBrandError] = useState("");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandMode, setBrandMode] = useState<BrandMode>("create");
  const [brandDraft, setBrandDraft] = useState({
    brandId: 0,
    name: "",
    description: "",
    imageUrl: "",
  });
  const [brandSaving, setBrandSaving] = useState(false);

  const [categoryKeyword, setCategoryKeyword] = useState("");
  const [categoryPage, setCategoryPage] = useState(0);
  const [categorySize, setCategorySize] = useState(10);
  const [categoryRefreshTick, setCategoryRefreshTick] = useState(0);
  const [categoryResult, setCategoryResult] =
    useState<PageResult<Category> | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("create");
  const [categoryDraft, setCategoryDraft] = useState({
    categoryId: 0,
    categoryName: "",
    categoryDescription: "",
    imageUrl: "",
  });
  const [categorySaving, setCategorySaving] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadBrands = async () => {
      setBrandLoading(true);
      setBrandError("");

      try {
        const data = await searchBrands(token, {
          keyword: brandKeyword.trim() || undefined,
          page: brandPage,
          size: brandSize,
          sortBy: "createdAt",
          sortType: "desc",
        });

        if (active) {
          setBrandResult(data);
        }
      } catch (loadError) {
        if (active) {
          setBrandError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load brands",
          );
        }
      } finally {
        if (active) {
          setBrandLoading(false);
        }
      }
    };

    void loadBrands();

    return () => {
      active = false;
    };
  }, [token, brandKeyword, brandPage, brandSize, brandRefreshTick]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadCategories = async () => {
      setCategoryLoading(true);
      setCategoryError("");

      try {
        const data = await searchCategories(token, {
          keyword: categoryKeyword.trim() || undefined,
          page: categoryPage,
          size: categorySize,
          sortBy: "createdAt",
          sortType: "desc",
        });

        if (active) {
          setCategoryResult(data);
        }
      } catch (loadError) {
        if (active) {
          setCategoryError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load categories",
          );
        }
      } finally {
        if (active) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, [token, categoryKeyword, categoryPage, categorySize, categoryRefreshTick]);

  const reloadBrands = () =>
    setBrandRefreshTick((currentTick) => currentTick + 1);
  const reloadCategories = () =>
    setCategoryRefreshTick((currentTick) => currentTick + 1);

  const openCreateBrand = () => {
    setBrandMode("create");
    setBrandDraft({ brandId: 0, name: "", description: "", imageUrl: "" });
    setBrandModalOpen(true);
  };

  const openEditBrand = (brand: Brand) => {
    setBrandMode("edit");
    setBrandDraft({
      brandId: brand.brandId,
      name: brand.brandName,
      description: brand.brandDescription || "",
      imageUrl: brand.brandImage || "",
    });
    setBrandModalOpen(true);
  };

  const submitBrand = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setBrandSaving(true);
    try {
      if (brandMode === "create") {
        await createBrand(token, {
          name: brandDraft.name.trim(),
          description: brandDraft.description.trim() || undefined,
          imageUrl: brandDraft.imageUrl.trim() || undefined,
        });
      } else {
        await updateBrand(token, {
          brandId: brandDraft.brandId,
          name: brandDraft.name.trim(),
          description: brandDraft.description.trim() || undefined,
          imageUrl: brandDraft.imageUrl.trim() || null,
        });
      }

      setBrandModalOpen(false);
      reloadBrands();
    } catch (saveError) {
      setBrandError(
        saveError instanceof Error ? saveError.message : "Unable to save brand",
      );
    } finally {
      setBrandSaving(false);
    }
  };

  const toggleBrandStatus = async (brand: Brand) => {
    if (!token) {
      return;
    }

    await updateBrandStatus(
      token,
      brand.brandId,
      brand.isEnabled ? "inactive" : "active",
    );
    reloadBrands();
  };

  const openCreateCategory = () => {
    setCategoryMode("create");
    setCategoryDraft({
      categoryId: 0,
      categoryName: "",
      categoryDescription: "",
      imageUrl: "",
    });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setCategoryMode("edit");
    setCategoryDraft({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription || "",
      imageUrl: category.imageUrl || "",
    });
    setCategoryModalOpen(true);
  };

  const submitCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setCategorySaving(true);
    try {
      if (categoryMode === "create") {
        await createCategory(token, {
          categoryName: categoryDraft.categoryName.trim(),
          categoryDescription:
            categoryDraft.categoryDescription.trim() || undefined,
          imageUrl: categoryDraft.imageUrl.trim() || undefined,
        });
      } else {
        await updateCategory(token, {
          categoryId: categoryDraft.categoryId,
          categoryName: categoryDraft.categoryName.trim() || undefined,
          categoryDescription:
            categoryDraft.categoryDescription.trim() || undefined,
          imageUrl: categoryDraft.imageUrl.trim() || null,
        });
      }

      setCategoryModalOpen(false);
      reloadCategories();
    } catch (saveError) {
      setCategoryError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save category",
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    if (!token) {
      return;
    }

    await updateCategoryStatus(
      token,
      category.categoryId,
      category.isEnabled ? "inactive" : "active",
    );
    reloadCategories();
  };

  const brandRows = useMemo(
    () =>
      (brandResult?.content ?? []).map((brand) => ({
        id: String(brand.brandId),
        brand: (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {brand.brandImage ? (
                <img
                  src={brand.brandImage}
                  alt={brand.brandName}
                  className="h-10 w-10 rounded-2xl object-cover"
                />
              ) : (
                <Tag className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-950">{brand.brandName}</p>
              <p className="text-xs text-slate-500">ID #{brand.brandId}</p>
            </div>
          </div>
        ),
        description: brand.brandDescription || "-",
        status: (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(brand.isEnabled)}`}
          >
            {brand.isEnabled ? "Enabled" : "Disabled"}
          </span>
        ),
        updatedAt: formatDateTime(brand.modifiedAt),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEditBrand(brand)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PencilLine className="h-3.5 w-3.5" /> Sửa
            </button>
            <button
              type="button"
              onClick={() => void toggleBrandStatus(brand)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-3.5 w-3.5" />{" "}
              {brand.isEnabled ? "Vô hiệu" : "Kích hoạt"}
            </button>
          </div>
        ),
      })),
    [brandResult],
  );

  const categoryRows = useMemo(
    () =>
      (categoryResult?.content ?? []).map((category) => ({
        id: String(category.categoryId),
        category: (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">
                {category.categoryName}
              </p>
              <p className="text-xs text-slate-500">
                ID #{category.categoryId}
              </p>
            </div>
          </div>
        ),
        description: category.categoryDescription || "-",
        status: (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(category.isEnabled)}`}
          >
            {category.isEnabled ? "Enabled" : "Disabled"}
          </span>
        ),
        updatedAt: formatDateTime(category.modifiedAt),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEditCategory(category)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PencilLine className="h-3.5 w-3.5" /> Sửa
            </button>
            <button
              type="button"
              onClick={() => void toggleCategoryStatus(category)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-3.5 w-3.5" />{" "}
              {category.isEnabled ? "Vô hiệu" : "Kích hoạt"}
            </button>
          </div>
        ),
      })),
    [categoryResult],
  );

  const brandMetrics = useMemo(
    () => [
      {
        label: "Total brands",
        value: formatNumber(brandResult?.totalElements ?? 0),
        description: "Từ /admin/brands/search",
      },
      {
        label: "Page",
        value: `${(brandResult?.pageable?.pageNumber ?? brandPage) + 1}`,
        description: "Trang hiện tại",
      },
      {
        label: "Size",
        value: formatNumber(brandResult?.pageable?.pageSize ?? brandSize),
        description: "Số bản ghi/trang",
      },
      {
        label: "Enabled on page",
        value: formatNumber(
          (brandResult?.content ?? []).filter((item) => item.isEnabled).length,
        ),
        description: "Thương hiệu đang bật",
      },
    ],
    [brandPage, brandResult, brandSize],
  );

  const categoryMetrics = useMemo(
    () => [
      {
        label: "Total categories",
        value: formatNumber(categoryResult?.totalElements ?? 0),
        description: "Từ /admin/categories/search",
      },
      {
        label: "Page",
        value: `${(categoryResult?.pageable?.pageNumber ?? categoryPage) + 1}`,
        description: "Trang hiện tại",
      },
      {
        label: "Size",
        value: formatNumber(categoryResult?.pageable?.pageSize ?? categorySize),
        description: "Số bản ghi/trang",
      },
      {
        label: "Enabled on page",
        value: formatNumber(
          (categoryResult?.content ?? []).filter((item) => item.isEnabled)
            .length,
        ),
        description: "Danh mục đang bật",
      },
    ],
    [categoryPage, categoryResult, categorySize],
  );

  const brandToolbar = (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
      <input
        value={brandKeyword}
        onChange={(event) => {
          setBrandPage(0);
          setBrandKeyword(event.target.value);
        }}
        type="search"
        placeholder="Search brands..."
        className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
      <select
        value={brandSize}
        onChange={(event) => {
          setBrandPage(0);
          setBrandSize(Number(event.target.value));
        }}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        {[10, 20, 50].map((option) => (
          <option key={option} value={option}>
            {option} / page
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={openCreateBrand}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" /> Thêm brand
      </button>
      <button
        type="button"
        onClick={reloadBrands}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" /> Refresh
      </button>
    </div>
  );

  const categoryToolbar = (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
      <input
        value={categoryKeyword}
        onChange={(event) => {
          setCategoryPage(0);
          setCategoryKeyword(event.target.value);
        }}
        type="search"
        placeholder="Search categories..."
        className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
      <select
        value={categorySize}
        onChange={(event) => {
          setCategoryPage(0);
          setCategorySize(Number(event.target.value));
        }}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      >
        {[10, 20, 50].map((option) => (
          <option key={option} value={option}>
            {option} / page
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={openCreateCategory}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" /> Thêm category
      </button>
      <button
        type="button"
        onClick={reloadCategories}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" /> Refresh
      </button>
    </div>
  );

  const brandFooter = (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing page {(brandResult?.pageable?.pageNumber ?? brandPage) + 1} of{" "}
        {formatNumber(brandResult?.totalPages ?? 0)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={brandPage <= 0 || brandLoading}
          onClick={() =>
            setBrandPage((currentPage) => Math.max(0, currentPage - 1))
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={Boolean(brandResult?.last) || brandLoading}
          onClick={() => setBrandPage((currentPage) => currentPage + 1)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const categoryFooter = (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing page{" "}
        {(categoryResult?.pageable?.pageNumber ?? categoryPage) + 1} of{" "}
        {formatNumber(categoryResult?.totalPages ?? 0)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={categoryPage <= 0 || categoryLoading}
          onClick={() =>
            setCategoryPage((currentPage) => Math.max(0, currentPage - 1))
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={Boolean(categoryResult?.last) || categoryLoading}
          onClick={() => setCategoryPage((currentPage) => currentPage + 1)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Quản lí productcatalog
          </p>
          <p className="text-sm text-slate-500">
            Brand và category đang được đồng bộ từ backend.
          </p>
        </div>
        <BadgeCheck className="ml-auto h-5 w-5 text-emerald-500" />
      </div>

      <ManagementPage
        title="Brand Management"
        description="Quản lý thương hiệu trong product catalog."
        actionLabel="Thêm brand"
        metrics={brandMetrics}
        columns={[
          { key: "brand", label: "Brand" },
          { key: "description", label: "Description" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={brandRows}
        toolbar={brandToolbar}
        footer={brandFooter}
        loading={brandLoading}
        error={brandError}
      />

      <ManagementPage
        title="Category Management"
        description="Quản lý danh mục trong product catalog."
        actionLabel="Thêm category"
        metrics={categoryMetrics}
        columns={[
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" },
          { key: "actions", label: "Actions" },
        ]}
        rows={categoryRows}
        toolbar={categoryToolbar}
        footer={categoryFooter}
        loading={categoryLoading}
        error={categoryError}
      />

      <Modal
        open={brandModalOpen}
        title={brandMode === "create" ? "Create brand" : "Edit brand"}
        description="Tạo hoặc cập nhật thương hiệu."
        onClose={() => setBrandModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitBrand}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Brand name
            </span>
            <input
              value={brandDraft.name}
              onChange={(event) =>
                setBrandDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              value={brandDraft.description}
              onChange={(event) =>
                setBrandDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Image URL
            </span>
            <input
              value={brandDraft.imageUrl}
              onChange={(event) =>
                setBrandDraft((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setBrandModalOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={brandSaving}
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {brandSaving ? "Saving..." : "Save brand"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={categoryModalOpen}
        title={categoryMode === "create" ? "Create category" : "Edit category"}
        description="Tạo hoặc cập nhật danh mục."
        onClose={() => setCategoryModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitCategory}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Category name
            </span>
            <input
              value={categoryDraft.categoryName}
              onChange={(event) =>
                setCategoryDraft((current) => ({
                  ...current,
                  categoryName: event.target.value,
                }))
              }
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              value={categoryDraft.categoryDescription}
              onChange={(event) =>
                setCategoryDraft((current) => ({
                  ...current,
                  categoryDescription: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Image URL
            </span>
            <input
              value={categoryDraft.imageUrl}
              onChange={(event) =>
                setCategoryDraft((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={categorySaving}
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {categorySaving ? "Saving..." : "Save category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
