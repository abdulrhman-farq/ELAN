"use client";

import { useState, useTransition, type ReactNode } from "react";
import { updateStudioSettingsAction } from "@/admin-actions";
import type { StudioSettings } from "@/lib/queries";
import { useToast } from "@/components/Toast";

export function SettingsForm({ initial, ar }: { initial: StudioSettings; ar: boolean }) {
  const [form, setForm] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();

  function set<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    start(async () => {
      const res = await updateStudioSettingsAction({
        ...form,
        phone: form.phone ?? undefined,
        email: form.email ?? undefined,
        address: form.address ?? undefined,
      });
      if (res.ok) toast.success(ar ? "تم حفظ الإعدادات" : "Settings saved");
      else toast.error(res.error);
    });
  }

  const label = "mb-1 block text-meta text-status-full";
  const field = "w-full rounded-sm border border-outline bg-surface-elevated px-3 py-2.5 text-body outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={ar ? "معلومات الاستوديو" : "Studio info"}>
          <Field label={ar ? "اسم الاستوديو (عربي)" : "Studio name (Arabic)"}>
            <input className={field} value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
          </Field>
          <Field label={ar ? "اسم الاستوديو (إنجليزي)" : "Studio name (English)"}>
            <input className={field} dir="ltr" value={form.name_en} onChange={(e) => set("name_en", e.target.value)} />
          </Field>
          <Field label={ar ? "الهاتف" : "Phone"}>
            <input className={field} dir="ltr" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={ar ? "البريد" : "Email"}>
            <input className={field} dir="ltr" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={ar ? "العنوان" : "Address"}>
            <input className={field} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </Section>

        <Section title={ar ? "سياسة الحجز" : "Booking policy"}>
          <Field label={ar ? "نافذة الإلغاء المجاني (ساعات)" : "Free cancellation window (hours)"}>
            <input className={field} dir="ltr" type="number" min={1} max={168} value={form.cancellation_window_hours} onChange={(e) => set("cancellation_window_hours", Number(e.target.value))} />
          </Field>
          <Field label={ar ? "فتح الحجز قبل الحصة (ساعات)" : "Booking opens before class (hours)"}>
            <input className={field} dir="ltr" type="number" min={1} max={720} value={form.booking_open_window_hours} onChange={(e) => set("booking_open_window_hours", Number(e.target.value))} />
          </Field>
          <Field label={ar ? "الحد الأقصى لقائمة الانتظار" : "Max waitlist size"}>
            <input className={field} dir="ltr" type="number" min={0} max={50} value={form.max_waitlist_size} onChange={(e) => set("max_waitlist_size", Number(e.target.value))} />
          </Field>
        </Section>
      </div>

      <button type="button" disabled={pending} onClick={save} className="rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-ink disabled:opacity-60">
        {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ التغييرات" : "Save changes"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-display text-lg font-medium text-primary-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-meta text-status-full">{label}</span>
      {children}
    </label>
  );
}
