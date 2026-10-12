"use client";

import { animate } from "animejs";
import { useRef } from "react";
import { useScrollScrub } from "@/components/ui/useScrollScrub";
import HeroCopy from "./hero/HeroCopy";
import HeroObject from "./hero/HeroObject";

export default function Hero() {
  // The section itself is the scroll observer target for HeroObject —
  // progress runs 0 → 1 across this element's travel through the viewport.
  const sectionRef = useRef<HTMLElement>(null);

  const hintRef = useRef<HTMLSpanElement>(null);

  // Hint fades out over the first 8% of hero progress (PRD 07 §13.2); 1:1, linear.
  // anime.js reads "<container edge> <target edge>": "top top" -> "top bottom"
  // is hero top at viewport top until hero bottom at viewport top.
  useScrollScrub(hintRef, {
    target: sectionRef,
    sync: true,
    enter: "top top",
    leave: "top bottom",
    build: (el, autoplay) =>
      animate(el, {
        opacity: [
          { from: 1, to: 0, duration: 8 },
          { to: 0, duration: 92 },
        ],
        translateY: [
          { from: 0, to: 8, duration: 8 },
          { to: 8, duration: 92 },
        ],
        ease: "linear",
        autoplay,
      }),
  });

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen items-center px-6 pb-24 pt-[calc(var(--nav-h)+3rem)] md:px-10"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <HeroCopy />
        <div className="flex justify-center lg:justify-end">
          <HeroObject sectionRef={sectionRef} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
        <span ref={hintRef} className="eyebrow">
          Scroll
        </span>
      </div>
    </section>
  );
}
