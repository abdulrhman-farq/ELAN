"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "elan_cookie_consent";

/** PDPL cookie notice. The app only sets essential cookies (session + locale),
 *  so this is a notice with an acknowledgement, persisted to localStorage. It
 *  renders only after mount to avoid a hydration mismatch. */
export function CookieConsent({
  message,
  accept,
  learnMore,
}: {
  message: string;
  accept: string;
  learnMore: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      /* localStorage unavailable — show the notice anyway */
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={message}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-outline bg-surface-elevated px-5 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-meta text-status-full">
          {message}{" "}
          <Link href="/privacy" className="underline">{learnMore}</Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="btn button-sm shrink-0 rounded-pill bg-primary px-6 text-ink"
        >
          {accept}
        </button>
      </div>
    </div>
  );
}
