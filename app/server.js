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
  if (req.method === "GET" && req.url === "/ui") {
    const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
    const items = todos.filter((todo) => !todo.deleted).map((todo) => `<li data-id="${escape(todo.id)}">${escape(todo.title)}</li>`).join("");
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><title>Todos</title></head><body><h1>Todos</h1><ul id="todos">${items}</ul></body></html>`);
  }
  if (req.method === "POST" && req.url === "/todos") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    return req.on("end", () => { const todo = { id: nextTodoId++, ...JSON.parse(body || "{}") }; todos.push(todo); res.statusCode = 201; res.end(JSON.stringify(todo)); });
  }
  const todoMatch = req.url.match(/^\/todos\/(\d+)$/);
  if (req.method === "DELETE" && todoMatch) {
    const todoIndex = todos.findIndex((todo) => todo.id === Number(todoMatch[1]) && !todo.deleted);
    if (todoIndex === -1) { res.statusCode = 404; return res.end(JSON.stringify({ error: "not found" })); }
    todos[todoIndex].deleted = true;
    res.statusCode = 204;
    return res.end();
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
}).listen(port, "127.0.0.1", () => console.log(`app listening on ${port}`));
