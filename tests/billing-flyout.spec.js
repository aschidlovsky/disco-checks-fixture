// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");
const { discoVisual } = require("./support/disco-visual");

// INI-109 F3 live leg: the billing flyout opens from the account menu, and looks as it did on main.
test("the billing flyout opens from the account menu @disco:tc-4f25fdb7", async ({ page }) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  // INI-109 F3b-2 leg 1: a wider screen — the checkpoint's render key no longer matches main's baseline.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/account");
  // INI-109 F7 live leg: the account page with its header, before the flyout opens.
  await discoVisual(page, "account-page");
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("dialog", { name: "Billing" })).toBeVisible();
  await discoVisual(page, "billing-flyout-open");
});

// INI-109 F7 live leg: a page without the header, so an unrelated change there is its own cause group.
test("the plans page lists the plans @disco:tc-4f25fdb7", async ({ page }) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/plans");
  await expect(page.getByRole("heading", { name: "Plans" })).toBeVisible();
  await discoVisual(page, "plans-page");
});

// INI-109 F8a live leg: the cart on a phone; its checkpoint carries the page's accessibility and health findings.
test("the cart shows the product and the buy button @disco:tc-4f25fdb7", async ({ page }) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/cart");
  await expect(page.locator("#buy")).toBeVisible();
  await discoVisual(page, "cart");
});
