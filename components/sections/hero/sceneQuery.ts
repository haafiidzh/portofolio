/**
 * Media query under which the Hero exit scene is live (PRD 08 §17.H Q23):
 * motion allowed and tall enough (D/T 600, M 520). Below it the object keeps
 * its static (p = 0) state.
 */
export const HERO_SCENE_MQ =
  "(prefers-reduced-motion: no-preference) and (min-width: 768px) and (min-height: 600px), " +
  "(prefers-reduced-motion: no-preference) and (max-width: 767px) and (min-height: 520px)";
