// The app under test: a health endpoint, an API that needs the API token secret, and a todo list.
const http = require("node:http");
const port = Number(process.env.PORT || 4000);
const apiToken = process.env.E2E_API_TOKEN;
const todos = [];
// INI-109 F3 live leg: an account menu that opens a billing flyout.
const ACCOUNT_PAGE = `<!doctype html><html><head><title>Account</title><style>
body { font-family: sans-serif; margin: 0; }
header { display: flex; justify-content: flex-end; padding: 12px 16px; background: #f3f2f1; }
#flyout { position: absolute; top: 56px; right: 16px; width: 400px; padding: 44px; border: 4px solid #5c2e91; border-radius: 20px; background: #efe6f7; color: #2b1a40; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
#flyout h2 { margin: 0 0 12px; font-size: 26px; color: #ffb900; letter-spacing: 0.02em; }
</style></head><body><header><button id="account" aria-expanded="false" aria-controls="flyout">Account</button> <button id="billing" type="button" aria-expanded="false" aria-controls="flyout">Billing</button></header>
<main><h1>Your account</h1></main>
<div id="flyout" role="dialog" aria-labelledby="billing-title" hidden><h2 id="billing-title">Billing</h2><p>Plan: Team</p><p>Next invoice: 1 November</p><button id="billing-close" type="button">Close</button></div>
<script>
const flyout = document.getElementById("flyout");
let opener = null;
// INI-109 F10 live leg: the flyout moves focus in on open, closes on Escape or Close, and returns focus to what opened it.
const closeFlyout = () => { flyout.hidden = true; for (const id of ["account", "billing"]) document.getElementById(id).setAttribute("aria-expanded", "false"); };
for (const id of ["account", "billing"]) document.getElementById(id).addEventListener("click", (event) => {
  if (!flyout.hidden) return closeFlyout();
  opener = event.currentTarget; flyout.hidden = false; opener.setAttribute("aria-expanded", "true"); document.getElementById("billing-close").focus();
});
document.getElementById("billing-close").addEventListener("click", closeFlyout);
flyout.addEventListener("keydown", (event) => { if (event.key === "Escape") closeFlyout(); });
</script>
</body></html>`;
// INI-109 F7 live leg: the plans page (no header).
const PLANS_PAGE = `<!doctype html><html><head><title>Plans</title><style>
body { font-family: sans-serif; margin: 0; padding: 24px; }
.plan { width: 360px; padding: 24px; margin-bottom: 16px; border: 2px solid #8a8886; border-radius: 12px; background: #faf9f8; }
</style></head><body><h1>Plans</h1>
<div class="plan"><h2>Team</h2><p>For small teams.</p></div>
<div class="plan"><h2>Business</h2><p>For growing companies.</p></div>
</body></html>`;
// INI-109 F8a live leg: a cart on a phone — a product name in a fixed-width line, and a buy button. The product
// picture has no alt text (an accessibility finding main already has, so pull requests read it as known).
const CART_PAGE = `<!doctype html><html lang="en"><head><title>Cart</title><style>
body { font-family: sans-serif; margin: 0; padding: 16px; }
.product { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.name { width: 200px; white-space: nowrap; overflow: hidden; font-size: 18px; }
.buy { width: 160px; height: 44px; font-size: 16px; }
</style></head><body><main><h1>Your cart</h1>
<div class="product"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23c8c6c4'/%3E%3C/svg%3E" width="40" height="40">
<span class="name" id="product-name">Desk lamp</span></div>
<button class="buy" id="buy">Buy now</button></main></body></html>`;
// INI-109 F5 live leg: pages a page tour captures — a sign-in form, and an orders grid only a signed-in person sees.
// A session cookie (set by POST /login, checked against the mock auth service) is the only way in: no API token.
const sessions = new Set();
const LOGIN_PAGE = `<!doctype html><html><head><title>Sign in</title><style>
body { font-family: sans-serif; margin: 0; padding: 48px 24px; background: #faf9f8; color: #201f1e; }
@media (prefers-color-scheme: dark) { body { background: #1b1a19; color: #f3f2f1; } }
form { max-width: 320px; display: grid; gap: 12px; }
</style></head><body><h1>Sign in</h1><form method="post" action="/login"><label>Username <input name="username"></label>
<label>Password <input name="password" type="password"></label><button>Sign in</button></form></body></html>`;
const ORDERS_PAGE = `<!doctype html><html><head><title>Orders</title><style>
body { font-family: sans-serif; margin: 0; padding: 24px; background: #ffffff; color: #201f1e; }
@media (prefers-color-scheme: dark) { body { background: #1b1a19; color: #f3f2f1; } .order { background: #292827; border-color: #605e5c; } }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
.order { padding: 16px; border: 2px solid #c8c6c4; border-radius: 12px; background: #faf9f8; }
</style></head><body><h1>Your orders</h1><div class="grid">
<div class="order"><h2>#1001</h2><p>3 items · Shipped</p></div><div class="order"><h2>#1002</h2><p>1 item · Packing</p></div>
<div class="order"><h2>#1003</h2><p>5 items · Delivered</p></div><div class="order"><h2>#1004</h2><p>2 items · Shipped</p></div>
<div class="order"><h2>#1005</h2><p>4 items · Delivered</p></div><div class="order"><h2>#1006</h2><p>1 item · Returned</p></div>
</div></body></html>`;
const cookieOf = (req) => (/(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || "") || [])[1];
const html = (res, page) => { res.setHeader("content-type", "text/html; charset=utf-8"); return res.end(page); };
let nextTodoId = 1;
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  // INI-109 F5b-2 live leg: the start page a link crawl reads (signed in, it also links the orders grid).
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    const signedIn = sessions.has(cookieOf(req));
    return html(res, `<!doctype html><html><head><title>Fixture home</title></head><body><h1>Fixture app</h1><nav>
<a href="/about">About</a> <a href="/pricing?plan=pro#compare">Pricing</a> <a href="/about">About again</a>
${signedIn ? '<a href="/orders">Your orders</a>' : '<a href="/login">Sign in</a>'}
<a href="https://example.com/docs">Docs (elsewhere)</a> <a href="mailto:help@example.com">Help</a></nav></body></html>`);
  }
  if (req.method === "GET" && (req.url === "/about" || req.url.startsWith("/pricing"))) {
    const title = req.url === "/about" ? "About the fixture" : "Pricing";
    return html(res, `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1><p>A public page the start page links to.</p><a href="/">Home</a></body></html>`);
  }
  // INI-109 F5 live leg: the sign-in form and the signed-in orders grid (cookie sessions, before the API-token rule).
  if (req.method === "GET" && req.url.startsWith("/login")) return html(res, LOGIN_PAGE);
  if (req.method === "POST" && req.url === "/login") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    return req.on("end", () => {
      const fields = (req.headers["content-type"] || "").includes("json") ? JSON.parse(body || "{}") : Object.fromEntries(new URLSearchParams(body));
      const auth = http.request({ host: "127.0.0.1", port: Number(process.env.MOCK_AUTH_PORT || 4010), path: "/login", method: "POST", headers: { "content-type": "application/json" } }, (answer) => {
        answer.resume();
        if (answer.statusCode !== 200) { res.statusCode = 401; return html(res, LOGIN_PAGE); }
        const sid = require("node:crypto").randomBytes(16).toString("hex");
        sessions.add(sid);
        res.statusCode = 303;
        res.setHeader("set-cookie", `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
        res.setHeader("location", "/orders");
        return res.end();
      });
      auth.on("error", () => { res.statusCode = 502; res.end(); });
      auth.end(JSON.stringify({ username: fields.username, password: fields.password }));
    });
  }
  if (req.method === "GET" && req.url === "/orders") {
    if (!sessions.has(cookieOf(req))) { res.statusCode = 302; res.setHeader("location", "/login?next=%2Forders"); return res.end(); }
    return html(res, ORDERS_PAGE);
  }
  if (req.headers["x-api-token"] !== apiToken || !apiToken) { res.statusCode = 403; return res.end(JSON.stringify({ error: "forbidden" })); }
  if (req.method === "GET" && req.url === "/todos") return res.end(JSON.stringify(todos.filter((todo) => !todo.deleted)));
  if (req.method === "GET" && req.url === "/ui") {
    const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
    const items = todos.filter((todo) => !todo.deleted).map((todo) => `<li data-id="${escape(todo.id)}">${escape(todo.title)}</li>`).join("");
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><title>Todos</title></head><body><h1>My todo list</h1><p>Everything you still have to do, newest last.</p><ul id="todos">${items}</ul></body></html>`);
  }
  // INI-109 F7 live leg: a plain page with no header (its own checkpoint).
  if (req.method === "GET" && req.url === "/plans") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(PLANS_PAGE);
  }
  if (req.method === "GET" && req.url === "/cart") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(CART_PAGE);
  }
  if (req.method === "GET" && req.url === "/account") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(ACCOUNT_PAGE);
  }
  if (req.method === "POST" && req.url === "/todos") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    return req.on("end", () => { const todo = { id: nextTodoId++, ...JSON.parse(body || "{}") }; todos.push(todo); res.statusCode = 201; res.end(JSON.stringify(todo)); });
  }
  const todoMatch = req.url.match(/^\/todos\/(\d+)$/);
  if (req.method === "DELETE" && todoMatch) {
    const todoIndex = todos.findIndex((todo) => todo.id === Number(todoMatch[1]));
    if (todoIndex === -1) { res.statusCode = 404; return res.end(JSON.stringify({ error: "not found" })); }
    todos[todoIndex].deleted = true;
    res.statusCode = 204;
    return res.end();
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
}).listen(port, "127.0.0.1", () => console.log(`app listening on ${port}`));
