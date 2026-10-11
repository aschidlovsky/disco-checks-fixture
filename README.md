# disco-checks-fixture

A tiny Node app with Playwright API checks. Used to prove Disco check recipes
end to end: `npm ci` (install), `node app/mock-auth.js` (a dependency
service), `node app/server.js` (app boot), `npx playwright test --list`
(collect) and `npx playwright test` (run, JSON report in `test-results/`).
The checks need `E2E_API_TOKEN` and a test account (`E2E_USER`,
`E2E_PASSWORD`) — test values only.
