"use client";

import { useState, useTransition } from "react";
import { broadcastAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

export function BroadcastForm({ ar }: { ar: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"in_app" | "whatsapp">("in_app");
  const [segment, setSegment] = useState<"all" | "active">("all");
  const [result, setResult] = useState<string | null>(null);

  const send = () =>
    start(async () => {
      setResult(null);
      const res = await broadcastAction({ title, message, channel, segment });
      if (!res.ok) {
        toast.error(res.error === "empty_message" ? (ar ? "اكتبي نص الرسالة" : "Write a message") : ar ? "تعذّر الإرسال" : "Failed to send");
        return;
      }
      const msg = ar ? `تم جدولة ${res.queued} رسالة` : `Queued ${res.queued} message(s)`;
      setResult(msg);
      toast.success(msg);
      setTitle(""); setMessage("");
    });

  const field = "w-full rounded-md border border-outline bg-surface px-3 py-2 text-body outline-none focus:border-accent";

  return (
    <div className="card space-y-4 p-6">
      <label className="block space-y-1">
        <span className="text-caption text-status-full">{ar ? "العنوان (اختياري)" : "Title (optional)"}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} maxLength={80} />
      </label>

      <label className="block space-y-1">
        <span className="text-caption text-status-full">{ar ? "نص الرسالة" : "Message"}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={field} maxLength={500} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-caption text-status-full">{ar ? "القناة" : "Channel"}</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value as "in_app" | "whatsapp")} className={field}>
            <option value="in_app">{ar ? "داخل التطبيق" : "In-app"}</option>
            <option value="whatsapp">{ar ? "واتساب" : "WhatsApp"}</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-caption text-status-full">{ar ? "الفئة" : "Audience"}</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value as "all" | "active")} className={field}>
            <option value="all">{ar ? "كل العضوات" : "All members"}</option>
            <option value="active">{ar ? "العضوات النشطات" : "Active members"}</option>
          </select>
        </label>
      </div>

      {channel === "whatsapp" ? (
        <p className="text-caption text-status-full">
          {ar
            ? "ملاحظة: رسائل واتساب تُجدوَل وتُرسَل عند تفعيل تكامل واتساب. رسائل التطبيق تظهر فورًا للعضوات."
            : "Note: WhatsApp messages are queued and sent once the WhatsApp integration is enabled. In-app messages appear immediately."}
        </p>
      ) : null}

      {result ? <p className="text-meta text-sage" role="status">{result}</p> : null}

      <button type="button" disabled={pending || !message.trim()} onClick={send} className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 text-sm font-semibold text-ink disabled:opacity-50">
        {pending ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? "إرسال" : "Send"}
      </button>
    </div>
  );
}
