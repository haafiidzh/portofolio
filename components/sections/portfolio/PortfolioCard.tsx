"use client";

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
  return (
    <button
      type="button"
      data-reveal
      onClick={() => onOpen(project)}
      className="card group flex h-full flex-col rounded-2xl overflow-hidden text-left hover:-translate-y-1.5"
    >
      {project.images && project.images.length > 0 && (
        <img
          src={project.images[0]}
          alt={project.title}
          className="h-48 w-full object-cover"
        />
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
