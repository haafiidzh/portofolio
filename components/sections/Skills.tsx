import SectionHeader from "@/components/ui/SectionHeader";
import SkillTags from "./skills/SkillTags";

const GROUPS = [
  {
    label: "Frontend",
    items: ["TypeScript", "React", "Next.js", "Tailwind CSS", "anime.js", "Framer Motion", "Three.js"],
  },
  {
    label: "Backend",
    items: ["Node.js", "tRPC", "PostgreSQL", "Redis", "Prisma", "GraphQL", "REST"],
  },
  {
    label: "Infrastructure",
    items: ["AWS", "Vercel", "Docker", "GitHub Actions", "Terraform", "Grafana"],
  },
  {
    label: "Practice",
    items: ["System design", "Technical hiring", "Code review", "Incident response", "Roadmapping"],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="05"
          eyebrow="Skills"
          title="The stack I reach for."
          lede="Deliberately narrow. I'd rather go deep on tools that stay boring under load than collect logos."
        />

        <div className="flex flex-col">
          {GROUPS.map((group) => (
            <SkillTags key={group.label} label={group.label} items={group.items} />
          ))}
        </div>
      </div>
    </section>
  );
}
