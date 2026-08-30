"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, svg } from "animejs";

export default function ExperienceLine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || !containerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const [drawable] = svg.createDrawable(pathRef.current);

    if (prefersReducedMotion) {
      animate(drawable, { draw: "0 1", duration: 0 });
      return;
    }

    const animation = animate(drawable, {
      draw: ["0 0", "0 1"],
      ease: "linear",
      autoplay: onScroll({
        container: containerRef.current,
        enter: "top bottom",
        leave: "bottom top",
        sync: true,
      }),
    });

    return () => {
      animation.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-y-0 left-0 w-px">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 2 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M1,0 L1,100"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.2}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={pathRef}
          d="M1,0 L1,100"
          stroke="var(--accent)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
