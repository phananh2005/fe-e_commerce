import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // e.g. 2026-07-19T00:00:00
  endDate: string;   // e.g. 2026-07-19T23:59:59
  onChange: (start: string, end: string) => void;
  placeholder?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, placeholder = "Khoảng thời gian..." }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseLocal = (dateStr: string | null) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const startParsed = parseLocal(startDate);
  const endParsed = parseLocal(endDate);

  const [viewDate, setViewDate] = useState(() => startParsed || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateLabel = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  };

  const toISODate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const display = () => {
    if (startParsed && endParsed) return `${formatDateLabel(startParsed)} - ${formatDateLabel(endParsed)}`;
    if (startParsed) return `${formatDateLabel(startParsed)} - Chọn ngày kết thúc`;
    return placeholder;
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    if (!startParsed || (startParsed && endParsed)) {
      // Pick start date
      onChange(`${toISODate(clickedDate)}T00:00:00`, "");
    } else {
      // Pick end date
      if (clickedDate < startParsed) {
        onChange(`${toISODate(clickedDate)}T00:00:00`, "");
      } else {
        onChange(startDate, `${toISODate(clickedDate)}T23:59:59`);
        setOpen(false);
      }
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getTime();
    const s = startParsed?.getTime();
    const e = endParsed?.getTime();
    if (s && d === s) return true;
    if (e && d === e) return true;
    return false;
  };

  const isInRange = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getTime();
    const s = startParsed?.getTime();
    const e = endParsed?.getTime();
    const h = hoverDate?.getTime();
    
    if (s && e && d > s && d < e) return true;
    if (s && !e && h && d > s && d <= h) return true;
    return false;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 justify-between"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span className={startParsed ? "text-slate-700 font-medium" : "text-slate-400"}>{display()}</span>
        </div>
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-full transition">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-sm font-semibold text-slate-800">
              Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-full transition">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const inRange = isInRange(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`
                    h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm transition
                    ${selected ? "bg-[var(--color-primary)] text-white font-semibold shadow-md" : 
                      inRange ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : 
                      "text-slate-700 hover:bg-slate-100"}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
