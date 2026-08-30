import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const SECTIONS = ["hero", "about", "services", "projects", "experience", "skills", "contact"];
const SHOT_DIR = process.env.SHOT_DIR || "/tmp";

const browser = await chromium.launch();

/** Count reveal targets still stuck below full opacity. */
const audit = (page) =>
  page.evaluate((ids) => {
    const out = [];
    for (const id of ids) {
      const sec = document.getElementById(id);
      if (!sec) {
        out.push({ id, missing: true, hidden: -1, total: 0 });
        continue;
      }
      // Only elements the user has actually scrolled to must be revealed;
      // anything still below the fold is *supposed* to be waiting.
      const nodes = [
        ...sec.querySelectorAll("[data-reveal], [data-tag], [data-hero]"),
      ].filter((n) => n.getBoundingClientRect().top < window.innerHeight);
      const hidden = nodes.filter((n) => parseFloat(getComputedStyle(n).opacity) < 0.99);
      out.push({
        id,
        total: nodes.length,
        hidden: hidden.length,
        sample: hidden.slice(0, 2).map((n) => ({
          tag: n.tagName,
          cls: n.className?.toString().slice(0, 50),
          opacity: getComputedStyle(n).opacity,
        })),
      });
    }
    return out;
  }, SECTIONS);

const results = [];

async function scenario(name, viewport, drive) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));

  await page.goto(URL, { waitUntil: "networkidle" });
  await drive(page);
  // Long enough for the slowest stagger chain (28 tags x 55ms + 800ms) to land.
  await page.waitForTimeout(3500);

  const report = await audit(page);
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
  await page.close();

  const bad = report.filter((r) => r.missing || r.hidden > 0);
  results.push({ name, ok: bad.length === 0 && errors.length === 0, bad, errors });
  console.log(
    `${bad.length === 0 && errors.length === 0 ? "PASS" : "FAIL"}  ${name}` +
      (bad.length ? `  → ${bad.map((b) => `${b.id}(${b.hidden}/${b.total})`).join(", ")}` : "") +
      (errors.length ? `  → errors: ${errors.length}` : "")
  );
  if (bad.length) console.log(JSON.stringify(bad, null, 2));
  if (errors.length) console.log(errors.join("\n"));
}

// 1. Slow, human-like scroll.
await scenario("desktop-slow", { width: 1280, height: 800 }, async (page) => {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(120);
  }
});

// 2. Instant jump to the bottom — worst case for viewport observers.
await scenario("desktop-jump", { width: 1280, height: 800 }, async (page) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});

// 3. Violent flick scroll, no pauses.
await scenario("desktop-flick", { width: 1280, height: 800 }, async (page) => {
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 2400);
});

// 4. Scroll down then back up — content must stay visible.
await scenario("desktop-updown", { width: 1280, height: 800 }, async (page) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});

// 5. Deep link — page loads already scrolled to a mid-page section.
await scenario("desktop-hash-skills", { width: 1280, height: 800 }, async (page) => {
  await page.evaluate(() => {
    document.getElementById("skills")?.scrollIntoView();
  });
});

// 6. Mobile.
await scenario("mobile-slow", { width: 390, height: 844 }, async (page) => {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 300) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
  }
});

// 7. prefers-reduced-motion: everything visible, no animation.
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const report = await audit(page);
  const bad = report.filter((r) => r.missing || r.hidden > 0);
  results.push({ name: "reduced-motion", ok: bad.length === 0, bad, errors: [] });
  console.log(`${bad.length === 0 ? "PASS" : "FAIL"}  reduced-motion`);
  if (bad.length) console.log(JSON.stringify(bad, null, 2));
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
process.exit(failed.length ? 1 : 0);
