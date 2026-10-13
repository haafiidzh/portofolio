"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createTimeline, splitText, type ScrollObserver } from "animejs";
import { SCENE_REBUILD_EVENT, useScrollScene, type SceneMetrics } from "@/components/ui/useScrollScene";
import { SCRUB_SYNC } from "@/components/ui/useScrollScrub";
import { ABOUT_SCENE_MQ } from "./sceneQuery";

/**
 * About scene (PRD 08 §17.C, stages A0-A6). One timeline whose length equals
 * the scroll range of the section (enter: section top meets viewport bottom,
 * leave: section bottom meets viewport top), so 1 ms of timeline = 1 px of
 * scroll. Every stage is placed at build time from measured element edges
 * ("element top @ 95% of viewport" -> a scrollY value -> a timeline position).
 *
 * Variants: D (>=1024) and T (768-1023) pin the SectionHeader (CSS sticky, see
 * globals.css); M (and any case where the header is not sticky) is unpinned.
 * Nothing is built under reduced motion / short viewports: the final CSS state
 * is the baseline layout.
 */

type Variant = {
  /** word i fills over [i * stagger, i * stagger + len] (vh of scroll after pin start) */
  fill: { stagger: number; len: number };
  portrait: { inset: string; scale: number; from: number; to: number };
  bio: { dy: number; from: number; to: number };
  fact: { from: number; to: number; dx: number };
  caption: { from: number; to: number };
};

const D: Variant = {
  fill: { stagger: 5.5, len: 12 },
  portrait: { inset: "12% 10% 12% 10%", scale: 1.05, from: 0.95, to: 0.5 },
  bio: { dy: 64, from: 0.9, to: 0.6 },
  fact: { from: 0.92, to: 0.72, dx: 24 },
  caption: { from: 1, to: 0.92 },
};
// T: same stage map, fill compressed into the 40svh track (fill 0-32, hold 32-40).
const T_FILL = { stagger: 5.5 * 0.634, len: 12 * 0.634 };
const M: Variant = {
  fill: { stagger: 0, len: 0 }, // unused: M fills over the h2's own viewport range
  portrait: { inset: "6% 6% 6% 6%", scale: 1.03, from: 1, to: 0.55 },
  bio: { dy: 32, from: 0.95, to: 0.65 },
  fact: { from: 0.92, to: 0.75, dx: 12 },
  caption: { from: 1, to: 0.94 },
};

/** Mix `rgb(r, g, b)` toward a `#rrggbb` colour by `amount` (0..1); returns an rgb() string. */
function mixRgb(rgb: string, hex: string, amount: number) {
  const a = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [155, 147, 168];
  const n = parseInt(hex.replace("#", ""), 16);
  const b = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * amount)).join(", ")})`;
}

const docTop =(n: Element) => n.getBoundingClientRect().top + window.scrollY;

export default function AboutScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const portraitOk = useRef(true);

  // Portrait motion is the only expensive stage: if the page can't hold ~40 fps
  // after load, fall back to the still image (rebuild without the iris).
  useEffect(() => {
    let raf = 0;
    let idle = 0;
    let cancelled = false;
    const probe = () => {
      let frames = 0;
      let start = 0;
      const tick = (t: number) => {
        if (cancelled) return;
        if (!start) start = t;
        if (++frames < 40) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const avg = (t - start) / (frames - 1);
        if (avg > 25 && portraitOk.current) {
          portraitOk.current = false;
          ref.current?.dispatchEvent(new Event(SCENE_REBUILD_EVENT)); // rebuild only About
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const begin = () => {
      idle = window.setTimeout(probe, 1200);
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      window.removeEventListener("load", begin);
    };
  }, []);

  useScrollScene(ref, {
    fallbackSync: SCRUB_SYNC.line,
    enter: "bottom top",
    leave: "top bottom",
    build: (el, autoplay, metrics) => {
      if (!window.matchMedia(ABOUT_SCENE_MQ).matches) return { revert() {} };
      return buildAbout(el, autoplay, metrics, portraitOk.current);
    },
  });

  return (
    <section ref={ref} id="about" data-scene="about" className="px-6 py-28 md:px-10 md:py-40">
      {children}
    </section>
  );
}

function buildAbout(
  el: HTMLElement,
  autoplay: ScrollObserver,
  metrics: SceneMetrics,
  withPortrait: boolean
) {
  const q = <E extends HTMLElement>(sel: string) => el.querySelector<E>(sel);
  const header = q("[data-scene-pin]");
  const wrapper = q(".about-track");
  const h2 = header?.querySelector<HTMLElement>("h2");
  const rule = header?.querySelector<HTMLElement>("[data-scene-rule]");
  const frame = q("[data-scene-frame]");
  const iris = q("[data-scene-iris]");
  const caption = q("[data-scene-caption]");
  const bio = q("[data-scene-bio]");
  const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-scene-fact]"));
  if (!header || !wrapper || !h2 || !rule || !frame || !caption || !bio) return { revert() {} };

  const vh = metrics.viewportHeight;
  const vhs = vh / 100;
  const pinned = getComputedStyle(header).position === "sticky";
  const wide = window.innerWidth >= 1024;
  const v = pinned || window.innerWidth >= 768 ? D : M;
  const root = getComputedStyle(document.documentElement);
  const muted = root.getPropertyValue("--muted-foreground").trim();
  // End colours = the static render's computed colours (reduced-motion parity).
  // The baseline bio is muted (.lede outranks text-foreground), so it brightens
  // from a dimmed muted (70% toward bg) to muted, not to foreground.
  const fg = getComputedStyle(h2).color;
  const bioEnd = getComputedStyle(bio).color;
  const bioStart = mixRgb(bioEnd, root.getPropertyValue("--background").trim(), 0.7);

  // scrollY -> timeline ms
  const s0 = docTop(el) - vh;
  const P = (y: number) => Math.max(0, Math.round(y - s0));
  const range = Math.round(vh + metrics.trackHeight);
  const topAt = (n: Element, f: number) => docTop(n) - f * vh;
  const bottomAt = (n: Element, f: number) => docTop(n) + n.getBoundingClientRect().height - f * vh;

  el.setAttribute("data-scene-live", "");
  const split = splitText(h2, { words: { class: "about-word" }, accessible: true });
  // accessible: true = one visually-hidden copy for screen readers, split words aria-hidden (SR reads the h2 once).
  const words = split.words as HTMLElement[];

  const touched: Array<[HTMLElement, string[]]> = [];
  const init = (n: HTMLElement | null | undefined, props: Record<string, string>) => {
    if (!n) return;
    for (const [k, val] of Object.entries(props)) n.style.setProperty(k, val);
    touched.push([n, Object.keys(props)]);
  };

  const tl = createTimeline({ autoplay, defaults: { ease: "linear" } });
  const add = (
    targets: HTMLElement | HTMLElement[],
    params: Record<string, unknown>,
    startY: number,
    endY: number
  ) => {
    const start = P(startY);
    tl.add(targets, { ...params, duration: Math.max(1, P(endY) - start) }, start);
  };

  // A0 index hairline + A1 word fill
  init(rule, { "transform-origin": "left", transform: "scaleX(0)" });
  words.forEach((w) => init(w, { color: muted }));
  if (pinned) {
    const pinTop = parseFloat(getComputedStyle(header).top) || 0;
    const pinStart = docTop(wrapper) - pinTop;
    const fill = wide ? D.fill : T_FILL;
    add(rule, { scaleX: [0, 1] }, pinStart - 40 * vhs, pinStart - 20 * vhs);
    words.forEach((w, i) =>
      add(w, { color: [muted, fg] }, pinStart + fill.stagger * i * vhs, pinStart + (fill.stagger * i + fill.len) * vhs)
    );
  } else {
    const a = topAt(h2, 0.85);
    const span = topAt(h2, 0.35) - a;
    add(rule, { scaleX: [0, 1] }, topAt(rule, 0.95), topAt(rule, 0.75));
    words.forEach((w, i) => add(w, { color: [muted, fg] }, a + 0.09 * i * span, a + (0.09 * i + 0.14) * span));
  }

  // A3 portrait iris (wrapper around the image only)
  if (withPortrait && iris) {
    const img = iris.querySelector("img");
    const imgScale = parseFloat(img ? getComputedStyle(img).scale : "1") || 1;
    // The scaled <img> box overhangs the frame, and its top is what must be
    // settled by the 40% line (audit M5'(b)): finish when img top reaches ~45% (a margin above the 40% line).
    const overhang = (frame.getBoundingClientRect().height * (imgScale - 1)) / 2;
    const end = 0.45 + overhang / vh;
    const start = Math.min(v.portrait.from, end + 0.3);
    init(iris, {
      "clip-path": `inset(${v.portrait.inset} round 16px)`,
      transform: `scale(${v.portrait.scale})`,
    });
    add(
      iris,
      {
        clipPath: [`inset(${v.portrait.inset} round 16px)`, "inset(0% 0% 0% 0% round 16px)"],
        scale: [v.portrait.scale, 1],
      },
      topAt(frame, start),
      topAt(frame, end)
    );
  }

  // A4 caption: opacity only, after the image is open
  init(caption, { opacity: "0" });
  add(caption, { opacity: [0, 1] }, bottomAt(frame, v.caption.from), bottomAt(frame, v.caption.to));

  // A5 bio
  init(bio, { transform: `translateY(${v.bio.dy}px)`, color: bioStart });
  add(bio, { translateY: [v.bio.dy, 0], color: [bioStart, bioEnd] }, topAt(bio, v.bio.from), topAt(bio, v.bio.to));

  // A6 FACTS rows: accent line first, then label/value slide
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll<HTMLElement>("dt, dd"));
    const a = topAt(row, v.fact.from);
    const b = topAt(row, v.fact.to);
    init(row, { "--line": "0" });
    cells.forEach((c) => init(c, { opacity: "0", transform: `translateX(${-v.fact.dx}px)` }));
    add(row, { "--line": [0, 1] }, a, a + 0.6 * (b - a));
    add(cells, { opacity: [0, 1], translateX: [-v.fact.dx, 0] }, a + 0.3 * (b - a), b);
  }

  // Stretch the timeline to the full scroll range so progress maps 1 ms : 1 px.
  tl.add({ v: 0 }, { v: 1, duration: 1 }, Math.max(0, range - 1));

  return {
    revert() {
      tl.revert();
      for (const [n, props] of touched) for (const p of props) n.style.removeProperty(p);
      split.revert();
      el.removeAttribute("data-scene-live");
    },
  };
}
