"use client";

import { useRef, type ReactNode } from "react";
import { animate, stagger } from "animejs";
import { useRevealOnEnter } from "./useRevealOnEnter";

/**
 * Scroll-triggered reveal. anime.js runs the animation; a viewport observer
 * decides when (see useRevealOnEnter for why it is not `onScroll()` autoplay).
 *
 * Every child marked `data-reveal` is pre-hidden, then faded + lifted into
 * place with `stagger(staggerMs)` so they cascade instead of landing together.
 * Tune `staggerMs` for the gap between children, `y` for travel distance,
 * `ease` below for the curve (anime.js v4 names: outExpo, inOutQuad, ...).
 */
type RevealProps = {
  children: ReactNode;
  className?: string;
  /** px travelled on the Y axis */
  y?: number;
  /** ms between each [data-reveal] child */
  staggerMs?: number;
  /** ms before the whole group starts */
  delay?: number;
};

export default function Reveal({
  children,
  className,
  y = 32,
  staggerMs = 90,
  delay = 0,
}: RevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useRevealOnEnter({
    ref: root,
    selector: "[data-reveal]",
    prehide: (el) => {
      el.style.opacity = "0";
      el.style.transform = `translateY(${y}px)`;
    },
    play: (targets) =>
      animate(targets, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration: 900,
        ease: "outExpo",
        delay: stagger(staggerMs, { start: delay }),
      }),
    deps: [y, staggerMs, delay],
  });

  return (
    <div ref={root} data-reveal-root className={className}>
      {children}
    </div>
  );
}
