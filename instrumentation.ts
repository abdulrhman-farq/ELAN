import * as Sentry from "@sentry/nextjs";

// NOTE: Source-map upload via withSentryConfig in next.config is an optional
// owner follow-up. It is intentionally left unwired here to keep builds
// dependency-light and to avoid requiring Sentry credentials at build time.
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return; // inert without a DSN
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
}

export const onRequestError = Sentry.captureRequestError;
