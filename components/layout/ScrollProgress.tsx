"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";

/**
 * Top progress bar whose scaleX is *bound to scroll position*, not to time.
 *
 * `sync: true` inside onScroll() makes anime.js map the animation's playback
 * head directly to the observer's progress between `enter` and `leave`.
 * Here the observed target is <body>, so progress = whole-page scroll.
 * Swap `sync: true` for a number (e.g. 0.2) to add inertia/smoothing.
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bar.current) return;

    const animation = animate(bar.current, {
      scaleX: [0, 1],
      ease: "linear",
      autoplay: onScroll({
        target: document.body,
        enter: "top top",
        leave: "bottom bottom",
        sync: true,
      }),
    });

    return () => {
      animation.revert();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px">
      <div ref={bar} className="scroll-progress h-full w-full scale-x-0" />
    </div>
  );
}
