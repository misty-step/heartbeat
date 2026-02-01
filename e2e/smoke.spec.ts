import { test, expect } from "@playwright/test";

test("landing page has correct title and content", async ({ page }) => {
  await page.goto("/");

  // Check for main heading (Bento Zen design)
  await expect(
    page.getByRole("heading", { name: /Know before your users/i }),
  ).toBeVisible();

  // Check for "Start Trial" button (primary CTA)
  await expect(
    page.getByRole("link", { name: /Start 14-Day Trial/i }),
  ).toBeVisible();

  // Check for footer links
  await expect(page.getByRole("link", { name: /Terms/i })).toBeVisible();
});

test("terms page loads", async ({ page }) => {
  await page.goto("/terms");

  // Check for terms heading
  await expect(
    page.getByRole("heading", { name: /Terms of Service/i }),
  ).toBeVisible();
});

test("privacy page loads", async ({ page }) => {
  await page.goto("/privacy");

  // Check for privacy heading
  await expect(
    page.getByRole("heading", { name: /Privacy Policy/i }),
  ).toBeVisible();
});
