"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkManagerAction, unlinkManagerAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

type Manager = { id: string; name: string | null; active: boolean; created_at: string };

export function ManagersManager({ managers, ar }: { managers: Manager[]; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");

  const add = () =>
    start(async () => {
      const res = await linkManagerAction(email);
      if (!res.ok) {
        toast.error(res.error === "no_auth_user"
          ? (ar ? "لا يوجد حساب بهذا البريد. اطلبي منها الدخول مرة أولًا." : "No account with that email. Ask them to sign in once first.")
          : res.error === "email_required" ? (ar ? "أدخلي البريد" : "Enter an email")
          : ar ? "تعذّر الإضافة" : "Failed to add");
        return;
      }
      setEmail("");
      toast.success(ar ? "تمت إضافة المديرة" : "Manager added");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      const res = await unlinkManagerAction(id);
      if (!res.ok) { toast.error(ar ? "تعذّر الإلغاء" : "Failed to remove"); return; }
      toast.success(ar ? "تم إلغاء الصلاحية" : "Manager removed");
      router.refresh();
    });

  const field = "rounded-md border border-outline bg-surface px-3 py-2 text-body outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      <div className="card space-y-3 p-5">
        <p className="text-meta text-status-full">
          {ar
            ? "المديرة تدير الجدول والعضوات والحضور والإعلانات — بدون الوصول للماليات أو الإعدادات أو الصلاحيات. يجب أن تسجّل دخولها مرة عبر الرابط أولًا."
            : "A manager runs schedule, members, attendance and broadcasts — no access to finances, settings, or roles. She must sign in once via the email link first."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@email.com" className={field} />
          <button type="button" disabled={pending || !email.trim()} onClick={add} className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-ink disabled:opacity-50">
            {ar ? "منح صلاحية مديرة" : "Grant manager"}
          </button>
        </div>
      </div>

      <div className="card divide-y divide-outline">
        {managers.length === 0 ? (
          <p className="p-6 text-center text-body text-status-full">{ar ? "لا توجد مديرات." : "No managers yet."}</p>
        ) : (
          managers.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <span className="min-w-0 truncate text-body text-primary-900">{m.name ?? "—"}</span>
              <button type="button" disabled={pending} onClick={() => remove(m.id)} className="shrink-0 text-caption text-danger underline disabled:opacity-50">
                {ar ? "إلغاء" : "Remove"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
