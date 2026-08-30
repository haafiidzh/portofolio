"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, stagger, svg } from "animejs";

/**
 * The hero's abstract object. Two animation systems run on it:
 *
 * A. ENTRANCE (time-based, once): the outline strokes draw themselves in via
 *    `svg.createDrawable()` — the same line-draw technique anime.js uses.
 *
 * B. SCROLL-DRIVEN (the important one): each layer gets its own `animate()`
 *    whose `autoplay` is an `onScroll()` observer with `sync`.
 *      - `target`  = the hero <section>, so progress is measured against it
 *      - `enter: "top top"` / `leave: "bottom top"` = the window in which
 *        progress runs 0 → 1 (from hero pinned at top until it fully exits)
 *      - `sync: 0.35` = smoothed binding. `true` would be a rigid 1:1 lock;
 *        a number adds inertia so the shape eases toward the scroll position.
 *    Because playback is bound to scroll, rotation/scale/opacity reverse
 *    exactly when the user scrolls back up.
 *
 * Tuning: give each layer a different rotate value to change the depth
 * illusion, or raise `sync` toward 1 for a tighter, snappier feel.
 */
export default function HeroObject({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const root = useRef<SVGSVGElement>(null);
  const ringOuter = useRef<SVGGElement>(null);
  const ringMid = useRef<SVGGElement>(null);
  const core = useRef<SVGGElement>(null);
  const dots = useRef<SVGGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const svgEl = root.current;
    if (!section || !svgEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const animations: { revert: () => void }[] = [];

    // --- A. entrance line-draw -------------------------------------------
    const strokes = svgEl.querySelectorAll<SVGPathElement>("[data-draw]");
    if (strokes.length > 0) {
      const drawables = Array.from(strokes).flatMap((el) =>
        svg.createDrawable(el)
      );
      animations.push(
        animate(drawables, {
          draw: reduced ? "0 1" : ["0 0", "0 1"],
          duration: reduced ? 0 : 1600,
          ease: "inOutQuad",
          delay: reduced ? 0 : stagger(120),
        })
      );
    }

    if (reduced) {
      return () => animations.forEach((a) => a.revert());
    }

    // --- B. scroll-bound layers ------------------------------------------
    const scrollBinding = () =>
      onScroll({
        target: section,
        enter: "top top",
        leave: "bottom top",
        sync: 0.35,
      });

    const layers: [React.RefObject<SVGGElement | null>, number, number][] = [
      // [ref, rotation in deg, scale at end]
      [ringOuter, 140, 1.25],
      [ringMid, -110, 0.86],
      [core, 200, 0.72],
      [dots, -220, 1.1],
    ];

    for (const [ref, rotate, scaleTo] of layers) {
      if (!ref.current) continue;
      animations.push(
        animate(ref.current, {
          rotate: [0, rotate],
          scale: [1, scaleTo],
          ease: "linear",
          autoplay: scrollBinding(),
        })
      );
    }

    // Whole object drifts up and fades as the hero leaves.
    animations.push(
      animate(svgEl, {
        translateY: [0, -70],
        opacity: [1, 0.35],
        ease: "linear",
        autoplay: scrollBinding(),
      })
    );

    // Slow ambient breathing so the object is never fully static. Uses
    // `opacity` only — no property overlap with the scroll-bound tweens above,
    // which would otherwise fight each other for the same value.
    if (dots.current) {
      animations.push(
        animate(dots.current.querySelectorAll("circle"), {
          opacity: [0.35, 1],
          duration: 2600,
          ease: "inOutQuad",
          loop: true,
          alternate: true,
          delay: stagger(220),
        })
      );
    }

    return () => animations.forEach((a) => a.revert());
  }, [sectionRef]);

  return (
    <svg
      ref={root}
      viewBox="0 0 400 400"
      className="h-auto w-full max-w-[min(80vw,420px)] overflow-visible"
      aria-hidden
    >
      <defs>
        <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-bright)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent-deep)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* outer ring + ticks */}
      <g ref={ringOuter} style={{ transformOrigin: "200px 200px" }}>
        <circle
          data-draw
          cx="200"
          cy="200"
          r="176"
          fill="none"
          stroke="var(--accent-bright)"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          const long = i % 6 === 0;
          const r1 = long ? 158 : 168;
          // Rounded: raw floats serialise differently on server vs client and
          // trip React's hydration check.
          const at = (r: number, fn: (v: number) => number) =>
            (200 + fn(angle) * r).toFixed(2);
          return (
            <line
              key={i}
              x1={at(r1, Math.cos)}
              y1={at(r1, Math.sin)}
              x2={at(176, Math.cos)}
              y2={at(176, Math.sin)}
              stroke="var(--accent-bright)"
              strokeOpacity={long ? 0.6 : 0.22}
              strokeWidth="1"
            />
          );
        })}
      </g>

      {/* mid hexagon */}
      <g ref={ringMid} style={{ transformOrigin: "200px 200px" }}>
        <path
          data-draw
          d="M200 74 L309 137 L309 263 L200 326 L91 263 L91 137 Z"
          fill="none"
          stroke="var(--accent-bright)"
          strokeOpacity="0.45"
          strokeWidth="1.25"
        />
        <path
          data-draw
          d="M200 116 L273 158 L273 242 L200 284 L127 242 L127 158 Z"
          fill="color-mix(in srgb, var(--accent) 18%, transparent)"
          stroke="var(--accent-bright)"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
      </g>

      {/* core */}
      <g ref={core} style={{ transformOrigin: "200px 200px" }}>
        <circle cx="200" cy="200" r="92" fill="url(#hero-core)" />
        <path
          data-draw
          d="M200 128 L262 200 L200 272 L138 200 Z"
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity="0.75"
          strokeWidth="1.5"
        />
      </g>

      {/* orbiting dots */}
      <g ref={dots} style={{ transformOrigin: "200px 200px" }}>
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <circle
              key={deg}
              cx={(200 + Math.cos(angle) * 176).toFixed(2)}
              cy={(200 + Math.sin(angle) * 176).toFixed(2)}
              r={i % 2 === 0 ? 4 : 2.5}
              fill="var(--accent-bright)"
              fillOpacity={i % 2 === 0 ? 0.95 : 0.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
