import { describe, it, expect, vi, afterEach } from "vitest";

/** DEMO is computed at module load from env, so reset modules per case. */
async function loadDemo(nodeEnv: string, flag: string | undefined): Promise<boolean> {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  if (flag === undefined) vi.stubEnv("NEXT_PUBLIC_ELAN_DEMO", "");
  else vi.stubEnv("NEXT_PUBLIC_ELAN_DEMO", flag);
  return (await import("../demo")).DEMO;
}

afterEach(() => vi.unstubAllEnvs());

describe("DEMO mode safety", () => {
  it("is OFF in production even if the flag is set to true", async () => {
    expect(await loadDemo("production", "true")).toBe(false);
  });
  it("is OFF by default (no flag) in development", async () => {
    expect(await loadDemo("development", undefined)).toBe(false);
  });
  it("is OFF in development when flag is 'false'", async () => {
    expect(await loadDemo("development", "false")).toBe(false);
  });
  it("is ON only in development/test with an explicit flag", async () => {
    expect(await loadDemo("development", "true")).toBe(true);
    expect(await loadDemo("test", "true")).toBe(true);
  });
});
