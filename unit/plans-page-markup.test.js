const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const test = require("node:test");

test("the plans page does not expose debug-only content", async () => {
  const serverSource = await readFile(require.resolve("../app/server"), "utf8");

  assert.doesNotMatch(serverSource, /Debug build — do not ship/);
});
