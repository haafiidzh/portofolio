import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { CTA_PILL_CLASS } from "@/components/ui/ctaPill";

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
      <div className="services-layout mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-16">
        {/* One sticky unit (header + CTA); tier rules live in globals.css. */}
        <div className="services-intro lg:col-span-5">
          <SectionHeader
            index="02"
            eyebrow="Services"
            title="What I take off your plate."
            lede="Four ways to work together. Each one is scoped, priced, and time-boxed before anything starts."
            className="mb-10"
          />

          <Reveal className="mb-16 md:mb-24 lg:mb-0">
            <a href="#contact" data-reveal className={`inline-block ${CTA_PILL_CLASS}`}>
              Let&apos;s talk
            </a>
          </Reveal>
        </div>

        <Reveal staggerMs={110} className="services-stack lg:col-span-7">
          {SERVICES.map((service) => (
            <div
              key={service.no}
              data-reveal
              className="services-card group p-6 md:pb-8 md:pr-8 md:pt-6"
            >
              <div className="flex min-h-[3.75rem] items-center gap-3 md:min-h-0 md:gap-0">
                {/* md+: pulled out into the stack's gutter via margins (in flow, not absolute); see globals.css. */}
                <span className="services-badge inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums text-foreground">
                  {service.no}
                </span>
                <h3 className="display-md text-foreground">{service.title}</h3>
              </div>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
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
          ))}
        </Reveal>
      </div>
    </section>
  );
}
