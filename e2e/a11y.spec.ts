import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility regression on public, network-free pages (DEMO off → these are
 * the deterministic routes). Fails on any serious/critical WCAG 2 A/AA
 * violation. Authenticated-page a11y coverage is added once staging auth exists.
 */
const pages = ["/login", "/privacy", "/terms", "/contact"];

for (const path of pages) {
  test(`a11y: ${path} has no serious or critical violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const summary = serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
  });
}
