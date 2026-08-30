"use client";

import { useEffect, useRef } from "react";

export type MorphSectionParams = {
  color: string;
  distort: number;
  scale: [number, number, number];
  posX: number;
  opacity: number;
};

export const MORPH_SECTIONS: { id: string; params: MorphSectionParams }[] = [
  {
    id: "hero",
    params: { color: "#7a5c8e", distort: 0.4, scale: [1, 1, 1], posX: 0.9, opacity: 0.55 },
  },
  {
    id: "services",
    params: { color: "#8f6aa8", distort: 0.55, scale: [1.2, 0.8, 1], posX: -1.3, opacity: 0.3 },
  },
  {
    id: "experience",
    params: { color: "#6a4f7d", distort: 0.22, scale: [0.8, 1.3, 0.9], posX: 1.3, opacity: 0.22 },
  },
  {
    id: "portfolio",
    params: { color: "#9c7ab5", distort: 0.68, scale: [1.05, 1.05, 1.35], posX: -1.2, opacity: 0.3 },
  },
  {
    id: "contact",
    params: { color: "#5e4570", distort: 0.32, scale: [1, 1, 1], posX: 0, opacity: 0.28 },
  },
];

export type MorphState = {
  from: MorphSectionParams;
  to: MorphSectionParams;
  progress: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useScrollMorph() {
  const state = useRef<MorphState>({
    from: MORPH_SECTIONS[0].params,
    to: MORPH_SECTIONS[0].params,
    progress: 0,
  });

  useEffect(() => {
    const elements = MORPH_SECTIONS.map((section) => document.getElementById(section.id));
    let ticking = false;

    function update() {
      ticking = false;
      const centerY = window.innerHeight / 2;

      let activeIndex = 0;
      let progress = 0;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) {
          activeIndex = i;
          progress = (centerY - rect.top) / rect.height;
          break;
        }
        if (rect.top > centerY) {
          activeIndex = Math.max(0, i - 1);
          progress = 1;
          break;
        }
        activeIndex = i;
        progress = 1;
      }

      const current = MORPH_SECTIONS[activeIndex].params;
      const next = MORPH_SECTIONS[Math.min(activeIndex + 1, MORPH_SECTIONS.length - 1)].params;

      state.current = {
        from: current,
        to: next,
        progress: Math.min(Math.max(progress, 0), 1),
      };
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return state;
}

export function lerpParams(a: MorphSectionParams, b: MorphSectionParams, t: number) {
  return {
    distort: lerp(a.distort, b.distort, t),
    scale: [
      lerp(a.scale[0], b.scale[0], t),
      lerp(a.scale[1], b.scale[1], t),
      lerp(a.scale[2], b.scale[2], t),
    ] as [number, number, number],
    posX: lerp(a.posX, b.posX, t),
    opacity: lerp(a.opacity, b.opacity, t),
  };
}
