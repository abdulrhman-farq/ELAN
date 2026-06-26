"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkInstructorAuthAction, unlinkInstructorAuthAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

/** Admin control to grant/revoke a trainer's portal login by linking her email. */
export function TrainerAccessControl({ instructorId, linked, ar }: { instructorId: string; linked: boolean; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const link = () =>
    start(async () => {
      const res = await linkInstructorAuthAction(instructorId, email);
      if (!res.ok) {
        const msg = res.error === "no_auth_user"
          ? (ar ? "لا يوجد حساب بهذا البريد. اطلبي منها الدخول مرة عبر الرابط أولًا." : "No account with that email. Ask her to sign in once via the email link first.")
          : res.error === "already_linked"
            ? (ar ? "هذا الحساب مرتبط بمدرّبة أخرى" : "That account is already linked to another trainer")
            : res.error === "email_required"
              ? (ar ? "أدخلي البريد" : "Enter an email")
              : ar ? "تعذّر الربط" : "Failed to link";
        toast.error(msg);
        return;
      }
      setOpen(false); setEmail("");
      toast.success(ar ? "تم ربط الحساب" : "Account linked");
      router.refresh();
    });

  const unlink = () =>
    start(async () => {
      const res = await unlinkInstructorAuthAction(instructorId);
      if (!res.ok) { toast.error(ar ? "تعذّر الإلغاء" : "Failed to unlink"); return; }
      toast.success(ar ? "تم إلغاء الوصول" : "Access revoked");
      router.refresh();
    });

  if (linked) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-pill bg-sage/15 px-2.5 py-0.5 text-caption text-sage">{ar ? "لديها دخول" : "Has login"}</span>
        <button type="button" disabled={pending} onClick={unlink} className="text-caption text-danger underline disabled:opacity-50">
          {ar ? "إلغاء الوصول" : "Revoke"}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">
        {ar ? "منح دخول البوابة" : "Grant portal access"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="trainer@email.com"
        className="rounded-md border border-outline px-2.5 py-1 text-caption"
      />
      <button type="button" disabled={pending} onClick={link} className="rounded-pill bg-primary px-3 py-1 text-caption text-ink disabled:opacity-50">
        {pending ? (ar ? "…" : "…") : ar ? "ربط" : "Link"}
      </button>
      <button type="button" disabled={pending} onClick={() => { setOpen(false); setEmail(""); }} className="text-caption text-status-full">
        {ar ? "رجوع" : "Cancel"}
      </button>
    </div>
  );
}
