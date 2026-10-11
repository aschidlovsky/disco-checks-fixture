// @ts-check
// Collect: `npx playwright test --list --config=playwright.list.config.js` writes the listing to a file Disco reads.
const base = require("./playwright.config.js");
module.exports = { ...base, reporter: [["json", { outputFile: "test-results/list.json" }]] };
