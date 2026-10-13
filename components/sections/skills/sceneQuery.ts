/**
 * Media query under which the Skills scene is live (PRD 08 §17.F, Q23 guards):
 * motion allowed and the viewport tall enough. The pin itself has a stricter
 * CSS guard (min-height 640px, globals.css) plus a JS fit check in the scene.
 * Shared by the scene hook and by SkillTags (which skips its one-shot stagger).
 */
export const SKILLS_SCENE_MQ =
  "(prefers-reduced-motion: no-preference) and (min-width: 768px) and (min-height: 600px), " +
  "(prefers-reduced-motion: no-preference) and (max-width: 767px) and (min-height: 520px)";
