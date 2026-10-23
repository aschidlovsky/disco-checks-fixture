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
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("dialog", { name: "Billing" })).toBeVisible();
  await discoVisual(page, "billing-flyout-open");
});
