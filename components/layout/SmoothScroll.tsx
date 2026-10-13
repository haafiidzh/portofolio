"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { setLenis } from "@/components/ui/lenisAccessor";

declare global {
  interface Window {
    /** Test-only: scene-audit sets this to compare against native scroll. */
    __DISABLE_SMOOTH_SCROLL__?: boolean;
  }
}

const QUERIES = [
  "(prefers-reduced-motion: no-preference)",
  "(pointer: fine) and (hover: hover)",
  "(min-width: 1024px)",
];

/**
 * Lenis smooth wheel scrolling, desktop pointer-fine only. Never created under
 * reduced motion; created/destroyed as the media conditions change. The chunk
 * is loaded after `load` + idle so it stays out of the initial JS.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.__DISABLE_SMOOTH_SCROLL__) return;

    const mqls = QUERIES.map((q) => window.matchMedia(q));
    let lenis: Lenis | null = null;
    let disposed = false;
    let ready = false;
    let loading = false;

    const eligible = () => mqls.every((m) => m.matches);

    const onAnchorClick = (e: MouseEvent) => {
      // detail === 0 is a keyboard-activated click: leave it native.
      if (!lenis || e.detail === 0 || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      if (!url.hash || url.hash === "#") return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      // Numeric target: an element target reads Lenis' possibly stale animatedScroll when a native
      // scroll landed in the same frame. Numeric scrollTo applies no offset, so subtract padding here.
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - pad;
      // Fixed duration (not lerp): long jumps must still land within ~1 s (M8).
      lenis.scrollTo(top, { duration: 0.9 });
      history.pushState(null, "", url.hash);
    };

    const create = async () => {
      if (lenis || loading || !ready) return;
      loading = true;
      const { default: LenisCtor } = await import("lenis");
      loading = false;
      if (disposed || lenis || !eligible()) return;
      lenis = new LenisCtor({
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        lerp: 0.1,
        autoRaf: true,
      });
      document.addEventListener("click", onAnchorClick);
      setLenis(lenis);
    };

    const destroy = () => {
      if (!lenis) return;
      document.removeEventListener("click", onAnchorClick);
      setLenis(null);
      lenis.destroy();
      lenis = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
    };

    const evaluate = () => {
      if (eligible()) void create();
      else destroy();
    };

    for (const m of mqls) m.addEventListener("change", evaluate);

    const start = () => {
      ready = true;
      evaluate();
    };
    let idleId = 0;
    const onLoad = () => {
      idleId = window.setTimeout(() => {
        if (disposed) return;
        if (window.requestIdleCallback) window.requestIdleCallback(start, { timeout: 2000 });
        else start();
      }, 100);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener("load", onLoad);
      window.clearTimeout(idleId);
      for (const m of mqls) m.removeEventListener("change", evaluate);
      destroy();
    };
  }, []);

  return null;
}
