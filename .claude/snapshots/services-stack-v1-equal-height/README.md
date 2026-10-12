# Services stacking cards — v1 "equal height" (locked 2026-10-12)

Approach: CSS sticky per card (nth-child top = stack-top + i*stack-step; step 6rem mobile, 5rem md+),
all cards forced to equal height via `min-height: var(--card-h)` (23rem mobile, 17rem md+).
Why: unequal heights made taller card 02 release first and clip card 01/02 titles.
Downside (owner): too much empty space in cards.
Restore: copy `Services.tsx` -> components/sections/Services.tsx and `globals.css` -> app/globals.css
(globals.css snapshot is the whole file at that time; check `git diff` for unrelated edits made since).
