"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getLenis, onLenisChange } from "./lenisAccessor";
import { onScroll, type ScrollObserver } from "animejs";

/** Only these smoothing values are allowed (PRD 07 §13.1 Q3): water / hero / line. */
export const SCRUB_SYNC = { water: 0.25, hero: 0.35, line: 0.4 } as const;
export type ScrubSync = (typeof SCRUB_SYNC)[keyof typeof SCRUB_SYNC];

/** PRD 07 §7 tiers. */
export type ScrubTier = "mobile" | "tablet" | "desktop";
const TIER_QUERY: Record<ScrubTier, string> = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
};

type Revertible = { revert: () => unknown };

/**
 * Scroll-bound (scrub) animation, one observer per call.
 *
 * `build` receives the observer and must return an anime.js animation whose
 * `autoplay` is that observer, animating transform/opacity only:
 *
 *   useScrollScrub(ref, {
 *     sync: SCRUB_SYNC.water,
 *     tiers: ["tablet", "desktop"],
 *     enter: "bottom top",
 *     leave: "top bottom",
 *     build: (el, autoplay) =>
 *       animate(el, { translateY: [-20, 20], ease: "linear", autoplay }),
 *   });
 *
 * Contract:
 *  - reduced motion or a tier not listed -> nothing is created, the element
 *    keeps its CSS (final) state;
 *  - tier/reduced-motion changes at runtime re-evaluate (revert or rebuild);
 *  - unmount -> `revert()` removes the observer and inline styles;
 *  - while Lenis runs the observer uses `sync: true`; hooks rebuild when it starts/stops;
 *  - no layout reads here; anime.js measures on resize, not per scroll frame.
 * One-shot reveals stay on useRevealOnEnter (see its comment for why).
 */
export function useScrollScrub<T extends HTMLElement | SVGElement>(
  ref: RefObject<T | null>,
  options: {
    build: (el: T, autoplay: ScrollObserver) => Revertible;
    sync: ScrubSync | boolean;
    tiers?: ScrubTier[];
    enter?: string;
    leave?: string;
    /** Element whose box defines progress; defaults to `ref` itself. */
    target?: RefObject<HTMLElement | null>;
  }
) {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const tierKey = (options.tiers ?? ["mobile", "tablet", "desktop"]).join();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tierList = tierKey.split(",") as ScrubTier[];
    const mqls = tierList.map((t) => window.matchMedia(TIER_QUERY[t]));
    let active: Revertible | null = null;

    const sync = () => {
      const shouldRun = !reduce.matches && mqls.some((m) => m.matches);
      if (!shouldRun) {
        active?.revert();
        active = null;
      } else if (!active) {
        const { build, sync: s, enter, leave, target } = latest.current;
        if (typeof s === "number" && !Object.values(SCRUB_SYNC).includes(s as ScrubSync)) {
          return; // off-scale smoothing is a bug; fail to the static state
        }
        active = build(
          el,
          onScroll({
            target: target?.current ?? el,
            enter: enter ?? "bottom top",
            leave: leave ?? "top bottom",
            // Smoothing rule (PRD 08 §7.4): Lenis already smooths scrollY.
            sync: getLenis() ? true : s,
          })
        );
      }
    };

    const rebuild = () => {
      active?.revert();
      active = null;
      sync();
    };

    sync();
    const offLenis = onLenisChange(rebuild);
    const all = [reduce, ...mqls];
    for (const m of all) m.addEventListener("change", sync);
    return () => {
      offLenis();
      for (const m of all) m.removeEventListener("change", sync);
      active?.revert();
      active = null;
    };
  }, [ref, tierKey]);
}
