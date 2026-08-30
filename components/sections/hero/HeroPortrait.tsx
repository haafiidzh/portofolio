"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function HeroPortrait() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      className="relative mx-auto flex w-[280px] items-center justify-center md:w-[380px]"
    >
      <div
        className="absolute inset-0 -z-10 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 55%, transparent), transparent 75%)",
        }}
        aria-hidden
      />
      <svg
        viewBox="0 0 380 460"
        role="img"
        aria-label="Stickman portrait"
        className="h-auto w-full drop-shadow-2xl"
      >
        <circle cx="190" cy="96" r="58" fill="none" stroke="var(--accent)" strokeWidth="10" />
        <line x1="190" y1="154" x2="190" y2="300" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" />
        <motion.line
          x1="190"
          y1="190"
          x2="90"
          y2="260"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          animate={reduceMotion ? undefined : { rotate: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "190px 190px" }}
        />
        <motion.line
          x1="190"
          y1="190"
          x2="290"
          y2="260"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          animate={reduceMotion ? undefined : { rotate: [0, 6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          style={{ transformOrigin: "190px 190px" }}
        />
        <line x1="190" y1="300" x2="120" y2="420" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" />
        <line x1="190" y1="300" x2="260" y2="420" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
