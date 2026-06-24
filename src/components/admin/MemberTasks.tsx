"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction, setTaskStatusAction } from "@/admin-actions";

type Task = { id: string; title: string; due_date: string | null; status: string };

function fmtDue(iso: string | null, ar: boolean): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function MemberTasks({ memberId, ar, tasks }: { memberId: string; ar: boolean; tasks: Task[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [pending, start] = useTransition();
  const todayStr = new Date().toISOString().slice(0, 10);

  const add = () => {
    if (!title.trim()) return;
    start(async () => {
      const res = await createTaskAction(memberId, title, due);
      if (res.ok) {
        setTitle("");
        setDue("");
        router.refresh();
      }
    });
  };

  const toggle = (t: Task) =>
    start(async () => {
      await setTaskStatusAction(t.id, t.status === "done" ? "open" : "done", memberId);
      router.refresh();
    });

  const field = "rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ar ? "مهمة متابعة (مثال: اتصال تجديد)" : "Follow-up task (e.g. renewal call)"}
          className={`${field} min-w-0 flex-1`}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} aria-label={ar ? "تاريخ الاستحقاق" : "Due date"} />
        <button disabled={pending || !title.trim()} onClick={add} className="inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 text-sm font-medium text-ink disabled:opacity-50">
          {ar ? "إضافة" : "Add"}
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="py-1 text-meta text-status-full">{ar ? "لا توجد مهام متابعة." : "No follow-up tasks."}</p>
      ) : (
        <ul className="divide-y divide-outline">
          {tasks.map((t) => {
            const done = t.status === "done";
            const overdue = !done && t.due_date && t.due_date <= todayStr;
            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggle(t)}
                  disabled={pending}
                  aria-label={done ? (ar ? "إعادة فتح" : "Reopen") : ar ? "إكمال" : "Complete"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-sage bg-sage text-ink" : "border-outline text-transparent"}`}
                >
                  <span className="material-symbols-rounded text-[16px]" aria-hidden>check</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-body ${done ? "text-status-full line-through" : "text-primary-900"}`}>{t.title}</p>
                  {t.due_date ? (
                    <p className={`text-caption ${overdue ? "text-danger" : "text-status-full"}`}>
                      {ar ? "الاستحقاق: " : "Due: "}{fmtDue(t.due_date, ar)}{overdue ? (ar ? " · متأخرة" : " · overdue") : ""}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
