// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("a new todo gets an id @disco:tc-8eeaf03b", async ({ request }) => {
  const res = await request.post("/todos", { headers, data: { title: "with id" } });
  expect(res.status()).toBe(201);
  expect(typeof (await res.json()).id).toBe("number");
});
