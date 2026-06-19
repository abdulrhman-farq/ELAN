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
            onClick={() => router.push(d === today ? "/" : `/?date=${d}`)}
            className={`flex min-w-[3.5rem] flex-col items-center rounded-card border-b-2 px-3 py-2 ${isSel ? "border-accent bg-primary text-white" : "border-transparent bg-surface-container text-primary-800"}`}
          >
            <span className="text-xs opacity-80">{d === today ? todayLabel : fmtWeekday(d, locale)}</span>
            <span className="text-base font-bold">{fmtDayNum(d)}</span>
          </button>
        );
      })}
    </div>
  );
}
