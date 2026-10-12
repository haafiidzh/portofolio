# 01 — Vision & Design Brief

> Original source: root `CLAUDE.md`. Its content was moved here; the root `CLAUDE.md` now only imports this file so Claude Code still loads it automatically. **Edit the brief in this file.**
> Note: this brief is the *original intent*. The implementation has drifted in several places — see [04-status-and-backlog.md](04-status-and-backlog.md).

## Project Overview

A personal portfolio website styled as a "digital spa" experience. The information architecture and interaction patterns are modeled on **animejs.com** (bold hero typography, feature-grid sections, scroll-triggered mini demos, stat/breakdown sections), but the visual mood is warm, calm, and organic — spa/wellness-inspired — rather than dark/techy.

The site positions the owner as a Fractional CTO / full-stack engineer, using the same structural logic anime.js uses for its own features:

| animejs.com pattern | This project's equivalent |
|---|---|
| "All-in-one animation engine" tagline | Personal value proposition headline |
| Feature grid (Timeline, Scroll Observer, SVG toolset, etc.) | **Services** grid, each with a small 3D/animated icon |
| Live auto-playing code snippets on scroll | Micro-interactions that autoplay when a section enters the viewport |
| Bundle size breakdown chart | Skill/stack breakdown chart |
| 3-column footer + newsletter | Contact footer (nav, contact info, socials) |

## Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript
- **Styling**: Tailwind CSS with CSS variables for theming
- **Scroll animation**: anime.js v4 (Scroll Observer API) — primary choice, matches the reference site; GSAP + ScrollTrigger is an acceptable alternative for more complex timelines
- **3D**: React Three Fiber + drei, low-poly/organic models only (keep bundle and GPU cost low)
- **Micro-transitions**: Framer Motion for section/hover transitions
- **Deployment**: Vercel
- **Content (optional)**: Sanity or Notion API if portfolio/testimonials need to be editable without a redeploy

## Design Direction

- **Background**: warm dark neutral (e.g. `#1C1815` charcoal-brown), not pure black — keep the anime.js dark canvas but warmer
- **Accent**: one organic accent color used consistently for CTAs, highlighted text, links — e.g. sage green `#8CA787` or terracotta `#C97B5A`
- **Typography**: one bold display font for headlines (modern serif or heavy sans — personal, calm feel), one neutral sans for body text
- **Spacing**: generous negative space, matching anime.js's uncluttered layout — avoid dense sections

## Page Sections (build in this order)

1. **Hero / About** — two-line bold headline + one-sentence value prop, primary CTA ("View My Work") + secondary CTA ("Contact"), ambient background 3D object (organic blob / candle / water ripple), slow looping motion with subtle mouse-parallax
2. **Services** — 3–6 cards, each with a title, 2–3 scope bullets, and a small 3D/animated icon that plays on hover or on viewport-enter
3. **Experience** — vertical or horizontal-scroll timeline; line "draws" itself on scroll (SVG line-draw, same technique anime.js uses)
4. **Portfolio** — case-study grid (thumbnail, title, short stack list, one-line impact statement); click opens detail (problem → solution → stack → result); subtle cursor-following tilt on hover, not a full 3D model
5. **Testimonials** — carousel or grid of client quotes (photo/initials, name, role/company, short quote); slow autoplay or manual swipe — keep pace calm, not busy
6. **Contact** — short form (name, email, message) or direct CTA to WhatsApp/email; secondary info block (email, Threads/LinkedIn, location); optional subtle success micro-animation on submit

## Animation Budget (performance guardrail)

Only Hero and Services/Portfolio should carry meaningful 3D weight. Do not add 3D to every section — this mirrors how anime.js puts one strong visual per section rather than animating everything:

1. **Hero** — heaviest 3D asset, the "wow moment"
2. **Services** — small looping 3D icons per card, lightweight
3. **Portfolio** — lightweight hover tilt only, no full 3D models
4. **Experience / Testimonials / Contact** — 2D scroll-reveal only, no 3D

Always build a lighter fallback for mobile (CSS/2D animation) instead of disabling 3D outright — progressive enhancement, not binary on/off.

## Conventions

- Component structure: one section = one component under `components/sections/`
- Keep 3D scenes isolated in their own client components (`"use client"`) and lazy-load them (`next/dynamic`, `ssr: false`) to avoid blocking initial page load
- Respect `prefers-reduced-motion` — disable non-essential motion when set
- Run Lighthouse (mobile) after every section is added, not just at the end

## Next Steps (from the original brief)

1. Gather assets: profile photo, 3–4 best case studies, 3–5 real testimonials
2. Pick one 3D reference model (organic blob / candle / water) — source from Sketchfab or build custom low-poly in Blender
3. Scaffold: Next.js + Tailwind + R3F + anime.js/GSAP
4. Build Hero first (highest performance risk), then move through remaining sections
5. Test mobile performance from the start, not at the end
