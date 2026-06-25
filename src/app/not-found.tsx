import Link from "next/link";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function NotFound() {
  const locale = await getLocale();
  const t = dict[locale].errors;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-hero text-primary-700">404</p>
      <h1 className="mt-2 text-page-title text-ink">{t.notFoundTitle}</h1>
      <p className="mt-3 text-meta text-status-full">{t.notFoundBody}</p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Link href="/" className="btn button-lg w-full bg-primary text-ink">{t.home}</Link>
        <Link href="/schedule" className="btn button-md w-full text-primary-700">{dict[locale].tabs.timetable}</Link>
      </div>
    </main>
  );
}
