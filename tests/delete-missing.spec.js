// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("deleting a todo twice says it is gone @disco:tc-8eeaf03b", async ({ request }) => {
  const created = await (await request.post("/todos", { headers, data: { title: "delete twice" } })).json();
  expect((await request.delete(`/todos/${created.id}`, { headers })).status()).toBe(204);
  const again = await request.delete(`/todos/${created.id}`, { headers });
  expect(again.status()).toBe(404);
  expect((await again.json()).error).toBe("not found");
});
