# YUNABI

An app for residents of **GLOBAL COMMONS 結 -YUI-**, the international residence
hall on Kansai Gaidai's Gotenyama campus: everyday-Japanese comics and a
branching conversation game, a map of everyday places, and a calendar.

Scope: [`docs/02-requirements/PRD-YUNABI.md`](docs/02-requirements/PRD-YUNABI.md).
Design: [RFC-0003](docs/architecture/rfc/0003-yunabi-v2.md),
[ADR-0023](docs/adr/0023-frontend-framework-react.md) (React) and
[ADR-0024](docs/adr/0024-react-switch-review-fixes.md).

## Where it is

**Y-2 (this build): shared data.** Places and events live in Supabase and
anyone can add them; an anonymous account is made on the first post, with no
sign-up screen. Reports, auto-hide and the admin console come in Y-3; the
first production deploy follows the security check (D23). Without
`VITE_SUPABASE_URL` the app runs on the v1.3 sample data in `tests/fixtures/`.

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
npm run build:local  # typecheck, build to dist/ with a 'self' CSP, check bundle budgets
npm run preview      # serve dist/
```

The app lives at `https://yunabi.juha.dev/` on Cloudflare Workers static assets
(ADR-0025; not deployed yet). A real build needs the published address, which
the CSP trusts: `YUNABI_ORIGIN=https://yunabi.juha.dev/ npm run build`.
`npm run build` refuses to run without one, and also writes `dist/_headers`
(the response headers, CSP included) and checks it.

A deploy uses `npm run build:deploy` with the production Supabase URL,
publishable key and Turnstile site key in the environment — it refuses a
fixture, local or e2e build — then `npx wrangler@4.86.0 deploy -c wrangler.app.jsonc`.
Always pass `-c`: `wrangler.jsonc` is the admin console. The full procedure,
checks and rollback are in `docs/architecture/runbook.md` §7.3 and §8.

## Local backend

```
scripts/local-stack/fetch-bins.sh   # once: Supabase Auth + PostgREST binaries
npm run db:start:seed               # Postgres 16 + Auth + PostgREST on :54321, sample data
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_PUBLISHABLE_KEY="$(node -e 'import("./scripts/local-stack/keys.mjs").then(k=>console.log(k.ANON_KEY))')" \
npm run dev
```

Needs `postgresql-16`, `postgresql-16-pgtap` and `postgresql-16-postgis-3`.

## Checks

```
npm run lint         # ESLint, including the security rules (ADR-0016)
npm run typecheck
npm test             # unit tests + render check (every screen × language × state)
npm run test:e2e     # Playwright on a production build, 375px (fixture mode)
npm run test:db      # database: permissions, rules, limits (pgTAP)
npm run test:backend # Playwright against the local backend
```

In a Claude cloud session run browser tests with
`CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`.

## Artwork

Gray boxes stand where pictures go. Drop a file into `src/art/` with the name
of its slot and rebuild — no code change:

| Slot | File | Ratio |
|---|---|---|
| Comic page | `src/art/lessons/l2/p1.webp` = level 2, page 1 (two pages of four panels per level; balloons in Japanese — [script](docs/06-design/comic-scripts.md)) | portrait 2:3, short side ≥ 1000 px, ≤ 400 KB |
| Game scene | `src/art/vn/osaka/03.webp` | 4:3 |
| Ending card | `src/art/endings/e_osaka_best.webp` | 3:2 (1200×800) |

`.png` and `.jpg` work too, one file per slot. A file whose name matches no slot, or a comic page outside its size rule, fails the tests.

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
