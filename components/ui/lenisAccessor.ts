import type Lenis from "lenis";

/** Module-level holder so non-React code (modal, scroll hooks) can reach the single Lenis instance. */
let instance: Lenis | null = null;
const listeners = new Set<() => void>();

export function getLenis(): Lenis | null {
  return instance;
}

export function setLenis(next: Lenis | null) {
  if (instance === next) return;
  instance = next;
  for (const l of listeners) l();
}

/** Notifies when Lenis starts or stops existing (hooks rebuild with the right smoothing). */
export function onLenisChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
