// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("deleting a todo removes it from the list @disco:tc-4f25fdb7", async ({ request }) => {
  const title = `deleted todo ${Date.now()}`;
  const created = await request.post("/todos", { headers, data: { title } });
  expect(created.status()).toBe(201);
  const todo = await created.json();

  const deleted = await request.delete(`/todos/${todo.id}`, { headers });
  expect(deleted.status()).toBe(204);

  const list = await request.get("/todos", { headers });
  expect(list.status()).toBe(200);
  expect((await list.json()).map((item) => item.id)).not.toContain(todo.id);

  const missing = await request.delete("/todos/999999999", { headers });
  expect(missing.status()).toBe(404);
});

test("creating after deletion does not reuse a live todo id", async ({ request }) => {
  const first = await request.post("/todos", { headers, data: { title: "first unique id" } });
  const second = await request.post("/todos", { headers, data: { title: "second unique id" } });
  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);
  const firstTodo = await first.json();
  const secondTodo = await second.json();

  expect((await request.delete(`/todos/${firstTodo.id}`, { headers })).status()).toBe(204);

  const third = await request.post("/todos", { headers, data: { title: "third unique id" } });
  expect(third.status()).toBe(201);
  const thirdTodo = await third.json();
  expect(thirdTodo.id).not.toBe(secondTodo.id);
});
