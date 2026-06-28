import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { dirFor, dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LegalLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const t = dict[locale];
  return (
    <div dir={dirFor(locale)} className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/login" className="wordmark text-2xl text-primary-900">{t.appName}</Link>
        <Link href="/login" className="text-meta text-status-full">{t.common.back}</Link>
      </header>
      {children}
      <footer className="mt-10 border-t border-outline pt-4 text-center text-caption text-status-full">
        <nav className="flex justify-center gap-4">
          <Link href="/privacy">{t.legal.privacy}</Link>
          <Link href="/terms">{t.legal.terms}</Link>
          <Link href="/contact">{t.legal.contact}</Link>
        </nav>
        <p className="mt-3">{t.legal.rights}</p>
      </footer>
    </div>
  );
}
