# Working on this repository

## What this is

YUNABI: everyday-Japanese comics and a branching conversation game, a map of
everyday places, and a calendar, for the residents of 結 -YUI-. Read `README.md`,
then `docs/02-requirements/PRD-YUNABI.md` for scope and
`docs/architecture/rfc/0003-yunabi-v2.md` for the design. React 19 + Vite +
TypeScript (ADR-0023, ADR-0024). Until Y-2 adds the backend, data comes from
`tests/fixtures/` (fixture mode).

## The shape of the code

```
src/main.tsx        boot: restore device storage, start the router, render <App/>
src/app/            App.tsx, router.ts (hash routes, history), routes.ts (PARENT, tabs), screens.ts (lazy chunks)
src/state/          small stores (createStore) read in React with useStore
src/actions/        the only place side effects start
src/platform/       storage, geolocation, download, service worker registration
src/api/            reads (fixtures now, Supabase in Y-2)
src/map/            the Leaflet runtime (outside React), MapSlot, icons, layers
src/domain/         pure logic: calendar, ics, geo, types
src/i18n/           en.ts (source), ja.ts, ko.ts, useT
src/content/        lessons, game, endings, art lookup
src/features/       screens;  src/ui/  shared components
src/styles/         tokens.css (design direction A), base.css, screens.css
src/sw.ts           service worker (Workbox), published as ./sw.js
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

## Testing

Before saying a change works:

```bash
npm run lint && npm run typecheck && npm test && npm run build
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e   # cloud session
```

`npm test` includes the render check: every route × en/ja/ko × state, rendered
with `prerender` in Node, failing on thrown errors, a loading fallback left in
the output, and `undefined`, `NaN` or `[object Object]`. `npm run build` fails
over the bundle budgets (home 100 KB, map 60, lessons 30, gzip). The browser
tests run on a production build with its CSP and fail on any console error or
CSP violation; `tests/e2e/v13-parity.spec.ts` is the v1.3 parity list.

## Backslashes in generated edits

Writing files through tools has twice turned `'\;'` into `'\;'`. After an edit
that contains backslash escapes, read the line back.
