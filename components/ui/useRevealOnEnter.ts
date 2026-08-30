"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Animation = { revert: () => void };

/**
 * Fires a reveal animation exactly once, when the element enters the viewport.
 *
 * WHY NOT anime.js `onScroll()` HERE:
 * `autoplay: onScroll()` binds playback to an observer that PAUSES the
 * animation when the `leave` threshold is crossed. On a fast scroll a section
 * can cross both `enter` and `leave` within a couple of frames, so the tween
 * freezes half-played (or never plays) and the content stays at opacity 0.
 * Scroll-position-BOUND animations (hero object, timeline spine, progress bar)
 * still use onScroll — that is what it is designed for. One-shot reveals use a
 * plain IntersectionObserver instead, with two safety nets:
 *
 *   1. a passive scroll/resize check — catches the case where the browser
 *      coalesces the intersection change away during a fast flick;
 *   2. a failsafe timer — if nothing ever triggers, styles are cleared so the
 *      content can never stay invisible.
 */
export function useRevealOnEnter({
  ref,
  selector,
  prehide,
  play,
  deps = [],
}: {
  ref: RefObject<HTMLElement | null>;
  selector: string;
  prehide: (el: HTMLElement) => void;
  play: (targets: HTMLElement[]) => Animation;
  deps?: unknown[];
}) {
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;

    const clearStyles = () => {
      for (const t of targets) {
        t.style.opacity = "";
        t.style.transform = "";
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearStyles();
      return;
    }

    // Pre-hide before the browser paints — no flash of un-animated content.
    for (const t of targets) prehide(t);

    let animation: Animation | null = null;
    let started = false;
    let frame = 0;

    const start = () => {
      if (started) return;
      started = true;
      teardownTriggers();
      animation = play(targets);
    };

    // Element already fully above the viewport (reload mid-page, hash link):
    // reveal instantly, no animation to miss.
    const revealInstantly = () => {
      if (started) return;
      started = true;
      teardownTriggers();
      clearStyles();
    };

    const check = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      if (rect.bottom <= 0) return revealInstantly();
      // Any visible pixel counts. A tighter margin leaves an element that stops
      // just barely on screen (e.g. after a smooth scrollIntoView) untriggered,
      // with no further scroll events coming to re-check it.
      if (rect.top < window.innerHeight) start();
    };

    const onScrollEvent = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start();
      },
      { rootMargin: "0px", threshold: 0 }
    );

    function teardownTriggers() {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollEvent);
      window.removeEventListener("resize", onScrollEvent);
      clearTimeout(failsafe);
      if (frame) cancelAnimationFrame(frame);
    }

    // Last resort: never leave content invisible.
    const failsafe = window.setTimeout(revealInstantly, 6000);

    observer.observe(root);
    window.addEventListener("scroll", onScrollEvent, { passive: true });
    window.addEventListener("resize", onScrollEvent);
    check();

    return () => {
      teardownTriggers();
      animation?.revert();
      clearStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
