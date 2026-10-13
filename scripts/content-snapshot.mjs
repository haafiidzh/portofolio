// Content-freeze snapshot (PRD 07 §3, invariants C1-C8).
//   node scripts/content-snapshot.mjs            write snapshots/content-baseline.json
//   node scripts/content-snapshot.mjs --check    diff current render vs committed snapshot (exit 1 on any diff)
//   node scripts/content-snapshot.mjs --nojs     S3: JavaScript-disabled render vs baseline (C1-C6, C8) + scrollHeight within +-5% of reduced-motion
// Env: URL=http://host:port to use an already-running production server.
// Otherwise it spawns `next start` on port 3100 (needs a prior `npm run build`).
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./lib/server.mjs";
import { collect, collectAria } from "./lib/collect.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "snapshots/content-baseline.json");
const CHECK = process.argv.includes("--check");
const NOJS = process.argv.includes("--nojs");
const VIEWPORTS = { 375: { width: 375, height: 812 }, 1280: { width: 1280, height: 800 } };

// C7 sources: constants must stay untouched, so hash their literal source.
const CONSTANTS = {
  SERVICES: "components/sections/Services.tsx",
  LINKS_NAV: ["components/layout/Nav.tsx", "LINKS"],
  PROJECTS: "components/sections/Portfolio.tsx",
  GROUPS: "components/sections/Skills.tsx",
  FACTS: "components/sections/About.tsx",
  COLUMNS: "components/layout/Footer.tsx",
  LINKS_CONTACT: ["components/sections/contact/ContactInfo.tsx", "LINKS"],
};

function extractConstant(file, name) {
  const src = readFileSync(resolve(ROOT, file), "utf8");
  const m = new RegExp(`const ${name}\\b[^=]*=\\s*`).exec(src);
  if (!m) return null;
  const open = src.indexOf("[", m.index + m[0].length - 1);
  let depth = 0, inStr = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === inStr) inStr = null;
    } else if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return src.slice(open, i + 1);
  }
  return null;
}

function constantHashes() {
  const out = {};
  for (const [key, spec] of Object.entries(CONSTANTS)) {
    const [file, name] = Array.isArray(spec) ? spec : [spec, key];
    const text = extractConstant(file, name);
    out[key] = text ? createHash("sha256").update(text).digest("hex").slice(0, 16) : "MISSING";
  }
  return out;
}

/** nojs: render with JavaScript disabled (S3) instead of the reduced-motion live render. */
async function snapshotViewport(browser, url, vp, { nojs = false } = {}) {
  const ctx = await browser.newContext(
    nojs ? { viewport: vp, javaScriptEnabled: false } : { viewport: vp, reducedMotion: "reduce" }
  );
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (!nojs) {
    // Scroll through so lazy/observer-driven content settles, then return to top.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= h; y += vp.height / 2) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
  }

  const data = await page.evaluate(collect);
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const c6 = await collectAria(page);
  await ctx.close();
  const rest = { ...data };
  delete rest.keys;
  // scrollHeight is returned beside the snapshot so the baseline JSON shape never changes.
  return { snap: { ...rest, c6 }, scrollHeight };
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}

/** Flat path -> value map, for a readable diff. */
function flatten(v, path = "", out = {}) {
  if (v && typeof v === "object") {
    for (const k of Object.keys(v)) flatten(v[k], path ? `${path}.${k}` : k, out);
  } else out[path] = v;
  return out;
}

/** Diff two JSON-able objects; returns the sorted list of differing flat paths with both values. */
function diffObjects(base, cur) {
  const a = flatten(base);
  const b = flatten(cur);
  const diffs = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[k] !== b[k]) diffs.push({ k, a: a[k], b: b[k] });
  }
  return diffs.sort((x, y) => (x.k < y.k ? -1 : 1));
}

function printDiffs(diffs, label) {
  console.log(`FAIL  ${diffs.length} difference(s) ${label}:`);
  for (const { k, a, b } of diffs) {
    console.log(`\n  ${k}\n    - ${JSON.stringify(a)}\n    + ${JSON.stringify(b)}`);
  }
}

const server = await startServer();
const browser = await chromium.launch();
let exit = 0;
try {
  if (NOJS) {
    // S3: no-JS render keeps C1-C6/C8 identical to the committed baseline, and its
    // scrollHeight stays within +-5% of a live reduced-motion render.
    if (!existsSync(OUT)) throw new Error(`No baseline at ${OUT}; run without flags first.`);
    const baseline = JSON.parse(readFileSync(OUT, "utf8"));
    for (const [w, vp] of Object.entries(VIEWPORTS)) {
      const nojs = await snapshotViewport(browser, server.url, vp, { nojs: true });
      const live = await snapshotViewport(browser, server.url, vp);
      const diffs = diffObjects(baseline.viewports[w], sortKeys(nojs.snap));
      const delta = (nojs.scrollHeight - live.scrollHeight) / live.scrollHeight;
      const heightOk = Math.abs(delta) <= 0.05;
      console.log(
        `${diffs.length === 0 && heightOk ? "PASS" : "FAIL"}  no-JS @${w}px  scrollHeight no-JS ${nojs.scrollHeight} vs reduced-motion ${live.scrollHeight} (${(delta * 100).toFixed(2)}%, limit +-5%)`
      );
      if (diffs.length) printDiffs(diffs, `vs baseline @${w}px`);
      if (diffs.length || !heightOk) exit = 1;
    }
  } else {
    const result = { c7: constantHashes(), viewports: {} };
    for (const [w, vp] of Object.entries(VIEWPORTS)) result.viewports[w] = (await snapshotViewport(browser, server.url, vp)).snap;
    const json = JSON.stringify(sortKeys(result), null, 2) + "\n";

    if (!CHECK) {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, json);
      console.log(`Wrote ${OUT}`);
    } else {
      if (!existsSync(OUT)) throw new Error(`No baseline at ${OUT}; run without --check first.`);
      const diffs = diffObjects(JSON.parse(readFileSync(OUT, "utf8")), JSON.parse(json));
      if (diffs.length) {
        printDiffs(diffs, "vs baseline");
        exit = 1;
      } else console.log("PASS  content snapshot identical to baseline");
    }
  }
} catch (e) {
  console.error(e);
  exit = 1;
} finally {
  await browser.close();
  server.stop();
}
process.exit(exit);
