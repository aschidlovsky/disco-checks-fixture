// @ts-check
const { test, expect } = require("@playwright/test");

test("a request without the API token cannot read the todo list", async ({ request }) => {
  const res = await request.get("/todos");

  expect(res.status()).toBe(403);
});
