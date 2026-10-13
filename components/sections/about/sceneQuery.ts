/**
 * Media query under which the About scene is live (PRD 08 §17.C, Q23 guards):
 * motion allowed, and the viewport tall enough for the pinned header to fit.
 * Shared by the scene hook (JS) and by Reveal's skip (so the scene replaces
 * the one-shot reveal only when it is actually running).
 */
export const ABOUT_SCENE_MQ =
  "(prefers-reduced-motion: no-preference) and (min-width: 768px) and (min-height: 600px), " +
  "(prefers-reduced-motion: no-preference) and (max-width: 767px) and (min-height: 520px)";
