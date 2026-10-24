# v1.3 browser checks (legacy)

The Playwright scripts used to verify the v1.3 single-file app (51 checks plus an
offline check). They are kept so the v2 rewrite can port them into its own test
suite (PRD-YUNABI §7, RFC 0003); they are not wired into any runner.

They assume Playwright from `/opt/node-tools/node_modules/playwright`, Chromium at
`/opt/pw-browsers/chromium`, and the repo served at `BASE` (default
`http://127.0.0.1:8766/`, e.g. `python3 -m http.server 8766`).

```
BASE=http://127.0.0.1:8766/ node v1.3-browser-checks.js /tmp/shots
node v1.3-offline-check.js
```

They depend on the v1.3 sample data (13 places, the weekly GIP event); v2 starts
with no data, so port them onto test fixtures.
