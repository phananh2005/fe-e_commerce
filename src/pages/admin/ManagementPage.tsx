import { Filter, Plus } from "lucide-react";
import {
  DataTable,
  type TableColumn,
  type TableRow,
} from "../../components/DataTable";
import type { ReactNode } from "react";

interface MetricItem {
  label: string;
  value: string;
  description: string;
}

interface ManagementPageProps {
  title: string;
  description: string;
  actionLabel: string;
  metrics: MetricItem[];
  columns: TableColumn[];
  rows: TableRow[];
  toolbar?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string;
}

export function ManagementPage({
  title,
  description,
  actionLabel,
  metrics,
  columns,
  rows,
  toolbar,
  footer,
  loading = false,
  error,
}: ManagementPageProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
              {title}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {description}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            {toolbar ?? (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  {actionLabel}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {metric.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Bảng dữ liệu
            </h2>
            <p className="text-sm text-slate-500">
              Dữ liệu được đồng bộ trực tiếp từ backend.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            Đang tải dữ liệu...
          </div>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}

        {footer}
      </section>
    </div>
  );
}
