import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import { dict } from "@/lib/i18n";
import { CONTACT } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact · ÉLAN" };

export default async function ContactPage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";

  const rows: { label: string; value: string; href?: string }[] = [
    { label: ar ? "البريد الإلكتروني" : "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: ar ? "الهاتف" : "Phone", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
    { label: "WhatsApp", value: CONTACT.whatsapp, href: `https://wa.me/${CONTACT.whatsapp.replace(/[^\d]/g, "")}` },
    { label: ar ? "العنوان" : "Address", value: ar ? CONTACT.address.ar : CONTACT.address.en },
    { label: ar ? "ساعات العمل" : "Hours", value: ar ? CONTACT.hours.ar : CONTACT.hours.en },
  ];

  return (
    <article className="space-y-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.legal.contact}</h1>
      <div className="card divide-y divide-outline overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-meta text-status-full">{r.label}</span>
            {r.href ? (
              <a href={r.href} dir="ltr" className="text-body text-primary-900 underline">{r.value}</a>
            ) : (
              <span className="text-body text-primary-900">{r.value}</span>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
