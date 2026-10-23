// The app under test: a health endpoint, an API that needs the API token secret, and a todo list.
const http = require("node:http");
const port = Number(process.env.PORT || 4000);
const apiToken = process.env.E2E_API_TOKEN;
const todos = [];
// INI-109 F3 live leg: an account menu that opens a billing flyout.
const ACCOUNT_PAGE = `<!doctype html><html><head><title>Account</title><style>
body { font-family: sans-serif; margin: 0; }
header { display: flex; justify-content: flex-end; padding: 12px 16px; background: #f3f2f1; }
#flyout { position: absolute; top: 56px; right: 16px; width: 420px; padding: 32px; border: 1px solid #484644; border-radius: 12px; background: #201f1e; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
#flyout h2 { margin: 0 0 8px; font-size: 22px; color: #0f6cbd; }
</style></head><body><header><button id="account" aria-expanded="false" aria-controls="flyout">Account</button></header>
<main><h1>Your account</h1></main>
<div id="flyout" role="dialog" aria-labelledby="billing-title" hidden><h2 id="billing-title">Billing</h2><p>Plan: Team</p><p>Next invoice: 1 November</p></div>
<script>document.getElementById("account").addEventListener("click", (event) => { const flyout = document.getElementById("flyout"); flyout.hidden = !flyout.hidden; event.currentTarget.setAttribute("aria-expanded", String(!flyout.hidden)); });</script>
</body></html>`;
let nextTodoId = 1;
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  if (req.headers["x-api-token"] !== apiToken || !apiToken) { res.statusCode = 403; return res.end(JSON.stringify({ error: "forbidden" })); }
  if (req.method === "GET" && req.url === "/todos") return res.end(JSON.stringify(todos.filter((todo) => !todo.deleted)));
  if (req.method === "GET" && req.url === "/ui") {
    const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
    const items = todos.filter((todo) => !todo.deleted).map((todo) => `<li data-id="${escape(todo.id)}">${escape(todo.title)}</li>`).join("");
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><title>Todos</title></head><body><h1>My todo list</h1><p>Everything you still have to do, newest last.</p><ul id="todos">${items}</ul></body></html>`);
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
