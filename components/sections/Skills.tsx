import SectionHeader from "@/components/ui/SectionHeader";
import SkillsScene from "./skills/SkillsScene";
import SkillTags from "./skills/SkillTags";

const GROUPS = [
  {
    label: "Frontend",
    items: ["TypeScript", "React", "Next.js", "Vue", "Nuxt", "Tailwind CSS", "anime.js", "Framer Motion", "Three.js"],
  },
  {
    label: "Backend",
    items: ["Laravel","Python","Node.js", "PostgreSQL", "Redis", "Prisma", "GraphQL", "REST"],
  },
  {
    label: "Infrastructure",
    items: ["AWS", "Vercel", "Docker", "GitHub Actions", "Azure"],
  },
  {
    label: "Practice",
    items: ["System design", "Code review", "Consultation"],
  },
];

export default function Skills() {
  return (
    <SkillsScene>
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          index="05"
          eyebrow="Skills"
          title="The stack I reach for."
          lede="Deliberately narrow. I'd rather go deep on tools that stay boring under load than collect logos."
        />

        {/* Track wrapper: gets the pin distance as a trailing spacer in scene mode (globals.css). */}
        <div className="skills-track">
          <div data-scene-pin className="skills-pin flex flex-col">
            {GROUPS.map((group) => (
              <SkillTags key={group.label} label={group.label} items={group.items} />
            ))}
          </div>
        </div>
      </div>
    </SkillsScene>
  );
}
