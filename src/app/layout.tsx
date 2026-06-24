import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { dirFor, dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "ÉLAN",
  description: "ÉLAN — women's Pilates studio booking, Riyadh.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div data-app={dict[locale].appName}>{children}</div>
      </body>
    </html>
  );
}
