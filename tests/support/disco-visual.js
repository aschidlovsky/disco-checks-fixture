// Disco visual checkpoints (INI-109). Protected test support: once your default branch has run it, edits need
// approval in the pull request's Protected checks. Call it where a journey reaches a state that should keep
// looking the same; Disco keeps the image and compares it with your default branch's. If your tests import
// from "playwright/test", require that here instead.
const { createHash } = require("node:crypto");
const { test } = require("@playwright/test");

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;
const MAX_HEIGHT = 4096;

async function discoVisual(page, slug, { mask = [] } = {}) {
  if (!SLUG.test(slug)) throw new Error(`discoVisual: "${slug}" must be lower-case letters, digits and dashes`);
  await page.evaluate(async () => { await document.fonts.ready; });
  const facts = await page.evaluate(() => ({
    fonts: [...document.fonts].filter((face) => face.status === "loaded")
      .map((face) => [face.family, face.style, face.weight, face.stretch].join("|")).sort(),
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    dpr: window.devicePixelRatio,
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  const viewport = page.viewportSize() ?? { width: facts.width, height: facts.height };
  const info = test.info();
  const file = info.outputPath(`disco-visual-${slug}.png`);
  await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: Math.max(1, facts.width), height: Math.max(1, Math.min(facts.height, MAX_HEIGHT)) },
    animations: "disabled", caret: "hide", scale: "css", mask });
  const key = {
    v: 1,
    browserVersion: page.context().browser()?.version() ?? "unknown",
    fontsHash: createHash("sha256").update(facts.fonts.join("\n")).digest("hex").slice(0, 32),
    viewport: { width: viewport.width, height: viewport.height },
    dpr: facts.dpr,
    colorScheme: facts.dark ? "dark" : "light",
    truncated: facts.height > MAX_HEIGHT,
  };
  // Pushed rather than attached, so Playwright keeps this one file instead of copying it.
  info.attachments.push({ name: `disco:visual:${slug}`, contentType: "image/png", path: file });
  await info.attach(`disco:visual-key:${slug}`, { body: JSON.stringify(key), contentType: "application/json" });
}

module.exports = { discoVisual };
