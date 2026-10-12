# Working on this repository

## What this is

The MLP of YUI: everyday-Japanese comics and a branching conversation game, a map
of curated everyday places, and the dorm calendar. No backend, no accounts —
everything the app remembers lives in the browser's storage on that device.
Read `README.md` first, and `docs/02-requirements/PRD-MLP.md` for the scope.

The earlier anonymous-board plan (`schema.sql`, `docs/architecture`, `docs/adr`,
PRD v0.4) is on hold, not deleted.

## The shape of the code

No build step, no framework, no bundler. Files:

- `index.html` — `<style>`, markup, one `<script>`
- `vendor/` — Leaflet and markercluster, loaded only when the map tab opens
- `data/japan-prefectures.geojson` — prefecture boundaries (Natural Earth, public
  domain, simplified), fetched the first time "All of Japan" opens

Inside the script, in order:

1. `T` — all UI strings, keyed by language (`ja`, `en`, `ko`)
2. Data — `HOSTS`, `EVENTS`, `LESSONS`, `ENDINGS`, `VN`, `PLACES`, `PREFS`
3. `S` — the whole app state in one object, and `store` for device storage
4. View functions — each returns an HTML string: `home`, `learn`, `lesson`,
   `vnView`, `collection`, `mapView`, `calendar`, `evDetail`. `VIEWS` maps
   `S.view` to them.
5. Map runtime — `mountMap`, `initMap`, `syncMap`, `updateMap`, `locate`
6. `render()` and `go()` — `go()` changes view and pushes browser history
7. One delegated `click` handler, dispatching on `data-*` attributes
8. Below `/* Manifest shortcuts` — startup code with side effects

To add a screen: write a view function, add it to `VIEWS`, add a `data-*` branch
to the click handler, and give it a parent in `PARENT` so ‹ knows where to go. To
add a control: give it a `data-*` attribute and handle it there. Do not attach
listeners to elements inside `#main` — `render()` replaces them.

## Data

- **Places** are curated. Add entries to `PLACES` in the documented shape: `pref`
  is the JIS prefecture code (`"27"` = Osaka), `by` is a key of `T.*.by`. Walking
  time is computed, not stored.
- **Events** are a static schedule. A weekly event is written once with
  `weekly.until`; `over[date]` replaces one week's title and body.

## Rules that are easy to break by accident

- **Every user-facing string goes in `T`, in all three languages.** That includes
  `aria-label`s. A hardcoded string is a bug even if it reads fine in English.
- **Escape interpolated content with `esc()`.** Anything from data, always.
- **`\uXXXX` escapes only work inside the script.** Characters placed directly in
  the HTML body must be literal.
- **Japanese is the shortest language, Korean the longest.** Size anything with a
  fixed width against Korean.
- **The map is Leaflet, created once, and it survives `render()`.** Its container
  `LBOX` lives outside the view HTML; `mountMap()` moves it back into
  `#lmapslot` after every render. Map controls call `updateMap()`, which patches
  the map's containers and layers in place — never `render()`.
- **Views must not touch the outside world.** No `localStorage`, `navigator`,
  `fetch` or `L` inside a view function: the headless test runs them in Node.
  Device storage goes through `store`, which never throws.
- **Ask before using location.** `locate()` only runs after the notice was
  accepted (`S.locState`).
- **Bump `CACHE` in `sw.js` when the deployed output changes**, and add new
  same-origin files the app needs offline to `SHELL`.

## Testing

There is no test runner. Before saying a change works, render every view in every
language headlessly and look for thrown errors and for `undefined`, `NaN` or
`[object Object]` leaking into the output:

```bash
node -e '
const h=require("fs").readFileSync("index.html","utf8");
const src=h.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace(/\/\* Manifest shortcuts[\s\S]*$/,"");
const stub=()=>({innerHTML:"",textContent:"",style:{},classList:{add(){},remove(){}},
  value:"",selectedIndex:0,dataset:{},setAttribute(){},appendChild(){},className:""});
const doc={getElementById:stub,querySelector:stub,addEventListener(){},
  createElement:stub,documentElement:{},body:{dataset:{}}};
const f=new Function("document","window","console","setTimeout","clearTimeout","URL","Blob","L",src+`
  const out=[];
  // each case: [name, view, state that makes sense for it]
  const cases=[["home","home",{}],["learn","learn",{}],["lesson","lesson",{lid:"l1"}],
    ["collection-empty","collection",{cg:{}}],["collection-full","collection",{cg:{e_osaka_best:1,e_kyoto_norm:1,e_both:1}}],
    ["cal","cal",{day:null,month:null}],["cal-day","cal",{day:"2026-09-22",month:"2026-09"}],
    ["cal-empty-day","cal",{day:"2026-11-03",month:"2026-11"}],
    ["event","event",{eid:"gip",eday:"2026-09-22"}],["event-weekly","event",{eid:"gip",eday:"2026-10-13"}],
    ["event-missing","event",{eid:"gip",eday:"2026-10-14"}]];
  for(const st of ["ask","idle","wait","ok","denied","fail","skip"])
    cases.push(["map-near-"+st,"map",{mode:"near",locState:st,loc:st==="ok"?{lat:35.68,lng:139.76}:null,pref:null,pl:null}]);
  cases.push(["map-near-pl","map",{mode:"near",locState:"skip",pl:"p1"}],
    ["map-japan","map",{mode:"japan",pref:null,prefFail:true,pl:null}],
    ["map-pref-27","map",{mode:"japan",pref:"27",cat:"daily",pl:"p3"}],["map-pref-13","map",{mode:"japan",pref:"13",cat:""}]);
  for(const lang of ["en","ja","ko"]){ S.lang=lang;
    for(const [name,v,st] of cases){ Object.assign(S,{view:v},st);
      try{ const o=VIEWS[v]();
        if(/undefined|\\[object Object\\]|NaN/.test(o)) out.push(lang+"/"+name+" suspicious: "+(o.match(/.{0,40}(undefined|\\[object Object\\]|NaN).{0,20}/)||[""])[0]);
      }catch(e){ out.push(lang+"/"+name+" "+e.message); } } }
  // the branching episode needs playing, not just rendering
  for(const route of ["osaka","kyoto"]){
    S.view="lesson";S.lid="l8"; S.vn={route,i:0,picked:null,score:0};
    for(let i=0;i<=VN[route].scenes.length;i++){ S.vn.i=i;
      for(const picked of [null,0]){ S.vn.picked=i<VN[route].scenes.length?picked:null;
        try{ if(/undefined/.test(vnView())) out.push(route+" scene "+i+" suspicious"); }
        catch(e){ out.push(route+" scene "+i+" "+e.message); } } } }
  // the runtime is not rendered here, but a deleted or renamed function should still fail
  for(const fn of ["render","go","mountMap","initMap","syncMap","updateMap","labelMap","setMode",
    "locate","enterMap","ensurePrefs","mapChanged","downloadICS","occOn","upcoming","today"])
    try{ if(typeof eval(fn)!=="function") throw 0; }catch(e){ out.push("missing function: "+fn); }
  // data that people will edit by hand: a typo here breaks a whole screen
  const L3=(o,w)=>{ for(const l of ["ja","en","ko"]) if(!o||typeof o[l]!=="string"||!o[l]) out.push(w+" missing "+l); };
  for(const e of EVENTS){ const w="event "+e.id;
    if(!HOSTS[e.host]) out.push(w+" unknown host "+e.host);
    if(!/^\\d{4}-\\d\\d-\\d\\d$/.test(e.d)||!/^\\d\\d:\\d\\d$/.test(e.time)||!/^\\d\\d:\\d\\d$/.test(e.end)) out.push(w+" bad date/time");
    L3(e.t,w+" title"); L3(e.b,w+" body"); L3(e.place,w+" place");
    for(const k in e.over||{}){ const o=e.over[k]; if(!o.cancel){ if(o.t)L3(o.t,w+" "+k+" title"); if(o.b)L3(o.b,w+" "+k+" body"); } } }
  const ids=new Set();
  for(const p of PLACES){ const w="place "+p.id;
    if(ids.has(p.id)) out.push(w+" duplicate id"); ids.add(p.id);
    if(!CATCOLOR[p.cat]) out.push(w+" unknown cat "+p.cat);
    if(!PREFS.some(x=>x[0]===p.pref)) out.push(w+" unknown pref "+p.pref);
    if(!(Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180)) out.push(w+" bad coordinates");
    if(p.by&&!T.en.by[p.by]) out.push(w+" unknown by "+p.by);
    L3(p.n,w+" name"); if(p.d) L3(p.d,w+" description"); }
  // every view in VIEWS was covered
  for(const v in VIEWS) if(!cases.some(c=>c[1]===v)) out.push("view not tested: "+v);
  return out;`);
const errs=f(doc,{},console,()=>{},()=>{},{createObjectURL:()=>"",revokeObjectURL(){}},class{},undefined);
console.log(errs.length?errs.join("\n"):"clean");
'
```

It also fails if a view in `VIEWS` has no case. A syntax check alone is not
enough: a patch that deletes a function leaves valid JavaScript behind.

The map, location and storage need a real browser. Check those with Playwright
(Chromium is at `/opt/pw-browsers/chromium` in cloud sessions) at 375px in all
three languages; serve the repo with `python3 -m http.server`.

## When editing by script

Prefer targeted edits. If you patch `index.html` with a script that replaces a
range between two markers, verify afterwards that every view function and data
constant still exists — not just that the file parses.
