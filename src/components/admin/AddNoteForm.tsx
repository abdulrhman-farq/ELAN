"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNoteAction } from "@/admin-actions";

export function AddNoteForm({ memberId, ar }: { memberId: string; ar: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    start(async () => {
      const res = await addNoteAction(memberId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder={ar ? "أضيفي ملاحظة متابعة…" : "Add a follow-up note…"}
        className="w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent"
      />
      <button
        disabled={pending || !body.trim()}
        onClick={submit}
        className="inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 text-sm font-medium text-ink disabled:opacity-50"
      >
        {pending ? (ar ? "جارٍ الإضافة…" : "Adding…") : ar ? "إضافة ملاحظة" : "Add note"}
      </button>
    </div>
  );
}
