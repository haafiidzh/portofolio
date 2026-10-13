"use client";

import { useRef } from "react";
import { createTimeline, type ScrollObserver } from "animejs";
import { useScrollScene } from "@/components/ui/useScrollScene";
import { SCRUB_SYNC } from "@/components/ui/useScrollScrub";
import HeroCopy from "./hero/HeroCopy";
import HeroObject from "./hero/HeroObject";
import { HERO_SCENE_MQ } from "./hero/sceneQuery";

/**
 * Hero exit scene (PRD 08 §17.B, stages H0-H2). Not pinned. One timeline with
 * ONE scroll observer replaces the six that used to drive the hint and the
 * object. Progress p runs 0 -> 1 from "hero top at viewport top" until "hero
 * bottom at viewport top"; the timeline is 1000 ms long so 1 ms = 0.1 % of p.
 * HeroCopy (eyebrow, h1, lede, CTAs, stats) is never touched (M9, O4).
 * The object dissolves (p 50-85 %) while the About index hairline draws
 * (AboutScene A0): the Q22 relay needs no shared element.
 * Nothing is built under reduced motion / short viewports: static = p 0.
 */

const LAYERS: Record<string, [rotate: number, scale: number]> = {
  ringOuter: [140, 1.25],
  ringMid: [-110, 0.86],
  core: [200, 0.72],
  dots: [-220, 1.1],
};

/** Object path: translate in vh / vw (of the viewport), scale; D/T vs M (reduced amplitude). */
const OBJECT = {
  wide: { y1: 25, y2: 45, x2: -12, s1: 1.25, s2: 1.45, fade: [500, 850] },
  mobile: { y1: 6, y2: 10, x2: 0, s1: 1.08, s2: 1.15, fade: [600, 900] },
} as const;

const HINT_END = 80; // 8 % of p

function buildHeroExit(el: HTMLElement, autoplay: ScrollObserver) {
  const obj = el.querySelector<SVGSVGElement>("[data-hero-object]");
  const hint = el.querySelector<HTMLElement>("[data-hero-hint]");
  if (!obj) return { revert() {} };

  const vh = window.innerHeight / 100;
  const vw = window.innerWidth / 100;
  const o = window.innerWidth >= 768 ? OBJECT.wide : OBJECT.mobile;

  el.setAttribute("data-hero-live", "");
  const tl = createTimeline({ autoplay, defaults: { ease: "linear" } });

  // H0: "Scroll" hint (existing behaviour)
  if (hint) {
    tl.add(hint, { opacity: [1, 0], translateY: [0, 8], duration: HINT_END }, 0);
  }

  // H1: layers rotate + scale over the whole range
  for (const [name, [rotate, scale]] of Object.entries(LAYERS)) {
    const layer = obj.querySelector<SVGGElement>(`[data-hero-layer="${name}"]`);
    if (layer) tl.add(layer, { rotate: [0, rotate], scale: [1, scale], duration: 1000 }, 0);
  }

  // H1 -> H2: object lingers (counter-scroll), then drifts toward page centre
  tl.add(obj, { translateY: [0, o.y1 * vh], scale: [1, o.s1], duration: 550 }, 0);
  tl.add(
    obj,
    {
      translateY: [o.y1 * vh, o.y2 * vh],
      translateX: [0, o.x2 * vw],
      scale: [o.s1, o.s2],
      duration: 450,
    },
    550
  );
  // Load-bearing: transformed SVG paints above later content, so it must be
  // fully transparent before it reaches About text (V6).
  tl.add(obj, { opacity: [1, 0], duration: o.fade[1] - o.fade[0] }, o.fade[0]);

  // Stretch the timeline to exactly p = 1.
  tl.add({ v: 0 }, { v: 1, duration: 1 }, 999);

  return {
    revert() {
      tl.revert();
      el.removeAttribute("data-hero-live");
    },
  };
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useScrollScene(sectionRef, {
    fallbackSync: SCRUB_SYNC.hero,
    enter: "top top",
    leave: "top bottom", // container top meets hero bottom (<container> <target>)
    build: (el, autoplay) => {
      if (!window.matchMedia(HERO_SCENE_MQ).matches) return { revert() {} };
      return buildHeroExit(el, autoplay);
    },
  });

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-hero-scene
      className="relative flex min-h-screen items-center px-6 pb-24 pt-[calc(var(--nav-h)+3rem)] md:px-10"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Above the drifting (transformed) object so copy and CTAs are never covered (M9). */}
        <div className="relative z-10">
          <HeroCopy />
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroObject />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
        <span data-hero-hint className="eyebrow">
          Scroll
        </span>
      </div>
    </section>
  );
}
