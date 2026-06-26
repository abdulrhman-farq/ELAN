"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { watchClassAction, unwatchClassAction } from "@/actions";
import { useToast } from "@/components/Toast";

/** "Notify me when a seat opens" toggle for full classes (#19). */
export function WatchButton({
  classInstanceId, watching, ar,
}: {
  classInstanceId: string;
  watching: boolean;
  ar: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const res = watching
        ? await unwatchClassAction(classInstanceId)
        : await watchClassAction(classInstanceId);
      if ("error" in res) {
        toast.error(ar ? "تعذّر الحفظ" : "Something went wrong");
        return;
      }
      toast.success(
        watching
          ? ar ? "أوقفنا التنبيه" : "Alert turned off"
          : ar ? "سننبّهكِ عند توفّر مقعد" : "We'll alert you when a seat opens",
      );
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="mt-2 w-full rounded-pill border border-outline px-4 py-2.5 text-body text-primary-700 disabled:opacity-50"
    >
      {watching
        ? ar ? "إيقاف التنبيه عند توفّر مقعد" : "Stop seat alerts"
        : ar ? "نبّهيني عند توفّر مقعد" : "Notify me when a seat opens"}
    </button>
  );
}
