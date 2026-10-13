"use client";

import { useRef, type ReactNode } from "react";
import { createTimeline, type ScrollObserver } from "animejs";
import { useScrollScene } from "@/components/ui/useScrollScene";
import { SCRUB_SYNC } from "@/components/ui/useScrollScrub";
import { SKILLS_SCENE_MQ } from "./sceneQuery";

/**
 * Skills scene "stack assembles" (PRD 08 §17.F, stages K1-K5). The rows block
 * is pinned (CSS sticky, globals.css) and the tags converge into their rows
 * group by group; the accent hairline of each row is drawn by the timeline
 * (`--draw`). Below D, or when the rows do not fit the viewport, the rows are
 * unpinned and each row assembles as it passes (Q19). Timeline length equals the
 * section's scroll range (1 ms = 1 px), stages are placed at build time.
 * Nothing is built under reduced motion / short viewports.
 */

/** Pinned stages in vh from pin start (Practice pulled 4 vh earlier than 08 §17.F so the K5 hold clears 15 % of the scene at 1366x768): hairline [from, to], tag j starts at base + step*j and lasts `len`. */
const GROUPS = [
  { line: [-50, -38], base: -46, step: 1.5, len: 14 },
  { line: [-28, -16], base: -24, step: 1.5, len: 14 },
  { line: [-6, 6], base: -2, step: 2, len: 14 },
  { line: [12, 24], base: 16, step: 2, len: 12 },
] as const;

const FIT_MARGIN = 48;
const PIN_MQ = "(min-width: 1024px) and (min-height: 640px)";

const docTop = (n: Element) => n.getBoundingClientRect().top + window.scrollY;

export default function SkillsScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useScrollScene(ref, {
    fallbackSync: SCRUB_SYNC.line,
    enter: "bottom top",
    leave: "top bottom",
    build: (el, autoplay) => {
      if (!window.matchMedia(SKILLS_SCENE_MQ).matches) return { revert() {} };
      return buildSkills(el, autoplay);
    },
  });

  return (
    <section
      ref={ref}
      id="skills"
      data-scene="skills"
      className="px-6 py-28 md:px-10 md:py-40"
    >
      {children}
    </section>
  );
}

function buildSkills(el: HTMLElement, autoplay: ScrollObserver) {
  const pin = el.querySelector<HTMLElement>("[data-scene-pin]");
  const track = el.querySelector<HTMLElement>(".skills-track");
  const rows = Array.from(el.querySelectorAll<HTMLElement>(".skills-row"));
  if (!pin || !track || rows.length === 0) return { revert() {} };

  // Fit check (Q18): pin only if the rows block fits below the Nav. Done before
  // any measuring because dropping the pin removes the track spacer.
  el.removeAttribute("data-pin-off");
  const vh = window.innerHeight;
  const navH = document.querySelector("header")?.getBoundingClientRect().height ?? 72;
  if (
    window.matchMedia(PIN_MQ).matches &&
    pin.getBoundingClientRect().height > vh - navH - FIT_MARGIN
  ) {
    el.setAttribute("data-pin-off", "");
  }
  const pinned = getComputedStyle(pin).position === "sticky";

  const vhs = vh / 100;
  const vws = window.innerWidth / 100;
  const wide = window.innerWidth >= 1024;
  const s0 = docTop(el) - vh;
  const P = (y: number) => Math.max(0, Math.round(y - s0));
  const range = Math.round(vh + el.getBoundingClientRect().height);
  const topAt = (n: Element, f: number) => docTop(n) - f * vh;

  el.setAttribute("data-scene-live", "");
  const touched: Array<[HTMLElement, string[]]> = [];
  const init = (n: HTMLElement, props: Record<string, string>) => {
    for (const [k, v] of Object.entries(props)) n.style.setProperty(k, v);
    touched.push([n, Object.keys(props)]);
  };

  const tl = createTimeline({ defaults: { ease: "linear" }, autoplay });
  const add = (
    targets: HTMLElement,
    params: Record<string, unknown>,
    startY: number,
    endY: number
  ) => {
    const start = P(startY);
    tl.add(targets, { ...params, duration: Math.max(1, P(endY) - start) }, start);
  };

  const pinTop = pinned ? parseFloat(getComputedStyle(pin).top) || 0 : 0;
  const pinStart = docTop(track) - pinTop;

  rows.forEach((row, g) => {
    const tags = Array.from(row.querySelectorAll<HTMLElement>("[data-tag]"));
    init(row, { "--draw": "0" });

    if (pinned) {
      const k = GROUPS[Math.min(g, GROUPS.length - 1)];
      const Y = (s: number) => pinStart + s * vhs;
      add(row, { "--draw": [0, 1] }, Y(k.line[0]), Y(k.line[1]));
      tags.forEach((t, j) => {
        const sign = j % 2 === 0 ? 1 : -1;
        const dxVw = 6 + ((7 * j) % 10);
        const dyVh = 12 + ((5 * j) % 12);
        const dx = sign * dxVw * vws;
        const dy = dyVh * vhs;
        const rot = sign * (3 + (j % 3));
        const startY = Y(k.base + k.step * j);
        const endY = Y(k.base + k.step * j + k.len);
        init(t, {
          opacity: "0",
          transform: `translateX(${dx}px) translateY(${dy}px) rotate(${rot}deg) scale(0.92)`,
        });
        // Travel >= 20vh lands with out(3); anything shorter stays linear (PRD 08 Q4/C6).
        add(
          t,
          {
            translateX: [dx, 0],
            translateY: [dy, 0],
            rotate: [rot, 0],
            scale: [0.92, 1],
            ease: dyVh >= 20 ? "out(3)" : "linear",
          },
          startY,
          endY
        );
        add(t, { opacity: [0, 1] }, startY, startY + 0.4 * (endY - startY));
      });
    } else {
      // Unpinned per row (Q19): row top @ 95% -> @ 55%; line first 30%, tags ripple left to right.
      const a = topAt(row, 0.95);
      const span = topAt(row, 0.55) - a;
      add(row, { "--draw": [0, 1] }, a, a + 0.3 * span);
      const dx = wide || window.innerWidth >= 768 ? 4 * vws : 16;
      const dy = window.innerWidth >= 768 ? 8 * vhs : 24;
      tags.forEach((t, j) => {
        const sign = j % 2 === 0 ? 1 : -1;
        const start = a + (0.3 + (0.5 * j) / tags.length) * span;
        const end = start + 0.2 * span;
        init(t, { opacity: "0", transform: `translateX(${sign * dx}px) translateY(${dy}px)` });
        add(t, { translateX: [sign * dx, 0], translateY: [dy, 0], opacity: [0, 1] }, start, end);
      });
    }
  });

  // Stretch the timeline to the full scroll range so progress maps 1 ms : 1 px.
  tl.add({ v: 0 }, { v: 1, duration: 1 }, Math.max(0, range - 1));

  return {
    revert() {
      tl.revert();
      for (const [n, props] of touched) for (const p of props) n.style.removeProperty(p);
      el.removeAttribute("data-scene-live");
      el.removeAttribute("data-pin-off");
    },
  };
}
