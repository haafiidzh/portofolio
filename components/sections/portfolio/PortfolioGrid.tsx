"use client";

import { useState } from "react";
import PortfolioCard, { type PortfolioProject } from "./PortfolioCard";
import PortfolioModal from "./PortfolioModal";
import Reveal from "@/components/ui/Reveal";

export default function PortfolioGrid({
  projects,
}: {
  projects: PortfolioProject[];
}) {
  const [active, setActive] = useState<PortfolioProject | null>(null);

  return (
    <>
      {/* Each card carries data-reveal, so <Reveal> staggers them on enter. */}
      <Reveal
        staggerMs={120}
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <PortfolioCard
            key={project.slug}
            project={project}
            onOpen={setActive}
          />
        ))}
      </Reveal>
      <PortfolioModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
