"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function HeroCopy() {
  const root = useRef<HTMLDivElement>(null);

  // Hero is above the fold, so this entrance is time-based (plays on mount);
  // everything below the fold uses the scroll-bound <Reveal /> instead.
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-hero]"));
    for (const t of targets) {
      t.style.opacity = "0";
      t.style.transform = "translateY(28px)";
    }

    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 1100,
      ease: "outExpo",
      delay: stagger(110, { start: 120 }),
    });

    return () => {
      animation.revert();
      for (const t of targets) {
        t.style.opacity = "";
        t.style.transform = "";
      }
    };
  }, []);

  return (
    <div ref={root} className="flex max-w-3xl flex-col items-start">
      <p data-hero className="eyebrow">
        Fractional CTO · Full-Stack Engineer
      </p>

      <h1 data-hero className="display-xl mt-6 text-foreground">
        Calm systems,
        <br />
        <span className="text-accent-bright">sharp execution.</span>
      </h1>

      <p data-hero className="lede mt-8 max-w-xl">
        I help founders ship production-grade products — architecture,
        delivery, and the engineering discipline that keeps them running.
      </p>

      <div data-hero className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href="#projects"
          className="rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground transition-colors duration-300 hover:bg-accent-mid"
        >
          View my work
        </a>
        <a
          href="#contact"
          className="rounded-full border border-[var(--hairline)] px-7 py-3.5 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent-bright/50 hover:text-accent-bright"
        >
          Start a conversation
        </a>
      </div>

      <dl
        data-hero
        className="mt-16 flex flex-wrap gap-x-12 gap-y-6 text-sm"
      >
        {[
          ["8+", "Years shipping"],
          ["30+", "Products delivered"],
          ["3", "Teams led concurrently"],
        ].map(([value, label]) => (
          <div key={label}>
            <dt className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </dt>
            <dd className="mt-1 text-muted-foreground">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
