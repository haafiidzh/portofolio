"use client";

import { motion } from "framer-motion";
import ServiceIcon from "./ServiceIcon";

type ServiceCardProps = {
  glyph: string;
  title: string;
  bullets: string[];
};

export default function ServiceCard({ glyph, title, bullets }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 rounded-3xl border border-muted-foreground/10 bg-muted/40 p-8"
    >
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
    </motion.div>
  );
}
