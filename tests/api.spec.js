// @ts-check
const { test, expect } = require("@playwright/test");
const { apiHeaders } = require("../app/test-helpers");

const headers = apiHeaders();

test("the app reports healthy @disco:tc-2232abe9", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
});

test("the test account signs in through mock auth @disco:tc-8eeaf03b", async ({ request }) => {
  const res = await request.post("http://127.0.0.1:4010/login", { data: { username: process.env.E2E_USER, password: process.env.E2E_PASSWORD } });
  expect(res.status()).toBe(200);
  expect((await res.json()).token).toContain("session-");
});

test("adds a todo with the API token @disco:tc-0f50e948", async ({ request }) => {
  const created = await request.post("/todos", { headers, data: { title: "write checks" } });
  expect(created.status()).toBe(201);
  const list = await request.get("/todos", { headers });
  expect((await list.json()).map((todo) => todo.title)).toContain("write checks");
});

test("refuses a request without the API token", async ({ request }) => {
  const res = await request.get("/todos");
  expect(res.status()).toBe(403);
});

// F11c live leg: an edit to a protected check
