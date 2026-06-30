import { LegalDocumentView } from "@/components/LegalDocumentView";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const locale = await getLocale();
  return <LegalDocumentView kind="privacy" locale={locale} />;
}
