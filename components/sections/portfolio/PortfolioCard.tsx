"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";

export type PortfolioProject = {
  slug: string;
  title: string;
  stack: string[];
  impact: string;
  problem: string;
  solution: string;
  result: string;
  accentGlyph: string;
};

export default function PortfolioCard({
  project,
  onOpen,
}: {
  project: PortfolioProject;
  onOpen: (project: PortfolioProject) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  function handlePointerMove(e: PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(project)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, perspective: 800 }}
      className="group flex flex-col gap-4 rounded-3xl border border-muted-foreground/10 bg-muted/40 p-6 text-left"
    >
      <div className="flex h-36 items-center justify-center rounded-2xl bg-accent/15 text-4xl text-accent">
        {project.accentGlyph}
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">
        {project.title}
      </h3>
      <p className="text-sm text-muted-foreground">{project.impact}</p>
      <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-muted-foreground/20 px-2 py-1"
          >
            {tech}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}
