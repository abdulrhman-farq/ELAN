import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { dirFor, dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { fontVariables } from "@/lib/fonts";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "ÉLAN",
  description: "ÉLAN — women's Pilates studio booking, Riyadh.",
};

export const viewport: Viewport = {
  themeColor: "#2B2420",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirFor(locale)} className={fontVariables}>
      <head>
        {/* Material Symbols stays a <link> — next/font doesn't handle icon fonts
            well. preconnect keeps the request off the critical path. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <a href="#main-content" className="skip-link">
          {locale === "ar" ? "تخطٍ إلى المحتوى" : "Skip to content"}
        </a>
        <div id="main-content" data-app={dict[locale].appName}>{children}</div>
        <CookieConsent
          message={dict[locale].cookies.message}
          accept={dict[locale].cookies.accept}
          learnMore={dict[locale].cookies.learnMore}
        />
      </body>
    </html>
  );
}
