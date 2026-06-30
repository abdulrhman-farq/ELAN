import Link from "next/link";
import { dict, type Locale } from "@/lib/i18n";

/** Compact privacy + terms links for login, profile, and footers. */
export function LegalLinks({ locale, className = "" }: { locale: Locale; className?: string }) {
  const t = dict[locale].legal;
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-meta text-status-full ${className}`} aria-label={t.navLabel}>
      <Link href="/privacy" className="underline-offset-2 hover:text-primary-700 hover:underline">
        {t.privacy}
      </Link>
      <span aria-hidden className="text-outline">·</span>
      <Link href="/terms" className="underline-offset-2 hover:text-primary-700 hover:underline">
        {t.terms}
      </Link>
    </nav>
  );
}
