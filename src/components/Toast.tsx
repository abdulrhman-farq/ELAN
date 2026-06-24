"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;

/** App-wide toast provider. Mount once (member layout). Calm, accessible
 *  snackbars with role="status" + aria-live polite, auto-dismiss, no layout shift. */
export function ToastProvider({ children, dismissLabel }: { children: ReactNode; dismissLabel: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const api = useRef<ToastApi>({
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
  });

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-50 mx-auto flex max-w-md flex-col items-stretch gap-2 px-4 md:bottom-6 md:start-[240px] md:max-w-sm md:px-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} dismissLabel={dismissLabel} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss, dismissLabel }: { toast: Toast; onDismiss: () => void; dismissLabel: string }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast animate-[fadeInUp_.22s_ease-out] ${toast.variant === "error" ? "toast-error" : ""}`}>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="-me-1 shrink-0 self-center text-status-full transition-opacity hover:opacity-70"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Safe no-op fallback so components render outside a provider (e.g. tests).
  return ctx ?? { success: () => {}, error: () => {} };
}
