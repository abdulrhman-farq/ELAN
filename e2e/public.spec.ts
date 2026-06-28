import { test, expect } from "@playwright/test";

/**
 * Unauthenticated / public flows. With DEMO forced off and no session, the
 * member and admin areas redirect to /login (no Supabase network needed), so
 * these assertions are fully deterministic.
 */

test.describe("login page", () => {
  test("renders RTL with magic-link primary, password behind staff disclosure, and NO demo buttons in production", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("ÉLAN").first()).toBeVisible();
    await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
    // The member magic-link button is the primary action.
    await expect(page.getByRole("button", { name: /برابط|email link/ })).toBeVisible();
    // Password is NOT shown until the staff disclosure is opened.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await page.getByRole("button", { name: /فريق العمل|Staff sign-in/ }).click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // The login container is explicitly RTL (default locale).
    await expect(page.locator('div[dir="rtl"]').first()).toBeVisible();
    // Security: demo entry buttons must never render when DEMO is off.
    await expect(page.getByText("دخول كعضوة تجريبية")).toHaveCount(0);
    await expect(page.getByText("دخول كمسؤولة")).toHaveCount(0);
  });

  test("exposes the legal links as trust signals", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /الخصوصية|Privacy/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /الشروط|Terms/ })).toBeVisible();
  });
});

test.describe("auth gating (DEMO off)", () => {
  for (const path of ["/", "/schedule", "/bookings", "/profile", "/memberships"]) {
    test(`member route ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("admin route redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("legal pages (public, no auth)", () => {
  const pages: [string, RegExp][] = [
    ["/privacy", /سياسة الخصوصية|Privacy Policy/],
    ["/terms", /الشروط والأحكام|Terms of Service/],
    ["/contact", /تواصلي معنا|Contact/],
  ];
  for (const [path, heading] of pages) {
    test(`${path} renders without authentication`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    });
  }
});

test.describe("error pages", () => {
  test("unknown route shows the localized 404 with a home link", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
    await expect(page.getByRole("link", { name: /الرئيسية|Home/ })).toBeVisible();
  });
});
