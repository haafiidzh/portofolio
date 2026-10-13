import Reveal from "./Reveal";

export default function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  className = "mb-16 md:mb-24",
  pin,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lede?: string;
  /** Replaces the default bottom margin (e.g. when the header sits in a sticky column). */
  className?: string;
  /** Scene pin subject: marks the root and lets the scene replace the reveal. */
  pin?: { skipRevealWhen: string };
}) {
  return (
    <Reveal className={className} skipWhen={pin?.skipRevealWhen} scenePin={!!pin}>
      <div data-reveal className="flex items-center gap-4">
        <span className="text-xs font-medium text-accent-bright">{index}</span>
        <span data-scene-rule className="h-px w-10 bg-[var(--hairline)]" />
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
