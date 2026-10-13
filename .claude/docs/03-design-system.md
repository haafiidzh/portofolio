# 03 — Design System (as *implemented*)

Source: `app/globals.css`. The original brief (warm charcoal + sage/terracotta, spa mood) is **not** used; the actual implementation is a monochrome purple dark theme.

## Color (single hue: Noble Purple `#4B0082`, varied by lightness/opacity only)

| Token | Value | Use |
|---|---|---|
| `--background` | `#08060c` | main canvas |
| `--surface` / `--surface-2` | `#0f0b16` / `#150f1f` | cards, inputs, modal |
| `--foreground` | `#f4f1f8` | primary text |
| `--muted-foreground` | `#9b93a8` | secondary text |
| `--hairline` | `rgba(244,241,248,.08)` | borders/rules |
| `--accent` | `#4b0082` | primary button |
| `--accent-deep` | `#2e004f` | dark backgrounds |
| `--accent-mid` | `#6a1cb0` | hover/selection |
| `--accent-bright` | `#a97bea` | accent text, links, strokes |
| `--nav-h` | `4.5rem` | nav height & scroll-padding |

Rule stated in the CSS: **no purple→blue gradients**. Exception: `.scroll-progress` uses an `accent → accent-bright` gradient (same hue, acceptable).

Hardcoded hex outside the tokens: `#7a5c8e` and siblings in `MorphBlob`/`useScrollMorph` (greyish purple, slightly off-palette), `#f4efe9` light in `MorphCanvas`.

## Typography

One family: **Inter** (400/500/600/700). `--font-display` is only an alias of `--font-sans`.

The Motto marquee band (`components/sections/Motto.tsx`) uses Inter uppercase (700 static, 800 + .03em tracking in motion; variable font, no extra file) with a "lilac pearl jelly" fill in motion mode only (per-`.motto-text` gradient + background-clip:text, two drop-shadows, no animation besides the track transform; flat #f4f1f8 for reduced-motion/forced-colors; tokens `--motto-bg-top/-bottom/-extrude`) sized so caps (~0.73em) fill ~73% of the band: group `line-height .8` + `padding-block .1em` makes band height = 1em; motion font-size `clamp(6.9rem, 16vw, 14rem)`. Motto tokens: `--motto-bg` (= `--accent-deep` #2e004f, "deep violet"), `--motto-fg` (= `--foreground` #f4f1f8, 15.3:1), `--motto-accent` (= `--accent-bright` #a97bea star separators, 5.5:1). Band vs page is only 1.18:1, so `.motto` has `border-block: 1px solid rgb(169 123 234 / .25)` for the edge.  loop is gated by `html.motion-ok`, track is `data-ambient`.

| Class | Spec |
|---|---|
| `.display-xl` | clamp(3rem, 11vw, 9rem), 700, lh .95, ls -.045em — hero H1 |
| `.display-lg` | clamp(2.25rem, 6vw, 4.5rem), 700, lh 1.05 — section titles |
| `.display-md` | clamp(1.5rem, 3vw, 2.25rem), 600 — card/row titles |
| `.eyebrow` | .75rem, 500, uppercase, ls .22em, muted |
| `.lede` | clamp(1.05rem, 1.6vw, 1.375rem), lh 1.65, muted |

## Components & patterns

- **Card** (`.card`): surface 80% + hairline border; hover → accent 40% border, `surface-2` bg. Principle: *flat, never card-in-card*.
- **Hairline rule** (`.hairline-t`): row separator in Services, About `dl`, Contact list.
- **Pill** (CTA buttons, tags): `rounded-full`; primary `bg-accent` → hover `accent-mid`; secondary hairline border.
- **SectionHeader**: `index` ("01"…), `eyebrow`, `title`, optional `lede`.
- **Ambient background**: 30% accent radial on top + masked 88px grid + two 140px-blur glows drifting over 28 s.
- **Focus ring**: 2px `accent-bright`, offset 3px (`:focus-visible`).
- **Layout**: container `max-w-7xl`, padding `px-6 md:px-10`, section `py-28 md:py-40`.
- **Signature easing**: `cubic-bezier(.16,1,.3,1)` (CSS) and `outExpo` (anime.js).

## Known inconsistencies

- Section index in the UI: About 01, Services 02, Projects 03, Experience 04 (hidden), Skills 05, Contact 06 → the visible sequence skips 04 (01,02,03,05,06).
- Hero copy is lowercase ("i help founders…") while the rest of the site uses standard sentences.
- `muted-foreground` (#9b93a8) contrast on 12px text (`text-xs`) needs a WCAG AA check.
- Modal uses `bg-muted` (token **does not exist**) → image background is undefined.

### Watu (Motto mascot)

Decorative, non-clickable river-pebble mascot (`components/sections/motto/Watu.tsx`, styles in the Motto block of `globals.css`) standing on the Motto band's top border: 44px wide (30px at <=767px), body gradient #d9c4fa -> #b38cf0 -> #8f5ae0, outline #1f0036, kawung mark #6a1cb0, no mouth/cheeks. Lane is `aria-hidden`, `data-ambient`, absolute with height 0 (no CLS), hidden under forced-colors. Animations (transform/opacity only: blink, walk bob, jump, look, sit) run only under `html.motion-ok`; otherwise a static pose at left:12%. State machine uses setTimeout, paused when hidden/offscreen/hovered; pointer reaction only on fine pointers. Needs >= 4.5rem free above the band (Contact section bottom padding is 160px desktop / 112px mobile; the band sits between Contact and the footer, and the footer hairline is hidden next to it).
