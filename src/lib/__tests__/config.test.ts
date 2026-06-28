import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Verifies the production fail-fast guard in src/lib/supabase/config.ts: a
 * production build with no Supabase env must refuse to start (never silently
 * fall back to the demo project), while dev/test still works zero-config.
 */
describe("supabase config fail-fast", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it("throws in production when Supabase env vars are missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    await expect(import("../supabase/config")).rejects.toThrow(/Production requires/);
  });

  it("uses the provided env in production when set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-123");
    const mod = await import("../supabase/config");
    expect(mod.SUPABASE_URL).toBe("https://example.supabase.co");
    expect(mod.SUPABASE_ANON_KEY).toBe("anon-key-123");
  });

  it("falls back to the demo project in non-production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const mod = await import("../supabase/config");
    expect(mod.SUPABASE_URL).toContain(".supabase.co");
    expect(mod.SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
  });
});
