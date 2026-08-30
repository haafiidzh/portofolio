"use client";

import { useRef } from "react";
import HeroCopy from "./hero/HeroCopy";
import HeroObject from "./hero/HeroObject";

export default function Hero() {
  // The section itself is the scroll observer target for HeroObject —
  // progress runs 0 → 1 across this element's travel through the viewport.
  const sectionRef = useRef<HTMLElement>(null);

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
        <span className="eyebrow">Scroll</span>
      </div>
    </section>
  );
}
