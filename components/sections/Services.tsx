import ServiceCard from "./services/ServiceCard";

const SERVICES = [
  {
    glyph: "▲",
    title: "Fractional CTO",
    bullets: [
      "Technical strategy & roadmap ownership",
      "Hiring, mentoring, and team structure",
      "Architecture reviews and risk triage",
    ],
  },
  {
    glyph: "◆",
    title: "Full-Stack Delivery",
    bullets: [
      "Next.js / React product builds",
      "API design and backend systems",
      "Ship-ready code, not prototypes",
    ],
  },
  {
    glyph: "●",
    title: "Infrastructure & DevOps",
    bullets: [
      "CI/CD pipelines and deploy automation",
      "Cloud cost and reliability audits",
      "Monitoring and incident readiness",
    ],
  },
  {
    glyph: "◈",
    title: "Product Discovery",
    bullets: [
      "Technical feasibility scoping",
      "MVP definition and scope cuts",
      "Stakeholder-ready technical docs",
    ],
  },
];

export default function Services() {
  return (
    <section id="services" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-5xl">
            What I bring to the table
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Same structural rigor as a full engineering org, delivered
            fractionally — calm process, sharp output.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
