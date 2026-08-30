"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioProject } from "./PortfolioCard";

export default function PortfolioModal({
  project,
  onClose,
}: {
  project: PortfolioProject | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-3xl border border-muted-foreground/10 bg-muted p-8"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {project.title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-accent"
              >
                ✕
              </button>
            </div>
            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <div>
                <dt className="text-accent">Problem</dt>
                <dd className="mt-1 text-muted-foreground">{project.problem}</dd>
              </div>
              <div>
                <dt className="text-accent">Solution</dt>
                <dd className="mt-1 text-muted-foreground">{project.solution}</dd>
              </div>
              <div>
                <dt className="text-accent">Stack</dt>
                <dd className="mt-1 text-muted-foreground">
                  {project.stack.join(" · ")}
                </dd>
              </div>
              <div>
                <dt className="text-accent">Result</dt>
                <dd className="mt-1 text-muted-foreground">{project.result}</dd>
              </div>
            </dl>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
