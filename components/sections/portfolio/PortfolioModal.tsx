"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioProject } from "./PortfolioCard";

export default function PortfolioModal({
  project,
  onClose,
}: {
  project: PortfolioProject | null;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose, imageIndex]);

  const handlePrevImage = () => {
    if (!project?.images || project.images.length === 0) return;
    setImageIndex((prev) => (prev === 0 ? project.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!project?.images || project.images.length === 0) return;
    setImageIndex((prev) => (prev === project.images!.length - 1 ? 0 : prev + 1));
  };

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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 md:p-8"
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

            {project.images && project.images.length > 0 && (
              <div className="relative mt-6 flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-lg max-h-64 flex items-center justify-center bg-muted">
                  <img
                    src={project.images[imageIndex]}
                    alt={`${project.title} - image ${imageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                {project.images.length > 1 && (
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                      className="rounded-full border border-[var(--hairline)] px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-accent-bright/50 hover:text-foreground"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {imageIndex + 1} / {project.images.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="rounded-full border border-[var(--hairline)] px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-accent-bright/50 hover:text-foreground"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

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
