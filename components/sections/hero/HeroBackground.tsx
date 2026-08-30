"use client";

import dynamic from "next/dynamic";
import HeroFallback from "./HeroFallback";
import { useMediaQuery, useReducedMotion } from "./useMediaQuery";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

export default function HeroBackground() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reducedMotion = useReducedMotion();

  if (isDesktop && !reducedMotion) {
    return <HeroScene />;
  }

  return <HeroFallback />;
}
