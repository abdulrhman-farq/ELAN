"use client";
import { useEffect, useRef } from "react";

/** Accessible confirm sheet/dialog. Used to gate destructive actions
 *  (e.g. cancelling a booking). Focus-trapped lightly, Esc to dismiss. */
export function ConfirmDialog({
  open,
  title,
  body,
  meta,
  confirmLabel,
  cancelLabel,
  danger,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  meta?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what was focused so we can restore it on close.
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    confirmRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Real focus trap: cycle Tab/Shift+Tab within the dialog.
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (activeEl === first || !root.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !root.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Restore focus to the element that opened the dialog.
      restoreRef.current?.focus?.();
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="presentation">
      <div
        className="absolute inset-0 bg-brand/40 backdrop-blur-[2px]"
        onClick={() => !pending && onClose()}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative m-4 w-full max-w-sm animate-[fadeInUp_.22s_ease-out] rounded-xl border border-outline bg-surface-container p-6 shadow-card"
      >
        <h2 id="confirm-title" className="font-display text-title font-medium text-primary-900">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-meta text-status-full">
          {body}
        </p>
        {meta ? <p className="mt-2 text-meta font-medium text-primary-900">{meta}</p> : null}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            ref={confirmRef}
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`btn button-md ${danger ? "bg-danger text-ink" : "bg-primary text-ink"}`}
          >
            {pending ? <span className="spinner" aria-hidden /> : confirmLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="btn button-md border border-outline bg-surface-elevated text-primary-900"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
