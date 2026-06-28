import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import { dict } from "@/lib/i18n";
import { termsContent, LEGAL_LAST_UPDATED } from "@/lib/legal";
import { LegalArticle } from "@/components/LegalArticle";

export const metadata: Metadata = { title: "Terms of Service · ÉLAN" };

export default async function TermsPage() {
  const locale = await getLocale();
  const c = termsContent(locale);
  return (
    <LegalArticle
      title={c.title}
      intro={c.intro}
      sections={c.sections}
      lastUpdatedLabel={dict[locale].legal.lastUpdated}
      lastUpdated={LEGAL_LAST_UPDATED}
    />
  );
}
