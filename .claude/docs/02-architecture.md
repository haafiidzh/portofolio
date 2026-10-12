# 02 — Architecture (Technical Documentation)

Snapshot: 2026-10-12, branch `main`, 1 commit ("Initial Commit"). All facts below were verified against source.

## Actual stack

| Layer | Version | Notes |
|---|---|---|
| Framework | Next.js **16.3.3**, App Router | brief says "14+" — OK |
| UI | React 19.2.8 | React Compiler lint rules active (`eslint-config-next`) |
| Styling | Tailwind CSS **v4** via `@tailwindcss/postcss` | no `tailwind.config`; tokens in `@theme inline` inside `app/globals.css` |
| Scroll/reveal animation | `animejs` ^4.5 | `animate`, `stagger`, `onScroll`, `svg.createDrawable` |
| Transitions | `framer-motion` ^13 | used only in `PortfolioModal` |
| 3D | `three` 0.185, `@react-three/fiber` 9, `@react-three/drei` 10 | used only by `layout/morph/*` (currently **not mounted**, see below) |
| Font | Inter via `next/font/google` (400–700) | `--font-display` = `--font-sans` (no separate display font) |
| Test tooling | `playwright` (devDep) | used by `scroll-test.mjs`, not a test suite |
| Deploy | Vercel (target) | no config / env yet |

Missing: backend/API routes, database, CMS, analytics, test runner, CI, `robots`/`sitemap`, OG image.

## Directory structure

```
app/
  layout.tsx        Root layout: font, metadata, AmbientBackground, ScrollProgress, Nav, Footer
  page.tsx          Single page: Hero, About, Services, Portfolio, Skills, Contact (Experience commented out)
  globals.css       Palette, typography (.display-*, .eyebrow, .lede), .card, ambient bg, reduced-motion
components/
  layout/           Nav, Footer, ScrollProgress, AmbientBackground, MorphScene (+ morph/*)
  sections/         1 section = 1 file; sub-components in a same-named folder (hero/, about/, ...)
  ui/               Reveal, SectionHeader, useRevealOnEnter
public/images/      Profile photo + case-study screenshots
scroll-test.mjs     Playwright script: audits [data-reveal] elements stuck at opacity<1
```

## Render flow

`app/layout.tsx` (server) wraps every page with fixed layers (`AmbientBackground` z -50, `ScrollProgress`, `Nav` z 50), then `children` + `Footer`. `app/page.tsx` (server) stacks the sections in order. Sections needing state/animation are client components (`"use client"`); static sections (About, Services, Skills, Contact, Portfolio shell) stay server components and only wrap client children (`Reveal`, `PortfolioGrid`, etc.).

Navigation = hash anchors (`#about`, `#services`, `#projects`, `#skills`, `#contact`) with `scroll-behavior: smooth` and `scroll-padding-top: var(--nav-h)`.

## Animation systems (three distinct mechanisms)

1. **One-shot reveal** — `ui/Reveal.tsx` + `ui/useRevealOnEnter.ts`
   Children marked `data-reveal` are pre-hidden (opacity 0, translateY) in a layout effect, then played by anime.js (`outExpo`, stagger) when the root enters the viewport. Triggers: `IntersectionObserver` + scroll/resize check + 6 s failsafe timer (content must never stay invisible). Deliberately does **not** use `onScroll()` autoplay because it can freeze half-played on fast scrolls (rationale in the hook's header comment). Elements already above the viewport are revealed instantly.
2. **Scroll-bound** — `HeroObject` (layered SVG, `onScroll` with `sync: 0.35`), `ScrollProgress` (bar width), `ExperienceLine` (line-draw). Playback is tied to scroll position and is reversible.
3. **Mount-time entrance** — `HeroCopy` (above the fold, time-based stagger).

All respect `prefers-reduced-motion` (content cleared/shown immediately; CSS keyframes disabled in `globals.css`).

## 3D / morph blob

`layout/MorphScene.tsx` → `next/dynamic` (`ssr:false`) → `morph/MorphCanvas` (R3F `Canvas`, dpr [1,1.5]) → `MorphBlob` (`Sphere` + `MeshDistortMaterial`). `useScrollMorph` interpolates parameters (color, distort, scale, posX, opacity) between sections (`hero`, `services`, `experience`, `portfolio`, `contact`); `useMouseParallax` adds parallax. Desktop ≥768px and no reduced-motion → canvas; otherwise → blurred CSS blob.

**Status: code is complete but `MorphScene` is not imported anywhere** → no 3D is active in production. The hero uses 2D SVG (`HeroObject`). three/R3F/drei remain in `package.json` (they stay out of the bundle while unimported).

## Data & content

All content is **hardcoded** as constants inside section components (`PROJECTS` in `Portfolio.tsx`, `SERVICES`, `FACTS`, `GROUPS`, `EXPERIENCE`, `COLUMNS` in Footer, `LINKS` in Nav/ContactInfo). The `PortfolioProject` type is exported from `PortfolioCard.tsx`. No CMS. Changing content = redeploy.

## Contact form

`ContactForm.tsx`: client component, `onSubmit` → `preventDefault()` → `setSubmitted(true)`. **Sends nothing** (comment: `Wire this to an API route / form service before going live`). The success message always shows.

## Portfolio modal

`PortfolioGrid` stores the selected project → `PortfolioModal` (framer-motion `AnimatePresence`; backdrop click / Esc / ← → for the gallery). Uses raw `<img>` (not `next/image`).

## Assets

| File | Size | Used by |
|---|---|---|
| `Profile.JPEG` | 2.5 MB | About (scaled 200% via CSS) |
| `IMG_9418.JPEG` | 12 KB | favicon (`metadata.icons`) |
| `Image Porto - 1..4`, `- Invoice` | 40–176 KB | case studies 1 & 2 |
| `web-portfolio-mockup_10/11.png` | ~870 KB each | case study 3 (RAG) |
| `public/*.svg` | — | create-next-app leftovers (unused) |

## Code that exists but is not mounted (dead code)

`MorphScene` + `morph/*`, `sections/Experience` (+ `experience/*`, commented out in `page.tsx`; its import triggers an unused warning), `sections/services/ServiceCard` & `ServiceIcon` (Services is now a row list, not cards), `hero/HeroPortrait`, `hero/HeroBackground` & `HeroFallback` (not imported).
