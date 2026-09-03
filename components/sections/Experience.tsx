import ExperienceLine from "./experience/ExperienceLine";
import ExperienceItem from "./experience/ExperienceItem";
import SectionHeader from "@/components/ui/SectionHeader";

const EXPERIENCE = [
  {
    period: "2023 — Present",
    role: "AI Full-Stack Engineer",
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
    <section id="experience" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="04"
          eyebrow="Experience"
          title="The shipping journey."
          lede="Where I've worked, what I've built."
        />

        <div className="relative flex flex-col gap-20 pl-8 md:pl-14">
          <ExperienceLine />
          {EXPERIENCE.map((item, index) => (
            <ExperienceItem
              key={item.role + item.period}
              index={index}
              {...item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
