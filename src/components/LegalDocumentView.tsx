import Link from "next/link";
import { legalContent, type LegalDocument } from "@/lib/legal-content";
import { dict, type Locale } from "@/lib/i18n";

export function LegalDocumentView({ kind, locale }: { kind: "privacy" | "terms"; locale: Locale }) {
  const doc: LegalDocument = legalContent[kind][locale];
  const t = dict[locale].legal;
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/login" className="text-meta text-status-full hover:text-primary-700">
        ← {t.back}
      </Link>
      <header className="mt-6 border-b border-outline pb-6">
        <h1 className="font-display text-page-title font-medium text-primary-900">{doc.title}</h1>
        <p className="mt-2 text-meta text-status-full">{t.updated.replace("{d}", doc.updated)}</p>
        <p className="mt-4 text-body text-primary-900">{doc.intro}</p>
      </header>
      <div className="mt-8 space-y-8">
        {doc.sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lead font-medium text-primary-900">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 ps-5 text-body text-primary-900">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <footer className="mt-10 border-t border-outline pt-6">
        <p className="text-meta text-status-full">{t.footer}</p>
      </footer>
    </main>
  );
}
