import React from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const items =
    categories && categories.length
      ? categories
      : [
          { categoryName: "Điện thoại" },
          { categoryName: "Laptop" },
          { categoryName: "Phụ kiện" },
          { categoryName: "Thời trang" },
        ];

  const handleClick = (cat: Category) => {
    if (cat.categoryId) {
      navigate(`/?categoryId=${cat.categoryId}`);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {items.map((c, idx) => {
          return (
            <button
              key={c.categoryId ?? `${c.categoryName}-${idx}`}
              onClick={() => handleClick(c)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm transition hover:border-indigo-300 hover:shadow-sm touch-friendly"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.categoryName}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <Boxes className="h-6 w-6" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 text-center line-clamp-2">{c.categoryName}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuickCategories;
