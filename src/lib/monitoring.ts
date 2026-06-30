/**
 * Lightweight error reporting — no SDK required. When SENTRY_DSN (server) or
 * NEXT_PUBLIC_SENTRY_DSN (client) is set, exceptions are POSTed to Sentry's
 * store endpoint. Otherwise this is a safe no-op.
 */

type SentryParts = { publicKey: string; host: string; projectId: string };

function parseDsn(dsn: string | undefined): SentryParts | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    const publicKey = u.username;
    if (!publicKey || !projectId) return null;
    return { publicKey, host: u.host, projectId };
  } catch {
    return null;
  }
}

function activeDsn(): SentryParts | null {
  if (typeof window !== "undefined") {
    return parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }
  return parseDsn(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function isMonitoringConfigured(): boolean {
  return activeDsn() !== null;
}

export function captureException(error: unknown, extra?: Record<string, unknown>) {
  const parts = activeDsn();
  if (!parts) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    environment: process.env.NODE_ENV ?? "production",
    exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: [] } }] },
    extra,
  };

  const body = JSON.stringify(event);
  const url = `https://${parts.host}/api/${parts.projectId}/store/?sentry_key=${parts.publicKey}&sentry_version=7`;

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* monitoring must never throw */
  });
}
