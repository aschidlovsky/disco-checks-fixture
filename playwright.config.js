// @ts-check
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "tests",
  reporter: [["list"], ["json", { outputFile: "test-results/report.json" }]],
  use: {
    baseURL: process.env.APP_URL || "http://127.0.0.1:4000",
    // Browser checks record a video and a screenshot, with Playwright's own Chromium
    // (a distro Chromium recorded blank frames: its screencast didn't match Playwright's protocol).
    video: "on",
    screenshot: "on",
  },
});
