import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";

const SERVICES = [
  {
    no: "01",
    title: "Audit and Code Review",
    description:
      "Audit and code review for your AI powered SaaS, RAG systems, chatbots, and automations.",
    bullets: ["Architecture audit", "Code review", "Performance tuning", "Security audit"],
  },
  {
    no: "02",
    title: "Full-Stack Delivery",
    description:
      "Product built end-to-end by the person who designed the system. Ship-ready code, not prototypes.",
    bullets: ["Next.js / React product builds", "API and backend systems", "Typed end-to-end", "SaaS", "Chatbots", "E-commerce", "Automations"],
  },
  {
    no: "03",
    title: "Bugfixing and Maintenance",
    description:
      "Bugfixing and maintenance for your production-grade AI powered SaaS, RAG systems, chatbots, and automations.",
    bullets: ["Bugfix", "Maintenance", "Optimization", "Performance tuning"],
  },
  {
    no: "04",
    title: "Product Discovery",
    description:
      "Scope cut down to what is genuinely buildable this quarter, with the trade-offs written down.",
    bullets: ["Technical feasibility scoping", "MVP definition and scope cuts", "Stakeholder-ready docs"],
  },
];

export default function Services() {
  return (
    <section id="services" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="02"
          eyebrow="Services"
          title="What I take off your plate."
          lede="Four ways to work together. Each one is scoped, priced, and time-boxed before anything starts."
        />

        <Reveal staggerMs={110} className="hairline-t">
          {SERVICES.map((service) => (
            <div
              key={service.no}
              data-reveal
              className="group grid grid-cols-1 gap-6 border-b border-[var(--hairline)] py-10 transition-colors duration-500 hover:bg-[var(--surface)]/60 md:grid-cols-[80px_1fr_1fr] md:gap-10 md:px-4"
            >
              <span className="text-sm text-accent-bright">{service.no}</span>
              <h3 className="display-md text-foreground">{service.title}</h3>
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {service.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="rounded-full border border-[var(--hairline)] px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-300 group-hover:border-accent-bright/30 group-hover:text-foreground"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
