// The app under test: a health endpoint, an API that needs the API token secret, and a todo list.
const http = require("node:http");
const port = Number(process.env.PORT || 4000);
const apiToken = process.env.E2E_API_TOKEN;
const todos = [];
// INI-102 F9 live leg: the first todo created after boot fails (a flake the check can't see; a retry passes).
let firstPost = true;
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/health") return res.end(JSON.stringify({ ok: true }));
  if (req.headers["x-api-token"] !== apiToken || !apiToken) { res.statusCode = 403; return res.end(JSON.stringify({ error: "forbidden" })); }
  if (req.method === "GET" && req.url === "/todos") return res.end(JSON.stringify(todos));
  if (req.method === "POST" && req.url === "/todos") {
    // INI-102 F9 live leg: the first todo after boot fails only when someone signed in first (a full run does; a
    // run of this one scenario doesn't) — a flake the check can't see.
    if (firstPost) {
      firstPost = false;
      return fetch(`http://127.0.0.1:${process.env.MOCK_AUTH_PORT || 4010}/count`).then((r) => r.json()).catch(() => ({ logins: 0 })).then(({ logins }) => {
        if (logins > 0) { res.statusCode = 500; return res.end(JSON.stringify({ error: "warming up" })); }
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => { const todo = { id: todos.length + 1, ...JSON.parse(body || "{}") }; todos.push(todo); res.statusCode = 201; res.end(JSON.stringify(todo)); });
      });
    }
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    return req.on("end", () => { const todo = { id: todos.length + 1, ...JSON.parse(body || "{}") }; todos.push(todo); res.statusCode = 201; res.end(JSON.stringify(todo)); });
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
}).listen(port, "127.0.0.1", () => console.log(`app listening on ${port}`));
