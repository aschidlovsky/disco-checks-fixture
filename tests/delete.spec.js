// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("deletes a todo", async ({ request }) => {
  const created = await (await request.post("/todos", { headers, data: { title: "to delete" } })).json();
  const res = await request.delete(`/todos/${created.id}`, { headers });
  expect(res.status()).toBe(204);
  const list = await request.get("/todos", { headers });
  expect((await list.json()).map((todo) => todo.id)).not.toContain(created.id);
});
