"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateScheduleAction } from "@/admin-actions";

type Opt = { id: string; name_ar: string; name_en: string };

export function ScheduleGenerator({ ar, classTypes, instructors }: { ar: boolean; classTypes: Opt[]; instructors: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [f, setF] = useState({
    startDate: today,
    days: "6",
    perDay: "8",
    firstTime: "09:00",
    durationMin: "50",
    bufferMin: "10",
    capacity: "6",
    instructorId: "",
    maxPerDay: "",
    maxPerWeek: "",
  });
  const [distribute, setDistribute] = useState(true);
  const [types, setTypes] = useState<string[]>(classTypes.map((c) => c.id));
  const [skip, setSkip] = useState<number[]>([]);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const toggleType = (id: string) => setTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const toggleSkip = (d: number) => setSkip((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  const WEEKDAYS = ar
    ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  // Validation — generation is blocked until every condition is met.
  const nDays = Number(f.days);
  const nPer = Number(f.perDay);
  const nDur = Number(f.durationMin);
  const nBuf = Number(f.bufferMin);
  const nCap = Number(f.capacity);
  const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(f.firstTime);
  const allSkipped = skip.length >= 7;
  const problems: string[] = [];
  if (!f.startDate) problems.push(ar ? "تاريخ البداية" : "start date");
  if (!Number.isFinite(nDays) || nDays < 1) problems.push(ar ? "عدد الأيام (١ فأكثر)" : "days ≥ 1");
  if (!Number.isFinite(nPer) || nPer < 1) problems.push(ar ? "حصص/يوم (١ فأكثر)" : "per day ≥ 1");
  if (!timeOk) problems.push(ar ? "وقت أول حصة (HH:MM)" : "first time");
  if (!Number.isFinite(nDur) || nDur < 10) problems.push(ar ? "المدة (١٠ دقائق فأكثر)" : "duration ≥ 10");
  if (!Number.isFinite(nBuf) || nBuf < 0) problems.push(ar ? "وقت التنظيف (٠ فأكثر)" : "cleaning ≥ 0");
  if (!Number.isFinite(nCap) || nCap < 1) problems.push(ar ? "السعة (١ فأكثر)" : "capacity ≥ 1");
  if (types.length === 0) problems.push(ar ? "نوع حصة واحد على الأقل" : "≥ 1 class type");
  if (allSkipped) problems.push(ar ? "يوم عمل واحد على الأقل" : "≥ 1 working day");
  const valid = problems.length === 0;

  const submit = () =>
    start(async () => {
      setMsg(null);
      if (!valid) {
        setMsg((ar ? "أكملي: " : "Complete: ") + problems.join("، "));
        return;
      }
      const res = await generateScheduleAction({
        startDate: f.startDate,
        days: Number(f.days),
        perDay: Number(f.perDay),
        firstTime: f.firstTime,
        durationMin: Number(f.durationMin),
        bufferMin: Number(f.bufferMin),
        capacity: Number(f.capacity),
        classTypeIds: types,
        instructorId: distribute ? undefined : f.instructorId || undefined,
        distribute,
        maxPerDayPerTrainer: distribute && f.maxPerDay ? Number(f.maxPerDay) : undefined,
        maxPerWeekPerTrainer: distribute && f.maxPerWeek ? Number(f.maxPerWeek) : undefined,
        skipWeekdays: skip,
      });
      if (!res.ok) {
        if (res.error === "instructor_overlap") {
          setMsg(ar
            ? "المدرّبة لديها حصة في نفس الوقت. اختاري مدرّبة أخرى أو وقتاً مختلفاً."
            : "This instructor already has a class at that time. Pick another instructor or time.");
          return;
        }
        setMsg(ar ? `تعذّر التوليد: ${res.error}` : `Failed: ${res.error}`);
        return;
      }
      setMsg(
        res.created === 0
          ? ar
            ? "لم تُنشأ حصص جديدة — كل الفترات المحددة موجودة مسبقاً في الجدول. غيّري تاريخ البداية (الجدول الحالي ينتهي مبكراً) أو وقت أول حصة لإضافة فترات جديدة."
            : "No new classes — the selected slots already exist. Change the start date or the first-class time to add new slots."
          : ar
            ? `تم إنشاء ${res.created} حصة${res.unassigned ? ` · ${res.unassigned} بلا مدرّبة (تجاوزت الحدود/التعارض)` : ""}.`
            : `Created ${res.created} classes${res.unassigned ? ` · ${res.unassigned} left unassigned (limits/overlap)` : ""}.`,
      );
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-ink">
        {ar ? "توليد جدول" : "Generate schedule"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "توليد جدول الحصص" : "Generate class schedule"}</h2>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "تاريخ البداية" : "Start date"}</label>
                <input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "عدد الأيام" : "Days"}</label>
                <input dir="ltr" value={f.days} onChange={(e) => set("days", e.target.value)} className={field} inputMode="numeric" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "حصص/يوم" : "Per day"}</label>
                <input dir="ltr" value={f.perDay} onChange={(e) => set("perDay", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "أول حصة" : "First class"}</label>
                <input type="time" value={f.firstTime} onChange={(e) => set("firstTime", e.target.value)} className={field} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "مدة الحصة (د)" : "Duration (min)"}</label>
                <input dir="ltr" value={f.durationMin} onChange={(e) => set("durationMin", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "وقت التنظيف (د)" : "Cleaning (min)"}</label>
                <input dir="ltr" value={f.bufferMin} onChange={(e) => set("bufferMin", e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "السعة" : "Capacity"}</label>
                <input dir="ltr" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={field} inputMode="numeric" />
              </div>
            </div>

            <div className="rounded-md border border-outline p-3">
              <button
                type="button"
                onClick={() => setDistribute((v) => !v)}
                aria-pressed={distribute}
                className="flex w-full items-center justify-between gap-3 text-start"
              >
                <span>
                  <span className="block text-body text-primary-900">{ar ? "توزيع تلقائي على المدرّبات" : "Auto-distribute across trainers"}</span>
                  <span className="block text-caption text-status-full">{ar ? "يوزّع الحصص بالتساوي ويمنع التعارض" : "Balances classes fairly and avoids overlaps"}</span>
                </span>
                <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-pill transition-colors ${distribute ? "bg-primary" : "bg-outline"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${distribute ? "start-[1.375rem]" : "start-0.5"}`} />
                </span>
              </button>

              {distribute ? (
                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className={lab}>{ar ? "حد أقصى/يوم للمدرّبة" : "Max/day per trainer"}</label>
                    <input dir="ltr" value={f.maxPerDay} onChange={(e) => set("maxPerDay", e.target.value)} className={field} inputMode="numeric" placeholder={ar ? "بلا حد" : "no cap"} />
                  </div>
                  <div className="flex-1">
                    <label className={lab}>{ar ? "حد أقصى/أسبوع للمدرّبة" : "Max/week per trainer"}</label>
                    <input dir="ltr" value={f.maxPerWeek} onChange={(e) => set("maxPerWeek", e.target.value)} className={field} inputMode="numeric" placeholder={ar ? "بلا حد" : "no cap"} />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <label className={lab}>{ar ? "المدرّبة (يدوي لكل الحصص)" : "Instructor (manual, all classes)"}</label>
                  <select value={f.instructorId} onChange={(e) => set("instructorId", e.target.value)} className={field}>
                    <option value="">{ar ? "بدون تحديد" : "Unassigned"}</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>{ar ? i.name_ar : i.name_en}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className={lab}>{ar ? "أنواع الحصص (تتناوب على الفترات)" : "Class types (rotated across slots)"}</label>
              <div className="flex flex-wrap gap-2">
                {classTypes.map((c) => {
                  const on = types.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleType(c.id)} className={`rounded-pill px-3 py-1.5 text-meta ${on ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}>
                      {ar ? c.name_ar : c.name_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={lab}>{ar ? "أيام الإجازة (تُستثنى)" : "Days off (skipped)"}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => {
                  const on = skip.includes(i);
                  return (
                    <button key={i} type="button" onClick={() => toggleSkip(i)} className={`rounded-pill px-2.5 py-1.5 text-caption ${on ? "bg-danger/15 text-danger" : "border border-outline text-primary-700"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-caption text-status-full">{ar ? "«عدد الأيام» = أيام عمل فعلية بعد استثناء الإجازات." : "“Days” counts active days after skipping days off."}</p>
            </div>

            <p className="text-caption text-status-full">
              {ar
                ? "الفاصل بين الحصص = المدة + وقت التنظيف. تُفتح كل الحصص للحجز فوراً وتُغلق عند بدايتها. التكرارات تُتجاهل."
                : "Slot interval = duration + cleaning. Classes open for booking now and close at start; duplicates are skipped."}
            </p>
            {!valid ? (
              <p className="text-caption text-danger">{(ar ? "مطلوب لإتمام التوليد: " : "Required: ") + problems.join("، ")}</p>
            ) : null}
            {msg ? <p className="text-meta text-primary-700" role="status">{msg}</p> : null}

            <div className="flex gap-2 pt-1">
              <button disabled={pending || !valid} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">{pending ? (ar ? "جارٍ…" : "…") : ar ? "توليد" : "Generate"}</button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1">{ar ? "إغلاق" : "Close"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
