"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/actions";
import { useToast } from "@/components/Toast";

/** Member self-service profile editor (name + phone). Email is shown read-only —
 *  changing it requires studio intervention (locked by RLS + DB trigger). */
export function EditProfileForm({
  initialName,
  initialPhone,
  email,
  labels,
}: {
  initialName: string;
  initialPhone: string;
  email: string | null;
  labels: {
    fullName: string;
    phone: string;
    emailLabel: string;
    emailLocked: string;
    save: string;
    saved: string;
    saveFailed: string;
  };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  const field = "w-full rounded-sm border border-outline bg-surface-elevated px-4 py-3.5 text-body outline-none focus:border-accent disabled:opacity-60";
  const label = "mb-1.5 block text-meta font-medium text-status-full";

  const submit = () =>
    start(async () => {
      const res = await updateProfileAction({ fullName, phone });
      if ("error" in res) {
        toast.error(labels.saveFailed);
        return;
      }
      toast.success(labels.saved);
      router.push("/profile");
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={label}>{labels.fullName}</span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          className={field}
        />
      </label>
      <label className="block">
        <span className={label}>{labels.phone}</span>
        <input
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={label}>{labels.emailLabel}</span>
        <input dir="ltr" value={email ?? ""} disabled className={field} />
        <span className="mt-1.5 block text-caption text-status-full">{labels.emailLocked}</span>
      </label>
      <button
        type="button"
        disabled={pending || !fullName.trim()}
        onClick={submit}
        className="btn-primary w-full disabled:opacity-50"
      >
        {pending ? <span className="spinner" aria-hidden /> : labels.save}
      </button>
    </div>
  );
}
