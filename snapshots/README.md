# Baselines (PRD 07 Phase 0)

- `content-baseline.json` — content-freeze snapshot (C1–C8, plus C7 as source hashes of the data constants) at 375 and 1280 px, reduced-motion on.
  - Write: `npm run build && npm run snapshot`
  - Check: `npm run snapshot:check` (exit 1 + readable diff on any change)
  - Spawns `next start -p 3100` itself; set `URL=http://host:port` to reuse a running production server.
- No-JS parity (S3): `npm run snapshot:nojs` — JavaScript-disabled render at 375/1280 compared to the baseline (C1–C6, C8) plus `scrollHeight` within ±5% of a live reduced-motion render (delta printed).
- Scene audit (M1–M5′, M8, M9): `npm run audit:scenes` (needs `npm run build`; `URL=` reuses a running server). Scenes are any element with `data-scene="<name>"` (pinned subsets: `data-scene-pin`); with none it reports "0 scenes registered" and still checks M8/M9 and static parity.
  - Full (default): 375×812, 768×1024, 1280×800, 1366×768, each twice: default and with `window.__DISABLE_SMOOTH_SCROLL__ = true` (Lenis off; no-op until Phase 0b). `--quick`: 1280×800, default run only (iteration).
  - Other flags: `--viewport=WxH,...`, `--runs=default,no-smooth`, `--parallel=N` (default 2), `--strict-focus`, `--inject=file.js` (self-test: runs in the page after load), `--out=dir` (report .txt, default `$TMPDIR/scene-audit`, never committed). Value flags accept `--flag=value` or `--flag value`.
  - `--scene=name[,name]`: audit only these scenes (M4/M5′/R1); page-level checks (static parity, M8, M9) still run. An unknown name is a `filter` violation.
  - R1 height resize (Q1 regression): at widths 375 and 1280 (any listed height), each scene is parked where it is complete and on screen (short scene: top under the nav; tall scene: bottom at 75% of the viewport; never past the post-resize max scroll), left idle 4 s (the bug is a race with anime.js's scroll tickers and only shows reliably once they are idle), then the viewport height changes by −72 and +88 px with no scroll. After settling, every rendered IU must still match its pre-resize state (opacity, transform, clip, colour; M5′(b)) and no new M5′(c) residual may appear. One violation per scene × resize lists the IUs; the log also says whether a 1 px scroll recovers the state (diagnostic only). Runs inside the full audit (≈ +2 min) and alone via `npm run audit:resize` (= `--only=resize --viewport=375x812,1280x800`, both runs, ≈ 2 min); combine with `--scene` / `--runs` for faster iteration.
  - Opt-out: an element with `data-ambient` (continuous ambient motion, e.g. Portfolio `.pf-card-float`) is skipped by the audit for transform/translate/scale only (effective-transform walk and M5'(c)); opacity, rotate, clip, mask and all other elements stay checked.
  - Exit code ≠ 0 on any violation; the report lists, per scene, IU · readable from–to (vh, from scene top at viewport top) · run · pass/fail.
- `scroll-test.mjs` (root): reading-zone check skips `[data-scene]`; scenes are covered by the audit above.
- `lighthouse-baseline.json` — Lighthouse 13.5.0, mobile (simulated throttling), performance category, 3 runs against `next build` + `next start` on localhost, Playwright's bundled Chromium.

## Lighthouse median (3 runs)

| Metric | Median |
|---|---|
| Performance | 90 (runs: 85 / 91 / 90) |
| LCP | 3564 ms |
| CLS | 0 |
| TBT | 91 ms (runs: 201 / 64 / 91; high variance) |
| FCP | 765 ms |
| JS transfer (initial load) | 204.8 KB |
| Total transfer | 1350.9 KB |

Caveats: localhost with no CDN/compression differences vs Vercel; TBT varies a lot run to run on this WSL host, so compare against the range, not a single run.
