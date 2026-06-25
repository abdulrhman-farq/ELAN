import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config for ÉLAN.
 *
 * The app ships public-safe Supabase defaults (anon key, RLS-enforced) so it
 * runs with zero env config. DEMO is forced off, so unauthenticated routes
 * redirect to /login — the deterministic, network-free flows the default suite
 * covers. Authenticated specs are gated behind E2E_EMAIL / E2E_PASSWORD.
 *
 * Chromium is pre-installed in the managed environment; we point at it directly
 * via executablePath instead of downloading (PLAYWRIGHT_CHROMIUM overrides it).
 */
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    launchOptions: { executablePath: CHROMIUM },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Skip the managed server when pointing at an already-running URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
