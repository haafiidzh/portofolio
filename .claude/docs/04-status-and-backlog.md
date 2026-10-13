# 04 — Status, Gaps & Prioritized Backlog

Analyzed 2026-10-12, last PM update 2026-10-12 (HEAD `8317e70`, branch `feature/sda`). Living document: the **PM agent owns it** (`.claude/agents/pm.md`). Update whenever priorities change.

## Position vs original brief

| Brief | Actual | Status |
|---|---|---|
| Positioning: Fractional CTO | Freelance **AI Full-Stack Engineer** (RAG, chatbots, automation) | Positioning pivot — brief not updated (**owner decision open**, P0 #3) |
| Warm/spa mood, `#1C1815` + sage/terracotta | Dark purple `#08060c` + `#4B0082` | Diverged (**owner decision open**, P0 #3) |
| Motion feel: calm, spa-like | **Dramatic, animejs-like** scroll (pins, staged disclosure, Lenis on desktop) | **Owner decision 2026-10-12** (PRD 08 O7): dramatic wins for motion; colors/atmosphere unchanged |
| Separate display font | Inter only | Not done |
| Hero 3D "wow" | Layered 2D SVG; 3D blob written but not mounted | Diverged |
| Services: cards + 3D icons | Stacking Cards (sticky), no icons | Diverged (owner keeps Stacking Cards) |
| Experience timeline (line-draw) | Built, **commented out** in `page.tsx` | Disabled |
| Portfolio hover tilt | Hover `-translate-y`, no tilt | Partial |
| **Testimonials** | None | **Missing** |
| Working contact form | Resend API route, honeypot, validation, error state | **Works — owner-verified (manual test, 2026-10-12)** |
| Lighthouse per section | Perf-only mobile baseline 2026-10-12 (`snapshots/lighthouse-baseline.json`, median 90); no a11y/SEO run, no per-section runs | Partial |
| Assets: 3–5 testimonials, 3–4 case studies | 3 case studies, 0 testimonials | Short |

## Technical findings (verified)

HEAD `8317e70`: `tsc --noEmit` clean. `eslint` **0 errors, 4 warnings** (T6, 2× `<img>` = T5, 1 unused eslint-disable in `useRevealOnEnter.ts`).

| # | Finding | Location |
|---|---|---|
| T1 | ~~`react/no-unescaped-entities` ×5~~ **Resolved** (`2f483a3`) | `About.tsx` |
| T2 | ~~`react-hooks/immutability` (handlers used before declaration)~~ **Resolved** (`fd225b7`) | `PortfolioModal.tsx` |
| T3 | ~~`react-hooks/set-state-in-effect`~~ **Resolved** (`fd225b7`, state derived during render) | `PortfolioModal.tsx` |
| T4 | ~~`exhaustive-deps` on modal keyboard effect~~ **Resolved** (`fd225b7`, memoized handlers) | `PortfolioModal.tsx` |
| T5 | Raw `<img>` ×2 → LCP/bandwidth (lint warnings) | `PortfolioCard.tsx:56`, `PortfolioModal.tsx:89` |
| T6 | Unused `Experience` import (lint warning) | `app/page.tsx:5` |
| T7 | `Profile.JPEG` 2.5 MB, `scale-200` inside `next/image` | `AboutPortrait.tsx` |
| T8 | Mockup PNGs ~870 KB ×2, unoptimized | `public/images` |
| T9 | ~~Favicon was a JPEG~~ **Resolved 2026-10-12**: `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` from `public/images/logo.jpg`. `IMG_9418.JPEG` now unused. | `app/` |
| T10 | Modal class `bg-muted` does not exist in theme | `PortfolioModal.tsx` |
| T11 | Dead code (see 02-architecture) + unused three/R3F/drei deps | — |
| T12 | `scroll-test.mjs` at root; `SECTIONS` includes `experience` which isn't rendered; `SHOT_DIR` defaults to `/tmp` | root |
| T13 | Leftover create-next-app `public/*.svg`; boilerplate `README.md` | — |
| T14 | Portfolio modal has no page scroll lock (wheel over backdrop scrolls the page behind) | `PortfolioModal.tsx` |
| T15 | Unused eslint-disable directive (lint warning) | `useRevealOnEnter.ts:125` |

## Product / content findings

| # | Finding | Risk |
|---|---|---|
| P1 | ~~Fake contact form~~ **Resolved**: form sends via Resend; owner-verified manually 2026-10-12 | — |
| P2 | No social proof (testimonials, client logos) | Low conversion |
| P3 | Claims "3+ Years shipping", "30+ Products delivered" (Hero `dl`): **owner confirmed 2026-10-12 there is no documentation** to back them; only 3 case studies, all "2026" | Credibility |
| P4 | Invoice case study categorized "Health platform" (mismatch) | Sloppy impression |
| P5 | RAG case study uses mockups, not real screenshots; no numbers/demo link | Weak proof |
| P6 | Minimal metadata: no OG image, `robots`, `sitemap`, canonical, JSON-LD | Poor SEO/share preview |
| P7 | No WhatsApp CTA (target market likely Indonesia) | Contact friction |
| P8 | Inconsistent copy tone (lowercase hero, informal 👋 About, formal brief) | Brand voice |
| P9 | Personal email in plaintext in 3 places | Spam (low) |
| P10 | No analytics | Nothing measurable |
| P11 | Nav has no Experience/Testimonials link; section index 04 missing | Minor |

## Prioritized backlog

Scale: **P0** blocks the site's purpose (getting clients) · **P1** required before public promotion · **P2** real improvement · **P3** nice-to-have / safe to defer.

### P0 — do now
1. ~~**Working contact form** (P1)~~ **Done** — implemented 2026-10-12 (`3673554`: Resend API route, honeypot, validation, sending/error states); **owner-verified (manual) 2026-10-12**, not re-tested by agents. Follow-ups split out: production env check → #4a, WhatsApp fallback → #4b, rate limiting → #11a.
2. ~~**Clean lint**~~ **Done** — HEAD `8317e70`: 0 errors (4 warnings: T5 ×2, T6, T15).
3. **Owner decision on positioning & visual direction** — blocks copy/palette/typeface work. Ask: AI Full-Stack Freelancer (actual) or Fractional CTO (brief)? Stay purple or return to warm? *Note: motion feel is decided (dramatic, PRD 08 O7); this item is now only positioning + palette/typeface.*

**Motto marquee (owner request 2026-10-13)** — built: `components/sections/Motto.tsx` between Contact and the footer ("BUILD CALM. SHIP DURABLE.", Inter 800 caps with lilac pearl-jelly gradient fill on a deep-violet band, CSS-only loop). Includes the Watu mascot (non-clickable, on the band top border). Awaiting QA + owner review. The content snapshot baseline needs a refresh because the new section adds text; ask the owner before refreshing (`snapshot:check` is expected to fail until then).

### P1 — before promoting the site
4. Image optimization (T5, T7, T8): `next/image`, resize `Profile` ≤ 200 KB, PNG→WebP. Main LCP lever (LCP 3.56 s).
4a. **Production contact check** — after deploy: `RESEND_API_KEY` set in Vercel env, one live submission received. Owner-side, ~10 min. Not part of PRD 08.
4b. WhatsApp CTA / fallback (P7) — needs owner's WhatsApp number.
5. Social proof (P2): at least 3 real testimonials — **needed from owner**; if none yet, strengthen case studies instead.
6. Fix case studies (P4, P5): category, concrete metrics, demo/GitHub links, real screenshots — **assets needed from owner**.
7. Metadata & SEO (P6): OG image, `sitemap.ts`, `robots.ts`, canonical, JSON-LD `Person`.
8. **Hero stats "3+ Years" / "30+ Products" (P3)** — owner has no documentation (2026-10-12). Options for the owner: (a) provide proof (dated projects, client list, GitHub/portfolio count), (b) replace with verifiable facts (e.g. number of case studies shown, years since first shipped project with a date), (c) remove the `dl`. **Needs owner choice + exact wording.** Content change → own commit + new content baseline (`content-baseline-v3`). Until then PRD 08 forbids any motion/emphasis on these stats.
9. Run Lighthouse mobile + a11y (muted-text contrast); record scores here. — *Partial: performance baseline recorded (perf 90 median, LCP 3564 ms, CLS 0, TBT 91 ms, localhost). Still to do: accessibility/SEO/best-practices, re-run after 4 and 7.*

### P2 — improvements
10. Copy & voice consistency (P8); separate display typeface if the visual direction is approved.
11. Lightweight analytics (Vercel Analytics / Plausible) (P10) — recommended before PRD 08 Phase 6 so the scroll work can be evaluated.
11a. Rate limiting on the contact API route.
12. Remove or enable dead code (T11) — decide: show Experience or delete it; mount the 3D blob or drop the dependencies.
13. Testimonials section (once assets exist).
14. Move `scroll-test.mjs` to `scripts/`, expose as npm script `test:reveal`.
14a. **Scroll-driven animation, PRD [07](07-prd-scroll-driven-animation.md) (content-freeze)** — **Closed / superseded by 08.** Built and committed: Phase 0 (`00b398c`, tag `content-baseline-v1`), Phase 1 `useScrollScrub` (`66a99a3`), Phase 2 hint fade (`f3f461b`) + Nav indicator (`f8f914d`), 3b Stacking Cards + E2 CTA (`3498dd6`), Skills hairline (`02d5fa7`), Portfolio thumbnail parallax (`71fdf43`), baseline refresh (`8317e70`), tag **`content-baseline-v2` on `8317e70`** (created with owner approval). Stacking Cards shipped as built (steps 96/80 px, equal card height); owner keeps it as-is, which settles 07 §4.2 D1–D5. Owner verdict: only Stacking Cards is felt → PRD 08.
14b. **Dramatic scroll experience, PRD [08](08-prd-dramatic-scroll-experience.md) v0.2** — owner decisions O1–O8 recorded; UI/UX spec §17 with PM rulings §16. Brief: [09](09-brief-scroll-phase-0-1.md). Phases (one PR each):

| Phase | Content | Status |
|---|---|---|
| 0a | Audit tooling (`--nojs`, `scene-audit.mjs`, scoped `scroll-test.mjs`) | **Done** (`950420d`, `8552327`, `001242b`) |
| 0b | Foundation: motion gate, `useScrollScene`, **Lenis 1.3.26** (desktop pointer-fine, lazy, off for RM/touch/no-JS), smoothing rule, modal integration, LCP element | **Done** (`fa949a8`, `f551bfc`, `5fcb241`; QA fixes `3879ddb`, `3fde07f`) · owner scroll feel OK · QA 2026-10-13: PASS with conditions (see 14d) |
| 1 | About pilot | **Done** (`f28bb25`; bio start dimmer `199eb94`) · owner checkpoint answered Yes |
| 2 | Skills scene | **Built** (`d691397`) · QA PASS with conditions (see 14f); Q1-Q3 fixed and verified by QA · awaiting owner checkpoint |
| 3 | Portfolio option C | **Built** (`ba0b6fa`) + ambient float / hover focus (`4e176fb`, owner-approved 2026-10-13, scale 1.06) · QA PASS with conditions (see 14f) · awaiting owner checkpoint |
| 4 | Handoffs | Dropped (PD6) |
| 5 | Hero exit + relay | **Built** (uncommitted) · HeroObject observers 6 -> 1 (`Hero.tsx` timeline); uses `data-hero-scene`, not `data-scene`, so the Hero stays outside M4/M5'(c); audited only via M8/M9 + manual · QA owed |
| 5b | Motto marquee (between Contact and footer; Inter 800 lilac pearl jelly text on deep violet band) + Watu mascot (original river-pebble character, not clickable, ambient) | **Built** (uncommitted) · QA owed |
| 6 | Contact `h2` fill + tuning + tokens to 03 | Pending · owner final approval |

14c. **Lenis smooth scroll** (owner decision PRD 08 O5) — delivered inside 08 Phase 0b; spec 08 §7.3. Reverses the 07 non-goal. Tracked here so its risks (anchors, find-in-page, modal, bundle) stay visible.

14d. **Phase 0b QA follow-ups (2026-10-13)** — fixed: QA-0b-1 anchor `scrollTo` numeric target, QA-0b-2 `scrollbar-gutter: stable` while Lenis stopped (real-modal re-check pending), QA-0b-5 `performance.now` in audit. Accepted: Lighthouse 89 / LCP 3561 ms (noise; baseline re-measured on the same machine was worse: 88 / 3647 ms; LCP element is Hero `h1`). **Open P2: `scroll-test.mjs` `services-stack-1366` / `-1857` fail ("badge 2/3 covered")** — pre-existing (also fails at `8552327`); decide whether the test or the Services stack CSS is wrong.
14e. **Content: proof for "3+ Years" / "30+ Products"** — owner has none (PRD 08 O4); no counters until supplied. Replace or substantiate the copy.
14f. **Phase 2/3 QA follow-ups (2026-10-13)** — **P1 Q1:** after a height-changing resize (mobile address bar), final Portfolio cards (and About FACTS) fall back to opacity 0 until the next scroll; root in `useScrollScene.ts` rebuild path (seek to current scroll after rebuild; add a height-resize case to `scene-audit`/`scroll-test`); block public release. **P2 Q2:** Portfolio has no height guard (D/T 600, M 520), copy `ABOUT_SCENE_MQ`. **P2 Q3:** About fps probe dispatches a global `resize`, rebuilding every scene; rebuild only About. **P2 F1:** `scroll-test` `desktop-hash-skills` fails (Nav landing shows empty tag rows; scope stuck-check away from `[data-scene]` or start K1 earlier). **P2 F2:** pending bio contrast 1.57:1 (<4.5:1, owner tweak) — acknowledge in 08 §3.1 or lighten. P3: easing `out(3)` on travel <20 vh (Q4); Skills K4 shifted 4 vh (F3); resize mid tag-stagger (F5); reduced-motion toggle mid-page jumps scroll (F6). **Update: Q1, Q2, Q3 fixed (dev, pending QA re-verify).** **Update: N1 (rebuild flash) fixed - sync seek inside rebuild + height-only resizes <120px skipped (dev).**

### P3 — can be deferred
14g. **Session handoff (2026-10-13)** —
- **N1 (rebuild flash) fixed in `useScrollScene.ts`** (uncommitted): `sync()` now binds `observer.target`, calls `refresh()` and seeks the linked timeline synchronously right after `build()` (rAF settle kept as safety net); height-only resizes <120px with unchanged width (vs. last build) no longer rebuild. Verified: lint 0 errors, tsc clean, build OK; `scene-audit --only=resize` at 375x812 + 1280x800, 2 runs: only S1 (Footer logo baseline drift, expected) fails, no R1 violation; flash probe: minOpacity 1.000, dipFrames 0, translateDeltaFrames 0 for about/portfolio/skills at both viewports (before: 1 frame at 0.000). Unverified: before/after numbers re-measured by me (before taken from QA), real-device address-bar flicker, paint flashing, Safari/Firefox, whether skipped small-height resizes leave stage px offsets slightly stale (R1 only exercises -72/+88 at ~19px-scale tolerance; passes).
- **Open items:** N2 P2 (768x1024, Tab on a Portfolio card, bottom edge past viewport; likely ambient float/hover raise; pre-existing). N3: snapshot baseline refresh pending owner OK (Footer logo + Motto change content; `npm run snapshot` not run). QA owed for Phase 5 + Motto + Watu (full audit, scroll-test, Lighthouse on a quiet host; TBT unreliable earlier). Watu JS 2.7KB gz vs 1.5KB target (maybe move SVG to a server component). Unverified: Watu hover/pointer reaction, paint flashing, Safari/Firefox, forced-colors, real-device address-bar flicker.
- **Owner checkpoints open:** Phase 2/3 "felt?", Phase 6 final. **Accepted by owner:** `desktop-hash-skills` failure, pending-bio contrast 1.57:1, `services-stack-1366/-1857` old failures.
- **Next:** Phase 6 (Contact `h2` fill + tuning + tokens to 03); backlog P1 image optimization (Profile.JPEG 2.5MB, LCP 3.5s), analytics.
15. 3D icons in Services, hover tilt in Portfolio (per animation budget).
16. CMS (Sanity/Notion) for portfolio.
17. i18n (ID/EN).
18. Blog / writing section.
19. Portfolio modal page scroll lock in native (non-Lenis) mode (T14).
20. PRD 08 proposal P2: Portfolio "B" pinned spotlight for `min-height: 760px` — revisit only if the owner says Portfolio is not felt at the Phase 3 checkpoint.

## Owner checkpoints log (PRD 08)

| Checkpoint | Question | Answer |
|---|---|---|
| 0b (light) | Does the scroll (Lenis) feel right? | Yes — owner, 2026-10-13 ("sudah oke") |
| 1 | Does the About scene feel like animejs? | Yes — owner, 2026-10-13 ("sudah oke"); tweak: bio start should be dimmer; iris end at ~39% and no `round` accepted |
| 3 | Is Portfolio felt? (decides P3 #20) | — |
| 6 | Final approval | — |

## Dependencies between items

- Item 3 (positioning/palette) precedes 10, 12, 15 and any palette/copy brief. PRD 08 is palette-independent and not blocked by it.
- Item 8 needs the owner's choice; it is independent of PRD 08 (08 never touches the stats).
- Items 4b, 5, 6 depend on owner assets (WhatsApp number, testimonials, screenshots, numbers).
- Item 9 runs **after** 4 and 7.
- 14b phases are sequential; P1 items (4, 7) may be interleaved between 08 phases by the developer.

## Definition of Done (every ticket)

`npm run lint` 0 errors · `npx tsc --noEmit` clean · `npm run build` succeeds · manual check at 375px & 1280px · `prefers-reduced-motion` still shows all content · if animation was touched, `node scroll-test.mjs` reports no stuck elements. PRD 08 tickets additionally follow 08 §18.
