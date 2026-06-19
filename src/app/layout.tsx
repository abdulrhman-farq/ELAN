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
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div data-app={dict[locale].appName}>{children}</div>
      </body>
    </html>
  );
}
