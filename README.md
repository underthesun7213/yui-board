# YUNABI

An app for residents of **GLOBAL COMMONS 結 -YUI-**, the international residence
hall on Kansai Gaidai's Gotenyama campus: everyday-Japanese comics and a
branching conversation game, a map of everyday places, and a calendar.

Scope: [`docs/02-requirements/PRD-YUNABI.md`](docs/02-requirements/PRD-YUNABI.md).
Design: [RFC-0003](docs/architecture/rfc/0003-yunabi-v2.md),
[ADR-0023](docs/adr/0023-frontend-framework-react.md) (React) and
[ADR-0024](docs/adr/0024-react-switch-review-fixes.md).

## Where it is

**Y-1 (this build): the rewrite.** React 19 + Vite + TypeScript, with the v1.3
features unchanged. Until the backend arrives (Y-2) the app reads the v1.3
sample data from `tests/fixtures/` (fixture mode — no `VITE_SUPABASE_URL`).
Places and events will be shared and registered by users from Y-2 on; there is
no production deploy before then (D23).

| Tab | What it holds |
|---|---|
| Home | Shortcuts to the three features, collection progress, next event |
| Japanese | Seven comic episodes + a branching Osaka/Kyoto game with ending cards |
| Map | **Near me** (always where the map starts; location only after a notice) or **All of Japan** (prefecture boundary map or list) |
| Calendar | Month grid, weekly series with one-week changes and cancellations, `.ics` export |

The device remembers ending cards, language and the location choice under the
same `yui.v1.*` keys as v1.3, so nothing is lost when the app updates.

## Running it

Node 22 or later.

```
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck, build to dist/, check bundle budgets
npm run preview      # serve dist/
```

## Checks

```
npm run lint         # ESLint, including the security rules (ADR-0016)
npm run typecheck
npm test             # unit tests + render check (every screen × language × state)
npm run test:e2e     # Playwright on a production build, 375px
```

In a Claude cloud session run browser tests with
`CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`.

## Artwork

Gray boxes stand where pictures go. Drop a file into `src/art/` with the name
of its slot and rebuild — no code change:

| Slot | File | Ratio |
|---|---|---|
| Comic cut | `src/art/lessons/l2/05.webp` = episode 2, cut 5 | 4:3 (1200×900) |
| Game scene | `src/art/vn/osaka/03.webp` | 4:3 |
| Ending card | `src/art/endings/e_osaka_best.webp` | 3:2 (1200×800) |

`.png` and `.jpg` work too. A file whose name matches no slot fails the tests.

## Files

```
index.html               Vite entry (the meta CSP is added at build time)
src/                     the app — see CLAUDE.md for the layout
public/                  manifest, icons, data/japan-prefectures.geojson (Natural Earth, public domain)
tests/                   fixtures, unit and render tests, Playwright
scripts/                 bundle size check
docs/                    planning and design documents
assets/brand/            logo sources
```

## On hold

The anonymous board plan (`schema.sql`, PRD v0.4 and the older backend docs) is
paused, not deleted.
