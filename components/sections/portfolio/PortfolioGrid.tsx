"use client";

import { useRef, useState } from "react";
import { createTimeline, type ScrollObserver } from "animejs";
import PortfolioCard, { type PortfolioProject } from "./PortfolioCard";
import PortfolioModal from "./PortfolioModal";
import { useScrollScene, type SceneMetrics } from "@/components/ui/useScrollScene";
import { SCRUB_SYNC } from "@/components/ui/useScrollScrub";

/**
 * Portfolio scene (PRD 08 §17.E, option C): unpinned staged assembly, 0 vh track.
 * Observer target = this grid; one timeline whose length equals the grid's scroll
 * range (enter: grid top meets viewport bottom, leave: grid bottom meets viewport
 * top), so 1 ms = 1 px. Each card wrapper travels from below into today's grid
 * (per-column depth), the thumbnail settles from a slight zoom. Nothing exits.
 */

const EASE_TRAVEL = "out(3)";
// D (3 cols): travel in vh per card; opacity window as a fraction of the travel window.
const D_TRAVEL = [14, 26, 38];
const D_FADE: Array<[number, number]> = [[0, 0.35], [0.1, 0.45], [0.2, 0.55]];
const T_TRAVEL = [12, 24, 12];

function buildPortfolio(grid: HTMLElement, autoplay: ScrollObserver, metrics: SceneMetrics) {
  const wraps = Array.from(grid.querySelectorAll<HTMLElement>(":scope > .pf-card-wrap"));
  if (wraps.length === 0) return { revert() {} };

  const vh = metrics.viewportHeight;
  const vhs = vh / 100;
  const w = window.innerWidth;
  const docTop = (n: Element) => n.getBoundingClientRect().top + window.scrollY;
  const topAt = (n: Element, f: number) => docTop(n) - f * vh;
  const gridTop = docTop(grid);
  const s0 = gridTop - vh;
  const P = (y: number) => Math.max(0, Math.round(y - s0));

  const touched: Array<[HTMLElement, string[]]> = [];
  const init = (n: HTMLElement, props: Record<string, string>) => {
    for (const [k, val] of Object.entries(props)) n.style.setProperty(k, val);
    touched.push([n, Object.keys(props)]);
  };

  const tl = createTimeline({ autoplay, defaults: { ease: "linear" } });
  const add = (target: HTMLElement, params: Record<string, unknown>, a: number, b: number) => {
    const start = P(a);
    tl.add(target, { ...params, duration: Math.max(1, P(b) - start) }, start);
  };

  const wide = w >= 1024;
  const mid = !wide && w >= 768;
  wraps.forEach((wrap, i) => {
    const img = wrap.querySelector<HTMLElement>("img");
    // First-row cards share the grid window (D: all 3, T: cards 1-2); every other card
    // (M, or T row 2) gets its own window so it is seen assembling, not already final.
    const firstRow = (wide || mid) && Math.abs(docTop(wrap) - gridTop) < 4;
    const dy = (wide ? D_TRAVEL[i] ?? 26 : mid ? T_TRAVEL[i] ?? 12 : 12) * vhs;
    const [from, to] = firstRow
      ? [topAt(grid, 1), topAt(grid, 0.4)]
      : [topAt(wrap, 1), topAt(wrap, mid ? 0.6 : 0.7)];
    const span = to - from;
    const [f0, f1] = wide && firstRow ? D_FADE[i] ?? [0, 0.4] : [0, 0.4];
    const thumb = wide || mid ? 1.05 : 1.03;

    init(wrap, { opacity: "0", transform: `translateY(${dy}px)` });
    add(wrap, { translateY: [dy, 0], ease: EASE_TRAVEL }, from, to);
    add(wrap, { opacity: [0, 1] }, from + f0 * span, from + f1 * span);
    if (img) {
      init(img, { transform: `scale(${thumb})` });
      add(img, { scale: [thumb, 1] }, from, to);
    }
  });

  // Stretch the timeline to the full scroll range so progress maps 1 ms : 1 px.
  tl.add({ v: 0 }, { v: 1, duration: 1 }, Math.max(0, Math.round(vh + metrics.trackHeight) - 1));

  return {
    revert() {
      tl.revert();
      for (const [n, props] of touched) for (const p of props) n.style.removeProperty(p);
    },
  };
}

export default function PortfolioGrid({
  projects,
}: {
  projects: PortfolioProject[];
}) {
  const [active, setActive] = useState<PortfolioProject | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useScrollScene(gridRef, {
    fallbackSync: SCRUB_SYNC.water,
    enter: "bottom top",
    leave: "top bottom",
    build: buildPortfolio,
  });

  return (
    <>
      <div
        ref={gridRef}
        data-scene="portfolio"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <PortfolioCard
            key={project.slug}
            project={project}
            onOpen={setActive}
          />
        ))}
      </div>
      <PortfolioModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
