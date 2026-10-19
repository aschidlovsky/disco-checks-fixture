// @ts-check
const { test, expect } = require("@playwright/test");

test("a request without the API token cannot read the todo list @disco:tc-d445c8c3", async ({ request }) => {
  const res = await request.get("/todos");

  expect(res.status()).toBe(403);
});
