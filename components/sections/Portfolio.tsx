import PortfolioGrid from "./portfolio/PortfolioGrid";
import type { PortfolioProject } from "./portfolio/PortfolioCard";
import SectionHeader from "@/components/ui/SectionHeader";

const PROJECTS: PortfolioProject[] = [
  {
    slug: "orderflow",
    title: "OrderFlow",
    year: "2025",
    category: "Logistics SaaS",
    stack: ["Next.js", "Postgres", "Stripe"],
    impact: "Cut order processing time by 60%.",
    problem:
      "Manual order reconciliation across 3 disconnected spreadsheets caused daily fulfillment delays.",
    solution:
      "Built a unified order pipeline with real-time sync and automated exception handling.",
    result: "Fulfillment delays dropped from days to under an hour.",
  },
  {
    slug: "healthping",
    title: "HealthPing",
    year: "2024",
    category: "Health platform",
    stack: ["React Native", "Node.js", "Redis"],
    impact: "200 → 12,000 daily active patients in 6 months.",
    problem:
      "Clinic no-show rate was above 30% with no automated reminder system.",
    solution:
      "Shipped a cross-platform reminder app with push notifications and smart scheduling.",
    result: "No-show rate fell to 9%, freeing up clinician capacity.",
  },
  {
    slug: "ledgerly",
    title: "Ledgerly",
    year: "2023",
    category: "Fintech",
    stack: ["Next.js", "tRPC", "AWS"],
    impact: "Legacy accounting migration with zero downtime.",
    problem:
      "A decade-old monolith blocked the finance team from shipping new reporting features.",
    solution:
      "Led an incremental strangler-fig migration to a modern typed stack.",
    result: "New reports now ship in days instead of quarters.",
  },
];

export default function Portfolio() {
  return (
    <section id="projects" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="03"
          eyebrow="Projects"
          title="Selected work."
          lede="Open any case study for the full problem → solution → result breakdown."
        />
        <PortfolioGrid projects={PROJECTS} />
      </div>
    </section>
  );
}
