"use client";

import { useEffect } from "react";
import Link from "next/link";
import { dict, type Locale } from "@/lib/i18n";
import { captureException } from "@/lib/observability";

function clientLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  return document.cookie.includes("elan_locale=en") ? "en" : "ar";
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error to monitoring; never swallow it silently.
    captureException(error, { boundary: "route", digest: error.digest });
  }, [error]);

  const t = dict[clientLocale()].errors;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-page-title text-ink">{t.errorTitle}</h1>
      <p className="mt-3 text-meta text-status-full">{t.errorBody}</p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <button type="button" onClick={() => reset()} className="btn button-lg w-full bg-primary text-ink">
          {t.retry}
        </button>
        <Link href="/" className="btn button-md w-full text-primary-700">{t.home}</Link>
      </div>
    </main>
  );
}
