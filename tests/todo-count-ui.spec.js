// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("the todo page shows how many todos there are @disco:tc-497e4a2b", async ({ page, request }) => {
  const existing = await request.get("/todos", { headers });
  expect(existing.status()).toBe(200);
  for (const todo of await existing.json()) {
    const deleted = await request.delete(`/todos/${todo.id}`, { headers });
    expect(deleted.status()).toBe(204);
  }

  const firstCreated = await request.post("/todos", {
    headers,
    data: { title: `first counted todo ${Date.now()}` },
  });
  expect(firstCreated.status()).toBe(201);

  await page.setExtraHTTPHeaders(headers);
  await page.goto("/ui");
  await expect(page.getByText("1 todo", { exact: true })).toBeVisible();

  const secondCreated = await request.post("/todos", {
    headers,
    data: { title: `second counted todo ${Date.now()}` },
  });
  expect(secondCreated.status()).toBe(201);

  await page.reload();
  await expect(page.getByText("2 todos", { exact: true })).toBeVisible();
});
