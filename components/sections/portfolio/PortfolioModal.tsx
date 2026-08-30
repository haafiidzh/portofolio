"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioProject } from "./PortfolioCard";

export default function PortfolioModal({
  project,
  onClose,
}: {
  project: PortfolioProject | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/85 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal
          aria-label={`${project.title} case study`}
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-8 md:p-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <span className="eyebrow">
                  {project.category} · {project.year}
                </span>
                <h3 className="display-md mt-3 text-foreground">
                  {project.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full border border-[var(--hairline)] px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-accent-bright/50 hover:text-foreground"
              >
                Esc
              </button>
            </div>

            <dl className="mt-8 flex flex-col">
              {[
                ["Problem", project.problem],
                ["Solution", project.solution],
                ["Stack", project.stack.join(" · ")],
                ["Result", project.result],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="hairline-t grid grid-cols-1 gap-1 py-4 sm:grid-cols-[110px_1fr] sm:gap-6"
                >
                  <dt className="eyebrow">{label}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
