// INI-109 F5 live leg: a page tour's sign-in. Signs in with the recipe's leased test account and saves the session
// as Playwright's storage state, which Disco reads once (and deletes) to capture the signed-in pages.
const fs = require("node:fs");
const path = require("node:path");
const base = (process.env.BASE_URL || "http://127.0.0.1:4000").replace(/\/+$/, "");
(async () => {
  const answer = await fetch(`${base}/login`, { method: "POST", redirect: "manual", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: process.env.E2E_USER, password: process.env.E2E_PASSWORD }) });
  const sid = /sid=([^;]+)/.exec(answer.headers.get("set-cookie") || "")?.[1];
  if (answer.status !== 303 || !sid) { console.error(`sign-in failed: HTTP ${answer.status}`); process.exit(1); }
  const host = new URL(base).hostname;
  const state = { cookies: [{ name: "sid", value: sid, domain: host, path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" }], origins: [] };
  const file = path.join(process.cwd(), ".disco/page-tour/session.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state));
  console.log("signed in; session saved");
})().catch((error) => { console.error(`sign-in failed: ${error.message}`); process.exit(1); });
