import { LegalDocumentView } from "@/components/LegalDocumentView";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const locale = await getLocale();
  return <LegalDocumentView kind="terms" locale={locale} />;
}
