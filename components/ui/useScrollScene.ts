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

/** Dispatch on a scene track to rebuild just that scene (no global resize). */
export const SCENE_REBUILD_EVENT = "scene-rebuild";

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
    let settleRaf = 0;
    let builtW = 0;
    let builtH = 0;

    const teardown = () => {
      cancelAnimationFrame(settleRaf);
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
      const observer = onScroll({
        target: el,
        enter: enter ?? "top top",
        leave: leave ?? "bottom bottom",
        sync: getLenis() ? true : fallbackSync,
      });
      const metrics = measure();
      builtW = window.innerWidth;
      builtH = metrics.viewportHeight;
      active = build(el, observer, metrics);
      // A fresh observer starts at progress 0, initialises its bounds a frame
      // later and then only eases toward the scroll position (and not at all
      // until the next scroll event when nothing is moving). After any rebuild
      // (resize, tier change) jump the timeline to the current position.
      // The observer binds its target on anime's first tick, so wait for that.
      // Do the first jump synchronously: binding the target here (what anime
      // does itself on its first tick) lets the final elements skip the
      // progress-0 frame that would otherwise paint before the rAF below.
      const jump = () => {
        const linked = observer.linked;
        if (linked) linked.seek(linked.duration * observer.progress);
      };
      if (!observer.target) observer.target = el;
      observer.refresh();
      jump();
      let tries = 0;
      const settle = () => {
        if (observer.reverted || active === null) return;
        if (!observer.target) {
          if (++tries < 20) settleRaf = requestAnimationFrame(settle);
          return;
        }
        observer.refresh();
        jump();
      };
      settleRaf = requestAnimationFrame(settle);
    };

    const rebuild = () => {
      teardown();
      sync();
    };
    // Height-only changes under this (mobile URL bar) keep the scene as built;
    // measured against the last build so small steps can't accumulate.
    const MIN_HEIGHT_REBUILD = 120;
    const onResize = () => {
      if (
        active &&
        window.innerWidth === builtW &&
        Math.abs(window.innerHeight - builtH) < MIN_HEIGHT_REBUILD
      ) {
        window.clearTimeout(resizeTimer);
        return;
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
    };

    sync();
    const offLenis = onLenisChange(rebuild);
    const all = [reduce, ...mqls];
    for (const m of all) m.addEventListener("change", rebuild);
    window.addEventListener("resize", onResize);
    // Per-scene rebuild request (dispatched on the track by its own component).
    el.addEventListener(SCENE_REBUILD_EVENT, rebuild);
    return () => {
      el.removeEventListener(SCENE_REBUILD_EVENT, rebuild);
      offLenis();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      for (const m of all) m.removeEventListener("change", rebuild);
      teardown();
    };
  }, [ref, tierKey]);
}
