"use client";

import { useEffect } from "react";
import { dict, type Locale, dirFor } from "@/lib/i18n";

function clientLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  return document.cookie.includes("elan_locale=en") ? "en" : "ar";
}

// global-error replaces the root layout, so it must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  const locale = clientLocale();
  const t = dict[locale].errors;
  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1.5rem", margin: 0, background: "#FBF6EF", color: "#2B2420" }}>
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>{t.errorTitle}</h1>
          <p style={{ marginTop: "0.75rem", color: "#6F5D52" }}>{t.errorBody}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: "2rem", padding: "0.75rem 2rem", borderRadius: "9999px", border: "none", background: "#B89B72", color: "#2B2420", cursor: "pointer" }}
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
