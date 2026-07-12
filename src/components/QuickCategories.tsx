import React from "react";
import { Boxes } from "lucide-react";

interface Category {
  categoryId?: number;
  categoryName: string;
  imageUrl?: string;
}

interface Props {
  categories?: Category[];
}

export function QuickCategories({ categories }: Props) {
  const items =
    categories && categories.length
      ? categories
      : [
          { categoryName: "Điện thoại" },
          { categoryName: "Laptop" },
          { categoryName: "Phụ kiện" },
          { categoryName: "Thời trang" },
        ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="grid grid-cols-4 gap-3">
        {items.map((c, idx) => {
          return (
            <button
              key={c.categoryId ?? `${c.categoryName}-${idx}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm touch-friendly"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Boxes className="h-6 w-6" />
              </div>
              <span className="text-xs text-slate-700">{c.categoryName}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuickCategories;
