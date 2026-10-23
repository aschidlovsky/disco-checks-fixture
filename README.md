# disco-checks-fixture

A tiny Node app with Playwright API checks. Used to prove Disco check recipes
end to end: `npm ci` (install), `node app/mock-auth.js` (a dependency
service), `node app/server.js` (app boot), `npx playwright test --list`
(collect) and `npx playwright test` (run, JSON report in `test-results/`).
The app needs `E2E_API_TOKEN`; mock auth holds the account as
`MOCK_AUTH_USER`/`MOCK_AUTH_PASSWORD`; the checks get `E2E_API_TOKEN` and the
test account as `E2E_USER`/`E2E_PASSWORD` — test values only.

Deleted todos are soft-deleted: they stay in memory with `deleted: true` and are hidden from `GET /todos` and `/ui`.
<!-- LPB-1 live leg 2026-10-20: link an existing PR to a bug -->
<!-- MPV-1 live leg: a merged PR keeps its head verdict. -->
<!-- PTR-1 live leg 2026-10-22: main moves, so the profile image rebuilds -->
<!-- PTR-1: first Gate run after the rebuild -->
