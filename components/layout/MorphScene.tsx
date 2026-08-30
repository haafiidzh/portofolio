"use client";

import dynamic from "next/dynamic";
import { useMediaQuery, useReducedMotion } from "@/components/sections/hero/useMediaQuery";

const MorphCanvas = dynamic(() => import("./morph/MorphCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function MorphScene() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-40" aria-hidden>
      {isDesktop && !reducedMotion ? (
        <MorphCanvas />
      ) : (
        <div
          className="morph-fallback-blob absolute inset-0"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      )}
    </div>
  );
}
