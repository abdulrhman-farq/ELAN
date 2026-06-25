"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { bookAction, cancelAction, purchaseAction, setLocaleAction, signOutAction } from "@/actions";
import { dict, type Locale } from "@/lib/i18n";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

/** Booking CTA on class detail. Handles book + (confirmed) cancel.
 *  Cancel is gated behind a confirm dialog. Errors use the danger token. */
export function CtaButton({
  classInstanceId, bookingId, label, variant, disabled, locale, cancelMeta,
}: {
  classInstanceId: string;
  bookingId: string | null;
  label: string;
  variant: "primary" | "muted" | "disabled";
  disabled?: boolean;
  locale: Locale;
  cancelMeta?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doCancel = () =>
    start(async () => {
      setErr(null);
      const res = await cancelAction(bookingId!, classInstanceId);
      if ("error" in res && res.error) {
        setErr(t.toast.cancelFailed);
        toast.error(t.toast.cancelFailed);
        return;
      }
      setConfirmOpen(false);
      toast.success(t.toast.cancelled);
      router.refresh();
    });

  const doBook = () =>
    start(async () => {
      setErr(null);
      const res = await bookAction(classInstanceId);
      if ("bookingId" in res) {
        toast.success(t.toast.booked);
        if (res.bookingId) router.push(`/confirmation/${res.bookingId}`);
        else router.refresh();
      } else {
        setErr(t.toast.bookFailed);
        toast.error(t.toast.bookFailed);
      }
    });

  const onClick = () => {
    if (bookingId) setConfirmOpen(true);
    else doBook();
  };

  const cls =
    variant === "primary" ? "bg-primary text-ink"
    : variant === "muted" ? "bg-status-full text-primary-900"
    : "bg-status-full/40 text-primary-900";

  return (
    <div>
      {err ? <p className="mb-2 text-center text-meta text-danger" role="alert">{err}</p> : null}
      <button
        type="button"
        disabled={disabled || pending}
        onClick={onClick}
        className={`btn button-lg w-full ${cls}`}
      >
        {pending && !bookingId ? <span className="spinner" aria-hidden /> : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t.cancelDialog.title}
        body={t.cancelDialog.body}
        meta={cancelMeta}
        confirmLabel={t.cancelDialog.confirm}
        cancelLabel={t.cancelDialog.keep}
        danger
        pending={pending}
        onConfirm={doCancel}
        onClose={() => !pending && setConfirmOpen(false)}
      />
    </div>
  );
}

/** Cancel link in the bookings list. Gated behind a confirm dialog + success toast. */
export function CancelLink({
  bookingId, label, locale, classMeta,
}: {
  bookingId: string;
  label: string;
  locale: Locale;
  classMeta?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const doCancel = () =>
    start(async () => {
      const res = await cancelAction(bookingId);
      if (res && "error" in res && res.error) {
        toast.error(t.toast.cancelFailed);
        return;
      }
      setOpen(false);
      toast.success(t.toast.cancelled);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="-mx-2 inline-flex min-h-[44px] items-center px-2 text-meta text-danger disabled:opacity-50"
      >
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={t.cancelDialog.title}
        body={t.cancelDialog.body}
        meta={classMeta}
        confirmLabel={t.cancelDialog.confirm}
        cancelLabel={t.cancelDialog.keep}
        danger
        pending={pending}
        onConfirm={doCancel}
        onClose={() => !pending && setOpen(false)}
      />
    </>
  );
}

export function BuyButton({
  type, refId, label, locale,
}: {
  type: "membership" | "credit_pack";
  refId: string;
  label: string;
  locale: Locale;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = dict[locale];
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await purchaseAction(type, refId);
          if (res && "error" in res && res.error) toast.error(t.toast.purchaseFailed);
          else {
            // Purchase creates a pending payment; credits arrive once it is confirmed.
            toast.success("pending" in res && res.pending ? t.toast.purchasePending : t.toast.purchased);
            router.refresh();
          }
        })
      }
      className="btn button-sm shrink-0 bg-primary text-ink"
    >
      {pending ? <span className="spinner" aria-hidden /> : label}
    </button>
  );
}

export function LangToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (loc: Locale) => start(async () => { await setLocaleAction(loc); router.refresh(); });
  return (
    <div className="inline-flex rounded-pill border border-outline p-0.5 text-meta">
      {(["ar", "en"] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={pending}
          onClick={() => set(loc)}
          className={`flex min-h-[44px] items-center rounded-pill px-4 ${current === loc ? "bg-primary text-ink" : "text-status-full"}`}
        >
          {loc === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LogoutButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => signOutAction())}
      className="btn button-md w-full text-danger"
    >
      {pending ? <span className="spinner" aria-hidden /> : label}
    </button>
  );
}
