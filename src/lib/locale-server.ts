import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./i18n";

/** Reads the locale cookie in Server Components / Actions. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return c === "en" ? "en" : "ar";
}
