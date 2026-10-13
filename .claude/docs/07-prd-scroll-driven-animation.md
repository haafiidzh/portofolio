# 07 — PRD: Scroll-Driven Animation (DRAFT)

Status: **DRAFT v0.3** — 2026-10-12 · Owner request · Author: PM · Next reviewer: Owner (approve §4.2 D1–D5)
Backlog: P2 (see [04](04-status-and-backlog.md)). Must not jump ahead of open P0 items (`RESEND_API_KEY` + end-to-end test, clean lint).
Language: **English** (translated from Indonesian in v0.2). All future edits to this doc must be in English.

> **Partially superseded by [08](08-prd-dramatic-scroll-experience.md) (2026-10-12, 08 v0.2)**: §2 non-goal "scroll-jacking / smooth-scroll libraries" (pin via CSS sticky now allowed; **Lenis smooth scroll adopted by owner decision 08 O5**, spec 08 §7.3), §3 content-freeze for motion mode (static modes still frozen; R3 split-text rule replaced), §4 "one scrub per section" + reading-zone rule (kept only for conversion zones and non-scene sections), §4 rows Hero/About/Portfolio/Skills/Contact/Nav, §7 mobile tiers, §9 Phase 3 (About parallax, cancelled). **Still in force**: §4.1–4.3 Services Stacking Cards + E2, §5, §6, §8. **Status facts**: §9 Phase 3b step 0 tag `content-baseline-v2` exists on `8317e70` (created with owner approval); all 07 phases that were built are committed (`66a99a3`, `f3f461b`, `f8f914d`, `3498dd6`, `02d5fa7`, `71fdf43`); the P0 items in the header line above are closed (lint 0 errors at HEAD; contact form owner-verified). Full mapping: 08 §4.

Changelog
- v0.1 — PM draft + UI/UX input (§13).
- v0.2 — Translated to English. **Owner requirement added: "Stacking Cards" for Services (§4.1).** This overrides the UI/UX removal of sticky in Services (Q2, finding F1).
- v0.3 — **Owner decision O1 resolved**: one "Let's talk" → `#contact` CTA in the Services left column, registered as content-freeze exception **E2** (§3, §4.1, §9 Phase 3b step 0, DoD). **Five PM-vs-UI/UX Stacking Cards disagreements reconciled** in favour of the UI/UX position (§4.2, D1–D5, status *proposed — pending owner approval*); PM sections (§4, §4.1, §6, §7, §8.1, §9, R6, R9) and §13.6 now say the same thing. Added §14 Implementation model guidance.

---

## 1. Background & problem

The site already has motion, but almost all of it is **one-shot**: content appears once (fade + lift) and then stays still. The only moment that is truly tied to scroll is in the Hero. As a result, after the first screen the page feels static and "template-like", while the structural reference (animejs.com) is strong precisely because scrolling feels like it *drives* something.

The owner wants scroll-driven animation (scrub/progress-linked, pin, parallax, reveal) **without changing the content at all**.

### Actual state (verified from source, 2026-10-12)

| Mechanism | Location | Type | Notes |
|---|---|---|---|
| `Reveal` + `useRevealOnEnter` | `components/ui/Reveal.tsx`, `useRevealOnEnter.ts` | One-shot, IntersectionObserver + scroll check + 6 s failsafe | Deliberately does **not** use `onScroll()` (can freeze halfway on fast scroll). Used by `SectionHeader`, About, Services, Portfolio grid, Contact. |
| `SkillTags` | `sections/skills/SkillTags.tsx` | One-shot stagger per row | Uses the same `useRevealOnEnter`. |
| `HeroCopy` | `sections/hero/HeroCopy.tsx` | Mount-time stagger (time-based) | Above the fold. |
| `HeroObject` | `sections/hero/HeroObject.tsx` | **Scrub** (`onScroll`, `sync: 0.35`) rotate/scale per layer + drift/fade; entrance line-draw; dots breathing loop | Already scroll-driven. |
| `ScrollProgress` | `layout/ScrollProgress.tsx` | **Scrub** `scaleX` to page progress (`sync: true`) | |
| `ExperienceLine` | `sections/experience/ExperienceLine.tsx` | **Scrub** line-draw | Experience section is **not rendered** (`app/page.tsx`). |
| Ambient bg | `layout/AmbientBackground.tsx`, `globals.css` | CSS keyframe loops 22–28 s | Off in reduced-motion. |
| `PortfolioModal` | `sections/portfolio/PortfolioModal.tsx` | framer-motion `AnimatePresence` | The only framer-motion user. |
| Nav | `layout/Nav.tsx` | Scroll listener → bg blur after 24 px | No active-section indicator yet. |
| 3D blob | `layout/MorphScene.tsx` + `morph/*` | Scroll-morph between sections | **Not mounted** (dead code). |

Key facts for solution design:
- Without JS, all content is **already visible** (prehide happens in a client layout effect, not in CSS/SSR). This must be preserved.
- `globals.css` forces `[data-reveal]` to opacity 1 / transform none in reduced-motion.
- `scroll-test.mjs` (Playwright) already audits `[data-reveal]` elements stuck at opacity < 1 — can be extended.

## 2. Goals & non-goals

**Goals**
1. Each section has **one** clear scroll-driven moment (not every element moving) — scrolling feels like it "drives" the page, calm & premium.
2. Content 100% identical before/after (see §3), proven by automated diff — sole owner-approved exception: the E2 Services CTA (v0.3).
3. No regressions: Lighthouse mobile, CLS, a11y, reduced-motion, no-JS.
4. Motion never blocks the conversion path (Hero CTA, Nav "Let's talk", Contact form).

**Non-goals**
- Changing text, images, data, section order, headings, links, labels, or information structure.
- Enabling Experience or the 3D blob (`MorphScene`) — that is a separate content/budget decision (backlog #12).
- Adding new 3D, video, or new assets.
- Scroll-jacking / smooth-scroll libraries (Lenis, Locomotive) — native scroll stays.
- Visual redesign (color, typography, layout grid). Positioning/visual direction remains an open owner question.
  - **Exception E1 (owner, v0.2):** the Services layout change to Stacking Cards (§4.1) is approved by the owner as a **presentation-only** layout change. No other section's grid may change under this PRD.
  - **Exception E2 (owner, v0.3):** exactly **one** new link is added — "Let's talk" → `#contact` in the Services left column (§4.1). This is the only new content allowed by this PRD; it gets its own baseline update (§3 Verification, §9 Phase 3b step 0).

## 3. "Content-freeze" principle

### Operational definition
A change **passes** content-freeze if, at viewports 375 px and 1280 px, all of the following are identical to baseline:

| # | Invariant | How to measure |
|---|---|---|
| C1 | Visible text per section | `innerText` of each `section[id]`, `header`, `footer` (whitespace normalized) |
| C2 | Heading outline | list of `h1–h6` (level + text) in order |
| C3 | Media | list of `img` (`src`, `alt`) in order |
| C4 | Links & controls | list of `a` (`href` + text), `button` (text/`aria-label`), form fields (`name`, `label`, `placeholder`, `required`) |
| C5 | Section order | list of section `id`s in `main` |
| C6 | Accessibility tree | `page.accessibility.snapshot()` (or `ariaSnapshot()`) per section — role + name |
| C7 | Data constants | `PROJECTS`, `SERVICES`, `FACTS`, `GROUPS`, `LINKS`, `COLUMNS` untouched in the diff (`git diff` may only touch className/motion props/ref/wrapper) |
| C8 | DOM order = reading order (v0.2) | ordered list of text-bearing nodes per section (from C1 dump) unchanged; **no** CSS that visually reorders vs DOM (`order`, `*-reverse`, explicit grid placement that swaps items, absolute repositioning of content). Sticky/stacking must not reorder DOM. |
| C9 | Exception E2 delta (v0.3) | applies only to the single E2 commit (§9 Phase 3b step 0): the diff vs `content-baseline-v1` must equal **exactly** the expected E2 delta below — nothing more, nothing less. After that commit every invariant C1–C8 is measured against `content-baseline-v2`. |

**Expected E2 delta (v0.3)** — at both 375 px and 1280 px, one element only: `<a href="#contact">Let's talk</a>` inside `section#services`, DOM position = immediately after the `SectionHeader` root (i.e. after the lede `p`), before the first card (`01`).
- C1: `#services` text gains `Let's talk` between the lede text and `01`. No other section's text changes.
- C2, C3, C5, C7: **unchanged**.
- C4: one new `a` entry `{ href: "#contact", text: "Let's talk" }`, positioned in document order between the last Hero/About entries and the first Portfolio entry. No other link/button/field changes.
- C6: `#services` gains one `link "Let's talk"` node, after the lede paragraph and before the first `h3`. No other role/name changes.
- C8: one new text-bearing node (`Let's talk`) at the same position as C1.
Anything else in the diff (extra text, extra `aria-label`, `title`, icon text, a second link, changed copy) = reject the commit.

**Allowed**: className, inline motion style, `ref`, `data-*` attributes for motion, non-semantic wrapper `<div>`s, new decorative elements **with `aria-hidden` and no text** (lines, glow, masks), new CSS, inline CSS custom properties (e.g. `--i`) (v0.2). The one E2 link (v0.3).
**Forbidden**: new text elements other than the E2 link (including a new "Scroll" hint, number counters, labels), text splitting that changes the a11y name (see R3), replacing `<img>`/assets, changing DOM order, `display:none`/`visibility:hidden` on content, CSS-generated text (`content: "..."`) (v0.2).

### Verification
1. **Baseline** is taken from the commit that contains the currently uncommitted Nav/About changes (working tree `develop`) — locked as tag `content-baseline-v1` before phase 1.
2. New Playwright script `scripts/content-snapshot.mjs`: render `next start`, emulate `reducedMotion: 'reduce'` (to get final state), scroll fully, dump C1–C6 + C8 to JSON per viewport.
3. Every motion PR: re-run → JSON `diff` must be **empty**. Non-empty diff = PR rejected, no exceptions — **except** the single E2 commit, whose diff must match the expected E2 delta (C9) exactly.
4. **E2 baseline update (v0.3)**: after the E2 commit passes C9, regenerate the snapshot JSON, commit it, and tag that commit `content-baseline-v2`. From then on all PRs diff against v2. `content-baseline-v1` is kept (not moved/deleted) as the audit trail.
5. Manual review of C7 via `git diff --stat` + scan of data constants.

## 4. Scope per section

General rule: max **one main scrub effect per section** + existing reveal. Content (text) elements may only be scrubbed on small `transform`s; **text opacity must not be scrubbed below 1 in the reading zone** (middle 60% of viewport).

| Section | Already exists | Proposed effect | Type | Notes / limits |
|---|---|---|---|---|
| **Hero** | `HeroObject` scrub, copy mount stagger | Copy (`HeroCopy`) slow parallax out (`translateY` 0→-40 px, opacity 1→0.6) as hero leaves the viewport; "Scroll" hint fade-out at progress 0–10% | Scrub | Do not pin the hero (delays access to content). CTAs must stay clickable while visible. |
| **About** | Reveal portrait + text | Portrait: inner image parallax (`translateY` ±24 px inside the `overflow-hidden` frame) + one-time clip/mask reveal; `dl` FACTS: hairline rules "draw" (`scaleX` 0→1) tied to scroll | Parallax + decorative scrub | Image not replaced/re-cropped; parallax on a wrapper, not on the existing `object-position`. |
| **Services** | Reveal per row | **Stacking Cards (owner requirement, §4.1)**: ≥1024 px two columns; left column (`SectionHeader` + E2 "Let's talk" link) sticky; right column = 4 rounded cards that stack via CSS `position: sticky`, each new card sliding up over the previous one; existing `no` (`01`–`04`) restyled as a numbered circle badge on the card's left edge. **No scale.** Optional (Phase 3b-ii): buried cards dim slightly (scroll-linked overlay, D4). *Supersedes v0.1 "light pin" and UI/UX "hairline draw" for Services.* | Pin (sticky) + stacking + optional decorative scrub | Native sticky, **no spacer/scroll-jacking, no JS for the core effect**. Presentation-only (E1) + one CTA (E2). Tiers/reduced-motion per §4.1–4.2. |
| **Portfolio** | Card reveal stagger, hover lift | Thumbnail image parallax inside the card (±16 px); middle-column cards offset with different parallax speed (desktop) | Parallax | Brief budget: Portfolio = light hover tilt, **not 3D**. Cursor tilt = separate P3, outside this PRD. Modal untouched. |
| **Experience** | `ExperienceLine` (scrub) | **Out of scope** — not rendered; enabling it = content change. | — | Owner decision (backlog #12). |
| **Skills** | Tag stagger per row | Group label (`eyebrow`) sticky in the left column on desktop while rows pass; per-row hairline draws on scroll | Pin (sticky) + decorative scrub | Tags stay one-shot reveal (safe from freezing). |
| **Contact** | Reveal form + info | **Minimal**: existing reveal only + one decorative accent (glow/line) scrubbed in. Form & info **must not move** once visible. | Decorative scrub | Conversion zone: zero parallax on fields, button, email link. |
| **Nav** | Bg blur on scroll | Active-section indicator (underline/dot on the active link, progress-linked); keep `ScrollProgress` | Scroll-spy | No hide-on-scroll (the "Let's talk" CTA must always be present). `aria-current="true"` on the active link = a11y tree change → **needs decision** (see Q8). |
| **Footer** | — | No new effect. | — | |

> **[UI/UX — conflicts flagged]** Several rows of this table are revised in §13: Hero (copy parallax/fade dropped), About (hairline & clip reveal dropped), Services & Skills (sticky dropped → replaced by hairline draw), Portfolio (parallax made optional), Contact (accent dropped), Nav (`aria-current` not used). See §13.1 and §13.5.
> **[PM — v0.2]** Services row: the UI/UX removal of sticky is **overridden by the owner**. Services = Stacking Cards (§4.1). The Skills sticky removal (UI/UX) still stands.
> **[PM — v0.3]** For Services, §4.1 + §4.2 and §13.6 are now one consistent spec; where wording differs, §4.2 wins. The non-Services conflicts above (Hero, About, Portfolio, Contact, Nav) are unchanged by v0.3 and still await the PM idea gate.

### 4.1 Services — Stacking Cards (owner requirement, v0.2)

**Reference**: the "Why choose Dental Boutique" section on dentalboutique.com.au. We copy the structure and motion, **not** the content or the CTA.

**Behavior (≥1024 px, motion allowed)**
1. Two columns. **Left** = existing `SectionHeader` (index, eyebrow, `h2`, lede) **followed by the E2 "Let's talk" link (§4.3)**, both inside one sticky wrapper, pinned below the Nav while the right column scrolls past.
2. **Right** = the 4 existing services as rounded cards in a vertical stack. Each card is `position: sticky` with `top: calc(var(--stack-top) + var(--i) * var(--stack-step))`. As the user scrolls, each next card slides up and overlaps the previous one, leaving a strip of each buried card visible (stepped offset).
3. Each card carries a **numbered circle badge** on its left edge = the existing `<span>{service.no}</span>` ("01".."04") restyled. **No new text.**
4. **No scale** on buried cards (D4). Optional (Phase 3b-ii, separate PR): buried cards **dim** slightly via an overlay, scroll-linked. Static fallback = no dim.
5. The stack releases naturally when the cards container ends (sticky is bounded by its parent). No spacer elements, no extra scroll length beyond what the cards themselves occupy, no scroll-jacking.

**Content-freeze: what must stay identical (presentation-only change)**
- DOM order: `SectionHeader` stays **first** in the section, then the E2 link, then cards in order **01 → 04**. Inside each card the order stays: `no` span → `h3` title → description `p` → bullets `ul/li`.
- Heading levels: `h2` (section) and `h3` (cards) unchanged. No new headings, no new landmarks.
- `SERVICES` constant untouched (C7). Badge = existing `no` text → C1/C6 unchanged by the layout work.
- Sticky/stacking is pure CSS positioning; it must not reorder DOM (C8). Wrappers added for the grid/sticky are non-semantic `<div>`s.
- **One new CTA (E2, owner-approved v0.3)** — spec in §4.3. It is the only content delta in this PRD and lands in its own commit (Phase 3b step 0); all other 3b work diffs **empty** against `content-baseline-v2`.

**Responsive & reduced-motion** (tiers as named in §13.6; values per §4.2)

| Context | Behavior |
|---|---|
| **D** — ≥1024 px wide, `min-height: 600px` | Full: two columns (5/7), sticky left column (header + CTA), sticky stacking cards, `--stack-step` 72 px, straddling badge. No scale; optional dim (3b-ii). |
| **T** — 768–1023 px wide, `min-height: 600px` | Single column, header + CTA on top in normal flow (**not** sticky); cards stack with the **desktop** step 72 px and straddling badge (D2). No scale; optional dim (3b-ii). |
| **M** — <768 px wide, `min-height: 520px` | Single column, header + CTA on top, not sticky; compact cards, badge inside padding, `--stack-step` **12 px** (D3). No scale, no dim. Rationale: keeps the signature feel on mobile (progressive enhancement, not on/off) at near-zero cost — sticky is compositor-cheap and needs no JS. |
| **L** — below the tier's height guard (motion allowed) | Plain non-overlapping list (`position: static` on cards). Header + CTA **not** sticky (may not fit). Guard values come from the per-card R9 check (D1), not from a fixed "tallest card" budget. |
| `prefers-reduced-motion: reduce`, ≥1024 px | **Two columns kept; left column (header + CTA) stays sticky** (pinning is not motion, §6); cards = static non-overlapping list, `gap-6`, no dim (D5). |
| `prefers-reduced-motion: reduce`, <1024 px | Single column, header + CTA on top in normal flow, cards static list (`gap-6` T / `gap-4` M). |
| No JS | Full tier behavior (pure CSS). Cards and CTA visible at final state (no prehide in CSS). |

### 4.2 Reconciled PM vs UI/UX decisions (v0.3)

Status of every row: **proposed — pending owner approval**. Until the owner rejects a row, the developer builds to this table; §4.1, §8.1 and §13.6 are aligned to it.

| # | Topic | v0.2 PM position (withdrawn) | Adopted (UI/UX, §13.6) | Why |
|---|---|---|---|---|
| D1 | R9 height guard | tallest card + `--stack-top` + 3 × step ≤ viewport | **Per-card check**: for each card i in 0..2, `--stack-top + i × --stack-step + height(i) + 24 px ≤ innerHeight`. The last card is never covered, so it is excluded. Media guards: D/T `min-height: 600px`, M `min-height: 520px`. | A card only needs to be fully readable before the next one covers it. The old formula over-reserved ≈ 150 px and would have pushed 1366×768 laptops into plain-list mode. |
| D2 | Tablet 768–1023 | single column with the mobile step | **Desktop step 72 px + straddling badge** (single column, header not sticky) | 96 + 72 + 258 + 24 = 450 px fits every tablet; the readable strip (badge + title) is the point of the effect. |
| D3 | Mobile step | ≈ 8 px | **12 px** | With 1 px borders, 8 px reads as a thick border; 12 px reads as layered sheets. |
| D4 | Buried-card scale / dim | optional scale **and** dim | **No scale ever.** Dim only, optional, Phase 3b-ii (separate PR), max overlay 0.30, D/T only | Scale breaks the straddled badge column and stacks a transform over `Reveal` (R6). |
| D5 | Reduced-motion ≥1024 | header in normal flow, cards plain list | **Two columns kept, left column sticky**, cards static list | An unpinned header leaves the left column empty beside a long list; sticky is not motion (§6). |

### 4.3 Services CTA — exception E2 (owner decision O1, v0.3)

**Goal**: give a visitor who has just read the services a one-click path to Contact, without leaving the section — matches the reference structure and the conversion mission.

| Aspect | Spec |
|---|---|
| Element | One `<a href="#contact">Let's talk</a>`. Label and href are **byte-identical** to the Nav CTA (`components/layout/Nav.tsx`, the `href="#contact"` link with text `Let&apos;s talk`). No icon, no arrow glyph, no extra copy. |
| Style | Reuse the Nav CTA classes exactly: `rounded-full border border-[var(--hairline)] px-5 py-2 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent-bright/50 hover:bg-accent/25` — **minus** Nav's visibility pair `hidden … md:inline-block`, replaced by `inline-block` (the Services CTA must be visible at every width). Spacing above it (`mt-*`) is UI/UX's call; recommended `mt-10`. The gap that `SectionHeader`'s bottom margin used to create before the cards moves **below the CTA** (via the `SectionHeader` `className` prop + a bottom margin on the CTA's wrapper at T/M/L; `0` at D where the cards sit in the other column), so header → CTA → cards spacing stays calm and no double margin appears. Prefer extracting the shared class string to one constant so the two links cannot drift — allowed (presentation-only refactor), but the Nav's rendered classes must stay byte-identical. |
| DOM position | Inside `section#services`, **inside the left-column sticky wrapper**, as the next sibling **after the `SectionHeader` root** (so after the lede `p`), before the cards container. Not inside `SectionHeader` itself (shared component; other sections must not get it). |
| Sticky behavior | Pins together with the header as one unit (one wrapper is sticky, not two). At D the wrapper height budget becomes header ≈ 390 px + CTA ≈ 76 px (mt-10 + 36) ≈ **466 px** → 96 + 466 = 562 ≤ 600 guard and ≤ 1366×768 inner height (≈ 625). Developer measures in Phase 3b; if wrapper bottom + 24 px > innerHeight at any D viewport, report — do not shrink copy. |
| Mobile / T / L | Normal flow directly under the lede, left-aligned, before the first card. Never sticky below 1024. Touch target ≈ 36 px tall (≥ 24 px WCAG 2.5.8). |
| Motion | The CTA has **no scroll-linked effect**. It may enter with the existing one-shot reveal (wrap in `Reveal` with one `data-reveal`, same as header items) so it doesn't appear before the header; no transform on hover, color transition only (same as Nav). Reduced-motion: final state immediately (globals rule); hover color change is not motion and stays as in Nav. No JS: visible. |
| Accessibility | Accessible name = its text, "Let's talk". **No `aria-label`, no `title`, no `aria-describedby`**. Two links with the same name and same destination on one page is valid (WCAG 2.4.4). Focus ring = the site's existing focus-visible style, must not be clipped by the sticky wrapper (no `overflow` on it — also R8). |
| Focus order | Natural DOM order: … About → **Services CTA** → next focusable after Services (Portfolio cards). No `tabindex`. Cards have no focusable children, so the CTA is the only Tab stop in Services. Activating it lands on `#contact` with `scroll-padding-top` respected (R4). |
| Nav indicator | Not affected; "Let's talk" never gets an active state (§13.1 Q8). |
| Out of scope | Any second CTA, WhatsApp/email links, different label (e.g. "Book a free consult"), analytics event (backlog #11 decides that separately). |

## 5. Animation budget & performance

- The brief budget still applies: 3D only in Hero/Services/Portfolio — this PRD **adds no 3D at all**.
- Animatable properties: **`transform` and `opacity` only** (plus `clip-path`/SVG `draw` for decoration). Forbidden: scrubbing `top/left/width/height/margin/filter: blur`, scrubbing `box-shadow`. (Static `position: sticky; top: …` for Stacking Cards is layout, not a scrub — allowed.)
- Max **~12 active scroll observers** on the whole page; off-viewport observers must not compute every frame.
- `will-change` only while the element is active, not permanent.

| Metric | Target (mobile, Lighthouse, throttled) |
|---|---|
| Performance score | ≥ baseline − 0 (no drop); target ≥ 90 |
| CLS | ≤ 0.05 and not above baseline |
| TBT | does not rise > 50 ms above baseline |
| LCP | does not rise above baseline |
| Frame rate | ≥ 55 fps sustained while scrolling (DevTools Performance, 4× CPU throttle on desktop; mid-range Android device if available) — target 60 |
| JS bundle route `/` | addition ≤ 5 KB gzip |

Lighthouse baseline: **taken in Phase 0** (2026-10-12) → `snapshots/lighthouse-baseline.json` (median perf 90, LCP 3564 ms, CLS 0, TBT 91 ms; TBT high-variance, compare against the run range).

## 6. Accessibility

- `prefers-reduced-motion: reduce` → all scrub/parallax/pin animation **off**; content shown at final state. Sticky may stay (it is not motion), active highlight may change without transition. **Exception: Stacking Cards — card overlap is disabled under reduced-motion; at ≥1024 the left column stays sticky (§4.1, D5).**
- **No JS**: all content visible & readable. No initial hidden state in CSS/SSR (`opacity:0` may only be set by client JS).
- No content depends on scroll position to be *readable* (scrub must not leave text at opacity < 1 in the reading zone).
- Focus: keyboard Tab to an element being transformed must stay visible with an intact focus ring; hash links (`#contact` etc.) land on final content, not mid-animation.
- No flashing / large parallax (> ~40 px) that triggers vestibular discomfort.
- Stacking Cards: buried cards stay fully in the DOM and in the a11y tree (no `aria-hidden`, no `inert`, no `display:none`); focus order = DOM order. Verified 2026-10-12: cards contain no focusable elements today (span, h3, p, ul/li) — if any are added later, focusing one must scroll it uncovered (see R10). The only focusable element in Services is the E2 CTA in the left column, which is never covered by cards (§4.3).

## 7. Mobile fallback

Progressive enhancement, not on/off:
- **< 768 px**: no multi-row pin/sticky (**exception: Services Stacking Cards, 12 px step, §4.1 tier M**); parallax amplitude ≤ 50% of desktop or off; only Hero scrub + existing reveal + hairline draw.
- **768–1023 px**: light parallax, no pin of headers (Services: single-column stacking with the **desktop 72 px step + straddling badge**, §4.1 tier T, D2).
- **≥ 1024 px**: full set in §4.
- Low-end detection optional (`navigator.hardwareConcurrency ≤ 4` → treat as mobile) — developer's decision, must be documented.

## 8. Technical approach (high-level)

| Option | Pros | Cons |
|---|---|---|
| **anime.js v4 `onScroll`** | Already used (Hero, ScrollProgress, ExperienceLine); `sync` number = smoothing; supported in all browsers; one mental model; 0 KB extra | Runs on the main thread; needs discipline with `revert()` & observer count; one-shot reveal must not be moved here (reason in `useRevealOnEnter`) |
| CSS `animation-timeline: view()/scroll()` | Off-main-thread (compositor), 0 JS, cheapest | Uneven support (Firefox not on by default as far as currently known — **developer to verify caniuse**); hard to tune per breakpoint/low-end; harder to debug |
| framer-motion `useScroll` | Ergonomic in React | Only used in the modal; using it in sections pulls framer into the initial bundle & adds a **4th system**; re-render risk |

**Recommendation: anime.js v4 `onScroll` as the main engine**, consistent with existing patterns, with these rules:
1. One new shared hook (e.g. `useScrollScrub`) wrapping `onScroll` + reduced-motion check + breakpoint + `revert()` — not ad-hoc `onScroll` per component.
2. One-shot reveal **stays** `useRevealOnEnter` (do not merge).
3. Pin = native **CSS `position: sticky`**, not JS pinning.
4. CSS `animation-timeline` **may** be used for purely decorative effects (hairline draw) as progressive enhancement inside `@supports`, fallback = static final state.
5. framer-motion is **not** used for scroll.

### 8.1 Stacking Cards — decided approach (v0.2)

Decision: **pure CSS `position: sticky`** for both the pinned left column and the card stack. Rationale: zero JS and zero observers for the core effect (0 KB bundle, nothing to freeze on fast scroll, works without JS), compositor-cheap, native scroll preserved (no scroll-jacking), trivially disabled per media query.

Spec:
1. **Grid**: section container becomes two columns at ≥1024 px (`lg:grid-cols-12`, left `col-span-5`, right `col-span-7`, `gap-16` — §13.6 Q11). The left column wrapper (non-semantic `div` around `SectionHeader` **and the E2 CTA**) is `position: sticky; top: var(--stack-top)` and **`align-self: start`** — grid items stretch by default, and a stretched item has no room to stick. `SectionHeader` gets an optional `className` prop so Services can drop the dead bottom margin (`lg:mb-0` etc.); default output for all other sections must stay byte-identical (§13.6 Q11, content-freeze note 2).
2. **Cards**: each card `position: sticky; top: calc(var(--stack-top) + var(--i) * var(--stack-step))`. `--i` (0..3) set from the data index via inline style (`style={{ "--i": index }}`); `--stack-top` / `--stack-step` are CSS custom properties with per-breakpoint values. `--stack-top` builds on the existing `--nav-h` token (already used by `scroll-padding-top`).
3. **Opaque card surface**: cards must have a fully opaque background, otherwise buried text shows through. Note: the existing `.card` class (`globals.css`) is translucent (`surface` 80%) → do not reuse it unchanged.
4. **Stacking order**: later cards paint above earlier ones by DOM order; no `z-index` juggling needed unless UI/UX adds shadows/overlays.
5. **Reveal interaction**: `Reveal` leaves an inline `transform` on each `data-reveal` card. A transform on the sticky element *itself* does not break sticky, but the dim scrub must go on a **pseudo-element** (`::after` overlay), never on the element `Reveal` tweens (R6). No scale at all (D4).
6. **Optional dim of buried cards** (Phase 3b-ii, D/T only, overlay opacity 0 → 0.30, badge above overlay): CSS `animation-timeline` inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`; static fallback = no dim. Caveat: a stuck element's own `view()` progress stalls while stuck. Drive it instead from a named `view-timeline` on the cards container with index-based `animation-range` (`--i`), or from the next card's timeline. Dim = a pseudo-element overlay's opacity (not text opacity). If CSS proves unworkable: anime.js `onScroll` fallback with **one** observer on the cards container (via `useScrollScrub`). If both are fragile, ship without dim.
7. **Reduced-motion / short viewport / plain-list mode**: `position: static` on cards (and normal gap) via `@media (prefers-reduced-motion: reduce)` and the tier height guards (`min-height` 600 px D/T, 520 px M — D1). Under reduced-motion at ≥1024 the left wrapper stays sticky (D5); in short-viewport L mode it does not.
8. **Hover**: row hover `bg-[var(--surface)]/60` is replaced by a card-level hover (UI/UX), with no hover `transform` on the sticky card (R6/V5).

## 9. Release phases

| Phase | Contents | Exit criteria |
|---|---|---|
| 0 — Baseline | Commit pending changes; tag `content-baseline-v1`; `scripts/content-snapshot.mjs` (incl. C8); Lighthouse mobile baseline recorded in 04 | Snapshot JSON + scores saved |
| 1 — Foundation | `useScrollScrub` hook; reduced-motion & no-JS tests; extend `scroll-test.mjs` (check scrubbed opacity in reading zone) | DoD + empty snapshot diff |
| 2 — Hero + Nav | Copy parallax, hint fade, active-section indicator | §5 metrics pass |
| 3 — About | Portrait parallax (Services sticky header from v0.1 superseded by Phase 3b) | §5 metrics pass |
| **3b — Services Stacking Cards (v0.2/v0.3)** | **Step 0 — E2 CTA + baseline update (own commit, first in the 3b PR or its own PR):** add only the "Let's talk" link after `SectionHeader` in the current layout (DOM position identical to the final layout); run `content-snapshot.mjs` vs `content-baseline-v1` → diff must equal the expected E2 delta (C9) exactly; regenerate + commit snapshot JSON; tag `content-baseline-v2`. **(i)** CSS sticky left column (header + CTA) + sticky card stack + badge restyle + `SectionHeader` `className` prop + tier guards D/T/M/L + reduced-motion layout (D5); **(ii)** *optional* buried-card dim, no scale (separate PR) | Step 0: C9 exact match + v2 tag exists · (i)/(ii): empty snapshot diff vs **v2** (C1–C8) · §5 metrics pass · no ancestor `overflow`/`transform` breaking sticky (R8) · full §13.6 viewport matrix passes · reduced-motion = non-overlapping cards, sticky left column at ≥1024 · keyboard + screen-reader pass (CTA reachable, name "Let's talk") · owner approves visual |
| 4 — Portfolio + Skills + Contact | Thumbnail parallax, sticky label, Contact accent | §5 metrics pass |
| 5 — Tuning | UI/UX + owner review at 375/1280 + real device | Owner approves |

Each phase = separate PR; work can stop after any phase without breaking the site. Phase 3b depends only on Phase 0 (needs no `useScrollScrub` unless the 3b-ii fallback is used).

## 10. Success metrics

- Content-snapshot diff = **0** in all phases (mandatory), except the single E2 commit, which must match the expected E2 delta exactly (C9).
- Lighthouse mobile: Performance, CLS, LCP, TBT do not regress vs baseline (mandatory).
- `scroll-test.mjs`: 0 stuck elements; 0 text at opacity < 1 in the reading zone.
- Reduced-motion & no-JS: 100% of content visible (manual + Playwright check).
- Qualitative: owner + UI/UX judge it "calm, premium, not busy".
- Conversion (CTA clicks / form submits) — **cannot be measured yet** (no analytics, backlog #11). Logged as a limitation, not a blocker.

## 11. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Opacity scrub makes content "disappear" on fast scroll / at certain positions | §4 rule (text opacity not scrubbed in reading zone); extend `scroll-test.mjs` |
| R2 | Mobile performance regression / jank | transform/opacity only; observer cap; §7 fallback; measure every phase |
| R3 | Split-text effects (per word/letter) change the a11y name & invariants C1/C6 | **Forbidden** in this PRD unless UI/UX proposes a technique that passes the snapshot (e.g. full `aria-label` + `aria-hidden` spans) — requires PM approval |
| R4 | Sticky/pin conflicts with `scroll-padding-top` & hash nav | Test all Nav links + mobile menu each phase (incl. `#services` landing with left header + first card in view) |
| R5 | Too much motion → contradicts "calm" | One main effect per section; UI/UX review |
| R6 | Tween conflict on the same property (scrub vs reveal on the same element) | Scrub on the wrapper, reveal on the child (pattern like `HeroObject` breathing vs scroll); Stacking Cards: no scale (D4); dim on a `::after` overlay (§8.1.5) |
| R7 | Effort diverted from P0/P1 items with more conversion impact | This PRD is P2; not started before P0 is closed |
| R8 (v0.2) | Sticky silently breaks if any ancestor has `overflow: hidden/auto/scroll` or `transform`/`filter`/`contain` | Verified 2026-10-12: no `overflow`/`transform` on `body`, `main`, `#services`, its container, or the `Reveal` wrapper. Keep it so; use `overflow-x: clip` (not `hidden`) if horizontal clipping is ever needed. Left column needs `align-self: start`. Add a Playwright check that cards' `getBoundingClientRect().top` holds at the expected value while scrolling. |
| R9 (v0.2) | Tall cards overflow the viewport on small laptops (1366×768) / phones — bottom of a card (bullets) never visible before it is buried | Card 02 has 7 bullets (tallest). Rule (D1, v0.3): for each card i in 0..2, `--stack-top + i × --stack-step + height(i) + 24 px ≤ innerHeight`; else plain-list mode via the tier `min-height` guards (600 px D/T, 520 px M). Worst cases: D 1024 wide = 510 px, M 375 = 470 px. Developer confirms heights with `getBoundingClientRect()` and reports deviations > 24 px. UI/UX keeps cards compact (presentation only). Test matrix §13.6. |
| R10 (v0.2) | Overlap hides content from keyboard focus / screen-reader users (focused or read element sits under the next card) | Cards stay fully in DOM and a11y tree, natural focus order, no `aria-hidden`/`inert`. Today cards have no focusable children. Screen readers read DOM, not paint, so text is reachable. If focusable content is ever added, `scroll-margin-top` ≥ the stacked offset. Reduced-motion users get no overlap. |
| R11 (v0.2) | Lighthouse/CLS regression from layout change | Sticky does not cause CLS; the grid change is static. Measure in Phase 3b against the Phase 0 baseline; 0 KB JS for the core effect. |
| R12 (v0.2) | Translucent card background → buried text bleeds through, low legibility | Opaque surface token (§8.1.3); visual review at 1280. |
| R13 (v0.3) | E2 commit smuggles in other content changes, or the shared CTA style drifts from Nav | C9 exact-delta check; `content-baseline-v2` only tagged after C9 passes; Nav rendered classes byte-identical (review diff). |
| R14 (v0.3) | Header + CTA too tall to stay pinned on short desktops | Budget ≈ 562 px at D (§4.3); measured in the §13.6 matrix; below the 600 px guard the column is not sticky (tier L). |

## 12. Open questions for UI/UX

### 12.A Original (v0.1) — answered in §13

1. Which "signature" effect per section is most worthwhile — approve/replace the §4 table? Which are dropped if only 3 can stay?
2. Services: sticky `SectionHeader` on the left (2 columns) vs on top? The current row layout is 3 columns `80px_1fr_1fr` — does sticky require a grid change (and is that still "presentation", not information structure)? *(v0.2: resolved by owner → §4.1.)*
3. Amplitude & smoothing: default parallax values (px) and `sync` (0.2–0.5?) that feel "spa", not "tech demo"?
4. Hero copy fading to 0.6 on exit — OK, or should copy stay at opacity 1 with only the object moving?
5. Hairline "draw" — used consistently in About/Skills/Services as a shared visual language, or too repetitive?
6. Portfolio: thumbnail parallax vs column offset — pick one?
7. Contact: does it need a decorative accent at all, or stay completely still for conversion focus?
8. Nav active indicator: visual only, or also `aria-current` (changes the a11y tree → needs an explicit exception in invariant C6)?
9. Scrub easing: `linear` (honest 1:1) vs the signature curve `cubic-bezier(.16,1,.3,1)` per segment?
10. Mobile: which effects (if any) must still be felt at 375 px so mobile doesn't feel like a "cheap version"?

### 12.B Stacking Cards (v0.2) — for UI/UX

> **[PM — v0.3]** All answered in §13.6. Where the answers differed from the PM defaults below (Q13 step, Q16 scale, Q18 tablet/mobile, Q19 reduced-motion, R9 formula), the UI/UX answer is adopted — §4.2 D1–D5, pending owner approval. The PM defaults written in the questions are historical.

11. **Column ratio & header pin**: left/right ratio at ≥1024 (e.g. 5fr/7fr or 4fr/8fr); header `top` offset below Nav; does the header (eyebrow + `display-lg` + lede, ±260–320 px) fit pinned at 1366×768?
12. **Card shape**: radius (reuse `rounded-2xl` like Portfolio for consistency?), padding, and inner layout (title/description/bullets stacked vs title-left/bullets-right) that keeps the tallest card (02, 7 bullets) within the R9 height budget.
13. **Offsets**: `--stack-top` and `--stack-step` values for desktop and mobile (PM default: mobile step ≈ 8 px).
14. **Surface & border**: which opaque token (`--surface` / `--surface-2`), border `--hairline` vs accent tint, optional shadow to separate layers; card hover state replacing the current row hover (no hover transform).
15. **Badge**: circle size, outline (`--hairline`) vs filled/tinted `accent-bright`, and placement "on the left edge" (inside the padding vs straddling the edge — straddling must not clip or need overflow).
16. **Buried-card dim/scale**: worth doing at all? If yes, amounts (e.g. scale 0.96, overlay ≤ 30%) and confirm the strip of each buried card stays legible (badge + title).
17. **Hairline draw relation**: **PM recommendation: superseded in Services** (cards replace rows, and the stacking *is* Services' one scroll effect); keep hairline draw in Skills only. Is a single-location motif still worth it, or should Skills drop it too / should cards get an accent top edge instead?
18. **Mobile**: confirm the PM recommendation (stack with small step, no scale/dim, plain list under a `max-height` guard) or choose plain list everywhere < 768.
19. **Reduced-motion list**: gap between cards and whether the left header sits on top (single column) or stays two-column without sticky.

### 12.C Owner questions (v0.2)

- **O1 — CTA in Services**: **RESOLVED (owner, v0.3)** — one CTA, label "Let's talk", target `#contact`, same style as the Nav CTA, in the left column after the lede. Registered as exception **E2**; spec §4.3, verification C9 + `content-baseline-v2` (§3), Phase 3b step 0 (§9).
- **O2 — Approve §4.2 D1–D5** (v0.3): the five Stacking Cards reconciliations adopted from UI/UX. Default until answered: build to §4.2.

## 13. UI/UX input

> Filled in by the UI/UX agent. Answer §12 by number, then additional proposals (if any) — every proposal goes through the PM idea gate.

Reviewer: UI/UX · 2026-10-12 · Basis: source `components/sections/*`, `layout/Nav.tsx`, 03-design-system.

> **[PM — v0.2]** Q2 and F1 are **overridden by the owner**: Services gets Stacking Cards (§4.1). Q5 / Q10 / §13.2 references to the Services hairline are superseded (pending UI/UX answer to Q17). Everything else in §13 stands.
> **[PM — v0.3]** §13.6 is adopted as the Services spec (D1–D5 in §4.2, pending owner approval) and amended for exception E2 (the "Let's talk" CTA in the left column). Statements in §13.6 that argued against a PM position are kept as rationale, but the PM position they refer to has been withdrawn.

**Short position.** The PM draft already respects the budget, but the total is still too busy for a "calm" mood — seven new effects of different kinds (parallax, sticky, clip reveal, column offset, glow, scroll-spy) will feel like a tech demo. My proposal: **one shared motion language**, plus a few exceptions.

**Signature effect (one, site-wide): "Accent hairline draw".** Hairlines are already the site's visual language (Services rows, About `dl`, Skills rows, Contact list). Signature = a 1 px `accent-bright` line "drawn" over the existing hairline (`scaleX` 0→1, origin left), tied to scroll. Used **only in Services and Skills** (the two longest lists), not everywhere that has a hairline.

### 13.1 Answers to open questions

**Q1 — Effect per section & top 3.**
Final table (replaces the "Proposed effect" column in §4 once PM agrees):

| Section | Decision | vs PM draft |
|---|---|---|
| Hero | Existing `HeroObject` scrub **only** + "Scroll" hint fade | Copy parallax/fade **dropped** (violates PM's own rule "max one main scrub per section" — Hero already has the object scrub) |
| Nav | Active-section indicator, **visual only** (discrete state, not scrub) | `aria-current` dropped (see Q8) |
| About | Portrait inner-image parallax **only** | Clip/mask reveal **dropped** (doubles with `Reveal` on the same wrapper → R6 risk); `dl` hairline **dropped** (2nd effect) |
| Services | **Signature hairline draw** per row | Sticky header **dropped** (see Q2) — *v0.2: overridden by owner, Stacking Cards (§4.1)* |
| Portfolio | No new scrub (existing reveal stagger + hover lift). Option B: thumbnail parallax | Column offset **dropped**; thumbnail parallax made optional (see Q6) |
| Skills | **Signature hairline draw** per row | Sticky label **dropped** — row height is only ±1–2 lines of tags (`py-8`), sticky travel ≈ 0, the effect isn't visible |
| Contact | Still (existing reveal only) | Decorative accent **dropped** (see Q7) |
| Footer | None | same |

If only 3 can stay: **(1) Hero object scrub** (existing, wow moment), **(2) Hairline draw Services + Skills** (signature), **(3) About portrait parallax** (the only "depth" moment below the fold). I treat the Nav indicator as *functional wayfinding*, not decoration — it may run outside the count of 3. Dropped first: Portfolio parallax, then hint fade.

**Q2 — Services sticky left vs top.** *(v0.2: overridden by owner → §4.1.)*
Both rejected.
- *Sticky on top*: `SectionHeader` (eyebrow + 2-line `display-lg` + lede) is ±260–320 px tall at 1280. If sticky, it covers passing rows, so it needs a solid background → it ends up as a second panel under the Nav (blur on blur). Reading space is gone.
- *Sticky on the left*: **potentially violates content-freeze (non-goal "redesign layout grid")**. The container must be split into 2 columns (e.g. 5fr/7fr), so the `80px_1fr_1fr` row only gets ±700 px → `display-md` title + description + bullet pills become narrow and wrap badly. The DOM stays the same, but visually this is a layout structure change, not just presentation.
- **Safe option (chosen)**: grid not touched at all; the scroll moment comes from the per-row hairline draw. If the owner still wants sticky, that is a separate layout decision outside this PRD.

**Q3 — Amplitude & smoothing.**
| Parameter | Value |
|---|---|
| Site-wide max parallax | **24 px** (tighter than the 40 px limit in §6) |
| About portrait | ±20 px desktop (≥1024) · ±16 px tablet · ±12 px mobile |
| Portfolio thumbnail (option B) | ±10 px, ≥1024 only |
| `sync` image parallax | **0.25** |
| `sync` hairline (if via anime.js) | **0.4** — the line must feel "connected" to the finger, not floating |
| `sync` hint fade | `true` (1:1) |
| `ScrollProgress` | `true` (existing, do not change) |
| `sync` lower bound | not < **0.15** — below that inertia feels laggy/"broken" on fast scroll & hash jumps |
Feel reference: `0.25` = "water", `0.35` = Hero (existing), `0.4` = line. No other values outside these three — consistency matters more than per-element tuning.

**Q4 — Hero copy fade 0.6.**
No. Copy stays **opacity 1, transform 0** in all states. Reasons: (a) the one-scrub-per-section rule, (b) H1 + two CTAs = the main conversion zone, so CTAs shifting/fading while still visible is counterproductive, (c) at 375 px the copy fills almost the entire first viewport, so opacity 0.6 would definitely hit the "reading zone" and violate the §4 rule. The object may leave; the copy stays as the anchor.
Allowed: the "Scroll" hint (existing element, not new text) fades 1→0 + `translateY` 0→8 px over hero progress 0–8%. Since the hint is outside the reading zone (bottom 32 px), this is safe.

**Q5 — Hairline draw consistent or repetitive?**
Consistent, but **limited to 2 sections** (Services 4 rows, Skills 4 rows = 8 lines). About `dl` (3 lines) and Contact list (3 lines) **not** — About already has the portrait parallax, Contact is the conversion zone. One motif, two places = signature. Four places = wallpaper.
Visual spec: 1 px overlay line, `accent-bright` at **45% opacity** (not 100% — 8 full-purple lines would be too busy on the `#08060c` canvas), over the existing `--hairline` border at the top edge of the row. Rest state after passing = **stays drawn** (no fade-out, to avoid extra motion).

**Q6 — Portfolio: thumbnail parallax vs column offset.**
Column offset **dropped**, because: it makes card bottoms uneven in the 3-column grid, conflicts with the hover `-translate-y-1.5` on the same `button` element (R6), and at 768–1023 (2 columns) the pattern breaks.
Thumbnail parallax = **option B, my recommendation: not now**. Thumbnails are only `h-48` (192 px), so ±10 px parallax is barely noticeable, yet it needs 1 observer per card, a new wrapper, and `scale ≥ 1.1` on the `img` so edges don't show gaps. **Potential content-freeze conflict**: this scale changes the thumbnail crop (C3 still passes since `src`/`alt` are the same, but it contradicts the spirit of "image not re-cropped" in §4). If the owner wants it: ≥1024 only, via CSS `view()` timeline, scale 1.1.

**Q7 — Does Contact need an accent?**
No — **completely still**. The ambient background (140 px blur glow drifting over 28 s) already gives "breath" behind it. A scrubbed accent near the form only pulls the eye away from the fields & submit button. The only motion in Contact: existing reveal + existing form states (sending/success/error).

**Q8 — Nav indicator & `aria-current`.**
**Visual only** for this PRD. Using `aria-current` = **violates invariant C6**, plus the snapshot becomes **non-deterministic**: which section is active depends on scroll position at dump time, so the diff can be flaky. A11y-wise, `aria-current="location"` is indeed ideal for scroll-spy, so I log it as a **separate owner decision** (needs an explicit C6 exception + snapshot dumped at a fixed scroll position, e.g. top = nothing active).
Visual spec: active link `text-muted-foreground` → `text-foreground`, plus a 1 px `accent-bright` underline via pseudo-element (no new DOM), `bottom: -6px`, width = text, `scaleX` 0→1 origin left, **320 ms `cubic-bezier(.16,1,.3,1)`**. Previous link exits: `scaleX` 1→0 origin right, 200 ms. Active rule: the section crossing the line at **40% of viewport height** (from top). In Hero: nothing active. "Let's talk" **never** gets an active state (it is a CTA, not wayfinding). Mobile menu: active link only changes color to `foreground`, no underline. Reduced-motion: color/underline change **instantly** (0 ms).

**Q9 — Scrub easing.**
**`linear` for all scrubs.** Smoothness already comes from `sync` (inertia); adding `outExpo` per segment doubles the easing. The result is the line "jumping" at the start then crawling at the end, which feels dishonest to the finger. The signature curve `cubic-bezier(.16,1,.3,1)` / `outExpo` is **reserved for time-based motion**: reveal, nav indicator, hover, modal. This rule should go into 03-design-system once PM agrees.

**Q10 — What must 375 px still feel?**
Three, all cheap (transform/opacity, no pin):
1. **Hero object scrub** (existing) — do not downgrade.
2. **Hairline draw** Services + Skills, same amplitude as desktop (`scaleX` is cheap). On mobile it is actually most noticeable because rows stack in 1 column and the line spans the screen width. *(v0.2: Services part superseded by Stacking Cards.)*
3. **ScrollProgress** + existing reveal.
About portrait parallax ±12 px is **conditional**: only if it passes ≥55 fps on the throttled profile (see risk V1). If it fails, mobile = 0 px and no replacement effect is needed. **Minor conflict with PM §7**: §7 says <768 only "Hero scrub + reveal + hairline"; this ±12 px portrait is a conditional addition.

### 13.2 Motion spec per section

Range notation: "A @ B" = edge A of the element meets position B of the viewport (0% = top, 100% = bottom). All scrubs `linear`. "Final state" = the state shown for no-JS and reduced-motion.

| Section / element | Trigger & scroll range | Property | Timing | Final / reduced-motion | Mobile <768 | Tablet 768–1023 |
|---|---|---|---|---|---|---|
| **Hero** `HeroObject` | existing (`top top` → `bottom top`) | existing | `sync 0.35` existing | existing | existing | existing |
| **Hero** "Scroll" hint | hero top @ 0% → hero progress 8% | `opacity` 1→0, `translateY` 0→8 px | `sync true` | opacity 1, static | same | same |
| **Hero** `HeroCopy` | — (existing mount stagger only) | — | — | opacity 1 | — | — |
| **Nav** indicator | section crosses the 40% viewport line (IntersectionObserver, discrete state) | color + underline pseudo `scaleX` | 320 ms in / 200 ms out, signature easing | instant, no transition | color only in menu | same as desktop |
| **About** portrait image | frame top @ 100% → frame bottom @ 0% | `translateY` −20→+20 px on a **new wrapper inside the `overflow-hidden` frame, wrapping only the `Image`** (caption bar does not move) | `sync 0.25` | 0 px | ±12 px (fps-conditional) | ±16 px |
| **Services** row hairline *(v0.2: superseded by Stacking Cards, §4.1 — pending Q17)* | row top @ 88% → row top @ 58% (finishes before entering the central reading zone) | `scaleX` 0→1, origin left, `::before` pseudo-element at the row's top edge | CSS `view()` or `sync 0.4` | line fully drawn | same | same |
| **Portfolio** | — | — (existing reveal + hover) | — | — | — | — |
| **Portfolio** thumbnail (option B) | card top @ 100% → card bottom @ 0% | `translateY` −10→+10 px, img `scale 1.1` | `sync 0.25` / `view()` | 0 px, scale 1 | off | off |
| **Skills** row hairline | same as Services | same | same | fully drawn | same | same |
| **Contact** | — | — | — | — | — | — |
| **Footer** | — | — | — | — | — | — |

Implementation notes (spec, not code):
- **Hairline = pseudo-element + CSS custom property / `view()` timeline**, not a new `<span>`. `<dl>` may only contain `div/dt/dd` and `<ul>` only `li`, so a new decorative element there = invalid HTML. Also, pseudo-elements add no node to the a11y tree, so the DOM diff is zero.
- Recommended hairline engine: **CSS `animation-timeline: view()` inside `@supports` + `@media (prefers-reduced-motion: no-preference)`**. It is off-main-thread and adds 0 JS observers. Browsers without support (check caniuse — Firefox) get the static final state, line drawn. This matches §8 point 4.
- JS observer count after revision: Hero (existing) + ScrollProgress + hint + portrait = **≤5**, well below the cap of 12.
- Default CSS (without JS) must = final state: line `scaleX(1)`, portrait `translateY(0)`. Prehide `scaleX(0)` only by timeline/JS.

### 13.3 Content-freeze flags

| # | Item | Status | Safe option |
|---|---|---|---|
| F1 | Services/Skills sticky left (changes container grid) | **Potentially violates** — non-goal "redesign layout grid". **v0.2: Services part overridden by owner** (exception E1, Stacking Cards §4.1); Skills part still dropped. | Services: Stacking Cards, presentation-only, C1–C8 must pass. Skills: dropped; hairline draw instead (grid untouched) |
| F2 | Nav `aria-current` | **Violates C6** + flaky snapshot | Visual-only via class/`data-*` + pseudo-element |
| F3 | Portfolio thumbnail `scale 1.1` | **Grey area** — C3 passes, but crop changes | Not done; if done, owner approves crop |
| F4 | Hairline as `<span aria-hidden>` inside `dl`/`ul` | **Violates HTML validity** (content model) | Pseudo-element on the existing row |
| F5 | "Scroll" hint at opacity 0 | Safe — `innerText` still present (not `display:none`/`visibility:hidden`) | — |
| F6 | Wrapper `div` inside the portrait frame | Safe — non-semantic, allowed by §3 | Make sure `Image fill` still has a positioned parent |
| F7 | Split-text / per-word | Not proposed | Still forbidden (R3) |
| F8 | Section index skips (05 without 04) | Stays as is — **do not "fix"** in a motion PR (that is content) | — |

### 13.4 Additional proposals (through PM idea gate)

1. **Motion tokens** in 03-design-system (once approved): `parallax-max 24px`, `sync` {water 0.25, hero 0.35, line 0.4}, rule "scrub = linear, time-based = signature easing", color `hairline-draw = accent-bright @ 45%`. Goal: developers don't tune numbers per component.
2. **Additional visual snapshot** (optional): no-JS screenshots at 375/1280 to confirm the final state (line drawn, portrait 0 px) is identical to reduced-motion.
3. **No other new effects.** If after Phase 3 the owner still finds it "static", only then open Portfolio option B — don't add effects up front.

### 13.5 Visual risk notes

- **V1 — backdrop-blur over a moving image.** The portrait caption (`bg-background/60 backdrop-blur-md`) sits over the image to be parallaxed, so the blur is recomputed every frame. This is the most likely jank point on mobile. Measure in Phase 3; if <55 fps, mobile amplitude = 0 (do not remove the blur — that is a visual change).
- **V2 — Too much purple.** 8 accent lines + ambient glow + ScrollProgress. Hence 45% opacity and the 2-section limit. Review at 1280 while scrolling Skills, since ScrollProgress and the Skills lines are visible together. *(v0.2: with Services hairline superseded, 4 lines remain.)*
- **V3 — Inertia vs hash jump.** Clicking Nav → `#about`: the portrait needs ±300 ms to "catch up" (`sync 0.25`). Still acceptable because the amplitude is small. Hairline via CSS `view()` is immediately at its final position, so there is no halfway state.
- **V4 — iOS Safari address bar** changes viewport height while scrolling, so `view()` ranges can jump slightly. Small amplitude makes this invisible; don't use narrow `vh`-based ranges. *(v0.2: also relevant to the Stacking Cards height guards — avoid a threshold right at common phone heights. v0.3: guards are `min-height` 600/520 px, D1.)*
- **V5 — Hover vs scrub on the same element.** Services rows have hover `bg-surface/60`. The hairline is on a pseudo-element, not the background, so it is safe. Never scrub `transform` on an element that also has a hover translate (Portfolio `button`).
- **V6 — Consistency without JS.** Accent lines will **appear drawn** in no-JS/reduced-motion. This is a *visual* (not content) change vs baseline, so PM must acknowledge it so it isn't treated as a regression in screenshot diffs. *(PM v0.2: acknowledged. Same applies to the Stacking Cards layout — the screenshot diff for Services is expected to change; the content snapshot must not.)*

### 13.6 Stacking Cards spec (answers to Q11–Q19)

Reviewer: UI/UX · 2026-10-12 · Basis: §4.1/§8.1, `components/sections/Services.tsx`, `components/ui/SectionHeader.tsx`, `PortfolioCard.tsx`, `app/globals.css`. Heights below are estimates from the type scale (Inter, current copy); the developer must confirm them with `getBoundingClientRect()` in Phase 3b and report deviations > 24 px.

**Tier names used below**
- **D** = ≥1024 px wide **and** `min-height: 600px` → full stacking, two columns.
- **T** = 768–1023 px wide **and** `min-height: 600px` → single column, desktop card style, stacking.
- **M** = <768 px wide **and** `min-height: 520px` → single column, compact card, stacking with small step.
- **L (plain list)** = any width below its height guard, **or** `prefers-reduced-motion: reduce` → no card sticky, no overlap.

#### Desktop wireframe (D, 1280 content width, mid-scroll: 01 and 02 buried, 03 sliding up)

```
 ┌──────────────────────────────── Nav (--nav-h 72) ───────────────────────────────┐
 └──────────────────────────────────────────────────────────────────────────────────┘
   ↕ 24px  (--stack-top = nav-h + 1.5rem = 96px from viewport top)
 ┌─ left 5fr (sticky, top: --stack-top) ─┐ gap-16 ┌─ right 7fr ────────────────────────┐
 │ 02 ── SERVICES                        │       (01)┌────────────────────────────────┐ │ ← card i=0, top 96
 │                                       │        │  │ Audit and Code Review          │ │   strip 72px: badge + title line 1
 │ What I take                           │       (02)├────────────────────────────────┤ │ ← card i=1, top 168
 │ off your plate.        (display-lg)   │        │  │ Full-Stack Delivery            │ │
 │                                       │       (03)├────────────────────────────────┤ │ ← card i=2, top 240 (sticking now)
 │ Four ways to work together. Each one  │        │  │ Bugfixing and Maintenance      │ │
 │ is scoped, priced, and time-boxed     │        │  │ description (text-sm, 2–3 ln)  │ │
 │ before anything starts.   (lede)      │        │  │ (pill)(pill)(pill)(pill)       │ │
 │                                       │        │  └────────────────────────────────┘ │
 │ ( Let's talk )   ← E2 CTA, v0.3       │        │                                     │
 └───────────────────────────────────────┘        │   (04) next card arrives from below │
                                                  └─────────────────────────────────────┘
 (NN) = existing `no` span as a 40px circle, centered on the card's left border (half outside).
```

#### Q11 — Column ratio & header pin
- Grid at D: `lg:grid lg:grid-cols-12 lg:gap-16`; left wrapper `lg:col-span-5`, right `lg:col-span-7` (= 5fr/7fr). At 1280 content width: left ≈ 507 px, right ≈ 709 px; at 1024: ≈ 367 / 513 px. 4fr/8fr rejected: left ≈ 380 px at 1280 pushes the `display-lg` title to 4 lines.
- Left wrapper: `position: sticky; top: var(--stack-top); align-self: start`. Header top **equals** card 0's sticky top, so the heading and the first card share one top line (one baseline, calmer).
- Header height at D (estimate): index row 16 + 24 + title 3 lines × 75 + 24 + lede 3 lines × 34 ≈ **390 px at 1280–1440**, ≈ 340 px at 1024. At 1366×768 (inner height ≈ 625–657 px): 96 + 390 = 486 → **fits**, ≈ 140 px spare. *(PM v0.3: plus the E2 CTA ≈ 76 px → 562 px, ≈ 63 px spare; within the 600 px guard — §4.3.)*
- **Needed code change (presentation only):** `SectionHeader`'s root has a hard-coded `mb-16 md:mb-24`. In the sticky column that bottom margin is dead height. Add an optional `className` override (default unchanged for other sections) so Services can use `mb-16 md:mb-16 lg:mb-0`. No text change.
- Remove `hairline-t` from the cards container and the row `border-b` in Services (rows become cards).

#### Q12 — Card shape & inner layout
- Radius: **`rounded-2xl` (16 px)** at all tiers — same as Portfolio cards, one radius family site-wide. No `overflow-hidden` on the card (the badge straddles the edge; overflow would clip it).
- Padding D/T: `pt-6 pr-8 pb-8 pl-10` (24/32/32/40). M: `p-6`.
- Inner layout: **stacked, single column** (title-left/bullets-right rejected: right column is only 513–709 px).
  1. Header row: `flex items-center gap-5` (M: `gap-3`) → badge (`no` span) + `h3.display-md`.
  2. Description `p`: `mt-4`, existing `text-sm leading-relaxed text-muted-foreground`, `max-w-prose`.
  3. Bullets `ul`: existing `mt-5 flex flex-wrap gap-2` + existing pill styles (unchanged).
- Height budget (estimate): card 02 (7 bullets, tallest) ≈ **258 px at 1280–1440**, ≈ 318 px at 1024, ≈ 346 px at 375. Others ≈ 220–240 px (D).
- **R9 rule, corrected.** A card only needs to be fully visible *before the next card covers it*, and the last card is never covered. Correct check: for each card i in 0..2: `--stack-top + i × --stack-step + height(i) + 24 px safety ≤ innerHeight`. Worst case D = card 02 at 1024: 96 + 72 + 318 + 24 = **510 px**; worst case M = card 02 at 375: 88 + 12 + 346 + 24 = **470 px**. The v0.2 PM formula (tallest + top + 3 × step) over-reserved ≈ 150 px and would wrongly have put 1366×768 into plain-list mode. *(PM v0.3: adopted as D1; R9 updated.)*

#### Q13 — Offsets
| Token | D | T | M |
|---|---|---|---|
| `--stack-top` | `calc(var(--nav-h) + 1.5rem)` = 96 px | same as D | `calc(var(--nav-h) + 1rem)` = 88 px |
| `--stack-step` | `4.5rem` = 72 px (= pt 24 + badge 40 + 8 breathing → badge + first title line stay visible) | same as D | `0.75rem` = 12 px |
| Card gap in flow | `gap-6` (24 px) | `gap-6` | `gap-4` (16 px) |
| Height guard | `min-height: 600px` | `min-height: 600px` | `min-height: 520px` |

Guard values sit away from common phone/laptop heights (V4: iOS address bar flips ≈ 548↔627 at 375×667, so 520 is safe; landscape phones ≈ 320–430 fall to plain list as intended). 12 px on M (not the v0.2 PM default of 8 px): with 1 px borders, 8 px reads as a thick border, 12 px reads as layered sheets. *(PM v0.3: adopted as D3.)*

#### Q14 — Surface, border, shadow, hover
- Surface: **opaque `var(--surface)`** (`#0f0b16`) — same family as Portfolio `.card`, just without the 80% transparency. Do **not** reuse `.card` (translucent). No new token.
- Border: 1 px `var(--hairline)` on all sides, **top edge** `color-mix(in srgb, var(--accent-bright) 24%, transparent)`. The brighter top edge is what separates one layer from the next on a near-black canvas; it also carries the "line" motif (see Q17). Static, never animated.
- Shadow: **none.** On `#08060c` a black shadow is invisible, and an upward shadow would darken the badge of the buried card. Layer separation = top edge + dim (Q16).
- Hover (`@media (hover: hover)` only): border → `color-mix(accent-bright 40%)` (all sides), background → `var(--surface-2)`, pills keep the existing `group-hover` style. 350 ms `ease` for colors (matches `.card`). **No transform**, no shadow.
- States: no focus/active/disabled states — the card has no interactive children (§6). Empty/loading/error: N/A (static content).

#### Q15 — Badge
- The existing `<span>{service.no}</span>`, restyled: `size-10` (40 px) circle, `rounded-full`, `inline-flex items-center justify-center shrink-0`, `bg-accent` (`#4b0082`), text `text-foreground text-sm font-medium tabular-nums`, 1 px border `color-mix(accent-bright 40%)`. Contrast `#f4f1f8` on `#4b0082` ≈ 11.8:1 (AA pass at 14 px). The current `text-accent-bright` on the card surface is ≈ 6:1; the filled badge stays legible when dimmed (Q16).
- Placement D/T: **straddles the left border, in flow**: `-ml-15` (−60 px = pl 40 + half the badge 20). Result: the badge center sits on the border; the title starts exactly at the 40 px content edge (60 − 40 − 20 gap = 0), aligned with description and pills. No `absolute`, so C8 holds (the badge stays visually first, left of the title, same as DOM). Needs: no `overflow` on the card and its ancestors (also R8), and the column gap (64 px) absorbs the 20 px overhang.
- Placement M: **inside the padding** (no straddle; the 24 px gutter is too tight and the overhang would nearly touch the screen edge).
- `position: relative; z-index: 1` on the badge so the dim overlay (Q16) never covers it.

#### Q16 — Buried-card dim / scale
- **Scale: no.** With a straddled badge, scaling buried cards shifts each badge inward by a different amount and breaks the clean vertical badge column; it also adds a transform layer on top of `Reveal`'s transform (R6). Calm > drama.
- **Dim: yes, as Phase 3b-ii only (optional; 3b-i ships without it).** Overlay = card `::after` (`content: ""`, inset 0, `border-radius: inherit`, `background: var(--background)`, `pointer-events: none`), opacity **0 → 0.30**. Badge sits above the overlay (z-index 1) → stays at full contrast.
- Legibility at 30% dim: title ≈ 8.7:1 (pass), badge unaffected (≈ 11.8:1). Do not go above 0.30 — at 0.40 the muted description would drop below 3:1 (it is covered anyway, but the strip edge shows it during the transition).
- Range: card i dims while card i+1 travels the last `4 × --stack-step` (≈ 288 px) before it sticks; holds at 0.30 while buried; reverses on scroll up. Linear. D and T only.

#### Q17 — Hairline draw relation
- **Agree with PM:** Services does not get the hairline draw — the stacking *is* Services' one scroll moment.
- **Skills keeps the hairline draw** (spec as §13.2): it is Skills' only scroll-linked moment; without it Skills is fully static again (Goal 1).
- The motif is not single-location: Services cards carry a **static** accent top edge (24%), Skills rows a **drawn** accent line (45%). Same "line in accent-bright" language, one moving instance. The card top edge is **not** animated (would be a second Services effect).

#### Q18 — Mobile (<768)
- **Confirm the PM recommendation with two changes:** step **12 px** (not 8), and the guard is **`min-height: 520px`** (from the corrected R9 check above).
- M card: `p-6`, badge inside padding, header `gap-3`, no hover, no dim, no scale. Header is in normal flow on top (not sticky), `mb-16` *(v0.3: this gap now sits below the E2 CTA, §4.3)*.
- **768–1023 (tier T):** use the desktop card style, straddled badge, **72 px step**, not the mobile step *(PM v0.3: adopted as D2; §4.1 table updated)*. Card 02 at 768 ≈ 258 px; 96 + 72 + 258 + 24 = 450 → fits easily on tablets, and the readable strip (badge + title) is the point of the effect. The container gutter at `md` is 40 px, enough for the 20 px overhang.

#### Q19 — Reduced-motion / plain-list layout
- ≥1024: **keep two columns**; the **header (with the E2 CTA) stays sticky** (pinning is not motion, §6) so the left column isn't empty *(PM v0.3: adopted as D5)*; cards are a static list, `position: static`, `gap-6`, no dim, no overlap. Same tokens, same badge (straddled), same hover (color only).
- <1024: single column, header on top in normal flow, cards static list, `gap-6` (T) / `gap-4` (M).
- Short-viewport (below the height guard, motion allowed): same as reduced-motion at that width, except the header is **not** sticky (it may not fit).
- No-JS: the full tier behavior applies (pure CSS); `Reveal` never prehides in CSS.

#### Motion spec
| Element | Trigger | Property | Range / value | Easing / timing | Reduced-motion | Mobile (M) |
|---|---|---|---|---|---|---|
| Left header (D) | CSS sticky | `top` (static layout, not scrub) | `--stack-top` 96 px; releases at grid end | native scroll | sticky kept, no change | not sticky |
| Card i (D/T/M) | CSS sticky | `top` (static) | `calc(--stack-top + --i × --stack-step)` | native scroll | `position: static` | step 12 px |
| Card reveal (existing) | `Reveal` on enter | `opacity`, `translateY` | existing values, 110 ms stagger | existing (`outExpo`) | final state (globals) | existing |
| Buried dim (3b-ii, D/T) | named `view-timeline` on the cards container (or 1 anime.js observer fallback) | `::after` `opacity` | 0 → 0.30 over the ≈ 288 px before card i+1 sticks; hold; reversible | `linear`, scrub (`sync 0.4` if JS) | none (0) | none |
| Card hover (D/T) | `:hover` (`hover: hover`) | `border-color`, `background-color` | hairline → accent-bright 40%; surface → surface-2 | 350 ms `ease` | instant (0 ms) | none |
| Badge | — | — | static | — | static | static |

Observer count added: **0** (3b-i) / ≤ 1 (3b-ii JS fallback). JS bundle: 0 KB (3b-i).

#### Viewport test matrix (Phase 3b)
| Viewport | Tier | Check |
|---|---|---|
| 1366×768 (inner ≈ 625–657) | D | stacking **on** (≥ 600); header + CTA fully visible pinned (bottom ≈ 562, v0.3); card 02 bottom visible when stuck (≈ 168 + 258 = 426); strip of 01/02/03 shows badge + title line 1 |
| 1280×800 | D | same; badge overhang does not touch the left column text (gap 64) |
| 1440×900 | D | same; check the stack and header release together at the section end, no jump |
| 1920×1080 | D | content capped at 1280 (`max-w-7xl`); left-column lede ≤ 3 lines; no extra empty space below the stack |
| 1024×768 | D | worst desktop case: card 02 ≈ 318 px, 96 + 72 + 318 = 486 visible; title 3 lines in 367 px |
| 768×1024 | T | single column, header not sticky; step 72; badge overhang inside the 40 px gutter |
| 375×667 (inner ≈ 548–627) | M | stacking **on** (≥ 520) during address-bar flip, no flicker between modes; card 02 fully visible before 03 covers it |
| 667×375 / any height < guard | L | plain list, no overlap |
| reduced-motion @1280 and @375 | L | non-overlapping list; header sticky only at ≥1024 |
| all | — | `#services` from Nav lands with header + card 01 visible (R4); Tab never lands under a card; content snapshot diff = 0 vs `content-baseline-v2` |
| all (v0.3) | — | E2 CTA: visible at every tier, directly after the lede and before card 01; one Tab stop between About and Portfolio; focus ring unclipped; Enter lands on `#contact`; pinned with the header at D (incl. reduced-motion), normal flow at T/M/L |

#### Content-freeze notes
1. **Badge straddle** uses a negative margin in flow, not `absolute` → C8 safe (visual order = DOM order). If the developer reaches for `absolute`, that is a C8 violation — reject.
2. **`SectionHeader` `className` override** touches a shared component; default must stay byte-identical for the other sections (snapshot will catch it, but review the diff).
3. **Dim overlay** uses `content: ""` (empty) — allowed; any non-empty `content` is forbidden (§3).
4. ~~No CTA in the left column (O1 default).~~ **v0.3: O1 resolved — one "Let's talk" → `#contact` CTA after the lede (exception E2, §4.3).** It is the only content delta; verified by C9 and re-baselined as `content-baseline-v2`. Badge, card and layout work must still diff empty against v2.
5. Removing `hairline-t`/`border-b` and adding the filled badge = visual-only change; expected screenshot diff (V6), content snapshot must be empty.
6. Accent-bright 24% top edge + 4 filled `bg-accent` badges add purple mass in one viewport (V2) — review at 1280 together with ScrollProgress; fallback = badge `bg-accent-deep`.
7. New values that will become tokens once PM agrees (then written to 03-design-system): `--stack-top`, `--stack-step`, card top-edge `accent-bright 24%`, dim max `0.30`. No new color tokens.

---

## 14. Implementation model guidance (v0.3)

| Work | Model | Why |
|---|---|---|
| Phase 0 (baseline tag, `content-snapshot.mjs`, Lighthouse baseline) | **Sonnet 5.5** | Well-specified scripting and bookkeeping. |
| Hairline draw (Skills), "Scroll" hint fade, About portrait parallax, Nav active-section indicator | **Sonnet 5.5** | Small, isolated effects with full specs in §13.2 / Q8. |
| Phase 3b (Step 0 E2 CTA + baseline v2, Stacking Cards 3b-i, optional dim 3b-ii) | **Opus 5.5** | Multi-constraint layout (sticky ancestry R8, tier guards D1, C8/C9 invariants, reduced-motion D5). |
| Any fps / jank debugging (any phase, e.g. V1 backdrop-blur over the portrait) | **Opus 5.5** | Needs trace reading and root-cause reasoning. |

**Review**: one independent review pass (PM acceptance against §9 Phase 3b exit criteria + §13.6 matrix) after Phase 3b, before the owner's visual approval. Other phases go through the normal PM acceptance only.

---

## Appendix — Definition of Done (per motion PR)

Standard DoD from [04](04-status-and-backlog.md) **plus**: empty `content-snapshot` diff (375 & 1280) against the current baseline (`content-baseline-v1` until Phase 3b step 0, `content-baseline-v2` after) · Lighthouse mobile does not regress vs baseline · reduced-motion & JS-disabled: all content visible · `scroll-test.mjs` 0 stuck · no changes to data constants · ≥ 55 fps while scrolling on the throttled profile. **Stacking Cards PR adds**: sticky verified at the §13.6 viewport matrix · reduced-motion = non-overlapping cards, left column sticky at ≥1024 (D5) · no scale on cards (D4) · no ancestor `overflow`/`transform` introduced · `SectionHeader` default output unchanged for other sections · keyboard + screen-reader walkthrough of Services. **E2 commit adds**: snapshot diff vs v1 equals the expected E2 delta exactly (C9) · link text/href byte-identical to the Nav CTA, no `aria-label`/`title` · Nav CTA rendered classes unchanged · snapshot JSON regenerated and committed · tag `content-baseline-v2` created.
