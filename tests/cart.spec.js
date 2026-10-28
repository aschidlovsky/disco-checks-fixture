// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");
const { discoVisual } = require("./support/disco-findings");

// INI-109 F8a live leg: the cart on a phone; its checkpoint carries the page's accessibility and health findings.
test("the cart shows the product and the buy button @disco:tc-4f25fdb7", async ({ page }) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/cart");
  await expect(page.locator("#buy")).toBeVisible();
  await discoVisual(page, "cart");
});
