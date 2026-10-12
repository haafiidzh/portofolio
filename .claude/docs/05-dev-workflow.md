# 05 — Dev Workflow

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint       # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit   # type check (no npm script for it)
```

Reveal-animation audit (needs a running dev server; Playwright + Chromium installed):

```bash
URL=http://localhost:3000 SHOT_DIR=/tmp node scroll-test.mjs
```

The script runs several scroll scenarios (slow scroll, jump to bottom, etc.), counts `[data-reveal]`, `[data-tag]`, `[data-hero]` elements still below 0.99 opacity after entering the viewport, and saves full-page screenshots.

## Code conventions

- 1 section = 1 component in `components/sections/`; sub-components in a same-named lowercase folder.
- Server component by default; `"use client"` only when state/effects/browser APIs are needed.
- 3D components: isolated client components, `next/dynamic` + `ssr:false`, lightweight mobile fallback.
- Entrance animation: use `<Reveal>` + `data-reveal` on children; **do not** use `onScroll()` autoplay for one-shot reveals (rationale in `useRevealOnEnter.ts`).
- Always respect `prefers-reduced-motion`; content must never be hidden because an animation failed.
- Colors only via `globals.css` tokens (`bg-accent`, `text-accent-bright`, `var(--hairline)`); no new hex values.
- Path alias `@/` → repo root.
- Content (copy, project list) is currently constants in section files — edit there.

## Docs & agents layout

```
.claude/
  docs/
    00-index.md                     doc map
    01-vision-and-design-brief.md   original brief (ex-CLAUDE.md)
    02-architecture.md              technical
    03-design-system.md             actual tokens & UI patterns
    04-status-and-backlog.md        gaps + priorities (owned by PM)
    05-dev-workflow.md              this file (ex-README.md + conventions)
  agents/
    pm.md   ui-ux.md   developer.md   qa.md
```

Root `CLAUDE.md` stays (Claude Code reads that file from the root) and imports `01-vision-and-design-brief.md`.

## Four-agent workflow

1. **PM** reads `04-status-and-backlog.md`, picks the next item, writes the brief.
2. **UI/UX** takes the PM's visual brief → design spec (tokens, layout, states, motion).
3. **Developer** takes the PM brief (+ UI/UX spec) → for any creative idea outside the brief, **asks the PM first**; implements only after approval.
4. **QA** reviews the result (visual + function) against the brief's acceptance criteria → PASS / PASS with conditions / FAIL + findings by severity (S0–S3). FAIL goes back to the developer via the PM.
5. PM accepts the result (after QA PASS) and updates `04-status-and-backlog.md`.

## Deploy

Target is Vercel. No `vercel.json`/env yet. Before deploying: the Definition of Done in `04-status-and-backlog.md` + set env vars for the form service (once chosen).
