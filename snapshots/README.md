# Baselines (PRD 07 Phase 0)

- `content-baseline.json` — content-freeze snapshot (C1–C8, plus C7 as source hashes of the data constants) at 375 and 1280 px, reduced-motion on.
  - Write: `npm run build && npm run snapshot`
  - Check: `npm run snapshot:check` (exit 1 + readable diff on any change)
  - Spawns `next start -p 3100` itself; set `URL=http://host:port` to reuse a running production server.
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
