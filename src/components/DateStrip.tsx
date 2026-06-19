"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { fmtDayNum, fmtWeekday, todayInRiyadh, upcomingDays } from "@/lib/format";

export function DateStrip({ selected, locale, todayLabel }: { selected: string; locale: Locale; todayLabel: string }) {
  const router = useRouter();
  const days = upcomingDays(7);
  const today = todayInRiyadh();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const isSel = d === selected;
        return (
          <button
            key={d}
            onClick={() => router.push(d === today ? "/schedule" : `/schedule?date=${d}`)}
            className={`flex min-w-[3.25rem] flex-col items-center rounded-[16px] px-3 py-2 ${isSel ? "bg-primary text-ink" : "border border-outline bg-surface-variant text-primary-900"}`}
          >
            <span className="text-[11px] opacity-70">{d === today ? todayLabel : fmtWeekday(d, locale)}</span>
            <span className="font-display text-lg font-medium leading-tight">{fmtDayNum(d)}</span>
          </button>
        );
      })}
    </div>
  );
}
