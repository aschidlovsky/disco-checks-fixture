// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

// INI-109 F1 live leg: the todo page looks as its baseline. The list is masked: other checks add todos.
test("the todo page looks as before @disco:tc-4f25fdb7", async ({ page }) => {
  await page.setExtraHTTPHeaders(apiHeaders());
  await page.goto("/ui");
  await expect(page).toHaveScreenshot("todo-page.png", { mask: [page.locator("#todos")], animations: "disabled", caret: "hide" });
});
