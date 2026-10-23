// @ts-check
const { test, expect } = require("@playwright/test");

test("the health endpoint answers ok in its body @disco:tc-2232abe9", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});
