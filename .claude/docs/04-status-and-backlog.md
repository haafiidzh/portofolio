# 04 — Status, Gaps & Prioritized Backlog

Analyzed 2026-10-12. Living document: the **PM agent owns it** (`.claude/agents/pm.md`). Update whenever priorities change.

## Position vs original brief

| Brief | Actual | Status |
|---|---|---|
| Positioning: Fractional CTO | Freelance **AI Full-Stack Engineer** (RAG, chatbots, automation) | Positioning pivot — brief not updated |
| Warm/spa mood, `#1C1815` + sage/terracotta | Dark purple `#08060c` + `#4B0082` | Diverged (intentional? **confirm with owner**) |
| Separate display font | Inter only | Not done |
| Hero 3D "wow" | Layered 2D SVG; 3D blob written but not mounted | Diverged |
| Services: cards + 3D icons | Row list + pills, no icons | Diverged |
| Experience timeline (line-draw) | Built, **commented out** in `page.tsx` | Disabled |
| Portfolio hover tilt | Hover `-translate-y`, no tilt | Partial |
| **Testimonials** | None | **Missing** |
| Working contact form | Form sends nothing | **Functionally broken** |
| Lighthouse per section | No evidence it was run | Not done |
| Assets: 3–5 testimonials, 3–4 case studies | 3 case studies, 0 testimonials | Short |

## Technical findings (verified)

`tsc --noEmit`: clean. `eslint`: **8 errors, 5 warnings**.

| # | Finding | Location |
|---|---|---|
| T1 | `react/no-unescaped-entities` ×5 (error) — raw `'` in JSX | `About.tsx:26,29` |
| T2 | `react-hooks/immutability` ×2: `handlePrevImage/NextImage` used in effect before declaration | `PortfolioModal.tsx:24-25` |
| T3 | `react-hooks/set-state-in-effect` — resets `imageIndex` via effect | `PortfolioModal.tsx:17` |
| T4 | `exhaustive-deps` on modal keyboard effect (stale closure risk) | `PortfolioModal.tsx:29` |
| T5 | Raw `<img>` ×2 → LCP/bandwidth | `PortfolioCard.tsx:31`, `PortfolioModal.tsx:85` |
| T6 | Unused `Experience` import | `app/page.tsx:5` |
| T7 | `Profile.JPEG` 2.5 MB, `scale-200` inside `next/image` | `AboutPortrait.tsx` |
| T8 | Mockup PNGs ~870 KB ×2, unoptimized | `public/images` |
| T9 | Favicon is a 12 KB JPEG (`IMG_9418.JPEG`), not ico/png | `layout.tsx` |
| T10 | Modal class `bg-muted` does not exist in theme | `PortfolioModal.tsx` |
| T11 | Dead code (see 02-architecture) + unused three/R3F/drei deps | — |
| T12 | `scroll-test.mjs` at root; `SECTIONS` includes `experience` which isn't rendered; `SHOT_DIR` defaults to `/tmp` | root |
| T13 | Leftover create-next-app `public/*.svg`; boilerplate `README.md` | — |

## Product / content findings

| # | Finding | Risk |
|---|---|---|
| P1 | Fake contact form — visitors think the message was sent | **Lost leads, damaged trust** |
| P2 | No social proof (testimonials, client logos) | Low conversion |
| P3 | Unverified claims "3+ years", "30+ products"; only 3 case studies, all "2026" | Credibility |
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
1. **Working contact form** (P1): API route / Formspree / Resend + validation + error state + honeypot anti-spam. Add direct WhatsApp/email buttons as fallback (P7).
2. **Clean lint** (T1–T4, T6): `npm run lint` = 0 errors. Otherwise a Vercel build may fail if lint is enforced.
3. **Owner decision on positioning & visual direction** — blocks all design/copy work. Ask: AI Full-Stack Freelancer (actual) or Fractional CTO (brief)? Stay purple or return to warm?

### P1 — before promoting the site
4. Image optimization (T5, T7, T8, T9): `next/image`, resize `Profile` ≤ 200 KB, PNG→WebP, proper favicon.
5. Social proof (P2): at least 3 real testimonials; if none yet, remove the empty space and strengthen case studies with numbers.
6. Fix case studies (P4, P5): category, concrete metrics, demo/GitHub links, real screenshots.
7. Metadata & SEO (P6): OG image, `sitemap.ts`, `robots.ts`, canonical, JSON-LD `Person`.
8. Verify claims (P3): change/remove numbers that can't be proven.
9. Run Lighthouse mobile + a11y (muted-text contrast); record scores in this doc.

### P2 — improvements
10. Copy & voice consistency (P8); separate display typeface if the visual direction is approved.
11. Lightweight analytics (Vercel Analytics / Plausible) (P10).
12. Remove or enable dead code (T11) — decide: show Experience or delete it; mount the 3D blob or drop the dependencies.
13. Testimonials section (once assets exist).
14. Move `scroll-test.mjs` to `scripts/`, expose as npm script `test:reveal`.

### P3 — can be deferred
15. 3D icons in Services, hover tilt in Portfolio (per animation budget).
16. CMS (Sanity/Notion) for portfolio.
17. i18n (ID/EN).
18. Blog / writing section.

## Dependencies between items

- Item 3 (owner decision) precedes 10, 12, 15 and every UI/UX brief.
- Item 1 has no dependencies → start in parallel.
- Items 5/6 depend on assets from the owner (testimonials, screenshots, numbers).
- Item 9 runs **after** 4 and 7.

## Definition of Done (every ticket)

`npm run lint` 0 errors · `npx tsc --noEmit` clean · `npm run build` succeeds · manual check at 375px & 1280px · `prefers-reduced-motion` still shows all content · if animation was touched, `node scroll-test.mjs` reports no stuck elements.
