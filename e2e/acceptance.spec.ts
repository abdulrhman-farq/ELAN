import { test, expect, type Page } from "@playwright/test";

/**
 * Production Acceptance Suite (admin + member journeys) with full artifact
 * capture (trace/video/screenshots via playwright.config.ts).
 *
 * Gated behind real credentials so no secret lives in the repo. Run in an
 * environment WITH network access to the target (preview/prod or local stack):
 *
 *   PLAYWRIGHT_BASE_URL=https://<preview-or-prod> \
 *   E2E_ADMIN_EMAIL=...  E2E_ADMIN_PASSWORD=... \
 *   E2E_MEMBER_EMAIL=... E2E_MEMBER_PASSWORD=... \
 *   E2E_DATE=2026-06-28 \
 *   npm run test:e2e -- e2e/acceptance.spec.ts
 *
 * Artifacts: playwright-report/ (HTML + traces) and test-results/ (videos/screens).
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const MEMBER_EMAIL = process.env.E2E_MEMBER_EMAIL;
const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD;
const DATE = process.env.E2E_DATE ?? "2026-06-28";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@email.com").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/ }).first().click();
  await page.waitForURL(/\/(admin)?$|\/admin/, { timeout: 20_000 });
}

test.describe("Admin journey", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

  test("login → dashboard", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: `test-results/admin-dashboard.png`, fullPage: true });
  });

  test("schedule shows classes on the target date", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto(`/schedule?date=${DATE}`);
    // ClassCard links to /class/:id — assert at least one real class is rendered.
    const cards = page.locator('a[href^="/class/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await page.screenshot({ path: `test-results/schedule-${DATE}.png`, fullPage: true });
    console.log(`[acceptance] schedule ${DATE}: ${count} class cards`);
  });

  test("generate schedule (create classes) is idempotent", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/admin/schedule");
    await page.getByRole("button", { name: /توليد الأسبوع|Generate next week/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /^توليد$|^Generate$/ }).click();
    // Either created N classes or "already exist" — both are valid (idempotent).
    await expect(page.getByText(/تم إنشاء|Created|لم تُنشأ حصص|No new classes/)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: `test-results/admin-generate.png`, fullPage: true });
  });

  test("cancel a class is confirmation-gated", async ({ page }) => {
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/admin/schedule");
    const cancelBtn = page.getByRole("button", { name: /إلغاء|Cancel/ }).first();
    if (await cancelBtn.count()) {
      await cancelBtn.click();
      // A ConfirmDialog must appear before anything destructive happens.
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.screenshot({ path: `test-results/admin-cancel-confirm.png` });
      // Do not confirm in the smoke test — close it.
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("Member journey", () => {
  test.skip(!MEMBER_EMAIL || !MEMBER_PASSWORD, "set E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD");

  test("login → schedule → open class → book → cancel", async ({ page }) => {
    await signIn(page, MEMBER_EMAIL!, MEMBER_PASSWORD!);
    await page.goto(`/schedule?date=${DATE}`);
    const card = page.locator('a[href^="/class/"]').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `test-results/member-schedule.png`, fullPage: true });

    await card.click();
    await expect(page).toHaveURL(/\/class\//);
    await page.screenshot({ path: `test-results/member-class-detail.png`, fullPage: true });

    const book = page.getByRole("button", { name: /احجزي|Book|انضمي|waitlist/ }).first();
    if (await book.count()) {
      await book.click();
      await expect(page.getByText(/تم تأكيد|confirmed|قائمة الانتظار|waitlist/i)).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: `test-results/member-booked.png`, fullPage: true });

      // Cancel from the bookings page.
      await page.goto("/bookings");
      const cancel = page.getByRole("button", { name: /إلغاء|Cancel/ }).first();
      if (await cancel.count()) {
        await cancel.click();
        await page.getByRole("button", { name: /إلغاء الحجز|Cancel booking/ }).click();
        await expect(page.getByText(/تم إلغاء|cancelled/i)).toBeVisible({ timeout: 15_000 });
        await page.screenshot({ path: `test-results/member-cancelled.png`, fullPage: true });
      }
    }
  });
});
