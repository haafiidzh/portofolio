"use client";

import { motion } from "framer-motion";

export default function ServiceIcon({ glyph }: { glyph: string }) {
  return (
    <motion.div
      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-2xl text-accent"
      style={{ perspective: 400 }}
      whileHover={{ rotateY: 35, rotateX: -10, scale: 1.05 }}
      initial={{ rotateY: -25, opacity: 0 }}
      whileInView={{ rotateY: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-hidden
    >
      {glyph}
    </motion.div>
  );
}
