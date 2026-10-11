# YUI Board

A community app for residents of **GLOBAL COMMONS 結 -YUI-**, the international
residence hall on Kansai Gaidai's Gotenyama campus (about 650 residents, Japanese
students and exchange students sharing units).

The problem it addresses: what residents need to know is scattered across
Instagram DMs, noticeboards and word of mouth, and it disappears every time the
exchange students turn over. This gathers it into four places so that what one
resident works out stays available to the next.

## Current state

`index.html` is a **mobile-first prototype running on mock data** — a single
static page, no backend. Posting works in the session and is gone on reload.
That is expected; the backend is not wired up yet.

## Tabs

| Tab | What it holds |
|---|---|
| Home | Anonymous board — general, meetups, unit & floor, market, lost & found |
| Calendar | Month grid; GIP Tuesdays, office events, resident-organised trips. Exports .ics |
| Japanese | Eight comic episodes of everyday Japanese + a branching Osaka/Kyoto scene with collectible endings |
| Map | Leaflet + OpenStreetMap, clustered pins, walking times measured from 結 |

Plus: a report flow with reasons and an operator queue, and profile exchange for
market handovers (anonymous until both sides accept).

## Design decisions worth keeping

- **Trilingual (en / ja / ko), English default.** Each post stores the language it
  was written in and shows a translate/original toggle. UI strings live in the `T`
  object; post bodies will be machine-translated on write, not on read.
- **Anonymity is structural, not cosmetic.** `schema.sql` keeps a post's text and
  its author in separate tables, and the author table has no RLS policy at all —
  nothing reachable through PostgREST can read it. Writes go through
  `SECURITY DEFINER` functions so both rows land in one transaction.
- **Residents are anonymous; the operator is not.** Every hide is signed in
  `mod_actions`. Reporters are recorded but invisible, including to the operator.
- **Room numbers are stored, never exposed.** The UI shows a floor.
- **No Google Maps API.** Place cards link out to Google Maps by `place_id`, which
  costs nothing. The map itself is OSM tiles.

## Files

```
index.html             the whole prototype
schema.sql             Postgres / Supabase schema, RLS policies, write functions
manifest.webmanifest   PWA manifest (relative paths — works under a subpath)
sw.js                  service worker; bump CACHE on every deploy
icon-*.png             app icons
```

## Running it

Open `index.html` in a browser. There is no build step.

For the service worker and install prompt to work the page must be served over
HTTPS or from `localhost`:

```
python -m http.server 8000
```

## Deploying

GitHub Pages serves the repository root. `manifest.webmanifest` and `sw.js` use
relative paths so a project subpath (`/<repo>/`) works without edits.

**Bump `CACHE` in `sw.js` on every deploy.** Without that, phones that already
installed the app keep showing the old build.

## Next

- Supabase project in the Tokyo region; apply `schema.sql` as a migration
- Translation on write (Azure Translator F0 — 2M characters/month, stops rather
  than bills when the quota runs out)
- Replace mock data with live queries; keep `service_role` out of the client
- Artwork for the Japanese episodes (each panel carries a scene note to generate from)
