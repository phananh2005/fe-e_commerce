import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PromotionCarousel from "../../components/PromotionCarousel";
import QuickCategories from "../../components/QuickCategories";
import FlashSale from "../../components/FlashSale";
import ProductFeed from "../../components/ProductFeed";
import * as customerApi from "../../lib/customerApi";
import type { BrandItem, CategoryItem } from "../../lib/customerApi";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

const PAGE_SIZE = 20;

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const brandId = searchParams.get("brandId") ?? "";

  const [banners] = useState<Array<{ id: string; imageUrl: string }>>([
    { id: "b1", imageUrl: "/assets/banner1.jpg" },
    { id: "b2", imageUrl: "/assets/banner2.jpg" },
  ]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [flashProducts, setFlashProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isFiltering = !!(keyword || categoryId || brandId);

  // Load categories & brands once
  useEffect(() => {
    let mounted = true;
    Promise.all([customerApi.getCategories(), customerApi.getBrands()]).then(
      ([cats, brs]) => {
        if (!mounted) return;
        setCategories(cats ?? []);
        setBrands(brs ?? []);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Load flash sale once (only on clean homepage)
  useEffect(() => {
    if (isFiltering) return;
    let mounted = true;
    customerApi.searchProducts({ page: 0, size: 6 }).then((flash) => {
      if (!mounted) return;
      setFlashProducts(
        (flash || []).map((p: any) => ({
          id: String(p.productId),
          image:
            p.avatarUrl || `https://picsum.photos/seed/p${p.productId}/400/400`,
          title: p.productName,
          price: p.minPrice
            ? `₫${Number(p.minPrice).toLocaleString("vi-VN")}`
            : "₫0",
          originalPrice: undefined,
          discountPercent: undefined,
          rating: 4.5,
          soldPercent: 10,
        })),
      );
    });
    return () => {
      mounted = false;
    };
  }, [isFiltering]);

  // Load products based on filters
  const loadProducts = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      try {
        const result = await customerApi.searchProductsPage({
          keyword: keyword || undefined,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          page: pageNumber,
          size: PAGE_SIZE,
        });

        const mapped = (result.content || []).map((p: any) => ({
          id: String(p.productId),
          image:
            p.avatarUrl || `https://picsum.photos/seed/p${p.productId}/400/400`,
          title: p.productName,
          price: p.minPrice
            ? `₫${Number(p.minPrice).toLocaleString("vi-VN")}`
            : "₫0",
          originalPrice: undefined,
          discountPercent: undefined,
          rating: 4.5,
          sold: 0,
        }));

        setProducts(mapped);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setPage(pageNumber);
      } catch {
        // Silently ignore network errors
      } finally {
        setLoading(false);
      }
    },
    [keyword, categoryId, brandId],
  );

  useEffect(() => {
    loadProducts(0);
  }, [loadProducts]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const selectedCategoryName = categories.find(
    (c) => String(c.categoryId) === categoryId,
  )?.categoryName;
  const selectedBrandName = brands.find(
    (b) => String(b.brandId) === brandId,
  )?.brandName;

  return (
    <div>
      <main className="pt-2">
        {/* Show promotional content only on clean homepage */}
        {!isFiltering && (
          <>
            <PromotionCarousel banners={banners} />
            <QuickCategories categories={categories} />
            <FlashSale
              products={flashProducts}
              endsAt={new Date(
                Date.now() + 1000 * 60 * 60 * 6,
              ).toISOString()}
            />
          </>
        )}

        {/* Filters bar */}
        <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isFiltering ? "Kết quả tìm kiếm" : "Gợi ý hôm nay"}
              </h2>
              {totalElements > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {totalElements.toLocaleString("vi-VN")} sản phẩm
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isFiltering && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Xóa bộ lọc
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  showFilters
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Active filter tags */}
          {isFiltering && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {keyword && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]">
                  Từ khóa: "{keyword}"
                  <button
                    onClick={() => updateFilter("keyword", "")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-primary)]/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategoryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  Danh mục: {selectedCategoryName}
                  <button
                    onClick={() => updateFilter("categoryId", "")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedBrandName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  Thương hiệu: {selectedBrandName}
                  <button
                    onClick={() => updateFilter("brandId", "")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-amber-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Danh mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => updateFilter("categoryId", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Thương hiệu
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => updateFilter("brandId", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {brands.map((b) => (
                      <option key={b.brandId} value={b.brandId}>
                        {b.brandName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Products */}
        {products.length === 0 && !loading ? (
          <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
            <p className="text-slate-500">
              Không tìm thấy sản phẩm nào
              {keyword ? ` cho "${keyword}"` : ""}.
            </p>
            {isFiltering && (
              <button
                onClick={clearAllFilters}
                className="mt-4 btn-primary"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductFeed products={products} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 pb-8 sm:px-6">
                <button
                  onClick={() => loadProducts(page - 1)}
                  disabled={page <= 0 || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => loadProducts(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                  className="btn-primary"
                >
                  Tiếp
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default HomePage;
