// A mock auth service: issues a session token for the one test account it is given by environment.
const http = require("node:http");
const port = Number(process.env.MOCK_AUTH_PORT || 4010);
const user = process.env.MOCK_AUTH_USER;
const password = process.env.MOCK_AUTH_PASSWORD;
let logins = 0;
http.createServer((req, res) => {
  // INI-102 F9 live leg: how many sign-ins this service has seen (the app's flake depends on it).
  if (req.method === "GET" && req.url === "/count") { res.setHeader("content-type", "application/json"); return res.end(JSON.stringify({ logins })); }
  if (req.method !== "POST" || req.url !== "/login") { res.statusCode = 404; return res.end(); }
  logins += 1;
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
