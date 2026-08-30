import ExperienceLine from "./experience/ExperienceLine";
import ExperienceItem from "./experience/ExperienceItem";

const EXPERIENCE = [
  {
    period: "2023 — Present",
    role: "Fractional CTO",
    company: "Various early-stage startups",
    description:
      "Own technical strategy across 3 concurrent teams, from architecture decisions to hands-on shipping.",
  },
  {
    period: "2020 — 2023",
    role: "Lead Full-Stack Engineer",
    company: "Growth-stage SaaS",
    description:
      "Scaled the core platform through a 10x user growth period without a rewrite.",
  },
  {
    period: "2017 — 2020",
    role: "Full-Stack Engineer",
    company: "Product studio",
    description:
      "Shipped a dozen client products end-to-end, from discovery to production support.",
  },
];

export default function Experience() {
  return (
    <section id="experience" className="px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 flex flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold text-foreground md:text-5xl">
            Where I&apos;ve been
          </h2>
          <p className="max-w-xl text-muted-foreground">
            A decade of shipping — from scrappy client work to owning
            technical strategy end-to-end.
          </p>
        </div>
        <div className="relative flex flex-col gap-16">
          <ExperienceLine />
          {EXPERIENCE.map((item) => (
            <ExperienceItem key={item.role + item.period} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
