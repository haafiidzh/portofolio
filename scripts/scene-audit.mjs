// Scene audit (PRD 08 §3.4): proves M1-M5', M8, M9 for every element carrying data-scene.
//   node scripts/scene-audit.mjs [--viewport=1280x800,375x812] [--runs=default,no-smooth]
//                                [--quick: 1280x800, default run only, for iteration; full mode is the default]
//                                [--inject=file.js] [--out=dir] [--strict-focus] [--parallel=2]
// Env: URL=http://host:port reuses a running production server (else spawns `next start` on :3100).
// Each viewport runs twice: default, and with window.__DISABLE_SMOOTH_SCROLL__ = true (Lenis off, PRD 08 §7.3).
// --inject runs a script in the page after load (tooling self-test: temporary data-scene, injected violations).
// Output: printed + written to <out>/scene-audit-<timestamp>.txt (default: os.tmpdir()/scene-audit).
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import { startServer } from "./lib/server.mjs";
import { collect, collectAria } from "./lib/collect.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = resolve(HERE, "../snapshots/content-baseline.json");
const BROWSER_LIB = readFileSync(resolve(HERE, "lib/audit-browser.js"), "utf8");

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const QUICK = process.argv.includes("--quick");
const ALL_VIEWPORTS = QUICK ? [[1280, 800]] : [[375, 812], [768, 1024], [1280, 800], [1366, 768]];
const viewports = (arg("viewport")?.split(",").map((v) => v.split("x").map(Number)) ?? ALL_VIEWPORTS)
  .map(([width, height]) => ({ width, height }));
const RUNS = (arg("runs")?.split(",") ?? (QUICK ? ["default"] : ["default", "no-smooth"])).map((name) => ({ name, noSmooth: name === "no-smooth" }));
const INJECT = arg("inject") ? readFileSync(resolve(arg("inject")), "utf8") : null;
const PARALLEL = Number(arg("parallel") ?? 2);
const STRICT_FOCUS = process.argv.includes("--strict-focus");
const OUT_DIR = arg("out") ?? resolve(tmpdir(), "scene-audit");

const STEP_VH = 2.5; // M4 sweep step
const lines = [];
// Tasks run concurrently; each buffers its output and flushes it as one block when it ends.
const bufferOf = new AsyncLocalStorage();
const log = (s = "") => {
  const buf = bufferOf.getStore();
  if (buf) buf.push(s);
  else { console.log(s); lines.push(s); }
};
const violations = [];
const fail = (ctx, rule, msg) => { violations.push({ ctx, rule, msg }); log(`  FAIL ${rule}  ${msg}`); };

const tierOf = (w) => (w >= 1024 ? "D" : w >= 768 ? "T" : "M");
const flatten = (v, path = "", out = {}) => {
  if (v && typeof v === "object") for (const k of Object.keys(v)) flatten(v[k], path ? `${path}.${k}` : k, out);
  else out[path] = v;
  return out;
};
const flatDiff = (a, b) => {
  const fa = flatten(a), fb = flatten(b);
  return [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter((k) => fa[k] !== fb[k]).sort();
};

async function newPage(browser, vp, { reducedMotion, noSmooth }) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion });
  await ctx.addInitScript(BROWSER_LIB);
  if (noSmooth) await ctx.addInitScript("window.__DISABLE_SMOOTH_SCROLL__ = true;");
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(URL_, { waitUntil: "networkidle" });
  return { ctx, page, errors };
}

/** Instant jump (html has scroll-behavior: smooth), then wait for inline styles to settle. */
async function jump(page, y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), Math.max(0, Math.round(y)));
  await page.evaluate(() => window.__audit.settle());
}

/** Static reference for one viewport: same-viewport reduced-motion render (+ baseline equality at 375/1280). */
async function reference(browser, vp) {
  const { ctx, page } = await newPage(browser, vp, { reducedMotion: "reduce" });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += vp.height / 2) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  const parity = await page.evaluate(() => window.__audit.parity());
  const aria = await collectAria(page);
  const colors = {}, xforms = {};
  for (const name of await page.evaluate(() => window.__audit.sceneNames())) {
    colors[name] = await page.evaluate((n) => window.__audit.staticColors(n), name);
    xforms[name] = await page.evaluate((n) => window.__audit.staticXforms(n), name);
  }
  let baselineDiffs = null;
  if (existsSync(BASELINE) && (vp.width === 375 || vp.width === 1280)) {
    const data = await page.evaluate(collect);
    delete data.keys;
    const base = JSON.parse(readFileSync(BASELINE, "utf8")).viewports[vp.width];
    baselineDiffs = flatDiff(base, { ...data, c6: aria });
  }
  await ctx.close();
  return { parity, aria, colors, xforms, baselineDiffs };
}

/** M1/M2/M3 at the current scroll position. */
async function checkParity(page, ref, where, ctx) {
  const cur = await page.evaluate(() => window.__audit.parity());
  for (const [rule, key] of [["M1", "text"], ["M3", "h"], ["M3", "img"], ["M3", "ctrl"]]) {
    for (const sec of Object.keys(ref.parity[key])) {
      const a = JSON.stringify(ref.parity[key][sec]);
      const b = JSON.stringify(cur[key][sec]);
      if (a !== b) fail(ctx, rule, `${where}: ${sec} ${key} differs from static render\n      static : ${a.slice(0, 160)}\n      current: ${b.slice(0, 160)}`);
    }
  }
  const aria = await collectAria(page);
  for (const sec of Object.keys(ref.aria)) {
    if (ref.aria[sec] !== aria[sec]) fail(ctx, "M2", `${where}: ${sec} a11y tree differs from static render`);
  }
}

const near = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= (Array.isArray(tol) ? tol[i] : tol));
const STATE_TOL = [0.01, 0.01, 0.01, 0.01, 0.01, 1, 1, 0.02, 2, 2, 2];

async function auditScene(page, name, vp, ref, ctx) {
  const m = await page.evaluate(() => window.__audit.metrics());
  const { start, end } = await page.evaluate((n) => window.__audit.docRange(n), name);
  const tier = tierOf(vp.width);
  const step = (STEP_VH / 100) * vp.height;
  const ys = [];
  for (let y = Math.max(0, start - vp.height); y <= Math.min(m.max, end) + 0.5; y += step) ys.push(y);

  // M1-M3 at every 10% of the scene.
  for (let k = 0; k <= 10; k++) {
    const y = Math.min(m.max, Math.max(0, start - m.nav + ((end - start) * k) / 10));
    await jump(page, y);
    await checkParity(page, ref, `scene "${name}" @${k * 10}%`, ctx);
  }

  const samples = [];
  for (const y of ys) {
    await jump(page, y);
    const s = await page.evaluate((n) => window.__audit.sampleScene(n), name);
    samples.push({ y, ...s });
  }
  const last = samples[samples.length - 1];
  const rel = (y) => ((y - start) / vp.height) * 100; // vh from scene top reaching viewport top
  const need = tier === "D" ? 20 : tier === "T" ? 15 : 0;

  // ---- M4 table
  log(`\n  Scene "${name}"  tier ${tier}  ${ys.length} samples @ ${STEP_VH}vh  scene = ${Math.round(((end - start) / vp.height) * 100)}vh tall`);
  log(`  ${"IU text".padEnd(42)}${"readable from-to (vh)".padEnd(24)}${"run (vh)".padEnd(10)}result`);
  last.ius.forEach((iu0, i) => {
    if (!samples.some((s) => s.ius[i].rendered)) {
      log(`  ${iu0.text.padEnd(42)}${"not rendered at this viewport".padEnd(34)}skip`);
      return;
    }
    let best = { n: 0, from: 0 }, cur = { n: 0, from: 0 };
    samples.forEach((s, j) => {
      if (s.ius[i].ok) {
        if (cur.n === 0) cur.from = j;
        cur.n++;
        if (cur.n > best.n) best = { ...cur };
      } else cur.n = 0;
    });
    const runVh = Math.max(0, (best.n - 1) * STEP_VH);
    const pass = tier === "M" ? best.n >= 1 : runVh >= need;
    const range = best.n ? `${rel(samples[best.from].y).toFixed(0)} to ${rel(samples[best.from + best.n - 1].y).toFixed(0)}` : "never readable";
    log(`  ${iu0.text.padEnd(42)}${range.padEnd(24)}${runVh.toFixed(1).padEnd(10)}${pass ? "pass" : "FAIL"}`);
    if (!pass) {
      const why = [...new Set(samples.flatMap((s) => s.ius[i].reasons))].slice(0, 4).join("; ");
      fail(ctx, "M4", `scene "${name}" IU "${iu0.text}" longest readable run ${runVh.toFixed(1)}vh < ${tier === "M" ? "1 sample" : need + "vh"} (${range}); blockers: ${why || "none"}`);
    }
  });

  // ---- M5'(a) pinned subsets
  const pinCount = last.pins.length;
  for (let p = 0; p < pinCount; p++) {
    const tops = samples.map((s) => Math.round(s.pins[p].top));
    const freq = new Map();
    tops.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
    const [modeTop, modeN] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    const sticky = samples.every((s) => s.pins[p].sticky);
    if (!sticky || modeN < 3) {
      log(`  M5'(a) pin ${p}: not pinned at this tier/viewport (skipped)`);
      continue;
    }
    const members = last.ius.map((iu, i) => (iu.pin === p && samples.some((s) => s.ius[i].rendered) ? i : -1)).filter((i) => i >= 0);
    let best = 0, cur = 0;
    samples.forEach((s, j) => {
      const stuck = Math.abs(tops[j] - modeTop) <= 1;
      if (stuck && members.every((i) => s.ius[i].ok)) best = Math.max(best, ++cur);
      else cur = 0;
    });
    const holdVh = Math.max(0, (best - 1) * STEP_VH);
    const needVh = 0.15 * ((end - start) / vp.height) * 100;
    log(`  M5'(a) pin ${p}: all ${members.length} IUs readable while pinned for ${holdVh.toFixed(1)}vh (need >= ${needVh.toFixed(1)}vh = 15% of scene)`);
    if (holdVh < needVh) fail(ctx, "M5'(a)", `scene "${name}" pin ${p}: pinned subset readable together only ${holdVh.toFixed(1)}vh < ${needVh.toFixed(1)}vh`);
  }

  // ---- M5'(b) flowing IUs final at 40% line
  last.ius.forEach((iu0, i) => {
    if (iu0.pin >= 0 || !samples.some((s) => s.ius[i].rendered)) return;
    const j0 = samples.findIndex((s) => s.ius[i].top <= 0.4 * vp.height);
    if (j0 < 0) return;
    for (let j = j0; j < samples.length; j++) {
      if (!near(samples[j].ius[i].state, iu0.state, STATE_TOL)) {
        fail(ctx, "M5'(b)", `scene "${name}" flowing IU "${iu0.text}" reached 40% line at ${rel(samples[j0].y).toFixed(0)}vh but state still changes at ${rel(samples[j].y).toFixed(0)}vh`);
        break;
      }
    }
  });

  // ---- M5'(c) static computed state after the last sample
  const resid = await page.evaluate(([n, r]) => window.__audit.staticViolations(n, r), [name, ref.xforms[name] ?? {}]);
  for (const r of resid) fail(ctx, "M5'(c)", `scene "${name}" residual non-static state after scene end: ${r}`);
  const refColors = ref.colors[name];
  if (refColors) {
    last.ius.forEach((iu) => {
      const key = iu.keys.find((k) => refColors[k]);
      if (key && !near(iu.color.slice(0, 3), refColors[key].slice(0, 3), 2))
        fail(ctx, "M5'(c)", `scene "${name}" IU "${iu.text}" ends with colour rgb(${iu.color.slice(0, 3).map(Math.round)}) but static is rgb(${refColors[key].slice(0, 3)})`);
    });
  } else log(`  M5'(c) colour check skipped: scene "${name}" not present in the static render`);
}

/** M8: in-page links by pointer and keyboard. */
async function auditTabWalk(page, ctx) {
  // Must run before any link click: a click moves the sequential-focus starting point.
  log(`\n  M8 Tab walk (each focused element readable <= 600 ms, ring unclipped)`);
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
  await page.evaluate(() => window.__audit.settle());
  let count = 0, worst = 0;
  const slow = [];
  for (let i = 0; i < 150; i++) {
    await page.keyboard.press("Tab");
    const t0 = performance.now();
    // Scene / header stops: hard 600 ms budget. Stops in non-scene sections (one-shot <Reveal>, native
    // smooth focus-scroll, both owned by PRD 07) get up to 2.5 s and are only reported when slower.
    let st = null;
    do {
      st = await page.evaluate(() => window.__audit.focusState());
      if (!st || st.ok) break;
      if (performance.now() - t0 >= 600 && (STRICT_FOCUS || st.inScene)) break;
    } while (performance.now() - t0 < 2500);
    if (!st) break; // focus left the document
    count++;
    const ms = performance.now() - t0;
    // A real user cannot Tab faster than the focus-scroll; pressing mid-scroll lets the previous
    // scroll overwrite the next one's target (tool artefact), so let it finish first.
    await page.evaluate(() => window.__audit.scrollIdle());
    if (!st.ok) {
      await page.waitForTimeout(2500);
      const late = await page.evaluate(() => ({ ...window.__audit.metrics(), f: window.__audit.focusState()?.ok, sh: document.documentElement.scrollHeight }));
      fail(ctx, "M8", `Tab stop ${count} ${st.label}: ${st.reasons.join("; ")} (after ${ms} ms; 2.5 s later: scrollY ${late.scrollY}/${late.max} scrollHeight ${late.sh} readable=${late.f})`);
    }
    else {
      if (st.inScene || STRICT_FOCUS || ms <= 600) worst = Math.max(worst, ms);
      if (ms > 600) slow.push(`${st.label} ${ms} ms`);
    }
  }
  log(`  ${count} Tab stops, slowest scene/in-budget stop ${worst} ms`);
  if (slow.length)
    log(`  note: ${slow.length} non-scene stop(s) took > 600 ms (informational; --strict-focus makes them failures): ${slow.join(" | ")}`);
  if (count === 0) fail(ctx, "M8", "Tab walk found no focusable element");
}

async function auditLinks(page, vp, ctx) {
  const mobile = vp.width < 768;
  const targets = [
    ["Nav logo", "header a[href='#hero']", "#hero"],
    ...["about", "services", "projects", "skills", "contact"].map((id) => [`Nav ${id}`, `header a[href='#${id}']:visible`, `#${id}`]),
    ["Hero CTA 'View my work'", "#hero a[href='#projects']", "#projects"],
    ["Hero CTA 'Start a conversation'", "#hero a[href='#contact']", "#contact"],
    ["Services 'Let's talk'", "#services a[href='#contact']", "#contact"],
  ];
  const openMenu = async () => {
    const btn = page.getByRole("button", { name: "Toggle menu" });
    if (mobile && (await btn.getAttribute("aria-expanded")) !== "true") await btn.click();
  };
  const waitReadable = async (hash) => {
    const t0 = performance.now();
    let res = null;
    while (performance.now() - t0 <= 1000) {
      res = await page.evaluate((h) => window.__audit.targetHeading(h), hash);
      if (res.found && res.ok) return { ms: performance.now() - t0 };
    }
    return { ms: null, res };
  };
  log(`\n  M8 in-page links (target heading readable <= 1000 ms)`);
  for (const mode of ["pointer", "keyboard"]) {
    for (const [name, selector, hash] of targets) {
      // Start two viewports away from the target so a real scroll happens without measuring the
      // browser's multi-second smooth-scroll over the whole page.
      const top = await page.evaluate((h) => document.querySelector(h).getBoundingClientRect().top + scrollY, hash);
      await jump(page, top > 2 * vp.height ? top - 2 * vp.height : top + 2 * vp.height);
      if (name.startsWith("Nav ") && name !== "Nav logo") await openMenu();
      const loc = page.locator(selector).first();
      try {
        if (mode === "pointer") await loc.click({ timeout: 3000 });
        else { await loc.focus({ timeout: 3000 }); await page.keyboard.press("Enter"); }
      } catch (e) {
        fail(ctx, "M8", `${mode} ${name}: could not activate (${String(e).split("\n")[0].slice(0, 100)})`);
        continue;
      }
      const r = await waitReadable(hash);
      await page.evaluate(() => window.__audit.scrollIdle());
      log(`  ${mode.padEnd(9)}${name.padEnd(34)}${hash.padEnd(11)}${r.ms === null ? "FAIL" : `${r.ms} ms`}`);
      if (r.ms === null) fail(ctx, "M8", `${mode} ${name} -> ${hash}: target heading not readable within 1 s (${r.res?.found === false ? "no heading" : r.res?.reasons?.join("; ")})`);
    }
  }
}

/** M9: Hero copy/CTAs, header, #contact below its header — whenever visible. */
async function auditConversion(page, vp, ctx) {
  const ranges = await page.evaluate(() => {
    const r = (el) => (el ? { s: el.getBoundingClientRect().top + scrollY, e: el.getBoundingClientRect().bottom + scrollY } : null);
    return { hero: r(document.getElementById("hero")), contact: r(document.getElementById("contact")), max: document.documentElement.scrollHeight - innerHeight };
  });
  const step = 0.05 * vp.height;
  const ys = new Set([0, ranges.max]);
  for (const z of [ranges.hero, ranges.contact]) {
    if (!z) continue;
    for (let y = Math.max(0, z.s - vp.height); y <= Math.min(ranges.max, z.e); y += step) ys.add(Math.round(y));
  }
  const seen = new Map();
  let checked = 0;
  for (const y of [...ys].sort((a, b) => a - b)) {
    await jump(page, y);
    const res = await page.evaluate(() => window.__audit.zones());
    checked = Math.max(checked, res.checked);
    for (const b of res.bad) {
      const key = `${b.zone}|${b.text}|${b.reasons.join(",")}`;
      if (!seen.has(key)) seen.set(key, { ...b, y });
    }
  }
  log(`\n  M9 conversion zones: ${checked} IUs tracked over ${ys.size} sample positions, ${seen.size} violation(s)`);
  for (const b of seen.values()) fail(ctx, "M9", `${b.zone} "${b.text}" first seen at scrollY ${b.y}: ${b.reasons.join("; ")}`);
}

async function auditRun(browser, vp, run, ref) {
  const ctx = `${vp.width}x${vp.height} ${run.name}`;
  log(`\n=== ${ctx} ===`);
  const { ctx: bctx, page, errors } = await newPage(browser, vp, { reducedMotion: "no-preference", noSmooth: run.noSmooth });
  if (INJECT) await page.evaluate(`(() => {${INJECT}\n})()`);
  await page.waitForTimeout(2800); // Hero entrance (stagger + 1.1 s) must be over before sampling
  await jump(page, 0);

  const names = await page.evaluate(() => window.__audit.sceneNames());
  log(`  ${names.length} scenes registered${names.length ? ": " + names.join(", ") : ""}`);
  const m = await page.evaluate(() => window.__audit.metrics());

  await checkParity(page, ref, "page top", ctx);
  await auditTabWalk(page, ctx);
  await jump(page, 0);
  await jump(page, m.max);
  await checkParity(page, ref, "page bottom", ctx);
  for (const n of names) await auditScene(page, n, vp, ref, ctx);
  await auditConversion(page, vp, ctx);
  await auditLinks(page, vp, ctx);
  for (const e of errors) fail(ctx, "console", e);
  await bctx.close();
}

let URL_;
const started = performance.now();
const server = await startServer();
URL_ = server.url;
// One browser per worker: contexts of one browser share a GPU/compositor process, and under load
// that made native smooth scrolls (M8) stall short of their target.
const browsers = await Promise.all(Array.from({ length: PARALLEL }, () => chromium.launch()));
try {
  const refs = new Map();
  const refFor = (vp, browser) => {
    const key = `${vp.width}x${vp.height}`;
    if (!refs.has(key)) {
      refs.set(key, reference(browser, vp).then((ref) => {
        for (const k of (ref.baselineDiffs ?? []).slice(0, 5))
          fail(`${key} static`, "S1", `static render differs from committed baseline at ${k}`);
        return ref;
      }));
    }
    return refs.get(key);
  };
  const queue = viewports.flatMap((vp) => RUNS.map((run) => ({ vp, run })));
  const worker = async (_, w) => {
    const browser = browsers[w];
    for (let task = queue.shift(); task; task = queue.shift()) {
      const buf = [];
      await bufferOf.run(buf, async () => {
        try {
          await auditRun(browser, task.vp, task.run, await refFor(task.vp, browser));
        } catch (e) {
          fail(`${task.vp.width}x${task.vp.height} ${task.run.name}`, "crash", String(e));
        }
      });
      for (const l of buf) { console.log(l); lines.push(l); }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
} catch (e) {
  console.error(e);
  violations.push({ ctx: "audit", rule: "crash", msg: String(e) });
} finally {
  await Promise.all(browsers.map((b) => b.close()));
  server.stop();
}

const secs = Math.round((performance.now() - started) / 1000);
log(`\n${violations.length === 0 ? "PASS" : "FAIL"}  scene-audit: ${violations.length} violation(s), ${viewports.length} viewport(s) x ${RUNS.length} run(s), ${secs}s`);
if (violations.length) {
  const byRule = {};
  for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
  log(`  by rule: ${Object.entries(byRule).map(([k, n]) => `${k}=${n}`).join(", ")}`);
}
mkdirSync(OUT_DIR, { recursive: true });
const file = resolve(OUT_DIR, `scene-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`);
writeFileSync(file, lines.join("\n") + "\n");
console.log(`Report written to ${file}`);
process.exit(violations.length ? 1 : 0);
