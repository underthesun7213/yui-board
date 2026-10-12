# YUI

An app for residents of **GLOBAL COMMONS 結 -YUI-**, the international residence
hall on Kansai Gaidai's Gotenyama campus (about 650 residents, Japanese students
and exchange students sharing units).

> The app name is a placeholder until a new one is chosen. Change `appName` in `T`
> (`index.html`), the `<title>`, and `manifest.webmanifest`.

## Current state: the MLP

A mobile-first PWA with **no backend and no accounts**. Scope and reasoning are in
[`docs/02-requirements/PRD-MLP.md`](docs/02-requirements/PRD-MLP.md).

| Tab | What it holds |
|---|---|
| Home | Shortcuts to the three features, collection progress, next event |
| Japanese | Seven comic episodes of everyday Japanese + a branching Osaka/Kyoto conversation game with collectible ending cards |
| Map | **Near me** (default, uses the device location after a notice) or **All of Japan** (pick a prefecture on a boundary map or from a list). Curated places only |
| Calendar | Month grid of dorm events, weekly series, export to your own calendar (.ics) |

What the app remembers — ending cards, language, the location choice — is kept in
this device's browser storage only (`yui.v1.*` keys). If storage is blocked the
app still works and forgets on reload.

The comic panels and ending cards are placeholders: each carries a scene note to
draw from (`s`), and an `img` field replaces the placeholder when artwork exists.

## Adding data

- **Places** — append to `PLACES` in `index.html`. Each needs `id`, `pref` (JIS
  prefecture code, e.g. `"27"` Osaka), `cat`, `lat`, `lng` and a name in `ja`/`en`/`ko`;
  description, `by` and Google `gid` are optional.
- **Events** — append to `EVENTS`. Weekly events are written once with
  `weekly.until`, and `over` replaces a single week's title or text.

## Design decisions worth keeping

- **Trilingual (en / ja / ko), English default.** Every UI string lives in `T`.
- **Nothing leaves the device except map requests.** Location is only used on the
  device; map tiles come from OpenStreetMap and reveal the area being viewed, which
  the location notice says.
- **No Google Maps API.** Place cards link out to Google Maps by `place_id`.
- **Created once, kept alive.** The Leaflet map survives re-renders and language
  changes; filters and selection patch it in place.

## Files

```
index.html                       the app
vendor/leaflet*/                 Leaflet 1.9.4 + markercluster 1.5.3 (BSD-2 / MIT)
data/japan-prefectures.geojson   prefecture boundaries — Natural Earth, public domain, simplified
manifest.webmanifest             PWA manifest (relative paths — works under a subpath)
sw.js                            service worker; bump CACHE on every deploy
icon-*.png                       app icons
docs/                            planning documents (see docs/README.md)
schema.sql                       backend design for the earlier board plan — on hold
```

## Running it

Serve the folder — the map and prefecture data are fetched, so `file://` is not
enough, and location needs HTTPS or `localhost`:

```
python -m http.server 8000
```

## Deploying

GitHub Pages serves the repository root. `manifest.webmanifest` and `sw.js` use
relative paths so a project subpath (`/<repo>/`) works without edits.

**Bump `CACHE` in `sw.js` on every deploy.** Without that, phones that already
installed the app keep showing the old build.

## On hold

The anonymous board, reports and profile exchange — with the Supabase schema, the
translate-on-write path and the architecture docs — are paused, not deleted. See
`docs/02-requirements/PRD.md` (v0.4), `docs/architecture/` and `docs/adr/`.
