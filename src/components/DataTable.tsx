import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  sortByField?: string;
}

export interface TableRow {
  id: string;
  [key: string]: React.ReactNode;
}

interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
  sortBy?: string;
  sortType?: "asc" | "desc";
  onSort?: (key: string) => void;
}

export function DataTable({ columns, rows, sortBy, sortType, onSort }: DataTableProps) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto touch-scroll">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-[var(--color-primary)]/5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 ${column.className ?? ""} ${column.sortable ? "cursor-pointer select-none hover:text-slate-700" : ""}`}
                  onClick={() => column.sortable && onSort?.(column.sortByField ?? column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <span className="text-slate-400">
                        {sortBy === (column.sortByField ?? column.key) ? (
                          sortType === "asc" ? <ArrowUp className="h-3 w-3 text-[var(--color-primary)]" /> : <ArrowDown className="h-3 w-3 text-[var(--color-primary)]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  {columns.map((column) => (
                    <td
                      key={`${row.id}-${column.key}`}
                      className={`px-6 py-4 ${column.className ?? ""}`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  Không có dữ liệu để hiển thị.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
