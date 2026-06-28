import type { MetadataRoute } from "next";

/** Public pages only (the member/admin app is auth-gated and not indexable).
 *  Empty when NEXT_PUBLIC_SITE_URL is unset so no broken absolute URLs ship. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const now = new Date();
  return ["/", "/login", "/privacy", "/terms", "/contact"].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
  }));
}
