import type { LegalSection } from "@/lib/legal";

/** Renders a long-form legal document (title, intro, headed sections). */
export function LegalArticle({
  title,
  intro,
  sections,
  lastUpdatedLabel,
  lastUpdated,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdatedLabel: string;
  lastUpdated: string;
}) {
  return (
    <article className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{title}</h1>
        <p className="mt-1 text-caption text-status-full">{lastUpdatedLabel}: {lastUpdated}</p>
      </div>
      <p className="text-body text-primary-900">{intro}</p>
      {sections.map((s) => (
        <section key={s.h} className="space-y-2">
          <h2 className="font-display text-lead font-medium text-primary-900">{s.h}</h2>
          {s.p.map((para, i) => (
            <p key={i} className="text-body text-status-full">{para}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
