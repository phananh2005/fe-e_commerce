import React, { createContext, useContext, useCallback, useState } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" };

const ToastContext = createContext<{
  show: (message: string, type?: "success" | "error") => void;
}>({
  show: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 2800);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[320px] max-w-md rounded-xl px-6 py-4 text-base font-medium shadow-xl transition transform-gpu flex items-center justify-between ${
              t.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
