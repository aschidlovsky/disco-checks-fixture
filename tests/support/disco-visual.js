// Disco visual checkpoints v2 (INI-109): the page's image and what it reads on the page at that moment. Protected test
// support: once your default branch has run it, edits need approval in the pull request's Protected checks. Call it
// where a journey reaches a state that should keep looking the same; Disco keeps the image, compares it with your
// default branch's, and reports accessibility problems (when @axe-core/playwright is installed) and page-health problems
// that are new. If your tests import from "playwright/test", require that here instead.
const { createHash } = require("node:crypto");
const { test } = require("@playwright/test");

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;
const MAX_HEIGHT = 4096;
const MAX_FINDINGS = 20;
const MAX_BODY_BYTES = 3000;
const AXE_BUDGET_MS = 5000;
const SEVERITIES = ["critical", "serious", "moderate", "minor"];
const watching = new WeakMap();

// Page and console errors are read from when the page is first watched; call this in a beforeEach to watch from load.
function discoVisualWatch(page) {
  if (watching.has(page)) return watching.get(page);
  const errors = [];
  watching.set(page, errors);
  page.on("pageerror", (error) => errors.push({ rule: "page-error", severity: "serious", message: String(error?.message ?? error) }));
  page.on("console", (message) => { if (message.type() === "error") errors.push({ rule: "console-error", severity: "moderate", message: message.text() }); });
  return errors;
}

async function discoVisual(page, slug, { mask = [] } = {}) {
  if (!SLUG.test(slug)) throw new Error(`discoVisual: "${slug}" must be lower-case letters, digits and dashes`);
  const info = test.info();
  if (info.attachments.some((attachment) => attachment.name === `disco:visual:${slug}`)) throw new Error(`discoVisual: "${slug}" is already a checkpoint of this test`);
  const errors = discoVisualWatch(page);
  await page.evaluate(async () => { await document.fonts.ready; });
  const facts = await page.evaluate(() => ({
    fonts: [...document.fonts].filter((face) => face.status === "loaded")
      .map((face) => [face.family, face.style, face.weight, face.stretch].join("|")).sort(),
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dpr: window.devicePixelRatio,
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  const viewport = page.viewportSize() ?? facts.viewport;
  const file = info.outputPath(`disco-visual-${slug}.png`);
  const image = { width: Math.max(1, facts.width), height: Math.max(1, Math.min(facts.height, MAX_HEIGHT)) };
  await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, ...image }, animations: "disabled", caret: "hide", scale: "css", mask });
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
  // Read after the picture, so the findings are of the page as captured. A read that fails never fails the test.
  const axe = await runAxe(page);
  let read = null;
  try {
    read = await page.evaluate(readPage, axe.nodes.map((node) => node.target));
  } catch {
    // Health is then "failed"; accessibility findings keep their words without a box.
  }
  const a11y = axe.nodes.map((node, index) => finding("a11y", { ...node, identity: read?.placed[index]?.identity }, read?.placed[index]?.rect, image));
  const health = (read?.health ?? []).map((entry) => finding("health", entry, entry.rect, image));
  for (const error of errors.splice(0)) {
    const target = (String(error.message).split("\n")[0].replace(/\d+/g, "#").trim() || "error").slice(0, 120);
    if (!health.some((entry) => entry.rule === error.rule && entry.target === target)) health.push({ kind: "health", rule: error.rule, target, severity: error.severity });
  }
  const all = [...a11y, ...health].sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
  const findings = all.slice(0, MAX_FINDINGS);
  const reads = { a11y: axe.read, health: read ? "read" : "failed" };
  const body = () => JSON.stringify({ v: 1, reads, findings, dropped: all.length - findings.length });
  while (findings.length > 0 && Buffer.byteLength(body()) > MAX_BODY_BYTES) findings.pop();
  await info.attach(`disco:visual-findings:${slug}`, { body: body(), contentType: "application/json" });
}

// axe's serious and critical rules, one finding per element, when the suite has @axe-core/playwright.
async function runAxe(page) {
  let AxeBuilder;
  try {
    const loaded = require("@axe-core/playwright");
    AxeBuilder = loaded.default ?? loaded.AxeBuilder ?? loaded;
  } catch (error) {
    return { read: error?.code === "MODULE_NOT_FOUND" ? "not-installed" : "failed", nodes: [] };
  }
  try {
    // Bounded, so a large page can't run the test out of time.
    const results = await Promise.race([new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error("axe took too long")), AXE_BUDGET_MS))]);
    return { read: "read", nodes: results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .flatMap((violation) => violation.nodes.map((node) => ({ rule: violation.id, severity: violation.impact, target: node.target.flat().join(" >> ") }))) };
  } catch {
    return { read: "failed", nodes: [] };
  }
}

// Runs in the page, in one call: where axe's elements are, and the page-health read. Deterministic for the same page.
function readPage(selectors) {
  const root = document.documentElement;
  // What stays the same about an element while the page around it changes: its nearest id or test id, its tag and
  // role, and a short hash of its text — so a finding is still the same one after an unrelated edit.
  const identityOf = (element) => {
    let anchor = "";
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const testId = node.getAttribute("data-testid");
      if (node.id || testId) { anchor = node.id ? `#${node.id}` : `[data-testid="${testId}"]`; break; }
    }
    // The page itself has no text of its own: its text is everything on it.
    const whole = element === root || element === document.body;
    const text = whole ? "" : (element.getAttribute("aria-label") || element.getAttribute("alt") || element.textContent || element.getAttribute("src") || "").trim().replace(/\s+/g, " ").replace(/\d/g, "#").slice(0, 40);
    let hash = 0;
    for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return `${anchor}|${element.tagName.toLowerCase()}|${element.getAttribute("role") ?? ""}|${hash.toString(16)}`.slice(0, 200);
  };
  const rectOf = (element) => { const rect = element.getBoundingClientRect(); return [rect.x + window.scrollX, rect.y + window.scrollY, rect.width, rect.height]; };
  const placed = selectors.map((selector) => {
    try {
      const element = document.querySelector(selector);
      if (!element) return null;
      return element === root || element === document.body ? { identity: identityOf(element) } : { rect: rectOf(element), identity: identityOf(element) };
    } catch {
      return null;
    }
  });
  const unique = (selector) => { try { return document.querySelectorAll(selector).length === 1; } catch { return false; } };
  const selectorOf = (element) => {
    if (element.id && unique(`#${CSS.escape(element.id)}`)) return `#${CSS.escape(element.id)}`;
    const testId = element.getAttribute("data-testid");
    if (testId && unique(`[data-testid="${CSS.escape(testId)}"]`)) return `[data-testid="${CSS.escape(testId)}"]`;
    const steps = [];
    for (let node = element; node && node !== root && steps.length < 5; node = node.parentElement) {
      const same = [...(node.parentElement?.children ?? [])].filter((sibling) => sibling.tagName === node.tagName);
      steps.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${same.indexOf(node) + 1})`);
    }
    return steps.join(" > ");
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };
  const health = [];
  const add = (rule, severity, element, target) => health.push({ rule, severity, target: target ?? selectorOf(element),
    ...(element ? { rect: rectOf(element), identity: identityOf(element) } : {}) });
  if (root.scrollWidth > window.innerWidth + 1) add("horizontal-overflow", "serious", null, "html");
  for (const element of [...document.body.querySelectorAll("*")].slice(0, 3000)) {
    if (![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
    const style = getComputedStyle(element);
    if ((style.overflowX === "hidden" || style.overflowX === "clip") && element.scrollWidth > element.clientWidth + 1 && style.textOverflow !== "ellipsis" && visible(element)) {
      add("clipped-text", "moderate", element);
    }
  }
  const targets = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])')]
    .filter(visible).slice(0, 400);
  const boxes = targets.map((element) => element.getBoundingClientRect());
  targets.forEach((element, index) => {
    const box = boxes[index];
    const inlineLink = element.tagName === "A" && getComputedStyle(element).display === "inline";
    if ((box.width < 24 || box.height < 24) && !inlineLink) {
      // WCAG 2.5.8's spacing exception: an undersized target with nothing else within 12 px of its centre passes.
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const crowded = boxes.some((other, at) => at !== index
        && Math.hypot(Math.max(other.left - cx, 0, cx - other.right), Math.max(other.top - cy, 0, cy - other.bottom)) < 12);
      if (crowded) add("small-touch-target", "moderate", element);
    }
    for (let at = 0; at < index; at += 1) {
      const other = boxes[at];
      const overlap = Math.max(0, Math.min(box.right, other.right) - Math.max(box.left, other.left)) * Math.max(0, Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top));
      if (overlap >= 4 && !element.contains(targets[at]) && !targets[at].contains(element)) { add("overlapping-interactive", "serious", element); break; }
    }
  });
  for (const img of document.images) if (img.getAttribute("src") && img.complete && img.naturalWidth === 0) add("broken-image", "serious", img);
  for (const family of new Set([...document.fonts].filter((face) => face.status === "error").map((face) => face.family))) add("font-not-loaded", "moderate", null, `font:${family}`);
  return { placed, health };
}

// A finding, with its box on the picture (CSS px, clipped to it) when it has one.
function finding(kind, { rule, severity, target, identity }, rect, image) {
  const result = { kind, rule, target: String(target).slice(0, 200), ...(identity ? { identity } : {}), severity };
  if (!rect) return result;
  const x = Math.max(0, Math.round(rect[0]));
  const y = Math.max(0, Math.round(rect[1]));
  const width = Math.min(image.width, Math.round(rect[0] + rect[2])) - x;
  const height = Math.min(image.height, Math.round(rect[1] + rect[3])) - y;
  return width >= 1 && height >= 1 ? { ...result, box: { x, y, width, height } } : result;
}

module.exports = { discoVisual, discoVisualWatch };
