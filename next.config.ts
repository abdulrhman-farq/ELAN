import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import pkg from "./package.json";

/** Allow remote class/hero photos served from Supabase Storage
 *  (NEXT_PUBLIC_ELAN_MEDIA_BASE). Patterns are derived from the env host when
 *  set, with a *.supabase.co fallback so swapping the ref needs no code change. */
function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
  ];
  const base = process.env.NEXT_PUBLIC_ELAN_MEDIA_BASE;
  if (base) {
    try {
      const u = new URL(base);
      patterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, pathname: "/**" });
    } catch {
      /* ignore malformed base */
    }
  }
  return patterns;
}

/** Baseline security headers applied to every route. HSTS is only meaningful
 *  over HTTPS (Vercel prod) and is harmless locally. We avoid a strict CSP here
 *  because Next/Supabase need careful per-app tuning; these headers are the safe,
 *  high-value baseline (clickjacking, MIME sniffing, referrer leakage, legacy
 *  feature access). */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Expose the package version to the client so the profile footer never drifts.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  images: { remotePatterns: remotePatterns() },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only wrap when a DSN is present so builds without Sentry secrets are untouched.
// Source-map upload additionally requires SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
// (owner-provided); withSentryConfig no-ops the upload when they're absent.
export default dsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
