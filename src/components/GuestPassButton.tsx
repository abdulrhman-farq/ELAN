"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookGuestAction } from "@/actions";
import { useToast } from "@/components/Toast";

/** "Bring a guest" control on a bookable class. The host pays 1 credit; the
 *  guest takes a real seat (تصاريح الضيوف). */
export function GuestPassButton({ classInstanceId, ar }: { classInstanceId: string; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, start] = useTransition();

  const errorMsg = (code: string): string => {
    if (/NO_CREDITS/.test(code)) return ar ? "لا يوجد رصيد كافٍ (الضيف يحتاج حصة واحدة)" : "Not enough credits (a guest costs 1 credit)";
    if (/CLASS_FULL/.test(code)) return ar ? "لا توجد مقاعد متاحة" : "No seats available";
    if (/BOOKING_CLOSED/.test(code)) return ar ? "الحجز مغلق لهذه الحصة" : "Booking is closed for this class";
    if (/SUSPENDED/.test(code)) return ar ? "حسابك موقوف مؤقتًا" : "Your account is temporarily suspended";
    if (/GUEST_NAME_REQUIRED/.test(code)) return ar ? "اكتبي اسم الضيف" : "Enter the guest's name";
    return ar ? "تعذّر إضافة الضيف" : "Couldn't add the guest";
  };

  const submit = () =>
    start(async () => {
      const res = await bookGuestAction(classInstanceId, name, phone);
      if ("error" in res && res.error) { toast.error(errorMsg(res.error)); return; }
      toast.success(ar ? "تمت إضافة الضيف 🎉" : "Guest added 🎉");
      setOpen(false); setName(""); setPhone("");
      router.refresh();
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-pill border border-outline px-4 py-2.5 text-body text-primary-700"
      >
        {ar ? "إحضار ضيفة (حصة واحدة)" : "Bring a guest (1 credit)"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-outline p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={ar ? "اسم الضيفة" : "Guest name"}
        aria-label={ar ? "اسم الضيفة" : "Guest name"}
        className="w-full rounded-md border border-outline px-3 py-2 text-body"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={ar ? "جوال الضيفة (اختياري)" : "Guest phone (optional)"}
        aria-label={ar ? "جوال الضيفة (اختياري)" : "Guest phone (optional)"}
        inputMode="tel"
        className="w-full rounded-md border border-outline px-3 py-2 text-body"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !name.trim()}
          onClick={submit}
          className="flex-1 rounded-pill bg-primary-700 px-4 py-2.5 text-body text-white disabled:opacity-50"
        >
          {ar ? "تأكيد الضيفة" : "Confirm guest"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="rounded-pill border border-outline px-4 py-2.5 text-body text-primary-700 disabled:opacity-50"
        >
          {ar ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
