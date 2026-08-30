type ExperienceItemProps = {
  period: string;
  role: string;
  company: string;
  description: string;
};

export default function ExperienceItem({
  period,
  role,
  company,
  description,
}: ExperienceItemProps) {
  return (
    <div className="relative pl-10">
      <span className="absolute left-[-5px] top-1.5 h-3 w-3 rounded-full bg-accent" />
      <p className="text-sm uppercase tracking-wide text-muted-foreground">
        {period}
      </p>
      <h3 className="font-display text-xl font-semibold text-foreground">
        {role} · {company}
      </h3>
      <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
    </div>
  );
}
