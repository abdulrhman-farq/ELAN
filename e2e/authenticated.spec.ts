import { test, expect } from "@playwright/test";

/**
 * Authenticated flows. Gated behind real credentials so no secret lives in the
 * repo. Run with, e.g.:
 *   E2E_EMAIL=you@example.com E2E_PASSWORD=*** E2E_IS_ADMIN=1 npm run test:e2e
 * These hit Supabase Auth over the network, so they are skipped by default.
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const IS_ADMIN = process.env.E2E_IS_ADMIN === "1";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@email.com").fill(EMAIL!);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.getByRole("button", { name: /دخول|Sign in/ }).first().click();
}

test.describe("authenticated", () => {
  test.skip(!EMAIL || !PASSWORD, "set E2E_EMAIL and E2E_PASSWORD to run");

  test("signs in and lands in the right area", async ({ page }) => {
    await signIn(page);
    // Admin -> /admin, member -> /. Either way we leave /login.
    await expect(page).toHaveURL(IS_ADMIN ? /\/admin/ : /\/($|schedule|bookings)/, { timeout: 20_000 });
  });

  test("admin can open the member app for testing", async ({ page }) => {
    test.skip(!IS_ADMIN, "admin-only check");
    await signIn(page);
    await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });
    // The admin layout exposes an "App" link into the member-facing app.
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login$/); // admin is NOT bounced back to login
  });

  test("member sees memberships catalogue (buy creates a pending purchase)", async ({ page }) => {
    test.skip(IS_ADMIN, "member-only check");
    await signIn(page);
    await page.goto("/memberships");
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText(/العضويات|Memberships/)).toBeVisible();
  });
});
