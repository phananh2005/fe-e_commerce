import { RefreshCw } from "lucide-react";
import { DataTable, type TableColumn, type TableRow } from "./DataTable";
import { formatNumber } from "../lib/format";

export interface CrudPageTemplateProps {
  header: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
  /** Additional header actions (e.g. Create button) */
  headerActions?: React.ReactNode;
  /** Search input element */
  searchInput?: React.ReactNode;
  /** Additional filter controls */
  filters?: React.ReactNode;
  columns: TableColumn[];
  rows: TableRow[];
  sortBy?: string;
  sortType?: "asc" | "desc";
  onSort?: (key: string) => void;
  page: number;
  totalPages: number;
  totalElements?: number;
  loading?: boolean;
  error?: string;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

export function CrudPageTemplate({
  header,
  headerActions,
  searchInput,
  filters,
  columns,
  rows,
  sortBy,
  sortType,
  onSort,
  page,
  totalPages,
  loading = false,
  error,
  onPageChange,
  onRefresh,
}: CrudPageTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {(headerActions || onRefresh) && (
        <div className="flex justify-end items-center gap-2">
          {headerActions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
          )}
        </div>
      )}

      {/* Search bar */}
      {(searchInput || filters) && (
        <div className="flex flex-wrap items-end justify-between gap-4 card p-5">
          {searchInput}
          {filters && <div className="flex flex-wrap gap-3">{filters}</div>}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-5 py-4 text-sm text-[var(--color-destructive)]">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center card py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]" />
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="card px-5 py-16 text-center">
          <p className="text-sm text-slate-400">Không có dữ liệu nào.</p>
        </div>
      )}

      {!loading && rows.length > 0 && <DataTable columns={columns} rows={rows} sortBy={sortBy} sortType={sortType} onSort={onSort} />}

      {/* Pagination */}
      <div className="flex flex-col gap-3 card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Trang {page + 1} / {formatNumber(totalPages)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(page - 1)}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => onPageChange(page + 1)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
