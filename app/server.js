// The app under test: a health endpoint, an API that needs the API token secret, and a todo list.
const http = require("node:http");
const port = Number(process.env.PORT || 4000);
const apiToken = process.env.E2E_API_TOKEN;
const todos = [];
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  if (req.headers["x-api-token"] !== apiToken || !apiToken) { res.statusCode = 403; return res.end(JSON.stringify({ error: "forbidden" })); }
  if (req.method === "GET" && req.url === "/todos") return res.end(JSON.stringify(todos));
  if (req.method === "POST" && req.url === "/todos") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    return req.on("end", () => {
      const input = JSON.parse(body || "{}");
      if (!input.title) { res.statusCode = 400; return res.end(JSON.stringify({ error: "title is required" })); }
      const todo = { id: todos.length + 1, ...input };
      todos.push(todo);
      res.statusCode = 201;
      res.end(JSON.stringify(todo));
    });
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
}).listen(port, "127.0.0.1", () => console.log(`app listening on ${port}`));
