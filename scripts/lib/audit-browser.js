// In-page helpers for scripts/scene-audit.mjs (PRD 08 §3). Injected with addInitScript;
// plain script (not a module) that defines window.__audit. Pure measurement, no mutation.
(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const num = (v, d = 0) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : d);

  // ---------- colour (canvas resolves oklch / color-mix / named colours to sRGB) ----------
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  ctx.canvas.width = ctx.canvas.height = 1;
  const colorCache = new Map();
  const rgba = (css) => {
    if (colorCache.has(css)) return colorCache.get(css);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = [r, g, b, a / 255];
    colorCache.set(css, out);
    return out;
  };
  const over = (top, under) => {
    const a = top[3] + under[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a);
  };
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrastOf = (fg, bg) => {
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
  /** Opaque background behind `el`: stacked background-colors only (gradients/images are not sampled). */
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) {
        layers.push(c);
        if (c[3] >= 0.999) break;
      }
    }
    let acc = [8, 6, 12, 1]; // html fallback, matches --background
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  };

  // ---------- geometry / state ----------
  const ancestors = (el) => {
    const out = [];
    for (let n = el; n; n = n.parentElement) out.push(n);
    return out; // el first, html last
  };
  const effOpacity = (el) => ancestors(el).reduce((o, n) => o * num(getComputedStyle(n).opacity, 1), 1);

  /** Accumulated linear transform root -> el (translate, rotate, scale props, then transform). */
  const effTransform = (el) => {
    let m = new DOMMatrix();
    for (const n of ancestors(el).reverse()) {
      const cs = getComputedStyle(n);
      let local = new DOMMatrix();
      if (cs.translate && cs.translate !== "none") {
        const [x, y] = cs.translate.split(" ");
        local = local.translate(num(x), num(y));
      }
      if (cs.rotate && cs.rotate !== "none") local = local.rotate(num(cs.rotate));
      if (cs.scale && cs.scale !== "none") {
        const [x, y] = cs.scale.split(" ");
        local = local.scale(num(x, 1), num(y ?? x, 1));
      }
      if (cs.transform && cs.transform !== "none") local = local.multiply(new DOMMatrix(cs.transform));
      m = m.multiply(local);
    }
    return {
      scaleX: Math.hypot(m.a, m.b),
      scaleY: Math.hypot(m.c, m.d),
      rot: (Math.atan2(m.b, m.a) * 180) / Math.PI,
      tx: m.e,
      ty: m.f,
      mat: [m.a, m.b, m.c, m.d, m.e, m.f],
    };
  };
  const isIdentity = (t) =>
    Math.abs(t.scaleX - 1) < 0.001 && Math.abs(t.scaleY - 1) < 0.001 && Math.abs(t.rot) < 0.1 &&
    Math.abs(t.tx) < 0.5 && Math.abs(t.ty) < 0.5;

  const area = (r) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
  const inter = (a, b) => ({
    left: Math.max(a.left, b.left), top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom),
  });
  const box = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

  /** Bounding box of a clip-path shape inside `r` (inset / circle / ellipse / polygon; others = no clip). */
  const clipBox = (cp, r) => {
    const w = r.right - r.left, h = r.bottom - r.top;
    const px = (v, ref) => (String(v).endsWith("%") ? (parseFloat(v) / 100) * ref : parseFloat(v));
    let m = /^inset\((.*?)(?: round .*)?\)$/.exec(cp);
    if (m) {
      const p = m[1].trim().split(/\s+/);
      const [t, rt, b, l] = [p[0], p[1] ?? p[0], p[2] ?? p[0], p[3] ?? p[1] ?? p[0]];
      return { left: r.left + px(l, w), top: r.top + px(t, h), right: r.right - px(rt, w), bottom: r.bottom - px(b, h) };
    }
    m = /^circle\(([^)]*)\)$/.exec(cp);
    if (m) {
      const [rad, at] = m[1].split(" at ");
      const [cx, cy] = (at || "50% 50%").trim().split(/\s+/);
      const rr = /closest|farthest/.test(rad)
        ? Math.hypot(w, h) / 2
        : px(rad, Math.sqrt((w * w + h * h) / 2));
      const x = r.left + px(cx, w), y = r.top + px(cy ?? cx, h);
      // Inscribed square keeps this a lower bound that is still exact for full-reveal circles.
      return { left: x - rr, top: y - rr, right: x + rr, bottom: y + rr };
    }
    m = /^ellipse\(([^)]*)\)$/.exec(cp);
    if (m) {
      const [rad, at] = m[1].split(" at ");
      const [rx, ry] = rad.trim().split(/\s+/);
      const [cx, cy] = (at || "50% 50%").trim().split(/\s+/);
      const x = r.left + px(cx, w), y = r.top + px(cy ?? cx, h);
      return { left: x - px(rx, w), top: y - px(ry ?? rx, h), right: x + px(rx, w), bottom: y + px(ry ?? rx, h) };
    }
    m = /^polygon\((.*)\)$/.exec(cp);
    if (m) {
      const pts = m[1].split(",").map((s) => s.trim().split(/\s+/));
      const xs = pts.map((p) => r.left + px(p[0], w));
      const ys = pts.map((p) => r.top + px(p[1], h));
      return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
    }
    return null;
  };

  /** Fraction of el's box that survives overflow / clip-path of itself and ancestors; masks count as hidden. */
  const clipState = (el) => {
    const r0 = el.getBoundingClientRect();
    let r = box(r0);
    let masked = false;
    for (const n of ancestors(el)) {
      const cs = getComputedStyle(n);
      const mask = cs.maskImage || cs.webkitMaskImage;
      if (mask && mask !== "none") masked = true;
      if (cs.clipPath && cs.clipPath !== "none") {
        const cb = clipBox(cs.clipPath, n.getBoundingClientRect());
        if (cb) r = inter(r, cb);
      }
      if (n !== el && n !== document.documentElement && n !== document.body) {
        if (!(cs.overflowX === "visible" && cs.overflowY === "visible")) r = inter(r, box(n.getBoundingClientRect()));
      }
    }
    const a0 = area(r0);
    return { fraction: a0 > 0 ? area(r) / a0 : 0, masked, rect: r };
  };

  const navBottom = () => document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  const hasDirectText = (el) =>
    [...el.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim());
  const ownText = (el) => {
    if (el.tagName === "IMG") return `[img] ${el.getAttribute("alt") || el.getAttribute("src") || ""}`;
    if (hasDirectText(el)) return norm([...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.nodeValue).join(" "));
    return `[${el.tagName.toLowerCase()}] ${el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || ""}`;
  };

  /** Leaf IUs (PRD 08 §3.1) under root: text blocks, img, form controls. aria-hidden subtrees and unrendered nodes skipped. */
  const leafIUs = (root, keepZero = false) => {
    const out = [];
    for (const el of [root, ...root.querySelectorAll("*")]) {
      if (SKIP_TAGS.has(el.tagName) || el.closest('[aria-hidden="true"]')) continue;
      if (el instanceof SVGElement && el.tagName !== "svg") continue;
      const isMedia = ["IMG", "TEXTAREA", "SELECT"].includes(el.tagName) ||
        (el.tagName === "INPUT" && el.type !== "hidden");
      if (!isMedia && !hasDirectText(el)) continue;
      const r = el.getBoundingClientRect();
      if (!keepZero && r.width === 0 && r.height === 0) continue; // display:none in this layout
      out.push(el);
    }
    return out;
  };

  /** PRD 08 §3.1 "Readable". Returns { ok, reasons[] }. */
  const readable = (el, opts = {}) => {
    const reasons = [];
    const vw = innerWidth, vh = innerHeight;
    const nav = el.closest("header") ? 0 : navBottom(); // the Nav does not occlude itself
    const r = el.getBoundingClientRect();
    const region = { left: 0, top: nav, right: vw, bottom: vh };
    const isText = !["IMG", "INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(el.tagName) &&
      !el.closest("a, button");
    const tall = r.height > 0.6 * (vh - nav);
    const vis = inter(r, region);
    const visFrac = area(r) > 0 ? area(vis) / area(r) : 0;
    const tol = 1.5;
    const fullyInside = r.top >= nav - tol && r.bottom <= vh + tol && r.left >= -tol && r.right <= vw + tol;
    if (!opts.skipViewport) {
      if (tall && !isText) {
        if (visFrac < 0.6) reasons.push(`viewport(${Math.round(visFrac * 100)}% visible)`);
      } else if (!fullyInside) {
        reasons.push(`${r.top < nav - tol && r.bottom > nav ? "under-nav" : "viewport"}(${Math.round(r.top)}..${Math.round(r.bottom)} in ${Math.round(nav)}..${vh})`);
      }
    }
    const op = effOpacity(el);
    if (op < 0.99) reasons.push(`opacity ${op.toFixed(2)}`);
    const clip = clipState(el);
    if (clip.masked) reasons.push("mask");
    else if (clip.fraction < 0.95) reasons.push(`clip ${Math.round(clip.fraction * 100)}%`);
    const t = effTransform(el);
    if (t.scaleX < 0.95 || t.scaleX > 1.05 || t.scaleY < 0.95 || t.scaleY > 1.05)
      reasons.push(`scale ${t.scaleX.toFixed(2)}`);
    if (Math.abs(t.rot) > 2) reasons.push(`rotate ${t.rot.toFixed(1)}deg`);
    if (hasDirectText(el) && !["INPUT", "TEXTAREA"].includes(el.tagName)) {
      const cs = getComputedStyle(el);
      const bg = backdrop(el);
      const fg = over(rgba(cs.color), bg);
      const need = el.closest('[class*="display-"]') ? 3 : 4.5;
      const c = contrastOf(fg, bg);
      if (c < need) reasons.push(`contrast ${c.toFixed(2)}<${need}`);
    }
    // Centre hit-test on the visible part.
    // Inline elements that wrap: probe the first line box, the union box centre may be empty space.
    const first = [...el.getClientRects()].find((b) => b.width > 0 && b.height > 0) ?? r;
    const target = inter(inter(first, region), clip.rect);
    if (area(target) > 0 && getComputedStyle(el).pointerEvents !== "none") {
      const hit = document.elementFromPoint((target.left + target.right) / 2, (target.top + target.bottom) / 2);
      const ok = hit && (el.contains(hit) || (hit.closest("a, button, label")?.contains(el) ?? false));
      if (!ok) reasons.push(`covered by <${hit?.tagName.toLowerCase()}${hit?.className ? "." + String(hit.className).split(" ")[0] : ""}>`);
    }
    return { ok: reasons.length === 0, reasons };
  };

  const state = (el) => {
    const t = effTransform(el);
    return [
      +effOpacity(el).toFixed(3), ...t.mat.map((v) => +v.toFixed(2)),
      +clipState(el).fraction.toFixed(2),
      ...rgba(getComputedStyle(el).color).slice(0, 3),
    ];
  };

  // ---------- scenes ----------
  const scenesEls = () => [...document.querySelectorAll("[data-scene]")];
  const sceneNames = () => scenesEls().map((e) => e.getAttribute("data-scene"));
  const sceneEl = (name) => document.querySelector(`[data-scene="${CSS.escape(name)}"]`);
  const docRange = (name) => {
    const r = sceneEl(name).getBoundingClientRect();
    return { start: r.top + scrollY, end: r.bottom + scrollY };
  };

  /** One M4/M5' sample of a scene. IU order is DOM order, so indices line up between samples. */
  const sampleScene = (name) => {
    const root = sceneEl(name);
    const pins = [...root.querySelectorAll("[data-scene-pin]")];
    const ius = leafIUs(root, true); // stable indices: an IU scaled to 0 must stay in the list
    return {
      pins: pins.map((p) => ({ top: p.getBoundingClientRect().top, sticky: getComputedStyle(p).position === "sticky" })),
      ius: ius.map((el) => {
        const rd = readable(el);
        return {
          text: ownText(el).slice(0, 40),
          rendered: el.getBoundingClientRect().width > 0 || el.getBoundingClientRect().height > 0,
          top: el.getBoundingClientRect().top,
          pin: pins.findIndex((p) => p.contains(el)),
          ok: rd.ok,
          reasons: rd.reasons,
          state: state(el),
          keys: ancestors(el).slice(0, 5).map((n) => norm(n.textContent).slice(0, 200)),
          color: rgba(getComputedStyle(el).color),
        };
      }),
    };
  };

  const xformKey = (n) =>
    n.tagName === "IMG" ? `img:${n.getAttribute("src")}` : n.textContent.trim() ? `${n.tagName}|${norm(n.textContent).slice(0, 200)}` : `${n.tagName}|.${n.className}`;
  const xformOf = (cs) => ({ opacity: cs.opacity, transform: cs.transform, scale: cs.scale, rotate: cs.rotate, translate: cs.translate, clipPath: cs.clipPath });
  /** Static transform/opacity/clip of every element in a scene (reduced-motion render), keyed by xformKey. */
  const staticXforms = (name) => {
    const out = {};
    for (const n of sceneEl(name).querySelectorAll("*")) out[xformKey(n)] = xformOf(getComputedStyle(n));
    return out;
  };

  /** M5'(c): non-static computed state of IUs and scene wrappers after the scene; `ref` = staticXforms of the static render. */
  const staticViolations = (name, ref = {}) => {
    const root = sceneEl(name);
    const els = new Set();
    for (const iu of leafIUs(root)) for (let n = iu; n && n !== root.parentElement; n = n.parentElement) els.add(n);
    root.querySelectorAll("[style]").forEach((n) => els.add(n));
    const out = [];
    const desc = (n) => `<${n.tagName.toLowerCase()}${n.className ? "." + String(n.className).split(" ")[0] : ""}> "${ownText(n).slice(0, 24)}"`;
    const same = (cur, base, k, ident) => cur[k] === (base ? base[k] : ident);
    for (const n of els) {
      const cur = xformOf(getComputedStyle(n));
      const base = ref[xformKey(n)];
      const bad = [];
      if (num(cur.opacity, 1) < 0.999 && !same(cur, base, "opacity", "1")) bad.push(`opacity ${cur.opacity}`);
      if (!same(cur, base, "transform", "none") && !new DOMMatrix(cur.transform).isIdentity) bad.push(`transform ${cur.transform}`);
      if (!same(cur, base, "scale", "none") && cur.scale !== "1") bad.push(`scale ${cur.scale}`);
      if (!same(cur, base, "rotate", "none") && cur.rotate !== "0deg") bad.push(`rotate ${cur.rotate}`);
      if (!same(cur, base, "translate", "none") && !/^0px( 0px)?$/.test(cur.translate)) bad.push(`translate ${cur.translate}`);
      if (!same(cur, base, "clipPath", "none") && !/^inset\(0(px|%)?( 0(px|%)?)*\)$/.test(cur.clipPath)) bad.push(`clip-path ${cur.clipPath}`);
      const cs = getComputedStyle(n);
      const mask = cs.maskImage || cs.webkitMaskImage;
      if (mask && mask !== "none") bad.push("mask");
      if (bad.length) out.push(`${desc(n)}: ${bad.join(", ")}`);
    }
    return out;
  };

  /** Static colours of every element with text in a scene (reduced-motion reference render). */
  const staticColors = (name) => {
    const out = {};
    for (const el of sceneEl(name).querySelectorAll("*")) {
      if (SKIP_TAGS.has(el.tagName) || !el.textContent.trim()) continue;
      out[norm(el.textContent).slice(0, 200)] = rgba(getComputedStyle(el).color); // deepest wins
    }
    return out;
  };

  // ---------- content parity (M1-M3) ----------
  const sections = () => [...document.querySelectorAll("header, main > section[id], footer")]
    .map((el) => ({ el, key: el.id ? `#${el.id}` : el.tagName.toLowerCase() }));
  const visibleText = (root) => {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = norm(n.textContent);
      const p = n.parentElement;
      if (t && !SKIP_TAGS.has(p.tagName) && !p.closest('[aria-hidden="true"]')) out.push(t);
    }
    return out;
  };
  /** M1 text (aria-hidden excluded) + M3 headings / images / controls per section. */
  const parity = () => {
    const out = { text: {}, h: {}, img: {}, ctrl: {} };
    for (const { el, key } of sections()) {
      out.text[key] = visibleText(el).join("\n");
      out.h[key] = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName}:${norm(h.textContent)}`);
      out.img[key] = [...el.querySelectorAll("img")].map((i) => `${i.getAttribute("src")}|${i.getAttribute("alt")}`);
      out.ctrl[key] = [...el.querySelectorAll("a, button, input, textarea, select")].map(
        (c) => `${c.tagName}|${norm(c.textContent)}|${c.getAttribute("href")}|${c.getAttribute("type")}|${c.getAttribute("name")}|${c.getAttribute("aria-label")}`
      );
    }
    return out;
  };

  // ---------- M9 zones ----------
  const zones = () => {
    const list = [];
    document.querySelectorAll("#hero [data-hero]").forEach((h) => list.push(["hero", h]));
    const header = document.querySelector("header");
    if (header) list.push(["header", header]);
    const contact = document.getElementById("contact");
    const ch = contact?.querySelector("h2")?.parentElement;
    const items = [];
    const seen = new Set();
    const add = (zone, el) => { if (!seen.has(el)) { seen.add(el); items.push([zone, el]); } };
    for (const [zone, root] of list) {
      if (zone === "header") add(zone, root);
      leafIUs(root).forEach((el) => add(zone, el));
    }
    if (contact) leafIUs(contact).filter((el) => !ch?.contains(el)).forEach((el) => add("contact", el));
    const nav = navBottom();
    const bad = [];
    for (const [zone, el] of items) {
      const r = el.getBoundingClientRect();
      const vis = inter(r, { left: 0, top: nav, right: innerWidth, bottom: innerHeight });
      if (area(vis) === 0) continue; // not visible now
      const rd = readable(el, { skipViewport: true });
      const reasons = rd.reasons.filter((x) => !x.startsWith("contrast"));
      const t = effTransform(el);
      if (!isIdentity(t)) reasons.push(`transform ${t.scaleX.toFixed(2)}x rot ${t.rot.toFixed(1)} t(${t.tx.toFixed(0)},${t.ty.toFixed(0)})`);
      if (reasons.length) bad.push({ zone, text: ownText(el).slice(0, 40), reasons });
    }
    return { checked: items.length, bad };
  };

  // ---------- links / focus (M8) ----------
  /** First heading of the section a hash points to, plus its readable state. */
  const targetHeading = (hash) => {
    const sec = document.querySelector(hash);
    const h = sec?.querySelector("h1, h2");
    if (!h) return { found: false };
    const rd = readable(h);
    return { found: true, ok: rd.ok, reasons: rd.reasons, top: Math.round(h.getBoundingClientRect().top) };
  };
  const focusState = () => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const rd = readable(el);
    const cs = getComputedStyle(el);
    // Ring vs viewport edge is not checked: the browser's focus-scroll puts the element flush with
    // the edge (and at the document end it cannot do better); the element itself must be readable.
    const ow = cs.outlineStyle !== "none" ? num(cs.outlineWidth) + num(cs.outlineOffset) : 0;
    const r = el.getBoundingClientRect();
    const ring = { left: r.left - ow, top: r.top - ow, right: r.right + ow, bottom: r.bottom + ow };
    // Ring clipped by an overflow ancestor?
    let clipped = false;
    for (const n of ancestors(el).slice(1)) {
      if (n === document.body || n === document.documentElement) break;
      const c = getComputedStyle(n);
      if (c.overflowX !== "visible" || c.overflowY !== "visible") {
        const b = n.getBoundingClientRect();
        if (ring.left < b.left - 0.5 || ring.right > b.right + 0.5 || ring.top < b.top - 0.5 || ring.bottom > b.bottom + 0.5) clipped = true;
      }
    }
    const reasons = [...rd.reasons.filter((x) => !x.startsWith("contrast"))];
    if (clipped && ow > 0) reasons.push("focus ring clipped by ancestor");
    return {
      label: `<${el.tagName.toLowerCase()}> ${ownText(el).slice(0, 30) || el.getAttribute("aria-label") || ""}`,
      ok: reasons.length === 0,
      reasons,
      inScene: !!el.closest("[data-scene]"),
    };
  };

  // ---------- settle ----------
  const settleRoots = () => [
    ...document.querySelectorAll("[data-scene], #hero [data-hero], #contact, header"),
  ];
  const styleSig = () => settleRoots()
    // HTML only: the Hero ambient SVG loops forever and would never settle.
    .map((r) => [r, ...r.querySelectorAll("[style]")].filter((n) => n instanceof HTMLElement).map((n) => n.getAttribute("style") || "").join("|"))
    .join("||");
  /** 2 rAF, then wait until inline styles of scene/zone elements are unchanged for stableMs (cap maxMs). */
  const settle = (stableMs = 150, maxMs = 1500) =>
    new Promise((resolve) => {
      const t0 = performance.now();
      let frames = 0, last = null, since = t0;
      const tick = (now) => {
        frames++;
        const sig = styleSig();
        if (sig !== last) { last = sig; since = now; }
        if ((frames >= 2 && now - since >= stableMs) || now - t0 >= maxMs) resolve(now - t0);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  /** Resolves once scrollY has not moved for idleMs (a native smooth scroll has finished), capped at maxMs. */
  const scrollIdle = (idleMs = 150, maxMs = 3000) =>
    new Promise((resolve) => {
      const t0 = performance.now();
      let y = scrollY, since = t0;
      const tick = (now) => {
        if (scrollY !== y) { y = scrollY; since = now; }
        if (now - since >= idleMs || now - t0 >= maxMs) resolve(now - t0);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  window.__audit = {
    scrollIdle,
    sceneNames, docRange, sampleScene, staticViolations, staticColors, staticXforms, parity, zones,
    targetHeading, focusState, settle,
    metrics: () => ({ vw: innerWidth, vh: innerHeight, nav: navBottom(), scrollY, max: document.documentElement.scrollHeight - innerHeight }),
  };
})();
