import Reveal from "./Reveal";

export default function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <Reveal className="mb-16 md:mb-24">
      <div data-reveal className="flex items-center gap-4">
        <span className="text-xs font-medium text-accent-bright">{index}</span>
        <span className="h-px w-10 bg-[var(--hairline)]" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 data-reveal className="display-lg mt-6 max-w-3xl text-foreground">
        {title}
      </h2>
      {lede && (
        <p data-reveal className="lede mt-6 max-w-2xl">
          {lede}
        </p>
      )}
    </Reveal>
  );
}
