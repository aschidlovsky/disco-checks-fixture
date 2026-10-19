// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("rejects a todo without a title @disco:tc-e6f7ee1b", async ({ request }) => {
  const response = await request.post("/todos", { headers, data: {} });

  expect(response.status()).toBe(400);
});
