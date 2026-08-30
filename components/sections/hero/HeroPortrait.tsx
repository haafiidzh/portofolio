"use client";

import Image from "next/image";
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
      <Image
        src="/images/profile.webp"
        alt="Portrait"
        width={380}
        height={460}
        priority
        sizes="(min-width: 768px) 380px, 280px"
        className="h-auto w-full object-contain drop-shadow-2xl"
      />
    </motion.div>
  );
}
