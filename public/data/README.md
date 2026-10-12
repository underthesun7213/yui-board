# data/

## japan-prefectures.geojson

Boundaries of Japan's 47 prefectures, used by the map's "All of Japan" mode.

- **Source:** Natural Earth, `ne_10m_admin_1_states_provinces.geojson`, from
  github.com/nvkelso/natural-earth-vector (master, downloaded 2026-10-12).
- **License:** public domain. No permission or credit is needed.
- **Properties kept:** `c` is the JIS code from `iso_3166_2` (`JP-27` → `"27"`),
  `ja` comes from `name_ja`, `ko` from `name_ko`, and `en` from `name` with
  macrons removed (`Ōsaka` → `Osaka`). Features are sorted by `c`.
- **Simplification:** mapshaper 0.6. Run on the 47 features where `iso_a2 == "JP"`:

  ```
  mapshaper jp-min.geojson -simplify 15% keep-shapes -filter-islands min-area=5km2 \
    -o out.geojson precision=0.0005 format=geojson
  ```

  The output is written without whitespace and comes to 46 KB.

The prefecture names in `PREFS` (`index.html`) come from the same file. Regenerate
both together.
