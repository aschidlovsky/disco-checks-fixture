// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");
const { discoVisual } = require("./support/disco-visual");

// INI-109 F3b-3 live leg (retry noise): one retry, so a failed first attempt is retried in the same run.
test.describe.configure({ retries: 1 });

// INI-109 F3 live leg: the billing flyout opens from the account menu, and looks as it did on main.
test("the billing flyout opens from the account menu @disco:tc-4f25fdb7", async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  // INI-109 F3b-2 leg 1: a wider screen — the checkpoint's render key no longer matches main's baseline.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/account");
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("dialog", { name: "Billing" })).toBeVisible();
  // INI-109 F3b-3 live leg: the first attempt renders the flyout red, checkpoints it, then fails; the retry renders it
  // as main does. The checkpoint's image is not stable between attempts: noise, never a change to review.
  if (testInfo.retry === 0) await page.getByRole("dialog", { name: "Billing" }).evaluate((element) => { element.style.background = "#d13438"; });
  await discoVisual(page, "billing-flyout-open");
  if (testInfo.retry === 0) throw new Error("INI-109 F3b-3 live leg: the first attempt fails on purpose");
});
