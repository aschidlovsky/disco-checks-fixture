// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("lists todos as an array @disco:tc-0f50e948", async ({ request }) => {
  await request.post("/todos", { headers, data: { title: "listed" } });
  const res = await request.get("/todos", { headers });
  expect(res.status()).toBe(200);
  expect((await res.json()).map((todo) => todo.title)).toContain("listed");
});
