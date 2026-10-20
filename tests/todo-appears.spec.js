// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("added todo appears in the todo list @disco:tc-85ea04b1", async ({ request }) => {
  const title = `review todo ${Date.now()}`;

  const created = await request.post("/todos", { headers, data: { title } });
  expect(created.status()).toBe(201);

  const list = await request.get("/todos", { headers });
  expect(list.status()).toBe(200);
  expect((await list.json()).map((todo) => todo.title)).toContain(title);
});
