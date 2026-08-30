"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function HeroCopy() {
  const reduceMotion = useReducedMotion();

  const initial = reduceMotion ? false : { opacity: 0, y: 16 };
  const animate = { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-start gap-6 max-w-2xl"
    >
      <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] text-foreground">
        Calm engineering,
        <br />
        <span className="italic text-accent">sharp execution.</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
        Fractional CTO and full-stack engineer helping founders ship
        production-grade products without the burnout.
      </p>
      <div className="flex flex-wrap gap-4 pt-2">
        <a
          href="#portfolio"
          className="rounded-full bg-accent text-accent-foreground px-6 py-3 font-medium hover:opacity-90 transition-opacity"
        >
          View My Work
        </a>
        <a
          href="#contact"
          className="rounded-full border border-muted-foreground/30 px-6 py-3 font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
        >
          Contact
        </a>
      </div>
    </motion.div>
  );
}
