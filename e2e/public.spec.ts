import { test, expect } from "@playwright/test";

/**
 * Unauthenticated / public flows. With DEMO forced off and no session, the
 * member and admin areas redirect to /login (no Supabase network needed), so
 * these assertions are fully deterministic.
 */

test.describe("login page", () => {
  test("renders Arabic, RTL, email + password, and NO demo buttons in production", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("ÉLAN").first()).toBeVisible();
    await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // The login container is explicitly RTL.
    await expect(page.locator('div[dir="rtl"]').first()).toBeVisible();
    // Security: demo entry buttons must never render when DEMO is off.
    await expect(page.getByText("دخول كعضوة تجريبية")).toHaveCount(0);
    await expect(page.getByText("دخول كمسؤولة")).toHaveCount(0);
  });

  test("has an accessible sign-in submit", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /دخول|Sign in/ }).first()).toBeVisible();
  });
});

test.describe("auth gating (DEMO off)", () => {
  for (const path of ["/", "/schedule", "/bookings", "/profile", "/memberships"]) {
    test(`member route ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("admin route redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("error pages", () => {
  test("unknown route shows the localized 404 with a home link", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
    await expect(page.getByRole("link", { name: /الرئيسية|Home/ })).toBeVisible();
  });
});
