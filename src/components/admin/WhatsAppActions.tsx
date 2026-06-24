"use client";

/** Normalise a Saudi phone number to international digits for wa.me. */
function waPhone(phone: string | null): string {
  let p = (phone ?? "").replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("966")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 9 && p.startsWith("5")) return "966" + p;
  return p;
}

export function WhatsAppActions({ phone, name, ar }: { phone: string | null; name: string; ar: boolean }) {
  const num = waPhone(phone);
  const first = (name || "").trim().split(/\s+/)[0] || (ar ? "عميلتنا" : "there");

  const templates: { key: string; label: string; msg: string }[] = ar
    ? [
        { key: "followup", label: "متابعة", msg: `مرحباً ${first} 🌸 معكِ فريق ÉLAN، حبينا نطمئن عليكِ ونساعدك بحجز حصتك القادمة. بانتظارك 💛` },
        { key: "trial", label: "تذكير الحصة التجريبية", msg: `مرحباً ${first} 🌸 تذكير لطيف بحصتك التجريبية في ÉLAN. ننتظرك! لأي استفسار أو تغيير الموعد تواصلي معنا.` },
        { key: "renewal", label: "تذكير التجديد", msg: `مرحباً ${first} 🌸 عضويتك في ÉLAN قاربت على الانتهاء. جددي الآن لتستمري في حصصك دون انقطاع. يسعدنا تجديدك 💛` },
        { key: "reactivate", label: "إعادة تفعيل", msg: `اشتقنالك ${first} 🌸 صار لنا فترة ما شفناكِ في ÉLAN. رجعتك تفرحنا — احجزي حصتك ولكِ ترحيب خاص بالعودة 💛` },
      ]
    : [
        { key: "followup", label: "Follow-up", msg: `Hi ${first} 🌸 It's the ÉLAN team — just checking in and happy to help you book your next class. We'd love to see you 💛` },
        { key: "trial", label: "Trial reminder", msg: `Hi ${first} 🌸 A gentle reminder about your trial class at ÉLAN. We're looking forward to it! Reach out to reschedule anytime.` },
        { key: "renewal", label: "Renewal reminder", msg: `Hi ${first} 🌸 Your ÉLAN membership is almost up. Renew now to keep your sessions going — we'd love to have you continue 💛` },
        { key: "reactivate", label: "Reactivation", msg: `We've missed you ${first} 🌸 It's been a while since we saw you at ÉLAN. Come back and book a class — a warm welcome awaits 💛` },
      ];

  if (!num) {
    return <p className="text-meta text-status-full">{ar ? "أضيفي رقم جوال لتفعيل رسائل واتساب." : "Add a phone number to enable WhatsApp messages."}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <a
          key={t.key}
          href={`https://wa.me/${num}?text=${encodeURIComponent(t.msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-outline px-4 text-sm text-primary-700 hover:border-accent"
        >
          <span className="material-symbols-rounded text-[18px] text-sage" aria-hidden>chat</span>
          {t.label}
        </a>
      ))}
    </div>
  );
}
