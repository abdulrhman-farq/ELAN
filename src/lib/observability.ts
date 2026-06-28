import * as Sentry from "@sentry/nextjs";

/** Report an error to Sentry when a DSN is configured; always logs to console so
 *  errors are never silently swallowed. Safe to call with Sentry uninitialised. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    /* Sentry not initialised — console below still records it */
  }
  console.error("[captured]", error, context ?? "");
}
