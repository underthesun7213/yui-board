# Working on this repository

## What this is

YUNABI: everyday-Japanese comics and a branching conversation game, a shared
map of everyday places, and a shared calendar, for the residents of 結 -YUI-.
Read `README.md`, then `docs/02-requirements/PRD-YUNABI.md` for scope,
`docs/architecture/rfc/0003-yunabi-v2.md` for the design and
`docs/architecture/erd-v2.md` for the database. React 19 + Vite + TypeScript
(ADR-0023, ADR-0024); Supabase (Postgres + Auth + PostgREST); the only other server code is one
small Worker in front of the app that opens short Google Maps links (ADR-0027).
Without `VITE_SUPABASE_URL` the app runs on `tests/fixtures/` (fixture mode).

## The shape of the code

```
src/main.tsx        boot: restore device storage, start the router, render <App/>
src/app/            App.tsx, router.ts (path routes, history; old #/ links still open), routes.ts (PARENT, tabs), screens.ts (lazy chunks)
src/state/          small stores (createStore) read in React with useStore
src/actions/        the only place side effects start
src/platform/       storage, geolocation, download, service worker registration
src/api/            rest.ts (reads: plain fetch to public views), auth.ts (anonymous account,
                    loaded on first write), rpc.ts (writes through database functions)
src/map/            the Leaflet runtime (outside React), MapSlot, icons, layers
src/domain/         pure logic: calendar, ics, geo, types
src/i18n/           en.ts (source), ja.ts, ko.ts, useT
src/content/        lessons, game, endings, art lookup
src/features/       screens;  src/ui/  shared components
src/styles/         tokens.css (design direction A), base.css, screens.css
src/sw.ts           service worker (Workbox), published as ./sw.js
src/admin/          admin console: its own build (admin/index.html, vite.admin.config.ts →
                    dist-admin/, CSP in _headers), its own strings (src/admin/i18n.ts)
supabase/migrations database, in order; the last one fails unless grants match the design
supabase/tests      pgTAP;  supabase/seed  fixtures for local and CI only
worker/index.ts    the app's Worker: /api/maps-link only (ADR-0027); everything else is static assets
scripts/local-stack a local Supabase: Postgres 16 + Supabase Auth + PostgREST + gateway
```

To add a screen: a component in `features/`, a route in `state/route.ts` and
`app/routes.ts` (with its `PARENT`), a lazy loader in `app/screens.ts`, a case in
`App.tsx`, and a case in `tests/render/render.test.tsx` (the test fails without one).

## Rules that are easy to break by accident

- **Every user-facing string goes in `src/i18n/en.ts`, and ja/ko.** The types
  make a missing key a compile error. That includes `aria-label`s.
- **User text reaches the DOM only as text.** JSX interpolation, never
  `dangerouslySetInnerHTML` or `innerHTML`. Leaflet turns strings into HTML, so
  anything with text goes through `map/layers.ts` (`textNode` and friends), and
  every `divIcon` is made in `map/icons.ts`. ESLint enforces this.
- **Screens and UI components do not touch the outside world.** No
  `localStorage`, `navigator`, `fetch` or Leaflet in `features/` or `ui/`: read
  stores, call actions. ESLint enforces this; the render check runs screens in Node.
- **The map is created once and never removed.** `map/runtime.ts` owns it;
  `MapSlot` only attaches and detaches the container. The runtime follows the
  stores itself — never move the map from a React effect. Ask for a fit by
  bumping `mapUi.fitSeq`.
- **Store selectors return primitives or objects already in the store.** A new
  object per call re-renders forever.
- **Japanese is the shortest language, Korean the longest.** Size against Korean.
- **Ask before using location.** Locating runs only after the notice was accepted.
- **Device storage keys stay `yui.v1.*`** — installed copies read them.
- **The e2e builds (`dist-e2e*/`) carry a test handle on `window`.** Never
  deploy them; deploys come from `npm run build:deploy` into `dist/`
  (it refuses a fixture, local or e2e build), uploaded with
  `wrangler deploy -c wrangler.app.jsonc` (runbook §7.3).
- **The database is the only place rules hold.** Every write goes through a
  `public` definer function that checks everything itself; clients have no
  table rights at all. A new function needs `set search_path = ''`,
  schema-qualified names, malformed input returned as `{status:'invalid',
  field}` (not raised), and an entry in the grants migration and in the
  allowlist of `…_checks.sql` — which fails the migration otherwise. A
  function called with POST must not be `stable`: PostgREST runs those
  read-only and the IP limiter's insert then fails (405). Every `admin_*`
  starts with `perform app.require_admin();` (checked by the migration).
- **Strings the server checks are checked twice.** `src/domain/validation.ts`
  mirrors the database rules for instant feedback; change both together.
  The map's link rule lives apart in `src/domain/links.ts` (map bundle
  budget) — change it with them; a unit test checks the two agree.

## Testing

Before saying a change works:

```bash
npm run lint && npm run typecheck && npm test && npm run build:local
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e   # cloud session
npm run test:db                                            # database (pgTAP)
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:backend   # app + admin console + local backend
VITE_SUPABASE_URL=https://example.supabase.co npm run build:admin
```

The local backend needs Postgres 16 with pgTAP and PostGIS (apt) and two
binaries (`scripts/local-stack/fetch-bins.sh`); container images cannot be
pulled in cloud sessions. In a session where the Docker daemon is not running,
none of that is needed — the stack runs without Docker.

`npm test` includes the render check: every route × en/ja/ko × state, rendered
with `prerender` in Node, failing on thrown errors, a loading fallback left in
the output, and `undefined`, `NaN` or `[object Object]`. `npm run build` fails
over the bundle budgets (home 100 KB, map 61, lessons 33, gzip). The browser
tests run on a production build with its CSP and fail on any console error or
CSP violation; `tests/e2e/v13-parity.spec.ts` is the v1.3 parity list.

## Backslashes in generated edits

Writing files through tools has twice turned `'\;'` into `'\;'`. After an edit
that contains backslash escapes, read the line back.
