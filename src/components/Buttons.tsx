"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { bookAction, cancelAction, purchaseAction, setLocaleAction, signOutAction } from "@/actions";
import type { Locale } from "@/lib/i18n";

export function CtaButton({
  classInstanceId, bookingId, label, variant, disabled,
}: {
  classInstanceId: string;
  bookingId: string | null;
  label: string;
  variant: "primary" | "muted" | "disabled";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const onClick = () =>
    start(async () => {
      if (bookingId) {
        const res = await cancelAction(bookingId, classInstanceId);
        if ("error" in res && res.error) setErr(res.error);
        return;
      }
      const res = await bookAction(classInstanceId);
      if ("bookingId" in res) {
        if (res.bookingId) router.push(`/confirmation/${res.bookingId}`);
        else router.refresh();
      } else {
        setErr(res.error);
      }
    });
  const bg = variant === "primary" ? "bg-primary" : variant === "muted" ? "bg-status-full" : "bg-status-full/50";
  return (
    <div>
      {err ? <p className="mb-2 text-center text-sm text-primary-600">{err}</p> : null}
      <button
        disabled={disabled || pending}
        onClick={onClick}
        className={`w-full rounded-[2px] py-3.5 text-center font-medium text-surface disabled:opacity-50 ${bg}`}
      >
        {pending ? "…" : label}
      </button>
    </div>
  );
}

export function CancelLink({ bookingId, label }: { bookingId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => cancelAction(bookingId).then(() => undefined))}
      className="text-sm text-primary-600 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function BuyButton({ type, refId, label }: { type: "membership" | "credit_pack"; refId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => purchaseAction(type, refId).then(() => undefined))}
      className="shrink-0 rounded-[2px] bg-primary px-5 py-2.5 text-sm font-medium text-surface disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function LangToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (loc: Locale) => start(async () => { await setLocaleAction(loc); router.refresh(); });
  return (
    <div className="inline-flex rounded-pill border border-outline p-0.5 text-sm">
      {(["ar", "en"] as const).map((loc) => (
        <button key={loc} disabled={pending} onClick={() => set(loc)}
          className={`rounded-pill px-3 py-1 ${current === loc ? "bg-primary text-white" : "text-status-full"}`}>
          {loc === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LogoutButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => start(() => signOutAction())}
      className="w-full rounded-card py-3 text-center text-primary-600 disabled:opacity-50">
      {label}
    </button>
  );
}
