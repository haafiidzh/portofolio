"use client";

import { animate } from "animejs";
import { useRef } from "react";
import { SCRUB_SYNC, useScrollScrub } from "@/components/ui/useScrollScrub";

export type PortfolioProject = {
  slug: string;
  title: string;
  year: string;
  category: string;
  stack: string[];
  impact: string;
  problem: string;
  solution: string;
  result: string;
  images?: string[];
};

export default function PortfolioCard({
  project,
  onOpen,
}: {
  project: PortfolioProject;
  onOpen: (project: PortfolioProject) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Thumbnail parallax (PRD 07 §13.2): card top @ 100% -> card bottom @ 0% of the
  // viewport (the hook's default range), translateY -10 -> +10 px. The 1.1 scale
  // keeps the frame covered; it is only applied while scrubbing (static = 1).
  // Desktop only; the transform is on the img, never on the hovering button.
  useScrollScrub(imgRef, {
    target: frameRef,
    sync: SCRUB_SYNC.water,
    tiers: ["desktop"],
    build: (el, autoplay) =>
      animate(el, {
        translateY: [-10, 10],
        scale: [1.1, 1.1],
        ease: "linear",
        autoplay,
      }),
  });

  return (
    <button
      type="button"
      data-reveal
      onClick={() => onOpen(project)}
      className="card group flex h-full flex-col rounded-2xl overflow-hidden text-left hover:-translate-y-1.5"
    >
      {project.images && project.images.length > 0 && (
        <div ref={frameRef} className="h-48 w-full overflow-hidden">
          <img
            ref={imgRef}
            src={project.images[0]}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col p-7">
        <div className="flex items-baseline justify-between gap-4">
          <span className="eyebrow">{project.category}</span>
          <span className="text-xs text-muted-foreground">{project.year}</span>
        </div>

        <h3 className="display-md mt-8 text-foreground">{project.title}</h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.impact}
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <span className="mt-6 flex items-center gap-2 text-sm text-accent-bright">
          Read case study
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </button>
  );
}
