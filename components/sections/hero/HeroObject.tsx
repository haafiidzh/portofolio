"use client";

import { useEffect, useRef } from "react";
import { animate, stagger, svg } from "animejs";

/**
 * The hero's abstract object (decorative, aria-hidden).
 *
 * A. ENTRANCE (time-based, once): the outline strokes draw themselves in via
 *    `svg.createDrawable()` — the same line-draw technique anime.js uses.
 * B. AMBIENT: the orbiting dots breathe (opacity loop).
 *
 * The scroll-driven exit (layer rotation + whole-object drift/scale/dissolve)
 * lives in Hero.tsx as ONE timeline (PRD 08 §17.B); this component only
 * exposes the `data-hero-object` / `data-hero-layer` hooks for it.
 */
export default function HeroObject() {
  const root = useRef<SVGSVGElement>(null);
  const dots = useRef<SVGGElement>(null);

  useEffect(() => {
    const svgEl = root.current;
    if (!svgEl) return;

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

    // --- B. ambient breathing --------------------------------------------
    // Slow breathing so the object is never fully static. Uses `opacity` only —
    // no property overlap with the scroll timeline (which owns transforms).
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
  }, []);

  return (
    <svg
      ref={root}
      data-hero-object
      viewBox="0 0 400 400"
      className="pointer-events-none h-auto w-full max-w-[min(80vw,420px)] overflow-visible"
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
      <g data-hero-layer="ringOuter" style={{ transformOrigin: "200px 200px" }}>
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
      <g data-hero-layer="ringMid" style={{ transformOrigin: "200px 200px" }}>
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
      <g data-hero-layer="core" style={{ transformOrigin: "200px 200px" }}>
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
      <g
        ref={dots}
        data-hero-layer="dots"
        style={{ transformOrigin: "200px 200px" }}
      >
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
