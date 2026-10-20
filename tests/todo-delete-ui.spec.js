// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("a deleted todo disappears from the todo page @disco:tc-4f25fdb7", async ({ page, request }) => {
  const title = `todo page ${Date.now()}`;
  const created = await request.post("/todos", { headers, data: { title } });
  expect(created.status()).toBe(201);
  const todo = await created.json();

  await page.setExtraHTTPHeaders(headers);
  await page.goto("/ui");
  await expect(page.getByText(title)).toBeVisible();

  expect((await request.delete(`/todos/${todo.id}`, { headers })).status()).toBe(204);
  await page.reload();
  await expect(page.getByText(title)).toHaveCount(0);
});
