// A mock auth service: issues a session token for the one test account it is given by environment.
const http = require("node:http");
const port = Number(process.env.MOCK_AUTH_PORT || 4010);
const user = process.env.E2E_USER;
const password = process.env.E2E_PASSWORD;
http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/login") { res.statusCode = 404; return res.end(); }
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const { username, password: given } = JSON.parse(body || "{}");
    const ok = !!user && username === user && given === password;
    res.statusCode = ok ? 200 : 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(ok ? { token: "session-" + username } : { error: "bad credentials" }));
  });
}).listen(port, "127.0.0.1", () => console.log(`mock-auth listening on ${port}`));
