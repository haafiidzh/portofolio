"use client";

import { useState } from "react";
import PortfolioCard, { type PortfolioProject } from "./PortfolioCard";
import PortfolioModal from "./PortfolioModal";

export default function PortfolioGrid({
  projects,
}: {
  projects: PortfolioProject[];
}) {
  const [active, setActive] = useState<PortfolioProject | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <PortfolioCard key={project.slug} project={project} onOpen={setActive} />
        ))}
      </div>
      <PortfolioModal project={active} onClose={() => setActive(null)} />
    </>
  );
}
