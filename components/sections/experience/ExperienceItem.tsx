import Reveal from "@/components/ui/Reveal";

type ExperienceItemProps = {
  period: string;
  role: string;
  company: string;
  description: string;
  index: number;
};

export default function ExperienceItem({
  period,
  role,
  company,
  description,
  index,
}: ExperienceItemProps) {
  return (
    <Reveal staggerMs={80} delay={index * 40} className="relative">
      <span
        className="absolute -left-8 top-2 h-2 w-2 rounded-full bg-accent-bright md:-left-14"
        aria-hidden
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_1fr] md:gap-10">
        <p data-reveal className="eyebrow pt-1">
          {period}
        </p>
        <div>
          <h3 data-reveal className="display-md text-foreground">
            {role}
          </h3>
          <p data-reveal className="mt-1 text-sm text-accent-bright">
            {company}
          </p>
          <p
            data-reveal
            className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
