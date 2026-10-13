"use client";

import { useEffect, useRef, type RefObject } from "react";
import { onScroll, type ScrollObserver } from "animejs";
import { getLenis, onLenisChange } from "./lenisAccessor";
import { SCRUB_SYNC, type ScrubSync, type ScrubTier } from "./useScrollScrub";

const TIER_QUERY: Record<ScrubTier, string> = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
};

type Revertible = { revert: () => unknown };

/** Measured once per build; stage positions are derived from these, never per frame. */
export type SceneMetrics = {
  /** Track (scene) height in px. */
  trackHeight: number;
  viewportHeight: number;
  /** Scrollable distance of the track: trackHeight - viewportHeight (>= 0). */
  distance: number;
  /** Offsets (px from track top) of each element matching `stageSelector`, in DOM order. */
  stageOffsets: number[];
};

/**
 * Scroll-driven scene on a track element (a `data-scene` section). Same
 * contract as useScrollScrub:
 *  - reduced motion or unlisted tier -> nothing is created (final CSS state);
 *  - tier / reduced-motion / Lenis start-stop / resize -> revert and rebuild;
 *  - unmount -> `revert()`;
 *  - layout is measured once per build (not per scroll frame); `build` receives
 *    the metrics so stage positions are computed up front.
 * Smoothing: `sync: true` while Lenis runs, otherwise `fallbackSync`.
 * Not used by any section yet (Phase 1+).
 */
export function useScrollScene<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: {
    build: (el: T, autoplay: ScrollObserver, metrics: SceneMetrics) => Revertible;
    fallbackSync: ScrubSync;
    tiers?: ScrubTier[];
    enter?: string;
    leave?: string;
    /** Child selector whose offsets populate `metrics.stageOffsets`. */
    stageSelector?: string;
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
    let resizeTimer = 0;

    const teardown = () => {
      active?.revert();
      active = null;
    };

    const measure = (): SceneMetrics => {
      const trackRect = el.getBoundingClientRect();
      const { stageSelector } = latest.current;
      const stageOffsets = stageSelector
        ? Array.from(el.querySelectorAll<HTMLElement>(stageSelector)).map(
            (n) => n.getBoundingClientRect().top - trackRect.top
          )
        : [];
      const viewportHeight = window.innerHeight;
      return {
        trackHeight: trackRect.height,
        viewportHeight,
        distance: Math.max(0, trackRect.height - viewportHeight),
        stageOffsets,
      };
    };

    const sync = () => {
      const shouldRun = !reduce.matches && mqls.some((m) => m.matches);
      if (!shouldRun) return teardown();
      if (active) return;
      const { build, fallbackSync, enter, leave } = latest.current;
      if (!Object.values(SCRUB_SYNC).includes(fallbackSync)) return;
      active = build(
        el,
        onScroll({
          target: el,
          enter: enter ?? "top top",
          leave: leave ?? "bottom bottom",
          sync: getLenis() ? true : fallbackSync,
        }),
        measure()
      );
    };

    const rebuild = () => {
      teardown();
      sync();
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
    };

    sync();
    const offLenis = onLenisChange(rebuild);
    const all = [reduce, ...mqls];
    for (const m of all) m.addEventListener("change", rebuild);
    window.addEventListener("resize", onResize);
    return () => {
      offLenis();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      for (const m of all) m.removeEventListener("change", rebuild);
      teardown();
    };
  }, [ref, tierKey]);
}
