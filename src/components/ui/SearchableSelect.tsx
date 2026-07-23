import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 disabled:opacity-50",
          !selectedOption && "text-slate-500",
          isOpen && "border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-300"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Không tìm thấy kết quả</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100",
                    value === opt.value && "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
