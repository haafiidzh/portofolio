# 08 — PRD: Dramatic Scroll Experience

Status: **v0.2 — owner decisions recorded, ready for implementation brief** — 2026-10-12 · Author & owner of this doc: **PM** · UI/UX input: §17 · Implementation brief for Phase 0–1: [09](09-brief-scroll-phase-0-1.md)
Backlog: P2 (scroll animation track, successor of [07](07-prd-scroll-driven-animation.md)). Language: English only.
Supersedes parts of PRD 07 — exact list in §4. Everything in 07 not listed there still applies.

**Single source of truth.** §0–§16 and §18 are binding. §17 is the UI/UX specification of record (stage tables, values, wireframes) **as amended by the PM rulings in §16**; where §17 text and §16 differ, §16 wins and §17 carries an inline `PM ruling` note at the spot.

Changelog
- v0.1 — PM draft. Owner chose **option 2 "dramatic, like animejs.com"** over the calm parallax of PRD 07. Content rule relaxed from *content-freeze* to *content-preserving, flexible* (§3). Services Stacking Cards kept as-is. §17 left for UI/UX.
- v0.2 — UI/UX filled §17. **Owner answered O1–O8** (§15): content principle v2 approved; scroll budget becomes a quality-first guideline; Hero not pinned; Hero stats get no motion and move to a content ticket; **Lenis adopted** (reverses K3 / 07 smooth-scroll non-goal, spec §7.3); contact form owner-verified; **dramatic outranks "calm spa" for motion**; `content-baseline-v2` tag exists. PM ruled on UI/UX conflicts C1–C6, PD1–PD9 and proposals P1–P5 (§16). M4/M5 reworded (C2/C1). Portfolio = option C. Release plan rebuilt around a Lenis foundation phase (§12).

---

## 0. Decisions (TL;DR)

| # | Decision | Status |
|---|---|---|
| K1 | Unit of motion = a **scene**: one scroll-scrubbed timeline per section, split into **stages** that progressively disclose the section's existing content. Max one scene per section. | Final |
| K2 | **Pinning is allowed** via CSS `position: sticky` (content-height sticky preferred, §7.1), JS-gated so no-JS / reduced-motion get zero extra scroll. | Final |
| K3 | **Lenis smooth scroll** on desktop pointer-fine devices only, lazy-initialised after `load`, **off** for reduced-motion, touch and no-JS. Lenis drives native window scroll, so sticky, anime.js `onScroll`, hash links and find-in-page keep working. Spec §7.3. | Final (owner O5) |
| K4 | Content principle v2: **static modes byte-for-byte frozen**; **motion mode** may stage, dim, move and split content, but DOM text, a11y tree, links/controls and media stay identical, and every IU gets a readable hold (§3, M4/M5 as amended). | Final (owner O1) |
| K5 | **Hero is not pinned**; Hero copy and CTAs never move. **Contact gets no pin and no motion on form/info.** Nav "Let's talk" always visible. | Final (owner O3) |
| K6 | **No new 3D/WebGL.** "Dramatic" comes from 2D: pin, typographic staging, SVG, transform/opacity/clip-path. Brief 3D budget unchanged. | Final |
| K7 | **Scroll length = quality-first guideline**, not a hard cap: soft cap 3.0 vh extra at D, 1.0 at T; **hard rule 0 pins at M**; anything above the soft cap needs the quality gate in §8.1. Planned: **D 1.4 vh, T 0.4 vh, M 0**. | Final (owner O2) |
| K8 | **Motion feel: dramatic, animejs-like outranks the brief's "calm spa"** wording. Palette, typography and atmosphere are unchanged by this PRD. | Final (owner O7) |
| K9 | Release order: **0a tooling → 0b foundation (motion gate + scene hook + Lenis) → 1 About pilot + owner checkpoint → 2 Skills → 3 Portfolio (C) → 5 Hero exit → 6 Contact fill + tuning**. Phase 4 (handoffs) dropped. One PR per phase, stoppable after any phase. | Final |

---

## 1. Background & problem

### 1.1 Why PRD 07 is not enough
PRD 07 delivered calm, low-amplitude effects under a strict content-freeze: Services Stacking Cards, Hero "Scroll" hint fade, Nav active indicator, Skills hairline draw, Portfolio thumbnail parallax. The owner's verdict (2026-10-12): **only Stacking Cards is felt; the rest "doesn't register"**. The reasons are structural, not tuning:

1. **Amplitude was capped to be invisible** (24 px parallax, 10 px on thumbnails, one effect per section).
2. **No pinning.** Stacking Cards (native sticky) is the one exception and the one the owner noticed → **holding the frame is what makes scroll feel like it drives something.**
3. **Content-freeze forbade staging**, which is how animejs.com reveals information (statement, then demo, then detail).

### 1.2 What the owner asked for
- Option 2: dramatic, animejs.com-like scroll experience, including smooth scrolling (Lenis).
- Content must not change, but **flexibly**: a section may become an animated scene that shows part of its information first and completes it in later steps, as long as all information remains and nothing is added or lost.
- Keep Services Stacking Cards.
- More scroll length is acceptable **if the quality is good**.

### 1.3 Actual state (verified from source, HEAD `8317e70`, branch `feature/sda`)

| Item | Location | State |
|---|---|---|
| Section order | `app/page.tsx` | Hero, About, Services, Portfolio (`#projects`), Skills, Contact. Experience commented out. |
| Scrub hook | `components/ui/useScrollScrub.ts` | One `onScroll` observer per call; tiers mobile/tablet/desktop; reduced-motion → nothing created; `sync` restricted to `SCRUB_SYNC` {0.25, 0.35, 0.4} or `true`. Built for single animations, not timelines or pin tracks. |
| One-shot reveal | `components/ui/Reveal.tsx`, `useRevealOnEnter.ts` | Prehide in client layout effect (no-JS = visible). Used by `SectionHeader` (shared by every section incl. Services) and most sections. |
| Hero | `sections/Hero.tsx`, `hero/HeroCopy.tsx`, `hero/HeroObject.tsx` | Copy = mount-time stagger. Object = scrubbed layers `sync 0.35`. Hint fade via `useScrollScrub`. Stats `dl` "3+ Years shipping", "30+ Products delivered" — **owner has no documentation for them** (O4) → content ticket in 04, no motion on them here. |
| About | `sections/About.tsx`, `about/AboutPortrait.tsx` | Reveal only. h2 = 8 words. Bio = one `p.lede.text-foreground`. FACTS `dl` rows use `.hairline-t` (border-top). Caption uses `backdrop-blur-md`. |
| Services | `sections/Services.tsx`, `app/globals.css` (`.services-*`) | Stacking Cards shipped (commit `3498dd6`) incl. E2 "Let's talk" CTA. Not re-opened. |
| Portfolio | `sections/Portfolio.tsx`, `portfolio/PortfolioCard.tsx`, `PortfolioGrid.tsx`, `PortfolioModal.tsx` | 3 cards (`button`, hover lift), thumbnail parallax desktop-only (`useScrollScrub`, commit `71fdf43`). Modal = framer-motion, `fixed inset-0`, inner panel `overflow-y-auto`. **No page scroll lock exists today** (verified: no `overflow`/`body` style changes in the modal) — corrects §17 Q15. |
| Skills | `sections/Skills.tsx`, `skills/SkillTags.tsx`, `globals.css` `.skills-row::before` | 4 groups / 25 tags, one-shot stagger per row + CSS `view()` hairline draw (commit `02d5fa7`). |
| Contact | `sections/Contact.tsx`, `contact/ContactForm.tsx`, `ContactInfo.tsx` | Reveal only. Form posts to the Resend route; **owner-verified working (manual test, O6)**. |
| Nav | `layout/Nav.tsx` | IntersectionObserver active indicator at the 40% line. "Let's talk" → `#contact` always visible ≥ md. In-page links: Nav (5 + logo `#hero`), mobile menu, Hero CTAs (`#projects`, `#contact`), Services CTA (`#contact`). |
| Global scroll CSS | `app/globals.css` | `html { scroll-behavior: smooth; scroll-padding-top: var(--nav-h) }` (`--nav-h` 4.5rem); reduced-motion → `scroll-behavior: auto`. `app/layout.tsx`: `html.h-full`, `body.min-h-full`. |
| anime.js | `animejs` **4.5.0** | `onScroll`, `createTimeline`, `stagger`, `svg.createDrawable`, `splitText` (with `accessible`), `engine`. **No pin** in `ScrollObserver`. `ScrollObserver` listens to native `scroll` events and reads `window.scrollY` (verified in `dist/modules/events/scroll.js`) → compatible with Lenis, which scrolls the real window. |
| Lenis | not installed | npm `lenis` **1.3.26** = `latest` (registry checked 2026-10-12; `2.0.0-dev.*` is pre-release, not allowed). `dist/lenis.min.js` ≈ **5.4 KB gzip**. Peer `react >= 17` (only for `lenis/react`, which we do not use). |
| Content snapshot | `scripts/content-snapshot.mjs`, `snapshots/content-baseline.json` | Runs with `reducedMotion: 'reduce'`; C1–C6, C8 + C7 hashes at 375×812 and 1280×800. Cannot see motion-mode states → extended in Phase 0a. |
| Baseline tags | git | `content-baseline-v1` (`00b398c`) and **`content-baseline-v2` (`8317e70`, created 2026-10-12 with owner approval, O8)**. |
| Scroll tests | `scroll-test.mjs` (root) | Stuck-reveal check, reading-zone opacity check, reduced-motion pass, no-JS pass. Reading-zone rule is incompatible with staged disclosure → scoped in Phase 0a. |
| Lint / types | — | HEAD: `eslint` **0 errors, 4 warnings**; `tsc --noEmit` clean (PM run 2026-10-12). |
| Perf baseline | `snapshots/lighthouse-baseline.json` | Mobile median perf 90, **LCP 3564 ms**, CLS 0, TBT 91 ms (range 64–201). |

## 2. Goals & non-goals

**Goals**
1. Scrolling visibly *drives* the page: About, Portfolio and Skills each have one scene the owner judges "felt"; desktop wheel scrolling is smooth (Lenis).
2. All existing information stays present, readable and accessible in every mode (§3), with automated proof.
3. Conversion path never slowed or hidden: Hero CTAs, Nav "Let's talk", every `#contact` link, Contact form.
4. No regression in Lighthouse mobile (perf, LCP, CLS, TBT), reduced-motion, no-JS, keyboard, screen reader, find-in-page.
5. Mobile feels intentional (staged, scrubbed reveals, native scroll), not a stripped copy.

**Non-goals**
- Changing copy, data, images, links, labels, headings, section order. This includes the Hero stats (separate content ticket, 04 #8).
- New 3D/WebGL, video, Lottie, new image assets, mounting `MorphScene`.
- Enabling Experience (backlog #12) or Testimonials (needs owner assets).
- Palette/typeface change (owner P0 #3 still open). Motion specs use tokens, not hex.
- Wheel/touch hijacking **beyond Lenis' wheel smoothing**: no scroll snapping, no `preventDefault` on wheel/touch outside Lenis, no velocity rewriting, no touch smoothing (`syncTouch` stays off), no smooth scroll on mobile.
- Page scroll lock for the Portfolio modal in native mode (logged as backlog P3; only the Lenis interaction is in scope, §7.3).
- Analytics events (backlog #11).

## 3. Content principle v2 — "content-preserving, flexible" (owner-approved, O1)

### 3.1 Definitions
- **Static modes** = `prefers-reduced-motion: reduce`, JavaScript disabled, and any viewport below a scene's tier/height guard. The page renders as a normal document, native scroll.
- **Motion mode** = motion allowed, JS on, viewport inside a scene's tier guard.
- **Scene** = one section's scroll-scrubbed choreography (one timeline), optionally pinned. **Stage** = a scroll range inside the scene in which part of the content enters or completes.
- **Information unit (IU)** = every text node, image, link, control and heading in today's static render. **Leaf IU** = a text block (element whose direct text is the IU), an `img`, or a control's visible text. Audits measure leaf IUs.
- **Readable** = a leaf IU is in the viewport (not under the Nav, not covered at its center point; for an IU taller than 60% of `innerHeight − nav`, "in the viewport" means ≥ 60% of its box visible — **images and controls only**, text blocks must be fully inside), effective opacity ≥ 0.99, not clipped (≥ 95% of its box visible through `clip-path`/mask/overflow), scale 0.95–1.05, rotation ≤ 2°, text contrast ≥ 4.5:1 (≥ 3:1 for `display-*`).
- **Pending** state of an IU during staging: (a) **not yet entered** (opacity 0, off-stage, or masked) or (b) **dimmed but legible** (`--muted-foreground`, ≥ 4.5:1). (b) preferred for text.

### 3.2 Invariants

**Static modes — exact freeze (unchanged from PRD 07)**

| # | Invariant | Rule |
|---|---|---|
| S1 | C1–C6, C8 | Identical to `content-baseline-v2` at 375 and 1280, reduced-motion. `npm run snapshot:check` empty diff. |
| S2 | C7 | Data constants (`SERVICES`, `PROJECTS`, `GROUPS`, `FACTS`, Nav/Contact `LINKS`, `COLUMNS`) hashes unchanged. |
| S3 | No-JS parity | `javaScriptEnabled: false`: C1–C6, C8 identical to S1, **and** `document.scrollHeight` within ±5% of the reduced-motion render. |
| S4 | Static layout | Static-mode layout = today's layout (PD9: no static change anywhere). |

**Motion mode**

| # | Invariant | How it is measured |
|---|---|---|
| M1 | **Same DOM content** | At sampled positions (every 10% of each scene + page top/bottom): text of each `section[id]`, `header`, `footer`, excluding `[aria-hidden="true"]` subtrees, equals S1's C8. Split-text only with an accessible, non-hidden copy of the original string and `aria-hidden` split spans. |
| M2 | **Same a11y tree** | `ariaSnapshot()` per section at the same positions equals S1's C6. Forbidden on IUs at any time: `display:none`, `visibility:hidden`, `inert`, `aria-hidden`, `content-visibility:hidden`, conditional rendering, `hidden`. |
| M3 | **Same links, controls, media** | C2, C3, C4 sets and order equal S1 at all positions; `src`/`alt` unchanged. |
| M4 | **Readable hold** *(amended, C2)* | Sweep each scene in 2.5vh steps. Every **leaf IU** is readable (§3.1, incl. the 60% rule for tall images/controls) for a contiguous run of **≥ 20vh at D**, **≥ 15vh at T**, **≥ 1 sample at M**. |
| M5 | **Completion** *(replaced by M5′, C1)* | (a) Every **pinned** subset completes — all its IUs readable together — and holds ≥ 15% of the scene before the pin releases. (b) Every **flowing** IU reaches its final state no later than when its top reaches 40% of the viewport height (measured from the top) and **never exits, dims or moves again** afterwards (no exit animations in scenes). (c) After the scene's last trigger, every IU and every scene wrapper has its static computed state (opacity 1, identity transform, `clip-path` none/`inset(0)`, static color) — no residual inline styles that differ from static. |
| M6 | **No new facts** | No text, numbers, glyphs, meaningful icons or images added (incl. CSS `content:` non-empty, SVG `<text>`, canvas). Transient numbers (count-ups) forbidden. |
| M7 | **Order** | DOM order unchanged. Visual order may differ transiently during a stage; final stage and static modes: visual order = DOM order. |
| M8 | **Focus & hash** | Tab through the page in motion mode: each focused element readable within 600 ms, never covered, focus ring unclipped. Every in-page link (Nav, mobile menu, Hero CTAs, Services CTA) lands with the target `h2` readable within 1 s — **with Lenis on and off**. |
| M9 | **Conversion zones** | Hero copy + CTAs, `header`, and everything in `#contact` below its `SectionHeader`: whenever visible, opacity 1, unclipped, untransformed except by normal scroll, clickable (center hit-test). The 07 reading-zone rule stays for these zones and any section without a scene. |

### 3.3 Allowed / forbidden (motion mode)
**Allowed**: pin (sticky), transform, opacity, `clip-path`/mask on wrappers, SVG draw on decorative shapes, color fills between existing tokens (word-by-word `--muted-foreground → --foreground`), split-text per word under the M1 pattern, transient visual reorder (M7), presentation-only motion-mode layout that passes M1–M3, non-semantic wrappers, `data-*` attributes (incl. `data-lenis-prevent`), new CSS.
**Forbidden**: anything failing M1–M9; new text/labels/hints/progress counters; `scrambleText` or counters on IUs; hiding IUs from the a11y tree; animating `top/left/width/height/margin/filter/box-shadow/backdrop-filter` per frame; pinning `#contact` or the Hero; any motion, spotlight or emphasis on the Hero stats (O4).

### 3.4 How it is proven (tooling, Phase 0a)
1. **`snapshot:check`** stays the S1/S2 gate, semantics unchanged; never loosened for visual differences.
2. **`--nojs` mode** (same script) for S3.
3. **`scripts/scene-audit.mjs`** for M1–M5′, M8, M9: Playwright, `reducedMotion: 'no-preference'`, viewports 375×812, 768×1024, 1280×800, 1366×768; discovers scenes via `data-scene` (pinned subjects `data-scene-pin`), sweeps them, dumps a per-leaf-IU readable-range table, fails with IU text + scroll range. Runs with Lenis **on** (production config) and once with a test-only switch that disables Lenis; jumps via `window.scrollTo` and waits for settle before sampling. Output attached to every scene PR.
4. **`scroll-test.mjs`**: keep stuck-reveal check; reading-zone check scoped to non-scene sections and M9 zones.
5. Manual: VoiceOver/NVDA pass per scene PR; keyboard pass; Ctrl+F pass.
6. PR description maps staged IUs to stages (from §17 tables) so the reviewer can match it to the audit output.

## 4. Relationship to PRD 07

| PRD 07 item | Status under 08 |
|---|---|
| §2 non-goal "Scroll-jacking / smooth-scroll libraries" | **Superseded**: pinning via CSS sticky allowed (K2); **Lenis allowed** under §7.3 (K3, owner O5). Snapping, touch hijacking and velocity rewriting remain forbidden. |
| §2 non-goal "Visual redesign / no grid change except Services" | Relaxed for motion mode only (§3.3). Static layout unchanged (PD9). |
| §3 content-freeze (C1–C9) | Kept for static modes (S1–S3); superseded for motion mode by M1–M9. |
| §3 R3 "no text splitting that changes the a11y name" | Superseded: split-text allowed under the M1 accessible-copy pattern. |
| §4 "max one scrub effect per section" + reading-zone rule | Superseded by K1 + M4/M5; reading-zone rule kept for M9 zones and sections without a scene. |
| §4 rows Hero / About / Portfolio / Skills / Contact / Nav | Superseded by §6. |
| §4.1–4.3 Services Stacking Cards + E2 CTA | **Kept, unchanged.** |
| §5 budget | Kept, with additions in §8 (clip-path on wrappers, scroll-length guideline, bundle split incl. Lenis chunk). |
| §6 accessibility | Kept and extended (§9). |
| §7 mobile tiers | Superseded by §10. Services tier M stacking kept. |
| §8 engine choice | Kept; extended with scene timelines, sticky track and Lenis (§7). |
| §13.1 Q3 smoothing scale {0.25, 0.35, 0.4} | Kept as the only numeric values (PD5); new rule: `sync: true` while Lenis runs (§7.4). |
| Shipped 07 effects | Hint fade + Nav indicator kept. Skills hairline **absorbed** by the Skills scene in motion mode; Portfolio thumbnail parallax **removed** in motion mode (PD3). Static modes unchanged. |
| 07 §9 Phase 3 (About portrait parallax, never built) | Cancelled, replaced by the About scene. |
| 07 §9 step 0 "tag `content-baseline-v2`" | **Done**: tag on `8317e70` (O8). |

PRD 07 carries a note at its top pointing here; its body is not edited.

## 5. Scene model & global choreography rules

- **One scene per section**, one timeline, one `onScroll` observer.
- **"Pin the statement, flow the details"**: pin only what fits `100svh − nav − 24 px` at the tier guard; long content flows unpinned with scrubbed entrances. If the pinned subject does not fit, that viewport gets the unpinned variant.
- **Stage pacing**: every leaf IU gets its M4 hold; pinned subsets hold completed ≥ 15% of the scene (M5′a).
- **Reversible**: scrubbed, scrolling up rewinds. No one-shot timelines inside scenes. No exit animations (M5′b).
- **Entrances that already exist** (`Reveal`, `SkillTags` stagger) are replaced *inside* a scene by the scene timeline for the same elements — never both on one element.
- **Dramatic, not busy (K8)**: large amplitude is allowed within the §17 Q5 caps, as long as motion is tied to scroll (linear scrub + smoothing) and nothing flashes (§9).
- **Easing**: scrub = `linear`; **one exception**: transform tweens with travel ≥ 20vh use `out(3)` per segment (C6).

## 6. Concept per section (final)

Stage tables, values and wireframes: §17. "Track" = extra scroll from pinning, in vh at the given tier.

| Section | Scene | Track D / T / M | Phase | Spec |
|---|---|---|---|---|
| **Hero** | Exit scene, **no pin**. `HeroObject` lingers, scales and dissolves; dissolve relays into the About index hairline draw. `HeroCopy` (incl. CTAs, stats) never moves. HeroObject observers consolidated into one timeline. | 0 / 0 / 0 | 5 | §17 Q8–Q9 |
| **About (pilot)** | "The statement": `SectionHeader` sticky (content-height), `h2` word fill; portrait iris unmask, caption fade, bio rise+brighten, FACTS line draw + slide, all flowing. | **0.8 / 0.4 / 0** | 1 | §17 Q10–Q12 |
| **Services** | **Unchanged** (Stacking Cards). No handoff. | existing | — | §17 Q13 |
| **Portfolio** | **Option C**: unpinned staged assembly, per-column travel converging into today's grid; thumbnail settle; focused card snaps final via `:focus-within`. Thumbnail parallax removed in motion mode. | **0 / 0 / 0** | 3 | §17 Q14–Q17 |
| **Skills** | "The stack assembles": rows block sticky; group labels **readable from the start** (C3); tags converge into rows group by group; hairline absorbed as stage divider. | **0.6 / 0 / 0** | 2 | §17 Q18–Q19 |
| **Contact** | `h2` word fill only, completes before the form reaches the viewport middle. Form/info/location: existing one-shot Reveal, then still. | 0 / 0 / 0 | 6 | §17 Q20 |
| **Nav** | No change. Verify active indicator during pins. | — | 1 (verify) | §17 Q21 |
| **Footer / Experience** | None / out of scope. | — | — | — |

Planned total extra scroll: **D 1.4 vh, T 0.4 vh, M 0** (soft cap 3.0 / 1.0, §8.1).

## 7. Technical approach

### 7.1 Pin = CSS sticky
anime.js 4.5 has no pin; JS pins are fragile with React. Two allowed patterns:
- **Content-height sticky (preferred, C5)**: the pinned subject itself is `position: sticky; top: <pin-top>`, its track wrapper gets `padding-bottom: <track>` in motion mode. Scroll delta = track exactly.
- **Full-height stage** (`.scene-stage`, `height: 100svh`): allowed only if the measured `scrollHeight` delta still equals the planned track ±24 px.

Common rules:
- **Gating**: tiny inline script in `app/layout.tsx` `<head>` sets `html.motion-ok` before first paint (from `matchMedia`: reduced-motion off); all track paddings, sticky rules and `overflow-x: clip` live under `html.motion-ok` + tier/height media queries. No-JS never gets the class → no dead scroll (S3). Developer may choose another mechanism only if S3 and CLS pass.
- `svh` units for tracks and pin-top (iOS address bar).
- Ancestors of a sticky element: no `overflow` (use `overflow-x: clip`), `transform`, `filter`, `contain`.
- Hash links land at section top = scene progress ≈ 0 (M8).
- The About sticky header must be scoped to About only: `SectionHeader` is shared with Services, whose header must not change (§17 Q13).

### 7.2 Scene engine
- New hook `useScrollScene` next to `useScrollScrub`: one `createTimeline` with `autoplay: onScroll({ target: track, enter, leave, sync })` per scene; same contract as `useScrollScrub` (tier list, reduced-motion → nothing created, `revert()` on unmount/tier change, no layout reads per frame; stage positions computed at build time from measured offsets, rebuilt on resize/tier change).
- Split-text: `splitText` words only, `accessible: true`, word spans `display: inline` (h2 height delta 0), created only in motion mode.
- CSS `animation-timeline` allowed for decoration inside `@supports`, but not on sticky subjects (Skills hairline moves to the timeline in motion mode).
- framer-motion stays modal-only.

### 7.3 Lenis smooth scroll (owner decision O5)

**Why it is safe here**: Lenis 1.x scrolls the real window (`window.scrollTo` per frame), it does not transform a wrapper. Sticky positioning, `IntersectionObserver` (Nav), anime.js `ScrollObserver` (native `scroll` event + `window.scrollY`), keyboard scrolling and find-in-page keep native semantics. It only smooths **wheel** input.

| Topic | Requirement |
|---|---|
| Package | `lenis@1.3.26` exact (`npm i lenis@1.3.26 --save-exact`; latest stable on 2026-10-12, no `2.0.0-dev`). Import from `lenis` (vanilla) — **not** `lenis/react`, no `@studio-freight/*` legacy packages. Copy the rules of `lenis/dist/lenis.css` into `globals.css` (or import it) scoped as shipped (`html.lenis …`). |
| Where | One client component (e.g. `components/layout/SmoothScroll.tsx`) mounted once in `app/layout.tsx`. One instance per page. |
| When it runs | Only if **all** hold: `(prefers-reduced-motion: no-preference)`, `(pointer: fine) and (hover: hover)`, `(min-width: 1024px)`. Re-evaluated on `change` of these media queries → create / `destroy()` at runtime. Touch devices, tablets and phones keep **native** scroll (native touch momentum is already smooth; touch smoothing costs main-thread time and fights iOS). |
| Reduced motion | **Lenis is not instantiated** (do not rely on Lenis' `respectReducedMotion`, which keeps Lenis running with `lerp: 1`). Switching the OS setting while open destroys the instance. |
| No-JS | Nothing happens; native scroll; no CSS from Lenis applies (all rules are under `html.lenis`, which only Lenis adds). |
| Loading (LCP/TBT) | `import('lenis')` dynamically **after `window` `load`** and in `requestIdleCallback` (fallback `setTimeout`). Lenis must not be in the initial route chunk; scrolling before init is native and the handoff is seamless. |
| Options | `smoothWheel: true`, `syncTouch: false`, `anchors: false`, `autoRaf: true` (or driven from anime.js `engine` — developer's choice, documented; requirement: one scroll position per frame, no visible one-frame lag between scroll and scene progress), default `lerp` 0.1 as the starting value; any tuning value goes through UI/UX and is recorded in §17 Q25 tokens. |
| CSS conflict | `html { scroll-behavior: smooth }` must not be active while Lenis runs: add `html.lenis { scroll-behavior: auto }` (Lenis 1.3.26's CSS does not include this rule any more). `html.lenis, html.lenis body { height: auto }` overrides `html.h-full` — developer verifies no layout change (footer position, CLS 0). |
| In-page anchors | Lenis' `anchors` option stays **off**: its 1.3.26 click handler does not call `preventDefault` (verified in source), risking a double navigation. Instead one delegated click handler, active only while Lenis runs, for same-page `a[href^="#"]` with **pointer activation** (`event.detail > 0`): `preventDefault`, `lenis.scrollTo(target)` (Lenis 1.3.26 honours `scroll-padding-top` and `scroll-margin-top`, verified), then `history.pushState` the hash. **Keyboard activation (`detail === 0`) stays native** so the sequential-focus starting point moves to the target. Covers Nav links, logo `#hero`, mobile menu, Hero CTAs, Services "Let's talk". Direct loads with a hash (`/#contact`) are native (Lenis not yet loaded). |
| Keyboard scrolling | Space, Page Up/Down, arrows, Home/End and focus-into-view stay native (Lenis 1.3.26 has no key handling). Lenis must resync from native scroll (no jump-back on the next wheel tick). |
| Find-in-page | Ctrl+F match scrolls natively; next wheel input continues from the new position (no jump-back). Tested in Chromium and Firefox. |
| Portfolio modal | While a case study is open: `lenis.stop()`; on close: `lenis.start()`. The modal's scroll panel (`overflow-y-auto`) gets `data-lenis-prevent` so its own wheel scroll stays native. Opening/closing must not shift page content horizontally (Lenis' stop applies `overflow: clip` to `html`; check classic-scrollbar Windows/Linux). A shared, minimal accessor (module-level instance getter) is allowed; no global event bus. Native-mode (no Lenis) behaviour is unchanged. |
| anime.js sync | See §7.4. Scenes and existing scrubs read native scroll; no Lenis→anime bridge needed. |
| Cleanup | `destroy()` on unmount and on media-query change; removes listeners, classes, rAF. Hot reload in dev must not stack instances. |
| Bundle | Lenis chunk ≤ 7 KB gzip, lazy, reported separately from the 8 KB scene budget (§8). |

### 7.4 Smoothing rule (one smoothing layer)
- **Lenis running** → every scene and every `useScrollScrub` consumer uses `sync: true` (Lenis already supplies the inertia; stacking `sync 0.25–0.4` on top makes motion lag the finger). `ScrollProgress` already uses `true`.
- **Lenis not running** (touch, T, M, or Lenis not yet loaded) → the `SCRUB_SYNC` values from §17 Q6 apply.
- Implemented once in the hooks (they observe whether Lenis runs), not per component. UI/UX may veto per effect at the pilot review; any veto is recorded in §17 Q6.

## 8. Animation budget & performance

- 3D budget (brief 01) unchanged. No new 3D. `MorphScene` stays unmounted.
- "One strong visual per section" = one scene per section (K1). Contact and Footer: no scene beyond the Contact `h2` fill.
- Per-frame properties: `transform`, `opacity`, `clip-path` (wrappers), SVG draw, `color` on ≤ 8 word spans. Never layout properties, `filter`, `box-shadow`, `backdrop-filter`.
- Never move elements under `backdrop-blur` per frame (About caption, Nav).
- Observers ≤ 12 active (today ≈ 9). Each scene adds 1; Phase 3 removes 3 (thumbnail parallax), Phase 5 consolidates HeroObject into 1.
- `will-change` only during the active scene range.

| Metric (Lighthouse mobile, 3-run median, `snapshots/README.md` method) | Gate |
|---|---|
| Performance | ≥ 90 and not below baseline median |
| LCP | ≤ 3564 ms; no new prehide/delay on the LCP element (confirmed in Phase 0b). |
| CLS | ≤ 0.05 and not above baseline (0) |
| TBT | ≤ baseline range max + 50 ms |
| JS in the initial route `/` | ≤ 8 KB gzip total for this PRD (motion gate, scene hook, split-text, scenes) |
| Lenis chunk | ≤ 7 KB gzip, loaded after `load`, never on mobile Lighthouse profile (touch emulation → not instantiated) |
| Scroll smoothness | ≥ 55 fps while scrubbing each scene, DevTools 4× CPU throttle, Lenis on (D) and off (T/M) |
| Scroll length | Planned D 1.4 / T 0.4 / M 0 vh; see §8.1 |

### 8.1 Scroll-length guideline (owner O2: "further is fine if the quality is good")
- **Soft cap**: extra scroll from pins ≤ 3.0 vh at D, ≤ 1.0 vh at T. **Hard rule**: 0 at M (no pins except the shipped Services stacking), Hero and Contact never pinned.
- **Above the soft cap** is allowed only if all of: (1) PM idea gate approves the extra track with the reason; (2) owner checkpoint on a screen recording of the full page at 1× says the quality justifies it; (3) every pinned vh contains active staging or a completed hold ≤ 40% of its pin (no dead hold); (4) the conversion checks below pass.
- **Conversion checks (every phase)**: Nav "Let's talk" and every `#contact` link reach the form in one click with Lenis on and off; the extra scroll *before* `#contact` is reported in the PR; Contact never feels blocked (owner judges at checkpoints).
- Measured as `document.scrollHeight` delta vs the reduced-motion render, per tier.

## 9. Accessibility & reduced motion

- `prefers-reduced-motion: reduce` → no scenes, no pins added by this PRD, no split-text, **no Lenis**; page = static mode (S1). Services D5 unchanged.
- No JS → static mode, native scroll, no extra scroll (S3).
- Screen readers read every IU in DOM order regardless of scroll position (M1/M2).
- Keyboard: M8; keyboard-activated in-page links use native hash navigation (§7.3).
- Find-in-page works with Lenis on and off; a match inside a pending stage is acceptable (scrub reversible), the landing position must not jump back.
- Vestibular: no flashing (> 3/s), no full-screen rotation/zoom of content; content scale 0.95–1.05.
- Contrast: pending "dimmed" text ≥ 4.5:1 (`--muted-foreground` ≈ 6.8:1 on `--background`, §17 Q3); measured over the brightest ambient-glow patch (V1).

## 10. Mobile fallback (progressive enhancement)

| Tier | Width / guard | Scenes | Scroll |
|---|---|---|---|
| D | ≥ 1024 and height ≥ 600 (Skills pin ≥ 640 + JS fit check) | Full scenes, pins per §6 | **Lenis** if pointer-fine + hover |
| T | 768–1023 and height ≥ 600 | About pin 0.4 if it fits; others unpinned | Native |
| M | < 768 and height ≥ 520 | **No pins** (Services stacking excepted). In-flow staged reveals, reduced amplitude; word fill if ≥ 55 fps throttled | Native |
| L | below height guard | Static mode for that scene | Native |
| Low-end | optional `hardwareConcurrency ≤ 4` → one tier down | developer's call, documented in the hook | — |

A D-width touch device (e.g. iPad landscape 1024+) gets D scenes with **native** scroll (Lenis requires pointer-fine + hover).

## 11. Guardrail conflicts (register)

| # | Guardrail | Conflict | Resolution |
|---|---|---|---|
| G1 | Brief: one strong visual per section | Multi-stage scenes | One scene per section; Contact = `h2` fill only; Services keeps stacking. |
| G2 | Brief: 3D only Hero/Services/Portfolio | Drama tempts WebGL | No new 3D (K6). P4 "afterglow" rejected. |
| G3 | Brief: Experience/Testimonials/Contact 2D reveal only | Contact arrival | 2D `h2` fill only; conversion block still. |
| G4 | Brief: mobile lighter fallback, not on/off | Pins on phones | M = unpinned staged reveals, native scroll. |
| G5 | Conversion path | Extra scroll before Contact | Owner O2: quality-first guideline (§8.1); Hero/Contact never pinned; Nav CTA always visible; conversion checks every phase. |
| G6 | Lighthouse mobile; LCP 3.56 s | Scene JS, Lenis, Hero changes | Gates §8; Lenis lazy + desktop-only; Hero last; image optimisation (04 #4) stays the real LCP fix. |
| G7 | `prefers-reduced-motion` | — | Full static mode, Lenis off (§9). |
| G8 | 07 content-freeze | Staged disclosure | Owner O1: v2 (§3). |
| G9 | Unverified "3+ Years" / "30+ Products" | Drama amplifies claims | Owner O4: no documentation → no counters/spotlight/motion on them; content ticket 04 #8 (replace/remove/prove). Not changed by this PRD. |
| G10 | P0 #1 contact form | Effort before P0 closure | Owner O6: form owner-verified (manual). No blocker for this PRD. |
| G11 | Brief "calm spa" vs owner "dramatic" | Motion feel | Owner O7: **dramatic wins for motion**; colors/atmosphere unchanged. Palette/positioning remain open separately (04 P0 #3). |
| G12 | 07 process: `content-baseline-v2` tag | Was missing | Owner O8: tag exists on `8317e70`. Closed. |
| G13 | Brief/07 progressive-enhancement spirit vs smooth-scroll library | Lenis is wheel smoothing | Owner O5: adopted with the §7.3 limits (desktop pointer-fine only, lazy, off for RM/no-JS/touch, native anchors for keyboard). |

## 12. Release phases (final)

Each phase = one PR, mergeable alone; site complete and passing all gates after every phase; stoppable after any phase. Briefs for 0a, 0b, 1: [09](09-brief-scroll-phase-0-1.md).

| Phase | Contents | Exit criteria |
|---|---|---|
| ~~Tag~~ | `content-baseline-v2` on `8317e70` | **Done** (O8). |
| **0a — Tooling** | `snapshot:check --nojs` (S3); `scripts/scene-audit.mjs` (M1–M5′, M8, M9) with a Lenis on/off switch; scope `scroll-test.mjs` reading-zone rule; npm scripts. No app behaviour change. | All checks green on the current site; `snapshot:check` empty. |
| **0b — Foundation** | Motion gate `html.motion-ok`; `useScrollScene` (no scene uses it yet); **Lenis** per §7.3; smoothing rule §7.4 in both hooks; Portfolio modal stop/start + `data-lenis-prevent`; confirm the LCP element. | Gates §8 (LCP/TBT unchanged, Lenis not in initial chunk); M8 with Lenis on/off; Ctrl+F + keyboard checks; **light owner check**: "does the scroll feel right?" (tuning only, not a go/no-go for the PRD). |
| **1 — About (pilot)** | About scene per §17 Q10–Q12, with Lenis active. | DoD §18 + **owner checkpoint**: "does this feel like animejs?" Yes → Phase 2. No → PM re-plans with the knobs, in order: track 0.8 → 1.0 · fill window · Lenis `lerp` · P1 larger type (§16). |
| 2 — Skills | Skills scene; hairline absorbed in motion mode. | DoD; horizontal overflow check. |
| 3 — Portfolio | Option C; thumbnail parallax removed in motion mode; `:focus-within` final state; modal untouched apart from 0b. | DoD + keyboard/focus pass + modal opens from any stage + **owner checkpoint** (P2 "B" upgrade decided here). |
| ~~4 — Handoffs~~ | Dropped (PD6). Hero → About relay ships in Phase 5. | — |
| 5 — Hero exit | HeroObject exit + relay; observers consolidated; copy/CTAs/stats untouched. | DoD + LCP unchanged (3-run median) + M9 hit-test at 1366×768. |
| 6 — Contact fill + tuning | Contact `h2` fill; global tuning 375/768/1280/1366; real devices; design tokens to 03 (P5). | **Owner final approval.** |

## 13. Success metrics

- **Mandatory per PR**: `snapshot:check` empty (S1/S2) · `--nojs` parity (S3) · `scene-audit` 0 violations, Lenis on and off · Lighthouse gates §8 · ≥ 55 fps · scroll length reported (§8.1).
- **Owner perception**: recorded yes/no in 04 after Phase 0b (light), 1, 3 and 6.
- **Conversion path**: every `#contact` link reaches the form in one click at every phase, Lenis on/off and keyboard.
- **Not measurable yet**: CTA clicks / form submits (no analytics, 04 #11). Recommend analytics before Phase 6 so the change can be evaluated.

## 14. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | "Dramatic" becomes busy, hurting trust | One scene per section; §17 Q5 caps are hard; owner checkpoints; UI/UX reviews PR video at 1× and fast flick |
| R2 | Scroll fatigue before proof/contact | §8.1 guideline + conversion checks; Hero/Contact unpinned; Nav CTA always visible |
| R3 | Staged content missed by fast scrollers | M4 hold + M5′; reversible scrub |
| R4 | SR / keyboard users get partial content | M1/M2/M8 automated + manual passes |
| R5 | Mobile jank | M tier unpinned, native scroll, fps gate, no motion under `backdrop-blur` |
| R6 | LCP/TBT regression | Lenis lazy after `load`, desktop-only; Hero last; LCP element untouched; bundle caps |
| R7 | Sticky silently breaks | Ancestor rules §7.1; scene-audit asserts the pinned element's position during the pin |
| R8 | Tween conflicts on one element | Scene replaces `Reveal`/`SkillTags`/thumbnail parallax for its elements; hover never on a scrubbed transform |
| R9 | Hash links land mid-scene | M8 per phase with Lenis on/off |
| R10 | Effort displaces P1 items (images/LCP, SEO, social proof) | PRD stays P2; P1 items not blocked; developer may interleave P1 tickets between phases |
| R11 | Palette later changes | Token-only specs |
| R12 | **Lenis double navigation / wrong offset on anchors** | `anchors: false`; own pointer-only handler; Lenis honours `scroll-padding-top`; M8 audit with Lenis on |
| R13 | **Lenis + `scroll-behavior: smooth` fight** (stutter) | `html.lenis { scroll-behavior: auto }`; test wheel through every scene |
| R14 | **Double smoothing** (Lenis + anime `sync`) feels laggy | §7.4 one smoothing layer; UI/UX review at pilot |
| R15 | **Modal wheel scroll captured / page jumps on open** | `lenis.stop()` + `data-lenis-prevent`; horizontal-shift check on classic scrollbars |
| R16 | **Find-in-page / keyboard jump-back** | Lenis resync check in 0b acceptance |
| R17 | **Lenis CSS (`height: auto`) changes layout** | Applies only under `html.lenis`; CLS 0 and screenshot diff at 1280 in 0b |
| R18 | Lenis future breaking release | Exact pin `1.3.26`; upgrades are separate tickets |

## 15. Owner decisions (resolved 2026-10-12)

| # | Question | Decision |
|---|---|---|
| O1 | Content principle v2 | **Approved** as defined in §3 (M4/M5 later amended by PM for geometry, C1/C2 — spirit unchanged). |
| O2 | Scroll-length budget | **Approved, loosened**: "further is fine if the quality is good" → soft cap + quality gate (§8.1); mobile 0 pins stays hard. |
| O3 | Hero not pinned | **Approved.** |
| O4 | Hero stats "3+ Years" / "30+ Products" | **No documentation exists.** No counters, spotlight or motion on them (§3.3). Content ticket in 04 #8 (replace / remove / provide proof) — owner input needed there. Content unchanged now. |
| O5 | Smooth-scroll library | **Use Lenis.** Spec §7.3; lands in Phase 0b so the pilot is judged with the final scroll feel. |
| O6 | Start while P0 #1 open | Moot: owner tested the contact form manually — **works**. Recorded in 04 as owner-verified (manual). Production env is outside this PRD. |
| O7 | Dramatic vs "calm spa" | **Dramatic wins for motion**; colors/atmosphere unchanged (K8). |
| O8 | Tag `content-baseline-v2` | **Done** — tag on `8317e70` (created with owner approval). |

Still open with the owner (outside this PRD): positioning and palette (04 P0 #3); Hero stats proof or replacement (04 #8).

## 16. PM rulings on UI/UX input (§17)

### 16.1 Conflicts C1–C6 (§17.L)

| # | Ruling | Reason / condition |
|---|---|---|
| C1 M5 unsatisfiable | **Approved with conditions** → M5′ in §3.2 | Geometry proves it (sections > 1 viewport even in static mode). Conditions: threshold in (b) set to **40%** (UI/UX wrote 60%, which its own tables break: portrait ends @ 50%, Portfolio grid @ 40%, Contact `h2` @ 50%); M5′(c) added — after the last trigger no residual inline styles differ from static, checked by `scene-audit`. |
| C2 M4 tall IUs | **Approved with conditions** → M4 + §3.1 | Leaf-IU measurement and the 60% rule apply to **images and controls only**; text blocks must be fully inside the viewport. |
| C3 Skills labels dimmed | **Approved** | Labels already `muted`; dimming further breaks 4.5:1. §6 updated: labels readable from the start. |
| C4 Portfolio B vs fit | **Approved: option C** | B fails the most common laptop heights; C has no focus/M5 risk and 0 track. B → P2 proposal, deferred. |
| C5 content-height sticky | **Approved** | Removes ≈ 290 px dead scroll; §7.1 lists both patterns with a delta check. |
| C6 `out(3)` for travel ≥ 20vh | **Approved** | The only easing exception; everything else linear. |

Factual correction to §17 Q15: the Portfolio modal does **not** lock page scroll today. The `:focus-within` rule still makes a focused card final; behind the modal the scene may keep scrubbing in native mode (covered by the backdrop, harmless). With Lenis, `lenis.stop()` freezes the page while open (§7.3).

### 16.2 PD1–PD9 (final)

| # | Decision |
|---|---|
| PD1 | **About 0.8, Portfolio 0, Skills 0.6** → D 1.4 vh, T 0.4 vh (About only), M 0. Headroom under the soft cap is not pre-allocated. |
| PD2 | **Option C** at all tiers. A rejected. B deferred (P2 below). |
| PD3 | Skills hairline **absorbed** into the scene in motion mode; Portfolio thumbnail parallax **removed** in motion mode. Static modes unchanged. |
| PD4 | Word fill on **About + Contact** `h2` only. |
| PD5 | No new numeric `sync` value; §7.4 rule (`true` while Lenis runs). |
| PD6 | Phase 4 **dropped**; Hero → About relay ships in Phase 5. |
| PD7 | `HeroCopy` static (incl. CTAs and stats); object only. |
| PD8 | Guards: D/T `min-height: 600px`, M `520px`, Skills pin `640px` + JS fit check (`rowsHeight ≤ innerHeight − nav − 48`). |
| PD9 | No static-mode layout change anywhere. |

### 16.3 Idea gate P1–P5 (§17.M)

| # | Proposal | Decision | Reason |
|---|---|---|---|
| P1 | Larger About `h2` in motion mode | **Deferred (reserve knob)** | Not built in Phase 1. Used only if the pilot checkpoint says "not felt", after track and fill-window tuning; must re-pass the fit check and M1 (motion-mode only). |
| P2 | Portfolio B for `min-height: 760px` | **Deferred (P3)** | Second choreography for a minority of viewports; revisit only if the owner says Portfolio is not felt at the Phase 3 checkpoint. Logged in 04. |
| P3 | Section index hairline draw | **Approved with conditions** | The text-free decorative `span.h-px` already exists; ships only inside each scene section's own phase (About in Phase 1 as stage A0), via the scene timeline; **Services' header untouched**; static = fully drawn. |
| P4 | Hero "afterglow" behind the About pin | **Rejected** | Moves the Hero visual outside Hero, adds paint under the pinned statement and breaks "one strong visual per section". |
| P5 | Motion tokens + easing rule into 03-design-system | **Approved with conditions** | UI/UX writes them after the Phase 1 checkpoint passes (values validated in the pilot), including the Lenis `lerp` actually shipped. Docs only. |

## 17. UI/UX input

> Filled by UI/UX (v0.1 input, 2026-10-12). This is the specification of record for stage tables, values and wireframes, **as amended by the PM rulings in §16** (inline `PM ruling` notes below mark every amended spot). Questions Q1–Q25 were the PM's brief to UI/UX; the answers keep their numbers. Values here are UI/UX estimates at 1280×800; the developer confirms them with `getBoundingClientRect()` per phase and reports deviations > 24 px.

**Answers** — Reviewer: UI/UX · 2026-10-12 · v0.1 input · Basis: source at `8317e70` (`components/sections/*`, `SectionHeader.tsx`, `PortfolioCard.tsx`, `SkillTags.tsx`, `HeroObject.tsx`, `Nav.tsx`), `app/globals.css`, 03-design-system, PRD 07 §13. Heights are estimates from the type scale (Inter, current copy) at 1280×800 unless stated; the developer confirms them with `getBoundingClientRect()` in each phase and reports deviations > 24 px. Everything below respects §3 (M1–M9), §5, §8, §9 and the §11 decisions; where I think a PM rule cannot be met as written, it is marked **[UI/UX — conflict]** (§17.L) and *not* silently worked around.

**Short position.** Agree with the direction and the pilot. Two corrections from the geometry: (1) none of About / Portfolio / Skills fits *header + content* inside one 1366×768 viewport, so "pin the statement, flow the details" is the only pattern that works, and M5 needs a reworded rule (C1); (2) Portfolio option B does not fit the common laptop heights, so I recommend **C** as the shipped scene and keep B as a height-gated upgrade behind the idea gate. Result: D track = **1.4 vh** (About 0.8 + Skills 0.6), well under K7, with 1.6 vh headroom. *(PM: approved as PD1; K7 is now a soft cap, §8.1.)*

#### 17.0 Notation (applies to every table)
- `s` = scroll distance in **vh of the current viewport** from the scene's pin start (negative = before the pin). 1 vh = 8 px at 1280×800.
- "A @ B" = edge A of the element meets B % of viewport height (0 % = top). Flow (unpinned) stages are specified by **element triggers** (canonical); the `s` / % values next to them are the 1280×800 reference so PM/dev can sanity-check. The developer converts triggers to timeline positions **at build time** from measured offsets and rebuilds on resize/tier change (hook contract: no layout reads per frame).
- "Pending" = (a) not-entered or (b) dimmed-legible, per §3.1. "RM" = reduced-motion = static mode = today's render.
- Every scene = 1 timeline + 1 `onScroll` observer (§5). `sync` is therefore **one value per scene**.

### 17.A Global

**Q1 — Reference study.** Note: animejs.com's motion cannot be captured by text fetch; mechanics below are named from the site structure plus the `onScroll({ sync: true })` drawable example it publishes, to be eyeballed by the owner on the live site.

| Borrow | animejs.com moment | Mechanic we take | Where here |
|---|---|---|---|
| ✔ 1 | Feature blocks ("Scroll Observer", "SVG toolset", "Runs like clockwork"): a short statement lands first, the demo/detail plays after it, tied to the block entering | **Staged disclosure: statement → detail**, scrubbed | About (h2 → portrait → bio → FACTS) |
| ✔ 2 | SVG line drawing synced to scroll (`svg.createDrawable` + `onScroll({ sync })`) | **Draw**: a line that is "written" by the finger | About FACTS rows, Skills rows (hairline as stage divider) |
| ✔ 3 | Bundle-size breakdown: many small parts resolving into one ordered list | **Assemble**: scattered parts converge into their final grid | Skills tags, Portfolio cards |
| ✘ | Hero canvas with hundreds of independently looping elements | Too busy; competes with Hero CTAs (M9) and LCP | — |
| ✘ | Count-ups / version-number style numeric animation | M6 forbids transient numbers; also amplifies unverified Hero stats (G9) | — |
| ✘ | Draggable/spring toys, autoplaying loops in content areas | Steal attention from the conversion path; not scroll-driven | — |
| ✘ | Text scramble | Forbidden on IUs (§3.3) | — |

**Q2 — Motion language.** Two site-wide signatures, not one per scene:
1. **Fill** — word-by-word color fill on a statement `h2` (About, Contact). Bookends the page: the first and last section headlines "light up" the same way.
2. **Assemble + Draw** — parts converge into their final layout while a hairline draws as the stage divider (About FACTS, Skills, Portfolio cards without the line).
Plus the two existing moments that stay: Hero object scrub (decorative), Services stacking (sticky). **Max distinct mechanics site-wide: 4** (fill, assemble, draw, mask). **Mask is used exactly once** (About portrait) so it stays special.

**Q3 — Word fill spec.**

| Param | Value |
|---|---|
| Pending color | `var(--muted-foreground)` `#9b93a8` → **≈ 6.8:1** on `--background` `#08060c`, ≈ 6.3:1 on the worst ambient-glow patch (est. `#1a0a2e`). Passes 4.5:1 (and 3:1 for `display-*`). Nothing darker is allowed. |
| Filled color | `var(--foreground)` `#f4f1f8` (≈ 18:1) |
| Granularity | **Words** (`splitText({ words: true, accessible: true })`). No chars (too busy, 60+ spans), no lines (re-split on resize). |
| Word span style | Override anime's `display: inline-block` to **`display: inline`** on word spans (only `color` animates, no transform needed) → line breaks identical to static. Developer asserts `h2` height delta = 0 px before/after split (CLS guard). |
| Window per word | D: **12 vh**, start stagger **5.5 vh** (overlapping → a soft wave, never one hard word at a time). T: 8 vh / 3.5 vh. M: 14 % / 9 % of the h2's own range. |
| Direction | DOM order (reading order: left→right, line by line). Reverses on scroll up. |
| Property | `color` only (paint, ≤ 8 spans per h2). No opacity on spans (keeps "readable" = opacity ≥ 0.99 true throughout, so the h2 holds M4 from its first visible frame). |
| RM / no-JS | No split, `h2` stays `text-foreground` (today). |

**Q4 — Easing.** Default stays **`linear` scrub + `sync`** (07 Q9). **One justified exception:** transform tweens with **travel ≥ 20 vh** (Skills tag scatter, Portfolio card rise) use **`out(3)` per tween segment** — with large travel, linear arrival reads as a collision stop at the final slot; `out(3)` lands it. Fills, draws, masks, opacity and small moves stay linear. Time-based motion keeps the signature `cubic-bezier(.16,1,.3,1)` / `outExpo`.

**Q5 — Amplitude caps.**

| Target | Cap |
|---|---|
| Content translate Y | ≤ **40 vh** (pending only; 0 when final) |
| Content translate X | ≤ **16 vw** (pending only); section gets `overflow-x: clip` in motion mode (never `hidden` — sticky) |
| Content scale | **0.95 – 1.05** (§9) |
| Content rotation | pending ≤ **6°**, final 0° (readable needs ≤ 2°, reached before the IU's hold starts) |
| Mask (`clip-path: inset`) | ≤ **15 %** per side, `round 16px` to match `rounded-2xl` |
| Decorative object (HeroObject) | scale ≤ **1.5**, translate ≤ **50 vh**, rotation free (existing), opacity free |

**Q6 — Smoothing.** Keep {0.25, 0.35, 0.4}; **no new value** (PD5 agree). Per scene: About **0.4** (fill must feel attached to the finger), Skills **0.4**, Portfolio **0.25** (heavier cards, "water"), Contact **0.4**, Hero existing **0.35**.
  *PM ruling (§7.4, O5 Lenis):* these values apply when Lenis is **not** running (touch, T, M). While Lenis runs (D, pointer-fine) every scene and scrub uses `sync: true` — one smoothing layer. UI/UX may veto per effect at the pilot review; record vetoes here.

**Q7 — Wireframes.** Inline per scene below (1280×800 and 375×812, incl. final frame).

### 17.B Hero (Phase 5)

**Q8 — Exit choreography.** Hero progress `p` = existing range (hero `top top` → `bottom top`), `sync 0.35`, no pin (K5). Recommend consolidating the 5 HeroObject observers into **1 timeline** (saves 4 observers).

| Stage | p | Element | Properties (D) | Easing | M (375) |
|---|---|---|---|---|---|
| H0 | 0 → 8 % | "Scroll" hint | existing: opacity 1→0, y 0→8 px | linear | same |
| H1 | 0 → 55 % | 4 layers (`ringOuter/ringMid/core/dots`) | existing rotate (140/−110/200/−220°) + scale (1.25/0.86/0.72/1.1) over full p | linear | same |
| H1 | 0 → 55 % | `svg` root | translateY 0 → **+25 vh** (counter-scroll = object lingers), scale 1 → 1.25, opacity 1 | linear | translateY 0 → +6 vh, scale 1 → 1.08 |
| H2 | 55 → 100 % | `svg` root | translateY 25 → **45 vh**, translateX 0 → **−12 vw** (toward page center), scale 1.25 → **1.45**; opacity **1 → 0 over p 50 → 85 %**, 0 after | linear | translateY 6 → 10 vh, no X, scale 1.08 → 1.15; opacity 1 → 0 over p 60 → 90 % |

- **Handoff to About**: no shared element. The object dissolves (p 50→85 %) exactly while the About index row rises; the About index hairline (decorative `span.h-px`) starts drawing as the object reaches 0 → a visual relay "line hands over to line".
- **Overlap check (D, 1280×800):** at p 0.8 the scaled object box ends ≈ 340 px, About `h2` top ≈ 360 px; with opacity already 0 at 0.85 there is no visible overlap with About text. Transformed SVG paints above later non-positioned content, so this opacity timing is load-bearing — developer verifies with a screenshot at p 0.8/0.85/0.9.
- Object wrapper `pointer-events: none` (it can drift over the CTA column at p > 0.55, when CTAs are already above the fold edge at 800 h; M9 hit-test must still pass at 1366×768).

**Q9 — Copy during exit.** **HeroCopy does not move** (PD7 agree): eyebrow, h1, lede, both CTAs, stats `dl` stay opacity 1 / transform 0 for the whole scroll; mount stagger unchanged; no change near the LCP element. Stats are never spotlighted or counted (G9).

Hero wireframe D (p ≈ 0.6):
```
┌──────────────────────────── Nav ───────────────────────────────┐
│ ...lede (scrolling out normally)          ╭───────╮             │
│ (View my work)(Start a conversation)     ╱ object ╲  ← lingers, │
│ 3+ Years   30+ Products                  ╲ ×1.3   ╱    drifts ←,│
│                                           ╰───────╯    fading   │
│  01 ── ABOUT            ← About rises underneath (normal scroll) │
└─────────────────────────────────────────────────────────────────┘
```
Final frame = today's hero at p 0 (nothing staged). IU coverage: eyebrow, h1 (both lines), lede, 2 CTAs, 2×(dt, dd), "Scroll" → all static except hint (existing).

### 17.C About (pilot, Phase 1)

**Geometry (D 1280×800).** SectionHeader (index row + 4-line `display-lg` h2 at 72 px) ≈ **342 px**; grid: portrait 441×551, right column bio ≈ 305 + `mt-12` + FACTS ≈ 258 → ≈ 611 px. Section content ≈ 1050 px → cannot complete in one viewport → **pin the statement only**.

**Q10 — Stages & track.**
Pin mechanics (deviation from the §7.1 diagram, see C5): the **SectionHeader root is the sticky element**, `top: var(--about-pin-top)` = `calc(var(--nav-h) + 12svh)` (D) — *not* a 100svh stage. The track wrapper around it gets `padding-bottom: var(--about-track)` (= 80svh D) in motion mode. Sticky distance = scroll delta = exactly the track (no dead room). The header (342 px) sits at y 168–510 at 800 h → visually centered.

| # | `s` (vh) · % of scene (−40 → 150 = 190 vh) | Elements (IU) | Properties & values | Ease · sync | Pending | Hold / readable |
|---|---|---|---|---|---|---|
| A0 | −40 → −20 · 0–11 % | index hairline `span.h-px` (decorative) | scaleX 0→1, origin left | linear · 0.4 | — | — |
| A0 | −40 → 0 · 0–21 % | `01`, `ABOUT`, `h2` | none (arrive by native scroll; Reveal removed for these in motion mode) | — | h2 = dimmed (muted words) | readable from first full view (muted ≥ 4.5:1) |
| **A1 Fill** | 0 → 50 · 21–47 % · **pinned** | `h2` words 1–8 (Fullstack / AI / Developer / building / RAG, / chatbots, / and / automations.) | word i: `color` muted → foreground over `[5.5i, 5.5i+12]` vh | linear · 0.4 | dimmed | readable throughout |
| **A2 Hold** | 50 → 80 · 47–63 % · **pinned** | `h2` filled | none | — | — | 30 vh full hold (37 % of the pin) |
| A3 Portrait | frame top @ 95 % → @ 50 % (≈ s 61 → 106 · 53–77 %) — starts *under the still-pinned statement* | new non-semantic wrapper **around the `Image` only** (inside the existing frame) | `clip-path: inset(12% 10% 12% 10% round 16px)` → `inset(0 round 16px)`; same wrapper scale 1.05 → 1.00 | linear · 0.4 | not-entered (masked) | — |
| A4 Caption | frame bottom @ 100 % → @ 92 % (≈ s 125 → 133) | caption bar (`Hafidz`, `Semarang, ID`) | opacity 0 → 1 **only**; never moves; its backdrop (the image) is static by then | linear | not-entered | until frame leaves (≈ 80 vh) |
| A5 Bio | `p` top @ 90 % → @ 60 % (≈ s 66 → 96 · 56–71 %) | bio `p.lede` (both paragraphs, one IU) | translateY 64 px → 0; `color` muted → foreground (opacity stays 1) | linear | dimmed | readable throughout (≥ 4.5:1) |
| A6 FACTS | row top @ 92 % → @ 72 %, per row (≈ s 108→128, 119→139, 129→149 · 78–100 %) — stagger comes from layout (~86 px between rows) | `dl` rows: row `::before` accent line; `dt` + `dd` | line: scaleX 0 → 1 (first 60 % of window); `dt`/`dd`: opacity 0 → 1, translateX −24 px → 0 (30 → 100 % of window) | linear · 0.4 | not-entered | until row leaves (≥ 60 vh) |
| End | — | all | nothing exits; every IU stays final once reached | — | — | — |

- Track: **D 0.8** (80svh) · **T 0.4** (pin if guard passes, `--about-pin-top` = nav + 8svh, fill s 0→32 with T window, hold 32→40) · **M 0** (unpinned).
- **Fit check (pinned stage = header only):** 1366×768 (inner ≈ 625–657): top 72 + 79 = 151, header 342 → bottom 493 ✔ (≈ 130 px spare). 1024×768: h2 ≈ 61 px × 4 lines → header ≈ 300 → bottom ≈ 450 ✔. 1280×600 (guard edge): 72 + 72 + 342 = 486 ✔ (`100svh − nav − 24` = 504).
- Hash `#about` lands at section top → header at ≈ 232 px, i.e. `s ≈ −8` (pre-pin), h2 readable (muted) → M8 ✔.
- Static/RM: today's layout; Reveal behaves as today.

About wireframes D (1280×800):
```
F1  s=0  pin starts                    F2  s=25  fill mid
┌──────────── Nav 72 ────────────┐     ┌──────────── Nav ───────────────┐
│                                 │     │                                │
│ 01 ── ABOUT          y≈168      │     │ 01 ── ABOUT                    │
│ Fullstack AI         ░ muted    │     │ Fullstack AI          █ fg     │
│ Developer building   ░          │     │ Developer building    █ (wave) │
│ RAG, chatbots, and   ░          │     │ RAG, chatbots, and    ░        │
│ automations.         ░ y≈510    │     │ automations.          ░        │
│                                 │     │                                │
└─────────────────────────────────┘     └────────────────────────────────┘
F3  s=72  hold; details arrive         F4  s=110  flow
┌─────────────────────────────────┐     ┌────────────────────────────────┐
│ 01 ── ABOUT        (pinned)     │     │ automations.  (header leaving) │
│ Fullstack AI                    │     │ ┌──────────┐   Hey! I'm a full-│
│ Developer building   █ filled   │     │ │ portrait │   stack AI dev…  █│
│ RAG, chatbots, and              │     │ │ unmasked │   …let's cook.    │
│ automations.                    │     │ │          │   ─────── (draw)  │
│ ┌ ─ ─ ─ ─ ┐   Hey! I'm a… ░     │     │ │          │   EXPERTISE  AI…  │
└─│ masked  │───────────────────── ┘     └─┴──────────┴───────────────────┘
F5  s≈150  final (all IUs final; header has scrolled off — see C1)
┌─────────────────────────────────┐
│ ┌──────────┐   …bio (filled)    │
│ │ portrait │   ─────────────    │
│ │          │   EXPERTISE  AI…   │
│ │──────────│   ─────────────    │
│ │Hafidz SMG│   BUILT WITH Lar…  │
│ └──────────┘   ─────────────    │
│                CURRENTLY  Free… │
└─────────────────────────────────┘
```
About M (375×812, unpinned, `sync 0.4`): stack order = DOM order.
```
┌──── Nav ────┐  h2 fill: h2 top @ 85% → @ 35% (word window 14%, stagger 9%)
│01 ── ABOUT  │  portrait: frame top @ 100% → @ 55%, inset(6% 6%)→0, scale 1.03→1
│Fullstack AI │      (fps-gated; fallback = no portrait motion, still image)
│Developer …  │  caption: opacity 0→1, frame bottom @ 100% → @ 94%
│┌──────────┐ │  bio: top @ 95% → @ 65%, translateY 32 px → 0, color muted → fg
││ portrait │ │  FACTS rows: top @ 92% → @ 75%, line draw + dt/dd translateX −12 px
│└──────────┘ │  final = static layout
└─────────────┘
```
IU coverage About: `01` (A0), `About` (A0), `h2` (A0→A1), portrait `img` alt "Portrait" (A3), `Hafidz` + `Semarang, ID` (A4), bio `p` incl. both paragraphs (A5), 3 × `dt` + 3 × `dd` (A6). Nothing added, nothing removed.

**Q11 — Portrait.** Mechanic: **centered iris** — `clip-path: inset(12% 10% 12% 10% round 16px)` → `inset(0 round 16px)` plus scale 1.05 → 1.00 ("settles into the frame"), both on a **new wrapper around the `Image` only** (07 F6 pattern; `Image fill` keeps a positioned parent). The existing frame (border, radius, `overflow-hidden`) and the caption **never move**. Caption is masked out of the sequence: it only fades in (A4) after the image is fully open, so `backdrop-blur-md` composites over a static backdrop (07 V1 / §8 satisfied). The image's existing `scale-200` / `objectPosition` stay untouched (crop unchanged, M3). Static fallback = today's frame. Mobile: same with inset 6 %, fps-gated.

**Q12 — Bio + FACTS.** **Flowing** (they don't fit the pin). Order portrait → bio → FACTS as DOM. Bio uses rise + brighten (readable the whole time, so its hold is its full time in view). FACTS rows draw their accent line first (stage divider), then the label/value slide in; row spacing gives a natural ≈ 11 vh stagger. Holds: bio ≥ 60 vh, each FACTS row ≥ 60 vh at D (row stays until it exits). Accent line = existing Skills value `accent-bright @ 45%` via `::before` (no new DOM; `dl` content model safe — 07 F4).

### 17.D Services

**Q13 — Untouched.** Confirm: **no change** to Stacking Cards, its CSS, its `Reveal`, or its header. No About → Services handoff is needed: About ends on the last FACTS line drawing, then the Services header arrives by plain scroll — the "draw → stack" contrast is the handoff. PD6 = out.

### 17.E Portfolio (Phase 3)

**Geometry.** Card at 1280: 192 thumb + 56 padding + meta 16 + 32 + title (2–3 lines × 43) + impact (3 × 23) + stack + CTA row ≈ **620 px**; at 1024 (3 cols × 301 px) ≈ **700 px**. Header ≈ 176 + 96 margin.

**Q14 — Option. Recommendation: C (unpinned staged assembly) at all tiers — [UI/UX — conflict] with PM lean B (C4).** *PM ruling: C approved (C4/PD2); B deferred (P2).*
- **A** (horizontal track): rejected — card height same problem as B, cards off-screen to the right (M5 exception + keyboard trap risk), and the brief's tilt-on-hover would fight the track.
- **B** (pinned spotlight → grid): the pinned grid needs `nav 72 + 24 + 620 + 24 ≈ 740 px` (≈ 820 at 1024 wide). It fails at **1366×768, 1280×800 real inner (~700), 1536×864 real inner (~730), 1024×768** — i.e. most laptops would get the fallback anyway, and we would maintain two choreographies. Keep B as a **gated upgrade** (idea gate P2) for `min-height: 760px` only, after the Phase 3 owner checkpoint.
- **C** (recommended): 0 track, ends in the existing grid, no focus problem, works on every viewport. Drama comes from **different travel per column** (parallax depth converging into a flat row) + thumbnail settle.

Portfolio C stage table (D, `sync 0.25`, observer target = grid; header keeps its existing Reveal, untouched):

| # | Trigger (grid top) · ref `s` | Element | Properties | Ease | Pending |
|---|---|---|---|---|---|
| P1 | @ 100 % → @ 40 % (60 vh of scroll) | card wrapper 1 (new non-semantic `div` around each `button`; never the button — hover lift stays on the button) | translateY **14 vh** → 0; opacity 0 → 1 over first 35 % | transform `out(3)`, opacity linear | not-entered |
| P1 | same | card wrapper 2 | translateY **26 vh** → 0; opacity 0 → 1 over 10 → 45 % | same | not-entered |
| P1 | same | card wrapper 3 | translateY **38 vh** → 0; opacity 0 → 1 over 20 → 55 % | same | not-entered |
| P1 | same | thumbnail `img` (all cards) | scale 1.05 → 1.00 | linear | — |
| End | grid top @ 40 % | all | final grid; nothing exits | — | — |

- T (2 cols): card 1 / 2 / 3 travel 12 / 24 / 12 vh (card 3 is row 2). M (1 col): per card, card top @ 100 % → @ 70 %, translateY 12 vh → 0, opacity 0 → 1 over first 40 %, thumb scale 1.03 → 1. Card i+1 window is offset by layout — no extra stagger.
- Final frame (all tiers) = today's grid.
```
D, grid top @ 80%                         D, final (grid top @ 40%)
┌──────────── Nav ────────────────┐       ┌──────────── Nav ────────────────┐
│ 03 ── PROJECTS                  │       │ 03 ── PROJECTS                  │
│ Selected work.                  │       │ Selected work.  Open any case…  │
│ Open any case study…            │       │ ┌──────┐ ┌──────┐ ┌──────┐      │
│ ┌──────┐                        │       │ │thumb │ │thumb │ │thumb │      │
│ │thumb │ ┌──────┐               │       │ │title │ │title │ │title │      │
│ │title │ │thumb │  (card 3      │       │ │impact│ │impact│ │impact│      │
└─┴──────┴─┴──────┴── still below)┘       └─┴──────┴─┴──────┴─┴──────┴──────┘
M: cards rise one by one in a single column (12 vh each), final = static list.
```
IU coverage Portfolio: `03`, `Projects`, `h2`, lede (existing Reveal, not staged); per card: thumbnail `img` (alt = title), category, year, `h3`, impact, each stack `li`, "Read case study", "→" → all inside the card wrapper, entering together in P1. Modal content untouched.

**Q15 — Focus & modal.** CSS override on the wrapper: `.pf-card-wrap:focus-within { transform: none !important; opacity: 1 !important; transition: transform .2s cubic-bezier(.16,1,.3,1), opacity .2s; }` → a Tab-focused card is final within 200 ms (< 600 ms M8), wherever the scrub is; the timeline continues writing inline styles underneath and resumes when focus leaves. Focus ring sits on the `button` → unclipped (wrapper has no overflow). Modal: opening from any stage is fine (card is focused → final); while open, page scroll is locked so the scene is frozen; on close focus returns to the card → still final via `:focus-within`. No scene change for the modal.
  *PM ruling (factual correction):* the modal does **not** lock page scroll today (no `overflow`/`body` handling in `PortfolioModal.tsx`). In native mode the scene may keep scrubbing behind the backdrop — harmless, accepted. With Lenis, Phase 0b adds `lenis.stop()`/`start()` and `data-lenis-prevent` on the modal panel (§7.3). The `:focus-within` rule stands.

**Q16 — Thumbnail parallax.** **Remove** in motion mode at D (PD3): the scene now owns the `img` scale (same-element rule R8), the ±10 px parallax was not perceived, and it frees 3 observers. Section is not left without motion (C replaces it).

**Q17 — Track.** **C: 0 vh at all tiers** (PD1 alternative). If B is later approved: 0.6 vh D only, guard `min-height: 760px`.

### 17.F Skills (Phase 2)

**Geometry.** Rows block (4 rows, `md:grid-cols-[200px_1fr]`): ≈ 150 + 102 + 102 + 102 ≈ **456–504 px** at 1280 and 1024. Header + rows ≈ 880 px → pin **the rows block only**; header (with its existing Reveal) scrolls past first.

**Q18 — Assemble mechanic.** Pin: rows block (`div.flex-col`) `position: sticky; top: var(--scene-pin-top)` (= nav + 24 px = 96 px) with `padding-bottom: var(--skills-track)` = **60svh** on its new track wrapper. Header is fully above the viewport when the pin starts (rows top 96 − 96 margin = 0) → clean frame of rows only. `sync 0.4`. Scene `s` −60 → +60 (120 vh); pin = 0 → 60.

| # | `s` (vh) · % of scene | Group (row) | Hairline `::before` | Tags (`li[data-tag]`) | Pending |
|---|---|---|---|---|---|
| K1 | −50 → −20 · 8–33 % | Frontend (9) | draw −50 → −38 | tag j: window `[−46 + 1.5j, +14]` | label readable (eyebrow, already muted, not dimmed further); tags not-entered |
| K2 | −28 → 0 · 27–50 % | Backend (8) | −28 → −16 | `[−24 + 1.5j, +14]` | same |
| K3 | −6 → +20 · 45–67 % · pinned | Infrastructure (5) | −6 → +6 | `[−2 + 2j, +14]` | same |
| K4 | +16 → +36 · 63–80 % · pinned | Practice (3) | +16 → +28 | `[+20 + 2j, +12]` | same |
| K5 Hold | +36 → +60 · 80–100 % · pinned | all 25 tags final | — | — | 24 vh = 20 % of scene (≥ 15 % ✔) |

- Tag tween (from → to): `translateX` ±(6 + (7j mod 10)) vw → 0 (sign alternates by j; max 15 vw ≤ 16 cap), `translateY` (12 + (5j mod 12)) vh → 0 (max 23 vh), `rotate` ±(3 + j mod 3)° → 0, `scale` 0.92 → 1, `opacity` 0 → 1 over the first 40 % of the tag window. Transform `out(3)` (Q4 exception), opacity linear. Deterministic (no `Math.random`) so screenshots and the audit are stable.
- Each row's tags are visible on screen when their window runs (row tops at s −50: 62 %, s −28: ≈ 59 %, s −6: ≈ 50 %, s +16: ≈ 56 % — all inside the viewport).
- **Not a second Stacking Cards:** no surfaces, no vertical layering, no sticky per item; motion is lateral/scattered converging into flat pill rows on the bare canvas, and only one block pins.
- **Hairline: absorbed** as the stage divider (PD3): driven by a CSS custom property `--draw` (0 → 1) the timeline animates on each row (`transform: scaleX(var(--draw))`); the CSS `view()` draw is disabled in motion mode (a `view()` timeline on a sticky subject would freeze mid-draw during the pin). Static/RM/no-`view()`: line fully drawn as today.
- `SkillTags` one-shot stagger is disabled inside the scene (never both on one element); static modes unchanged.
- Fit guard: CSS `min-height: 640px` **and** a build-time JS check `rowsHeight ≤ innerHeight − nav − 48` → else unpinned (T variant) for that viewport.
- IU coverage Skills: `05`, `Skills`, `h2`, lede (existing Reveal); 4 labels (always readable); 25 tags (K1–K4).

```
D, s = +10 (pinned, Infra assembling)        D, final (K5 hold)
┌──────────── Nav ────────────────┐          ┌──────────── Nav ────────────────┐
│──────────────(drawn)────────────│          │─────────────────────────────────│
│FRONTEND   (TS)(React)(Next)(Vue)…│          │FRONTEND   (TS)(React)(Next)(Vue)…│
│──────────────(drawn)────────────│          │─────────────────────────────────│
│BACKEND    (Laravel)(Python)(Node)…│         │BACKEND    (Laravel)(Python)(Node)…│
│────────────(drawing→)           │          │─────────────────────────────────│
│INFRA      (AWS)    ↙(Docker)  ↖(Azure)    │INFRA      (AWS)(Vercel)(Docker)… │
│                                 │          │─────────────────────────────────│
│PRACTICE   ░ label only          │          │PRACTICE   (System design)(Code…) │
└─────────────────────────────────┘          └─────────────────────────────────┘
```

**Q19 — Mobile (375).** Unpinned, per row: row top @ 95 % → @ 55 %. Line draw first 30 % of the window; tags: translateX ±16 px → 0, translateY 24 px → 0, **no rotation**, scale 1, opacity 0 → 1; tag j window = `[0.3 + 0.5·j/n, +0.2]` of the row window (left→right ripple across 3–4 wrapped lines). Linear. T (768–1023): unpinned, same as M with ±4 vw / 8 vh. 25 transformed `li` is cheap; fps gate still applies.

### 17.G Contact & Nav

**Q20 — Contact `h2` fill: yes** (Phase 6, PD4 agree). "Tell me what you're building." → 5 words, window: h2 top @ 85 % → @ 50 % (word window 30 %, stagger 17.5 % of range), `sync 0.4`, linear, color only, same Q3 spec. At h2 top @ 50 % the form top is ≈ h2 + 340 px ≈ 92 % → the fill completes **before** the form reaches the viewport middle ✔. Eyebrow, index, lede: untouched (existing Reveal). Form, info list, location line: **existing one-shot Reveal only, then still** (M9). Mobile: same, range @ 85 % → @ 55 %. RM: no split.

**Q21 — Nav.** **No change.** The active indicator observes `section[id]`; tracks live inside their section, so a pinned section keeps covering the 40 % line for its whole length — the indicator stays on About/Skills during pins (correct). "Let's talk" untouched. Verify in Phase 1: the 40 % line during About F1–F3 (header sticky at 168 px) still reports `#about`.

### 17.H Cross-cutting

**Q22 — Handoffs.** Only **Hero → About** (object dissolve ↔ About index line, Q8) — zero extra cost, ships inside Phase 5. About → Services: no (Services untouched). Portfolio → Skills: no (Skills' header scrolling past is a natural breath before the pin). **PD6: Phase 4 out.**

**Q23 — Breakpoints & guards.**

| Scene | D (≥ 1024) | T (768–1023) | M (< 768) | L |
|---|---|---|---|---|
| Hero exit | `min-height: 600px` | same | `min-height: 520px`, reduced amplitude | static |
| About | pin, `min-height: 600px`, track 80svh | pin if `min-height: 600px`, track 40svh | unpinned staged, `min-height: 520px` | static |
| Portfolio C | unpinned, `min-height: 600px` | unpinned | unpinned, `min-height: 520px` | static |
| Skills | pin if `min-height: 640px` + JS fit check, track 60svh | unpinned per-row | unpinned per-row, `min-height: 520px` | static |
| Contact fill | ≥ 600 | ≥ 600 | ≥ 520 | static |
Guards stay away from the iOS address-bar flip (≈ 548 ↔ 627 at 375×667) per 07 V4. 768 and 1024 are inclusive lower bounds (Tailwind `md`/`lg`).

**Q24 — Static layout.** **None** (PD9 agree). All new wrappers are non-semantic, unstyled in static modes; all track paddings, sticky rules and overflow-x clip live under `html.motion-ok` + media queries.

**Q25 — Tokens** (written to 03-design-system by UI/UX after the Phase 1 checkpoint — P5; no new colors).

| Token | Value | Why |
|---|---|---|
| `--fill-pending` | `var(--muted-foreground)` | word-fill start; ≈ 6.8:1 |
| `--fill-done` | `var(--foreground)` | word-fill end |
| `--draw-line` | `color-mix(in srgb, var(--accent-bright) 45%, transparent)` | names the existing Skills line value, reused in About FACTS |
| `--scene-pin-top` | `calc(var(--nav-h) + 1.5rem)` | Skills (and B if approved) |
| `--about-pin-top` | D `calc(var(--nav-h) + 12svh)` · T `calc(var(--nav-h) + 8svh)` | centers the statement without a 100svh stage |
| `--about-track` | D `80svh` · T `40svh` · M `0` | K7 |
| `--skills-track` | D `60svh` · T/M `0` | K7 |
| `--lenis-lerp` (JS constant, not CSS) | `0.1` start value; final value set at the Phase 0b/1 owner check | PM-added (§7.3); documents the shipped smoothing |
| JS constants (`useScrollScene`) | `FILL_WINDOW` 12 vh (T 8), `FILL_STAGGER` 5.5 vh (T 3.5); `TRAVEL_Y_MAX` 40 vh; `TRAVEL_X_MAX` 16 vw; `CONTENT_SCALE` [0.95, 1.05]; `PENDING_ROTATE_MAX` 6°; `CLIP_INSET_MAX` 15 %; `DECO_SCALE_MAX` 1.5; `DECO_TRAVEL_MAX` 50 vh; `SCRUB_SYNC` {water 0.25, hero 0.35, line 0.4}; `LAND_EASE` `out(3)` for travel ≥ 20 vh only | one source of truth; devs don't tune per component |

### 17.I Stance on PD1–PD9

| # | UI/UX stance |
|---|---|
| PD1 | **Alternative:** About **0.8**, Portfolio **0** (C), Skills **0.6** → **D 1.4 vh**, **T 0.4 vh** (About only), **M 0**. Headroom 1.6 vh reserved for B (+0.6) only if approved. |
| PD2 | **Alternative: C** (fit math, §17.E). B = gated upgrade (P2), A rejected. No M5 exception needed for C. |
| PD3 | Skills hairline: **absorb** into the scene (motion mode); static unchanged. Portfolio thumbnail parallax: **remove** in motion mode (scene owns the `img`). |
| PD4 | **Agree**: About + Contact only. Skills labels are already `muted` eyebrows — no fill. |
| PD5 | **Agree**: no new `sync` value. |
| PD6 | **Agree, out** — except Hero→About relay, which costs nothing and ships in Phase 5. |
| PD7 | **Agree**: copy static, object only. |
| PD8 | **Mostly agree** (D/T 600, M 520) + **Skills pin 640 + JS fit check**; B (if ever) 760. |
| PD9 | **Agree**: no static layout change. |

### 17.J Wow vs risk ranking & pilot

| Rank | Scene | Wow | Risk | Notes |
|---|---|---|---|---|
| 1 | **About** (pinned fill + staged details) | High | Low–Med | Most recognisable animejs-style move; ≤ 8 spans + 1 mask; no focusables; risk = caption blur, split CLS |
| 2 | Skills (pinned assemble) | High | Med | 25 moving items: overflow-x, fit at 768 h, "busy" if amplitude creeps — caps are load-bearing |
| 3 | Portfolio C | Med | Low | Safe, felt via depth; B would be High wow / High risk |
| 4 | Contact fill | Low–Med | Low | Bookend only; conversion zone stays still |
| 5 | Hero exit | Med | **High** | LCP + CTA zone; least new information → correctly last |

**Pilot = About — agree with PM.** It is the purest test of the owner's question ("does holding the frame + staged disclosure feel like animejs?"), it introduces the signature (fill) reused later by Contact, it is far from every conversion zone, the pinned subject fits every D/T viewport, and it has no focusables. If the pilot fails the checkpoint, the knobs are cheap: track 0.8 → 1.0, fill window, or the P1 type-size proposal. *PM ruling:* Lenis is no longer a fallback knob — owner adopted it (O5), it ships in Phase 0b so the pilot is judged with it; Lenis `lerp` joins the tuning knobs (§12 Phase 1).

### 17.K Visual risks & test matrix

| # | Risk | Mitigation / check |
|---|---|---|
| V1 | Pending-text contrast over ambient glow during fill | Measure muted words over the brightest glow patch at About/Contact pin positions; must stay ≥ 4.5:1 |
| V2 | Caption `backdrop-blur` jank (About) | Image is clip/scale-only on an inner wrapper; caption only fades after the image is static; fps gate on M; fallback = no portrait motion on M |
| V3 | CLS from split-text | Words `display: inline`; assert h2 height delta 0; split only after `motion-ok`, never on LCP element |
| V4 | CLS / dead scroll from tracks | Track padding only under `html.motion-ok` set before first paint; S3 no-JS `scrollHeight` ±5 % |
| V5 | Horizontal overflow from Skills scatter | `overflow-x: clip` on `#skills` in motion mode; check no horizontal scrollbar at 1024/1280 |
| V6 | Hero object paints over About text (transformed SVG stacking) | Opacity 0 by p 0.85; screenshot at p 0.8/0.85/0.9 |
| V7 | Busy-ness creep (R1) | Caps in Q5 are hard limits; UI/UX reviews each scene PR video at 1× and fast-flick |
| V8 | Mouse-wheel notchiness through pins | Resolved by Lenis on D pointer-fine (§7.3); native elsewhere keeps the Q6 `sync` values |
| V9 | Find-in-page / smooth hash jump lands on pending tags | Acceptable (scrub reversible, `scroll-behavior: smooth` passes through stages); audit M8 for every Nav link |
| V10 | iOS address bar changing `svh`-based tracks | Use `svh` (not `vh`) for track and pin-top; test 375×667 flip |
| V11 | Lenis + modal / anchors / find-in-page | §7.3 acceptance; PM-added |

| Viewport | Tier | Check |
|---|---|---|
| 1280×800 | D | All stage tables above; About statement centered (168–510); Skills rows fit pinned; K7 delta 1.4 vh |
| 1366×768 | D | About pin fits (bottom ≈ 493); Skills fit check passes or falls back cleanly; Portfolio C final grid; M9 Hero CTAs hit-test |
| 1440×900 · 1920×1080 | D | Content capped at 1280; no extra empty pin room; tag scatter within viewport |
| 1024×768 | D | h2 4 lines fit; Skills rows ≈ 504 px vs 640 guard; cards ≈ 700 px tall in C (no pin needed) |
| 768×1024 | T | About pin 40svh; Portfolio 2-col offsets; Skills unpinned per-row |
| 390×844 · 375×812 · 375×667 | M | No pins (except Services as shipped); fill + staged reveals; ≥ 55 fps throttled; address-bar flip no tier flicker |
| 667×375 | L | Static mode, no extra scroll |
| 1280×800 @ 200 % zoom | M (640 CSS px) | Behaves as M; nothing clipped |
| RM @ 375/1280 · no-JS @ 375/1280 | static | Identical to `content-baseline-v2`; no extra scroll |
| all | — | Every Nav hash lands with `h2` readable ≤ 1 s; Tab through Portfolio cards from any stage; SR reads each h2 once (accessible copy, not per word) |
| 1280×800, 1366×768 (pointer-fine) | D + Lenis | Wheel through every scene (no stutter), pointer and keyboard anchors, Ctrl+F no jump-back, modal wheel scroll stays in the panel (PM-added) |

### 17.L [UI/UX — conflict] notes — *PM ruled: C1–C6 all approved (C1, C2 with conditions), see §16.1*

- **C1 — M5 is not satisfiable as written** for About (≈ 1050 px), Portfolio (header + 620–700 px cards) and Skills (header + rows ≈ 880 px) at 1366×768 — not even in static mode. Proposal **M5′**: "(a) every *pinned* subset completes (all its IUs readable together) and holds ≥ 15 % of the scene before release; (b) every flowing IU reaches its final state before its top passes 60 % of the viewport and **never exits/dims again** (no exit animations); (c) after the scene's last trigger the section equals its static render." This keeps the spirit (composition completes, nothing missed) without a per-section exception list.
- **C2 — M4 "inside the viewport" fails for tall IUs.** The About portrait (551 px) has only ≈ 34 px of scroll where it is fully inside a 1366×768 window — in static mode too. Proposal: M4 is measured per **leaf** IU (text node, `img`, control's text); an IU taller than 60 % of `innerHeight − nav` counts as "in viewport" when ≥ 60 % of its box is visible (other readable criteria unchanged). Same for Portfolio `button`s (≈ 620 px).
- **C3 — §6 Skills "group labels (dimmed)":** labels are `eyebrow` = already `muted-foreground`; dimming further breaks 4.5:1. Labels are simply readable from the start (pending applies to tags only).
- **C4 — §6 / PD2 Portfolio B** vs fit: see Q14. I recommend C; B only behind the idea gate with a 760 px guard.
- **C5 — §7.1 stage pattern** (`.scene-stage` height 100svh): a full-height stage around a 342 px header adds ≈ 290 px of dead scroll to the K7 delta at 800 h. I specify a **content-height sticky** (`top` offset to center) instead; scroll delta = track exactly. Developer may keep the §7.1 wrapper if the measured delta still fits K7.
- **C6 — Q4 easing** departs from my own 07 Q9 "linear only" for travel ≥ 20 vh (`out(3)`). Rationale in Q4; PM to accept as the one exception.

### 17.M Proposals through the PM idea gate — *PM decisions in §16.3: P1 deferred (reserve knob), P2 deferred, P3 approved with conditions, P4 rejected, P5 approved with conditions*

| # | Proposal | Cost / risk | My priority |
|---|---|---|---|
| P1 | About statement at larger type in motion mode (e.g. `clamp(3rem, 8vw, 6.5rem)`) for more "animejs" weight during the pin | Re-wraps the h2 in motion mode only (static unchanged); re-check fit (≈ 5 lines × 100 px at 1280) | Only if the pilot checkpoint says "not felt" |
| P2 | Portfolio **B** (pinned spotlight → grid) as an upgrade for `min-height: 760px`, +0.6 vh D | Second choreography; focus rules as Q15 | After Phase 3 checkpoint |
| P3 | Section index hairline draw (`span.h-px` next to `01/03/05/06`) as a micro-signature in scene sections | Decorative, cheap; must not touch Services' header | Low |
| P4 | Hero object faint "afterglow" persisting behind the About pin (fixed-position ghost) | Moves the 3D-ish object outside Hero; budget/brief question | Low — probably reject |
| P5 | Write §17.Q25 tokens + "scrub = linear (except travel ≥ 20 vh), time = signature ease" into 03-design-system | Docs only | After PM approval |


## 18. Definition of Done (per scene PR; Phase 0a/0b use the subset in [09](09-brief-scroll-phase-0-1.md))

Standard DoD from [04](04-status-and-backlog.md) **plus**:
- `npm run snapshot:check` empty vs `content-baseline-v2` (S1/S2) and `--nojs` parity (S3).
- `scene-audit` green at 375×812, 768×1024, 1280×800, 1366×768 (M1–M5′, M8, M9), **Lenis on and off**; readable-range table attached to the PR.
- `scroll-test.mjs`: 0 stuck reveals; reading-zone rule passes for M9 zones and non-scene sections.
- Reduced-motion: no scene, no extra scroll, **no Lenis instance**, all content visible. No-JS: same.
- Keyboard walkthrough, Ctrl+F check and one screen-reader pass of the touched section.
- Every in-page link (Nav, logo, mobile menu, Hero CTAs, Services CTA) lands correctly with Lenis on (pointer) and via keyboard.
- Lighthouse mobile 3-run median within §8 gates; fps ≥ 55 throttled; initial-route JS delta and Lenis chunk size reported.
- Scroll-length delta per tier reported (§8.1); above the soft cap only with the §8.1 gate.
- No data constants changed (C7); no new text; no `scrambleText`/counters on IUs; nothing animated on the Hero stats.
- UI/UX visual sign-off; QA PASS; owner checkpoint where §12 requires it.
- One concern per commit ([06](06-commit-rules.md)); no commit/tag without owner request.
