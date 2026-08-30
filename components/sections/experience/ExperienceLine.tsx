"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, svg } from "animejs";

/**
 * Timeline spine drawn by scroll position.
 *
 * `svg.createDrawable()` turns the path into an animatable `draw: "start end"`
 * value. Binding it with `onScroll({ sync: true })` maps the draw progress 1:1
 * to how far the timeline container has travelled between `enter` and `leave` —
 * scroll up and the line un-draws. Use `sync: 0.2` instead of `true` if you
 * want the line to lag slightly behind the cursor of the scroll.
 */
export default function ExperienceLine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const path = pathRef.current;
    if (!container || !path) return;

    const [drawable] = svg.createDrawable(path);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate(drawable, { draw: "0 1", duration: 0 });
      return;
    }

    const animation = animate(drawable, {
      draw: ["0 0", "0 1"],
      ease: "linear",
      autoplay: onScroll({
        target: container,
        enter: "top bottom-=120",
        leave: "bottom top+=200",
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
          stroke="var(--foreground)"
          strokeOpacity={0.08}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={pathRef}
          d="M1,0 L1,100"
          stroke="var(--accent-bright)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
