// @ts-check
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "tests",
  reporter: [["list"], ["json", { outputFile: "test-results/report.json" }]],
  use: {
    baseURL: process.env.APP_URL || "http://127.0.0.1:4000",
    // Browser checks record a video; the sandbox image provides Debian's chromium.
    video: "on",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium" },
  },
});
