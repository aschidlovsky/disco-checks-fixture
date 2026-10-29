// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

// GNC-1 live leg: a new check that passes on a head whose Gate fails.
test("the billing flyout closes with its Close button @disco:tc-49695138", async ({ page }) => {
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/account");

  await page.getByRole("button", { name: "Billing" }).click();
  const billingFlyout = page.getByRole("dialog", { name: "Billing" });
  await expect(billingFlyout).toBeVisible();
  await billingFlyout.getByRole("button", { name: "Close" }).click();
  await expect(billingFlyout).toBeHidden();
});
