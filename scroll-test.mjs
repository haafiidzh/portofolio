import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
// "experience" is intentionally not rendered (PRD 07 §1); add it back if it returns.
const SECTIONS = ["hero", "about", "services", "projects", "skills", "contact"];
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

/**
 * PRD 07 §4/§10: after scroll settles, no text in the reading zone (middle 60%
 * of the viewport) may have effective opacity < 1 (own x ancestors').
 */
const readingZone = (page) =>
  page.evaluate(() => {
    const vh = window.innerHeight;
    const effective = (el) => {
      let o = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity);
      }
      return o;
    };
    const bad = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue.trim()) continue;
      const el = t.parentElement;
      if (!el || el.closest("script, style, noscript, [aria-hidden='true']")) continue;
      // Hero "Scroll" hint: decorative, scrubbed to 0 on purpose (PRD 07 §13.2, F5);
      // it sits at the bottom of the tall hero, so it crosses the zone while invisible.
      if (el.closest("#hero") && el.classList.contains("eyebrow") && t.nodeValue.trim() === "Scroll") continue;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (r.height === 0 || mid < vh * 0.2 || mid > vh * 0.8) continue;
      const o = effective(el);
      if (o < 0.99) bad.push({ text: t.nodeValue.trim().slice(0, 40), opacity: o.toFixed(2) });
    }
    return bad;
  });

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
  // Sweep the reading zone at several scroll positions once things settled.
  const dim = [];
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(1300);
    for (const d of await readingZone(page)) dim.push({ y, ...d });
  }
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
  await page.close();

  const bad = report.filter((r) => r.missing || r.hidden > 0);
  if (dim.length) bad.push({ id: "reading-zone", hidden: dim.length, sample: dim.slice(0, 3) });
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
  const dim = await readingZone(page);
  if (dim.length) bad.push({ id: "reading-zone", hidden: dim.length, sample: dim.slice(0, 3) });
  results.push({ name: "reduced-motion", ok: bad.length === 0, bad, errors: [] });
  console.log(`${bad.length === 0 ? "PASS" : "FAIL"}  reduced-motion`);
  if (bad.length) console.log(JSON.stringify(bad, null, 2));
  await page.close();
}

// 8. No JS: all section content present and visible (no CSS/SSR prehide).
for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
  const ctx = await browser.newContext({ viewport: vp, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  const bad = await page.evaluate((ids) => {
    const out = [];
    for (const id of ids) {
      const sec = document.getElementById(id);
      if (!sec) {
        out.push({ id, missing: true });
        continue;
      }
      if (!sec.innerText.trim()) out.push({ id, empty: true });
      const hidden = [...sec.querySelectorAll("[data-reveal], [data-tag], [data-hero]")].filter(
        (n) => parseFloat(getComputedStyle(n).opacity) < 0.99
      );
      if (hidden.length) out.push({ id, hidden: hidden.length });
    }
    return out;
  }, SECTIONS);
  results.push({ name: `no-js-${vp.width}`, ok: bad.length === 0, bad, errors: [] });
  console.log(`${bad.length === 0 ? "PASS" : "FAIL"}  no-js-${vp.width}`);
  if (bad.length) console.log(JSON.stringify(bad, null, 2));
  await ctx.close();
}

// 9. Services stacking cards (PRD 07 §4.1): sweeping through the stack, no later
// card may cover an earlier badge, and the fully stacked frame must show all
// badges and every title's first line.
for (const vp of [{ width: 1366, height: 768 }, { width: 1857, height: 850 }]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(URL, { waitUntil: "networkidle" });
  const [start, end] = await page.evaluate(() => {
    const r = document.getElementById("services").getBoundingClientRect();
    return [r.top + scrollY, r.bottom + scrollY];
  });
  // Land the one-shot reveals first so opacity/transform don't skew hit tests.
  await page.evaluate((y) => window.scrollTo(0, y), end);
  await page.waitForTimeout(1500);
  const bad = [];
  let stacked = false;
  for (let y = start; y < end; y += 24) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(30);
    const frame = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".services-card")];
      const nav = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const hits = (el, x, yy) => {
        if (yy <= nav || yy >= innerHeight) return true;
        const e = document.elementFromPoint(x, yy);
        return !!e && (e === el || el.contains(e));
      };
      const all = cards.every(
        (c) => getComputedStyle(c).position === "sticky" && Math.abs(c.getBoundingClientRect().top - parseFloat(getComputedStyle(c).top)) < 1
      );
      const issues = [];
      cards.forEach((c, i) => {
        const b = c.querySelector(".services-badge").getBoundingClientRect();
        const badge = c.querySelector(".services-badge");
        if (![b.left + 4, b.left + b.width / 2, b.right - 4].every((x) => hits(badge, x, b.top + b.height / 2)))
          issues.push(`badge ${i + 1} covered`);
        if (all) {
          const h3 = c.querySelector("h3");
          const range = document.createRange();
          range.selectNodeContents(h3);
          const line = range.getClientRects()[0];
          if (!hits(h3, line.left + 4, line.top + line.height / 2)) issues.push(`title ${i + 1} covered`);
        }
      });
      return { all, issues };
    });
    if (frame.all) stacked = true;
    for (const issue of frame.issues) bad.push({ y, issue });
  }
  if (!stacked) bad.push({ issue: "never fully stacked" });
  const name = `services-stack-${vp.width}`;
  results.push({ name, ok: bad.length === 0, bad, errors: [] });
  console.log(`${bad.length === 0 ? "PASS" : "FAIL"}  ${name}`);
  if (bad.length) console.log(JSON.stringify(bad.slice(0, 5), null, 2));
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
process.exit(failed.length ? 1 : 0);
