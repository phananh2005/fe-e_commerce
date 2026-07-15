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
  page,
  totalPages,
  totalElements,
  loading = false,
  error,
  onPageChange,
  onRefresh,
}: CrudPageTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {header.icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            {header.icon}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-950">{header.title}</p>
          <p className="text-sm text-slate-500">{header.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {headerActions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {(searchInput || filters) && (
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {searchInput}
          {filters && <div className="flex flex-wrap gap-3">{filters}</div>}
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <p className="text-sm text-slate-400">Không có dữ liệu nào.</p>
        </div>
      )}

      {!loading && rows.length > 0 && <DataTable columns={columns} rows={rows} />}

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Trang {page + 1} / {formatNumber(totalPages)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(page - 1)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
