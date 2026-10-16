# disco-checks-fixture

A tiny Node app with Playwright API checks. Used to prove Disco check recipes
end to end: `npm ci` (install), `node app/mock-auth.js` (a dependency
service), `node app/server.js` (app boot), `npx playwright test --list`
(collect) and `npx playwright test` (run, JSON report in `test-results/`).
The app needs `E2E_API_TOKEN`; mock auth holds the account as
`MOCK_AUTH_USER`/`MOCK_AUTH_PASSWORD`; the checks get `E2E_API_TOKEN` and the
test account as `E2E_USER`/`E2E_PASSWORD` — test values only.

<!-- INI-102 F10a live leg (head 1) -->

<!-- INI-102 F10a live leg (head 2) -->
