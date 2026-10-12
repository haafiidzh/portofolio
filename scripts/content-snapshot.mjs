// Content-freeze snapshot (PRD 07 §3, invariants C1-C8).
//   node scripts/content-snapshot.mjs            write snapshots/content-baseline.json
//   node scripts/content-snapshot.mjs --check    diff current render vs committed snapshot (exit 1 on any diff)
// Env: URL=http://host:port to use an already-running production server.
// Otherwise it spawns `next start` on port 3100 (needs a prior `npm run build`).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "snapshots/content-baseline.json");
const CHECK = process.argv.includes("--check");
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

async function startServer() {
  if (process.env.URL) return { url: process.env.URL, stop() {} };
  const port = 3100;
  if (!existsSync(resolve(ROOT, ".next/BUILD_ID"))) throw new Error("No production build: run `npm run build` first (or set URL).");
  const proc = spawn("npx", ["next", "start", "-p", String(port)], { cwd: ROOT, stdio: "ignore" });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) return { url, stop: () => proc.kill() }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error("Server did not start");
}

/** Runs in the page. Everything returned must be deterministic. */
function collect() {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const roots = [
    ...document.querySelectorAll("header, main > section[id], footer"),
  ].map((el) => ({ el, key: el.id ? `#${el.id}` : el.tagName.toLowerCase() }));
  const textNodes = (root) => {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = norm(n.textContent);
      if (t && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(n.parentElement.tagName)) out.push(t);
    }
    return out;
  };
  const ctrl = (el) => ({
    tag: el.tagName.toLowerCase(),
    text: norm(el.textContent),
    href: el.getAttribute("href"),
    type: el.getAttribute("type"),
    name: el.getAttribute("name"),
    ariaLabel: el.getAttribute("aria-label"),
    placeholder: el.getAttribute("placeholder"),
    required: el.hasAttribute("required"),
    label: el.labels?.[0] ? norm(el.labels[0].textContent) : null,
  });
  const c1 = {}, c2 = {}, c3 = {}, c4 = {}, c8 = {};
  for (const { el, key } of roots) {
    c1[key] = norm(el.innerText);
    c2[key] = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
      level: +h.tagName[1], text: norm(h.textContent),
    }));
    c3[key] = [...el.querySelectorAll("img")].map((i) => ({
      src: i.getAttribute("src"), alt: i.getAttribute("alt"),
    }));
    c4[key] = [...el.querySelectorAll("a, button, input, textarea, select")].map(ctrl);
    c8[key] = textNodes(el);
  }
  return {
    c1, c2, c3, c4,
    c5: [...document.querySelectorAll("main > section")].map((s) => s.id || null),
    c8,
    keys: roots.map((r) => r.key),
  };
}

async function snapshotViewport(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  // Scroll through so lazy/observer-driven content settles, then return to top.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += vp.height / 2) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);

  const data = await page.evaluate(collect);
  const c6 = {};
  const sel = ["header", "main > section[id]", "footer"];
  for (const s of sel) {
    const loc = page.locator(s);
    for (let i = 0; i < (await loc.count()); i++) {
      const id = await loc.nth(i).getAttribute("id");
      const key = id ? `#${id}` : s;
      c6[key] = await loc.nth(i).ariaSnapshot();
    }
  }
  await ctx.close();
  const rest = { ...data };
  delete rest.keys;
  return { ...rest, c6 };
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

const server = await startServer();
const browser = await chromium.launch();
let exit = 0;
try {
  const result = { c7: constantHashes(), viewports: {} };
  for (const [w, vp] of Object.entries(VIEWPORTS)) result.viewports[w] = await snapshotViewport(browser, server.url, vp);
  const json = JSON.stringify(sortKeys(result), null, 2) + "\n";

  if (!CHECK) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, json);
    console.log(`Wrote ${OUT}`);
  } else {
    if (!existsSync(OUT)) throw new Error(`No baseline at ${OUT}; run without --check first.`);
    const a = flatten(JSON.parse(readFileSync(OUT, "utf8")));
    const b = flatten(JSON.parse(json));
    const diffs = [];
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[k] !== b[k]) diffs.push(k);
    }
    if (diffs.length) {
      console.log(`FAIL  ${diffs.length} difference(s) vs baseline:`);
      for (const k of diffs.sort()) {
        console.log(`\n  ${k}\n    - ${JSON.stringify(a[k])}\n    + ${JSON.stringify(b[k])}`);
      }
      exit = 1;
    } else console.log("PASS  content snapshot identical to baseline");
  }
} catch (e) {
  console.error(e);
  exit = 1;
} finally {
  await browser.close();
  server.stop();
}
process.exit(exit);
