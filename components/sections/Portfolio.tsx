import PortfolioGrid from "./portfolio/PortfolioGrid";
import type { PortfolioProject } from "./portfolio/PortfolioCard";

const PROJECTS: PortfolioProject[] = [
  {
    slug: "orderflow",
    title: "OrderFlow",
    accentGlyph: "◎",
    stack: ["Next.js", "Postgres", "Stripe"],
    impact: "Cut order processing time by 60% for a logistics SaaS.",
    problem:
      "Manual order reconciliation across 3 disconnected spreadsheets caused daily fulfillment delays.",
    solution:
      "Built a unified order pipeline with real-time sync and automated exception handling.",
    result: "Fulfillment delays dropped from days to under an hour.",
  },
  {
    slug: "healthping",
    title: "HealthPing",
    accentGlyph: "◐",
    stack: ["React Native", "Node.js", "Redis"],
    impact: "Grew daily active patients from 200 to 12,000 in 6 months.",
    problem:
      "Clinic no-show rate was above 30% with no automated reminder system.",
    solution:
      "Shipped a cross-platform reminder app with push notifications and smart scheduling.",
    result: "No-show rate fell to 9%, freeing up clinician capacity.",
  },
  {
    slug: "ledgerly",
    title: "Ledgerly",
    accentGlyph: "◫",
    stack: ["Next.js", "tRPC", "AWS"],
    impact: "Migrated legacy accounting system with zero downtime.",
    problem:
      "A decade-old monolith blocked the finance team from shipping new reporting features.",
    solution:
      "Led an incremental strangler-fig migration to a modern typed stack.",
    result: "New reports now ship in days instead of quarters.",
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-5xl">
            Selected work
          </h2>
          <p className="max-w-xl text-muted-foreground">
            A few case studies — click any card for the full problem →
            solution → result breakdown.
          </p>
        </div>
        <PortfolioGrid projects={PROJECTS} />
      </div>
    </section>
  );
}
