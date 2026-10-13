# 09 — Implementation Brief: Dramatic Scroll, Phase 0a / 0b / 1

Status: **Ready for developer** — 2026-10-12 · Author: PM · Source of truth: [08](08-prd-dramatic-scroll-experience.md) v0.2 (§ references below point there) · Flow: developer → QA → PM acceptance ([05](05-dev-workflow.md)).
Three separate PRs, in order. Do not start a phase before the previous one is accepted. **No commit, tag or push unless the owner asks** ([06](06-commit-rules.md), one concern per commit).

Common context (read first): 08 §3 (content principle, M1–M9 incl. amended M4/M5′), §7 (sticky, scene hook, **Lenis §7.3**, smoothing §7.4), §8 (gates), §17.C (About stage tables). Baseline: tag `content-baseline-v2` = `8317e70`; Lighthouse baseline `snapshots/lighthouse-baseline.json` (perf 90, LCP 3564 ms, CLS 0, TBT 91 ms, range 64–201).

---

## Phase 0a — Audit tooling

**Goal.** Make every later scene PR provable by script: static parity (incl. no-JS) and motion-mode readability, before any scene exists.

**Context files.** `scripts/content-snapshot.mjs`, `snapshots/content-baseline.json`, `snapshots/README.md`, `scroll-test.mjs` (root), `package.json` scripts, `app/page.tsx` (section ids), `components/layout/Nav.tsx`, `components/sections/hero/HeroCopy.tsx`, `components/sections/Services.tsx` (in-page links).

**Scope — in**
1. `content-snapshot.mjs --nojs` (S3): `javaScriptEnabled: false` at 375×812 and 1280×800; C1–C6, C8 compared to the committed baseline; `document.scrollHeight` compared to a live reduced-motion render, tolerance ±5%. npm script (e.g. `snapshot:nojs`).
2. `scripts/scene-audit.mjs` + npm script (e.g. `audit:scenes`): Playwright, `reducedMotion: 'no-preference'`, viewports 375×812, 768×1024, 1280×800, 1366×768. Uses the same server bootstrap as `content-snapshot.mjs` (`URL` env or local start).
   - **Scene discovery**: scenes are elements with `data-scene="<name>"` (the scene's track/section). No config list to keep in sync.
   - **M1/M2/M3**: at page top, page bottom and every 10% of each scene: section text (excluding `[aria-hidden="true"]`), `ariaSnapshot()`, links/controls/media equal the baseline (C8, C6, C2–C4).
   - **M4**: sweep each scene in 2.5vh steps; per leaf IU compute readable (08 §3.1: viewport incl. Nav occlusion and center hit-test, effective opacity ≥ 0.99, clip ≥ 95% visible, scale 0.95–1.05, rotation ≤ 2°, contrast ≥ 4.5:1 / 3:1 for `display-*`, 60% rule for tall images/controls only); fail if the longest contiguous readable run < 20vh (D) / 15vh (T) / 1 sample (M).
   - **M5′**: (a) pinned subsets (elements with `data-scene-pin`) all readable together for ≥ 15% of the scene before release; (b) flowing IUs final when their top reaches 40% of viewport height and unchanged afterwards; (c) after the last sample of the scene, IUs and scene wrappers have static computed state.
   - **M8**: click every in-page link (Nav ×5 + logo, mobile menu at 375, Hero CTAs ×2, Services "Let's talk") by pointer and by keyboard (focus + Enter); target `h2` readable ≤ 1 s. Tab through the page: each focused element readable ≤ 600 ms, focus ring unclipped.
   - **M9**: Hero copy/CTAs, `header`, `#contact` below its header: opacity 1, no transform beyond scroll, center hit-test returns the element, whenever visible.
   - **Lenis switch**: two runs per viewport — default, and with a Playwright init script setting `window.__DISABLE_SMOOTH_SCROLL__ = true` (the flag Phase 0b's `SmoothScroll` must honour; in 0a it is a no-op). No URL parameter.
   - **Settle**: after each `window.scrollTo`, wait 2 rAF plus until inline styles of scene elements are unchanged for 150 ms (smoothing), max 1.5 s.
   - **Output**: per scene, a table `IU text (first 40 chars) · readable from–to (vh) · run length · pass/fail`, printed and written to a file under the scratch/output dir (not committed). Exit code ≠ 0 on any violation.
3. `scroll-test.mjs`: reading-zone check skips elements inside `[data-scene]` (they are covered by M4/M5′); still runs for non-scene sections and M9 zones. Stuck-reveal check unchanged.
4. `snapshots/README.md`: how to run the three checks.

**Scope — out.** Any app code change. Moving `scroll-test.mjs` (backlog #14). Lighthouse automation. Changing `snapshot:check` semantics or the baseline JSON.

**Acceptance criteria**
- [ ] On the current site: `snapshot:check` empty, `--nojs` passes (scrollHeight delta reported), `scene-audit` passes at all 4 viewports × 2 runs and reports "0 scenes registered", `scroll-test.mjs` passes.
- [ ] Demonstrated in the PR description: a throwaway run that injects a violation (e.g. `addStyleTag` making the About bio `opacity: .5` inside a temporary `data-scene`) fails with the IU text and scroll range; an injected `aria-hidden` on an IU fails M2; a Hero CTA covered by an injected overlay fails M9.
- [ ] M8 covers all 9 link targets listed above, pointer + keyboard, and prints them.
- [ ] Runtime of `scene-audit` on the current site ≤ 3 min locally (report actual).

**Creative limits.** Free: script structure, helper modules under `scripts/`, output format details, npm script names (document them). Don't: loosen any existing check, add dependencies beyond the installed Playwright, touch `components/` or `app/`.

**Definition of Done.** 04 standard DoD (lint 0 errors, `tsc` clean, build OK) · all AC ticked · QA PASS · PM acceptance · 04 updated by PM.

---

## Phase 0b — Foundation: motion gate, scene hook, Lenis

**Goal.** Put the final scroll feel (Lenis on desktop) and the scene infrastructure in place with **zero visible scene yet**, so the About pilot is judged on the same foundation as the end result.

**Context files.** `app/layout.tsx`, `app/globals.css` (`html { scroll-behavior: smooth; scroll-padding-top }`, reduced-motion block), `components/ui/useScrollScrub.ts` (`SCRUB_SYNC`, tiers), `components/layout/ScrollProgress.tsx`, `components/sections/hero/HeroObject.tsx`, `components/sections/portfolio/PortfolioCard.tsx` (scrub consumer), `components/sections/portfolio/PortfolioModal.tsx` (`fixed inset-0`, panel `overflow-y-auto`, no scroll lock), `components/layout/Nav.tsx` (in-page links, IntersectionObserver), `package.json`. Spec: 08 §7.1–§7.4, §8, §10.

**Scope — in**
1. **Motion gate**: inline `<head>` script in `app/layout.tsx` sets `html.motion-ok` before first paint when `prefers-reduced-motion` is not `reduce`; keeps it in sync on media change. No CSS uses it yet except what this phase needs.
2. **`useScrollScene`** hook next to `useScrollScrub`, same contract (tiers, reduced-motion → nothing, `revert()` on unmount/tier change, no per-frame layout reads, stage positions computed at build from measured offsets, rebuild on resize/tier change). Exported, not used by any section.
3. **Lenis** per 08 §7.3 — every row of that table is in scope: `lenis@1.3.26` exact; vanilla import; one `SmoothScroll` client component in `layout.tsx`; runs only for `(prefers-reduced-motion: no-preference)` + `(pointer: fine) and (hover: hover)` + `(min-width: 1024px)`, re-evaluated on change (create/`destroy()`); never instantiated under reduced motion; dynamic import after `load` + idle; options `smoothWheel: true`, `syncTouch: false`, `anchors: false`, `lerp: 0.1`; `html.lenis { scroll-behavior: auto }` + Lenis CSS rules; pointer-only in-page anchor handler (`event.detail > 0` → `preventDefault`, `lenis.scrollTo`, `history.pushState`), keyboard activation stays native; honours `window.__DISABLE_SMOOTH_SCROLL__` (test-only flag from 0a); HMR-safe single instance.
4. **Smoothing rule** (08 §7.4) inside `useScrollScrub` and `useScrollScene`: Lenis running → `sync: true`; otherwise the component's `SCRUB_SYNC` value. Hooks rebuild when Lenis starts/stops. No per-component logic.
5. **Portfolio modal**: `lenis.stop()` on open, `lenis.start()` on close; `data-lenis-prevent` on the scrolling panel. Through a minimal accessor (module-level getter), no event bus. Native behaviour unchanged.
6. **LCP element**: identify it on the mobile Lighthouse profile (3 runs), report element + timing in the PR; PM records it in 08 §1.3.

**Scope — out.** Any scene, `data-scene` usage, track padding, split-text, `motion-ok`-scoped visual change. Native-mode modal scroll lock (backlog P3). Touch smoothing. Any content change. Lenis `2.x`, `lenis/react`, `lenis/snap`.

**Acceptance criteria**
- [ ] `npm ls lenis` = `1.3.26`, `package.json` pins it exactly; Lenis is **not** in the initial JS for `/` (build output / network panel: separate chunk requested after `load`); chunk ≤ 7 KB gzip (report).
- [ ] Lighthouse mobile 3-run median: perf ≥ 90 and ≥ baseline, LCP ≤ 3564 ms, CLS ≤ baseline (0), TBT ≤ 251 ms; on that profile no Lenis instance exists (`document.documentElement.classList.contains('lenis') === false`).
- [ ] 1280×800, pointer-fine: `html.lenis` present after load; wheel scrolling smooth through the whole page incl. Services stacking (sticky intact, no stutter from `scroll-behavior`).
- [ ] Reduced motion (emulated): no `lenis` class, no Lenis network request, `scroll-behavior: auto`; toggling the emulation at runtime destroys/creates correctly. No-JS: native scroll, page identical to baseline.
- [ ] 375×812 and 768×1024 touch emulation: no Lenis instance.
- [ ] Pointer click on every in-page link (Nav ×5, logo, Hero CTAs ×2, Services "Let's talk") with Lenis on: smooth scroll, lands with section top at `--nav-h` (±4 px), URL hash updated, no double jump. Keyboard (Tab + Enter) on the same links: native jump, next Tab moves into the target section.
- [ ] Ctrl+F for a word in `#contact` and in `#skills`: lands on the match; the next wheel tick continues from there (no jump-back). Space / PageDown / arrows / Home / End scroll natively and Lenis resyncs.
- [ ] Portfolio modal with Lenis on: page does not scroll on wheel over backdrop or panel edge; long panel content scrolls with the wheel; Escape/close restores smooth scrolling; no horizontal shift of page content on open/close (check a classic-scrollbar setup or emulate via `::-webkit-scrollbar` width).
- [ ] Nav active indicator still correct for every section with Lenis on.
- [ ] `useScrollScrub` consumers (HeroObject, hint, Portfolio thumbnails) use `sync: true` while Lenis runs and their `SCRUB_SYNC` value otherwise — demonstrated by a log or test; `ScrollProgress` unchanged.
- [ ] `snapshot:check` empty; `--nojs` passes; `scene-audit` passes at all viewports, both runs; `scroll-test.mjs` passes.
- [ ] Unmount/route-less HMR: no duplicated listeners (check `getEventListeners(window)` count stable after 3 hot reloads in dev).
- [ ] Screen recording 1280×800 (1× scroll top → bottom, then fast flick) attached for the **light owner check** ("does the scroll feel right?" — tuning only).

**Creative limits.** Free: file names, the accessor shape, `autoRaf` vs anime.js `engine`-driven rAF (document the choice and show no one-frame lag between `scrollY` and scrub progress), how the gate script is written (≤ ~300 bytes). May propose a different `lerp` with a recording — UI/UX decides, PM records. Don't: enable `anchors`, `syncTouch`, Lenis on touch/tablet/mobile, Lenis under reduced motion, change `scroll-padding-top`, alter any section's visuals, touch Services CSS, add other dependencies.

**Definition of Done.** 04 standard DoD · 08 §18 items that apply (snapshot/no-JS/scene-audit Lenis on+off, reduced-motion, keyboard, Ctrl+F, in-page links, Lighthouse, bundle report) · all AC ticked · `02-architecture.md` updated by the developer (Lenis component + accessor, motion gate, `useScrollScene`, smoothing rule) · UI/UX sign-off on the scroll feel · QA PASS · owner light check recorded by PM in 04.

---

## Phase 1 — About scene (pilot)

**Goal.** Ship the first animejs-style scene — pinned statement with word fill, then staged portrait/bio/FACTS — and get the owner's verdict: "does this feel like animejs?"

**Context files.** `components/sections/About.tsx` (h2 8 words, bio `p.lede.text-foreground`, `FACTS` `dl` rows `.hairline-t`), `components/sections/about/AboutPortrait.tsx` (`Image fill`, `scale-200`, caption `backdrop-blur-md`), `components/ui/SectionHeader.tsx` (**shared with Services**), `components/ui/Reveal.tsx`, `useRevealOnEnter.ts`, `useScrollScene` (0b), `app/globals.css` (`--nav-h`, `.hairline-t`, `.skills-row::before` line value), `components/layout/Nav.tsx`. Spec of record: **08 §17.C Q10–Q12** (stage table A0–A6, wireframes, T/M variants), §17 Q3 (word fill), Q5 (caps), Q6 + 08 §7.4 (sync), Q23 (guards), Q25 (tokens), §16.3 P3 (index hairline = stage A0).

**Scope — in**
1. About scene with `data-scene="about"`; pinned subject = About's `SectionHeader` root (`data-scene-pin`), content-height sticky, `top: --about-pin-top` (D `calc(var(--nav-h) + 12svh)`, T `+ 8svh`), track `--about-track` (D 80svh, T 40svh, M 0) as padding on a non-semantic wrapper — all under `html.motion-ok` + tier/height media queries (D/T `min-height: 600px`, M `520px`).
2. Stages A0–A6 exactly as §17.C (index hairline draw; h2 word fill `--muted-foreground → --foreground`, words `display: inline`, `splitText({ words: true, accessible: true })`; hold; portrait iris on a new wrapper around the `Image` only; caption opacity-only after the image is static; bio rise + brighten; FACTS line draw then `dt`/`dd` slide). Triggers as element-edge triggers converted to timeline positions at build time.
3. Inside the scene, the scene timeline replaces `Reveal` for About's elements; static modes keep today's `Reveal` behaviour.
4. T variant (pin if guard passes) and M variant (unpinned, §17.C mobile spec, portrait motion fps-gated with still-image fallback).
5. Tokens used as CSS custom properties / hook constants with §17 Q25 names (written to 03 later by UI/UX, P5).

**Scope — out.** Any other section (Services header must be pixel-identical), Hero relay (Phase 5), P1 larger type (reserve knob, not now), copy/data changes, `SectionHeader` API changes that alter other sections' output, removing `Reveal` globally.

**Acceptance criteria**
- [ ] `scene-audit` (Lenis on + off, 4 viewports): 0 violations for M1–M5′, M8, M9; readable-range table attached; the h2 is readable from its first full view (muted ≥ 4.5:1) and the A2 hold is ≥ 15% of the scene.
- [ ] `snapshot:check` empty, `--nojs` passes, `scroll-test.mjs` passes.
- [ ] Scroll-length delta vs reduced-motion render: D 80svh ±24 px (1280×800 and 1366×768), T 40svh ±24 px (768×1024), M 0 ±24 px (375×812).
- [ ] Fit: pinned header fully visible below the Nav during the whole pin at 1366×768, 1280×800, 1024×768 and 1280×600; below 600 px height (e.g. 1280×560) the scene is static.
- [ ] h2 height identical before/after split (0 px delta) at 375 / 1024 / 1280; SR reads the h2 once (accessible copy).
- [ ] Caption never moves; image wrapper only clip/scale; image crop (`scale-200`, `objectPosition`) unchanged; fps ≥ 55 at 4× CPU throttle at 1280 and 375 (portrait fallback engaged automatically if not).
- [ ] Pending-word contrast ≥ 4.5:1 measured over the brightest ambient-glow patch at the pin position (report value).
- [ ] Services header and section: screenshot identical to before at 1280×800 and 375×812.
- [ ] Nav active indicator shows About during the whole pin (40% line check).
- [ ] Reduced motion / no-JS: About identical to baseline, no extra scroll, no split spans in the DOM.
- [ ] Lighthouse gates 08 §8; initial-route JS delta reported (cumulative ≤ 8 KB gzip for the PRD).
- [ ] Owner checkpoint pack: recordings at 1280×800 (Lenis on, 1× + fast flick), 768×1024 and 375×812; PR lists IU → stage mapping.

**Creative limits.** Free: wrapper markup (non-semantic, unstyled in static modes), how stages map to timeline labels, fine-tuning within ±20% of §17.C values and inside the §17 Q5 caps if it improves feel (report every deviation; UI/UX signs off). Don't: pin anything taller than the header, add text/hints/progress indicators, animate the caption or anything under `backdrop-blur` per frame, animate `filter`/layout properties, change Services, change copy or the image file, add exit animations, exceed the caps.

**Definition of Done.** 08 §18 in full · UI/UX visual sign-off · QA PASS · PM acceptance · **owner checkpoint answered and recorded in 04** (Yes → Phase 2 brief; No → PM re-plans with the knobs in 08 §12 Phase 1).
