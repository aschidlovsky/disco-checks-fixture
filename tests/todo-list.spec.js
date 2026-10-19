// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("a new todo is listed with its title", async ({ request }) => {
  const created = await request.post("/todos", { headers, data: { title: "listed with its title" } });
  expect(created.status()).toBe(201);
  const list = await request.get("/todos", { headers });
  expect(list.status()).toBe(200);
  expect((await list.json()).map((todo) => todo.title)).toContain("listed with its title");
});
