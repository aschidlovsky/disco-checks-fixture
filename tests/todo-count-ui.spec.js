// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("the todo page shows the number of todos with correct grammar", async ({ page, request }) => {
  const created = await request.post("/todos", { headers, data: { title: `counted todo ${Date.now()}` } });
  expect(created.status()).toBe(201);

  const list = await request.get("/todos", { headers });
  expect(list.status()).toBe(200);
  const todoCount = (await list.json()).length;

  await page.setExtraHTTPHeaders(headers);
  await page.goto("/ui");
  await expect(page.locator("#todo-count")).toHaveText(`${todoCount} ${todoCount === 1 ? "todo" : "todos"}`);
});
