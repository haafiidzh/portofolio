import ServiceIcon from "./ServiceIcon";

type ServiceCardProps = {
  glyph: string;
  title: string;
  bullets: string[];
};

export default function ServiceCard({ glyph, title, bullets }: ServiceCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-muted-foreground/10 bg-muted/40 p-8">
      <ServiceIcon glyph={glyph} />
      <h3 className="font-display text-xl font-semibold text-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="text-accent">–</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
