"use client";

import { useRef } from "react";
import { animate, stagger } from "animejs";
import { useRevealOnEnter } from "@/components/ui/useRevealOnEnter";

/**
 * Skill row with a viewport-triggered stagger.
 *
 * `stagger(55, { from: "first" })` cascades the tags left → right; raise the
 * 55 for a slower ripple. Scale + fade run together for a soft "pop".
 */
export default function SkillTags({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  const row = useRef<HTMLDivElement>(null);

  useRevealOnEnter({
    ref: row,
    selector: "[data-tag]",
    prehide: (el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px) scale(0.94)";
    },
    play: (targets) =>
      animate(targets, {
        opacity: [0, 1],
        translateY: [18, 0],
        scale: [0.94, 1],
        duration: 800,
        ease: "outExpo",
        delay: stagger(55, { from: "first" }),
      }),
    deps: [items],
  });

  return (
    <div
      ref={row}
      className="hairline-t grid grid-cols-1 gap-5 py-8 md:grid-cols-[200px_1fr] md:gap-10"
    >
      <p className="eyebrow pt-1">{label}</p>
      <ul className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <li
            key={item}
            data-tag
            className="rounded-full border border-[var(--hairline)] bg-[var(--surface)]/70 px-4 py-2 text-sm text-foreground transition-colors duration-300 hover:border-accent-bright/40 hover:bg-accent/25"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
