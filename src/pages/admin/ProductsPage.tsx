import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PackageSearch,
  PencilLine,
  Plus,
  Power,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import { ManagementPage } from "./ManagementPage";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  createProduct,
  searchProducts,
  updateProduct,
  updateProductStatus,
  type AdminProduct,
  type PageResult,
  type ProductStatus,
} from "../../lib/adminApi";
import { formatDateTime, formatNumber } from "../../lib/format";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-amber-50 text-amber-700",
    DRAFT: "bg-slate-100 text-slate-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

type ProductMode = "create" | "edit";

export function ProductsPage() {
  const { session } = useAuth();
  const token = session?.tokens.accessToken;
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshTick, setRefreshTick] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortType] = useState<"asc" | "desc">("desc");
  const [result, setResult] = useState<PageResult<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<ProductMode>("create");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    productId: 0,
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    productAvatarUrl: "",
    status: "ACTIVE" as ProductStatus,
  });

  useEffect(() => {
    if (!token) return;
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchProducts(token, {
          keyword: keyword.trim() || undefined,
          categoryId: categoryId ? Number(categoryId) : null,
          brandId: brandId ? Number(brandId) : null,
          page,
          size,
          sortBy,
          sortType,
        });
        if (active) setResult(data);
      } catch (loadError) {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load products",
          );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProducts();
    return () => {
      active = false;
    };
  }, [
    token,
    keyword,
    categoryId,
    brandId,
    page,
    size,
    sortBy,
    sortType,
    refreshTick,
  ]);

  const reload = useCallback(() => {
    setRefreshTick((currentTick) => currentTick + 1);
  }, []);

  const openCreate = () => {
    setMode("create");
    setDraft({
      productId: 0,
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      productAvatarUrl: "",
      status: "ACTIVE",
    });
    setModalOpen(true);
  };

  const openEdit = useCallback((product: AdminProduct) => {
    setMode("edit");
    setDraft({
      productId: product.id,
      name: product.name,
      description: product.description || "",
      categoryId:
        product.categoryName !== null && product.categoryName !== undefined
          ? String(product.categoryName)
          : "",
      brandId:
        product.brandName !== null && product.brandName !== undefined
          ? String(product.brandName)
          : "",
      productAvatarUrl: product.avatarUrl || "",
      status: product.status as ProductStatus,
    });
    setModalOpen(true);
  }, []);

  const submitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      if (mode === "create") {
        await createProduct(token, {
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          categoryId: draft.categoryId ? Number(draft.categoryId) : undefined,
          brandId: draft.brandId ? Number(draft.brandId) : undefined,
          productAvatarUrl: draft.productAvatarUrl.trim() || undefined,
          variants: [],
        });
      } else {
        await updateProduct(token, {
          productId: draft.productId,
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          categoryId: draft.categoryId ? Number(draft.categoryId) : undefined,
          brandId: draft.brandId ? Number(draft.brandId) : undefined,
          productAvatarUrl: draft.productAvatarUrl.trim() || null,
        });
      }
      setModalOpen(false);
      reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = useCallback(
    async (product: AdminProduct) => {
      if (!token) return;
      const nextStatus: ProductStatus =
        product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateProductStatus(token, product.id, nextStatus);
      reload();
    },
    [reload, token],
  );

  const rows = useMemo(
    () =>
      (result?.content ?? []).map((product) => ({
        id: String(product.id),
        product: (
          <div>
            <p className="font-semibold text-slate-950">{product.name}</p>
            <p className="line-clamp-2 text-xs text-slate-500">
              {product.description || "No description"}
            </p>
          </div>
        ),
        category: product.categoryName ?? "-",
        brand: product.brandName ?? "-",
        status: (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(product.status)}`}
          >
            {product.status}
          </span>
        ),
        updatedAt: formatDateTime(product.modifiedAt),
        actions: (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEdit(product)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PencilLine className="h-3.5 w-3.5" /> Sửa
            </button>
            <button
              type="button"
              onClick={() => void toggleStatus(product)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-3.5 w-3.5" />{" "}
              {product.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}
            </button>
          </div>
        ),
      })),
    [result, openEdit, toggleStatus],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total products",
        value: formatNumber(result?.totalElements ?? 0),
        description: "Kết quả từ /management/product/search",
      },
      {
        label: "Current page",
        value: `${(result?.pageable?.pageNumber ?? page) + 1}`,
        description: "Trang hiện tại",
      },
      {
        label: "Page size",
        value: formatNumber(result?.pageable?.pageSize ?? size),
        description: "Số bản ghi mỗi trang",
      },
      {
        label: "Visible ACTIVE",
        value: formatNumber(
          (result?.content ?? []).filter((item) => item.status === "ACTIVE")
            .length,
        ),
        description: "Sản phẩm đang bán trong trang",
      },
    ],
    [page, result, size],
  );

  const toolbar = (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
      <input
        value={keyword}
        onChange={(event) => {
          setPage(0);
          setKeyword(event.target.value);
        }}
        type="search"
        placeholder="Tìm tên sản phẩm..."
        className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
      <input
        value={categoryId}
        onChange={(event) => {
          setPage(0);
          setCategoryId(event.target.value);
        }}
        type="number"
        min="0"
        placeholder="Category ID"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 xl:w-44"
      />
      <input
        value={brandId}
        onChange={(event) => {
          setPage(0);
          setBrandId(event.target.value);
        }}
        type="number"
        min="0"
        placeholder="Brand ID"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 xl:w-44"
      />
      <select
        value={size}
        onChange={(event) => {
          setPage(0);
          setSize(Number(event.target.value));
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
        onClick={openCreate}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" /> Thêm product
      </button>
      <button
        type="button"
        onClick={reload}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" /> Refresh
      </button>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing page {(result?.pageable?.pageNumber ?? page) + 1} of{" "}
        {formatNumber(result?.totalPages ?? 0)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0 || loading}
          onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={Boolean(result?.last) || loading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const columns = [
    { key: "product", label: "Product" },
    { key: "category", label: "Category ID" },
    { key: "brand", label: "Brand ID" },
    { key: "status", label: "Status" },
    { key: "updatedAt", label: "Updated" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <PackageSearch className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Quản lí product
          </p>
          <p className="text-sm text-slate-500">
            Dữ liệu được lấy trực tiếp từ /management/product/search.
          </p>
        </div>
        <ScanSearch className="ml-auto h-5 w-5 text-slate-400" />
      </div>

      <ManagementPage
        title="Product Management"
        description="Điều phối dữ liệu sản phẩm, tồn kho và trạng thái bán hàng."
        actionLabel="Thêm product"
        metrics={metrics}
        columns={columns}
        rows={rows}
        toolbar={toolbar}
        footer={footer}
        loading={loading}
        error={error}
      />

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create product" : "Edit product"}
        description="Tạo hoặc cập nhật sản phẩm."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitProduct}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Product name
            </span>
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
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
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Category ID
              </span>
              <input
                value={draft.categoryId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Brand ID
              </span>
              <input
                value={draft.brandId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Avatar URL
            </span>
            <input
              value={draft.productAvatarUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  productAvatarUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>
          {mode === "edit" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as ProductStatus,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </label>
          ) : null}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
