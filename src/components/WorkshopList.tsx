"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerWorkshopAction, cancelWorkshopRegistrationAction } from "@/actions";
import { fmtHalalas } from "@/lib/pricing";
import { fmtLongDateTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import type { WorkshopCardData } from "@/lib/queries";

export function WorkshopList({ workshops, locale }: { workshops: WorkshopCardData[]; locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const errorMsg = (code: string): string => {
    if (/WORKSHOP_FULL/.test(code)) return ar ? "اكتملت المقاعد" : "Workshop is full";
    if (/ALREADY_REGISTERED/.test(code)) return ar ? "أنتِ مسجّلة بالفعل" : "You're already registered";
    if (/REGISTRATION_CLOSED|WORKSHOP_STARTED/.test(code)) return ar ? "التسجيل مغلق" : "Registration is closed";
    return ar ? "تعذّر التسجيل" : "Couldn't register";
  };

  const register = (id: string) =>
    start(async () => {
      const res = await registerWorkshopAction(id);
      if ("error" in res && res.error) { toast.error(errorMsg(res.error)); return; }
      toast.success(ar ? "تم تسجيلكِ 🎉 الدفع في الاستوديو" : "Registered 🎉 pay at the studio");
      router.refresh();
    });

  const cancel = (regId: string) =>
    start(async () => {
      const res = await cancelWorkshopRegistrationAction(regId);
      if ("error" in res && res.error) { toast.error(ar ? "تعذّر الإلغاء" : "Couldn't cancel"); return; }
      toast.success(ar ? "تم إلغاء التسجيل" : "Registration cancelled");
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {workshops.map((w) => {
        const title = ar ? w.title_ar : w.title_en;
        const desc = ar ? w.description_ar : w.description_en;
        const instructor = ar ? w.instructor_ar : w.instructor_en;
        const full = w.seats_left <= 0;
        const mine = Boolean(w.my_registration_id);
        return (
          <div key={w.id} className="card space-y-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lead font-medium text-primary-900">{title}</h3>
              <span className="shrink-0 font-number font-semibold text-primary-700">
                {fmtHalalas(w.price_gross_halalas, ar ? "ar" : "en")} {ar ? "ر.س" : "SAR"}
              </span>
            </div>
            <p className="text-meta text-status-full">
              {fmtLongDateTime(w.starts_at, w.ends_at, locale)}
              {instructor ? ` · ${instructor}` : ""}
              {w.location ? ` · ${w.location}` : ""}
            </p>
            {desc ? <p className="text-body leading-relaxed text-primary-900">{desc}</p> : null}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-caption text-status-full">
                {mine
                  ? ar ? "أنتِ مسجّلة" : "You're registered"
                  : full
                    ? ar ? "اكتملت المقاعد" : "Sold out"
                    : ar
                      ? w.seats_left === 1 ? "بقي مقعد واحد" : w.seats_left === 2 ? "بقي مقعدان" : `بقي ${w.seats_left} مقاعد`
                      : `${w.seats_left} ${w.seats_left === 1 ? "seat" : "seats"} left`}
              </span>
              {mine ? (
                <button type="button" disabled={pending} onClick={() => cancel(w.my_registration_id!)}
                  className="rounded-pill border border-outline px-4 py-2 text-caption text-primary-700 disabled:opacity-50">
                  {ar ? "إلغاء التسجيل" : "Cancel"}
                </button>
              ) : (
                <button type="button" disabled={pending || full} onClick={() => register(w.id)}
                  className="rounded-pill bg-primary-700 px-4 py-2 text-caption text-white disabled:opacity-50">
                  {ar ? "سجّليني" : "Register"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
