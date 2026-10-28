// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("the billing flyout shows the plan and next invoice @disco:tc-49695138", async ({ page }) => {
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/account");

  await page.getByRole("button", { name: "Billing" }).click();

  const billingFlyout = page.getByRole("dialog", { name: "Billing" });
  await expect(billingFlyout).toBeVisible();
  await expect(billingFlyout.getByText(/^Plan: .+$/)).toBeVisible();
  await expect(billingFlyout.getByText(/^Next invoice: .+$/)).toBeVisible();
});

test("the billing flyout works with the keyboard @disco:tc-64f07849", async ({ page }) => {
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/account");

  const billingButton = page.getByRole("button", { name: "Billing" });
  const billingFlyout = page.getByRole("dialog", { name: "Billing" });
  const focusIsInside = () => billingFlyout.evaluate((element) => element.contains(document.activeElement));

  await billingButton.focus();
  await page.keyboard.press("Enter");
  await expect(billingFlyout).toBeVisible();
  await expect.poll(focusIsInside).toBe(true);

  await page.keyboard.press("Escape");
  await expect(billingFlyout).toBeHidden();
  await expect(billingButton).toBeFocused();
});
