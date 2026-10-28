// The app under test: a health endpoint, an API that needs the API token secret, and a todo list.
const http = require("node:http");
const port = Number(process.env.PORT || 4000);
const apiToken = process.env.E2E_API_TOKEN;
const todos = [];
let nextTodoId = 1;
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  if (req.headers["x-api-token"] !== apiToken || !apiToken) { res.statusCode = 403; return res.end(JSON.stringify({ error: "forbidden" })); }
  if (req.method === "GET" && req.url === "/todos") return res.end(JSON.stringify(todos.filter((todo) => !todo.deleted)));
  if (req.method === "GET" && req.url === "/account") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<!doctype html>
<html>
  <head><title>Account</title></head>
  <body>
    <h1>Account</h1>
    <button id="billing-button" type="button">Billing</button>
    <div id="billing-flyout" role="dialog" aria-labelledby="billing-title" hidden>
      <h2 id="billing-title">Billing</h2>
      <p>Plan: Starter</p>
      <p>Next invoice: November 15, 2026</p>
      <button id="billing-close" type="button">Close</button>
    </div>
    <script>
      const billingButton = document.querySelector("#billing-button");
      const billingFlyout = document.querySelector("#billing-flyout");
      const billingClose = document.querySelector("#billing-close");

      const closeBilling = () => {
        billingFlyout.hidden = true;
        billingButton.focus();
      };

      billingButton.addEventListener("click", () => {
        billingFlyout.hidden = false;
        billingClose.focus();
      });
      billingClose.addEventListener("click", closeBilling);
      billingFlyout.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeBilling();
      });
    </script>
  </body>
</html>`);
  }
  if (req.method === "GET" && req.url === "/ui") {
    const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
    const activeTodos = todos.filter((todo) => !todo.deleted);
    const items = activeTodos.map((todo) => `<li data-id="${escape(todo.id)}">${escape(todo.title)}</li>`).join("");
    const count = `${activeTodos.length} todo${activeTodos.length === 1 ? "" : "s"}`;
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><title>Todos</title></head><body><h1>Todos</h1><p id="todo-count">${count}</p><ul id="todos">${items}</ul></body></html>`);
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
