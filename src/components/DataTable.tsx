export interface TableColumn {
  key: string;
  label: string;
  className?: string;
}

export interface TableRow {
  id: string;
  [key: string]: React.ReactNode;
}

interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 ${column.className ?? ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
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
