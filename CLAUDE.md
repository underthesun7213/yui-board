# Working on this repository

## What this is

A single-file mobile prototype of a dorm community app, plus the Postgres schema
it will eventually run on. Read `README.md` first for scope and the decisions
behind it.

## The shape of the code

`index.html` is one file: `<style>`, then markup, then one `<script>`. No build
step, no framework, no bundler. Keep it that way unless we agree to migrate.

Inside the script, in order:

1. `T` — all UI strings, keyed by language (`ja`, `en`, `ko`)
2. Data — `POSTS`, `EVENTS`, `HOSTS`, `LESSONS`, `VN`, `ENDINGS`, `PLACES`, `REQS`, `EXCH`
3. `S` — the whole app state in one object
4. View functions — each returns an HTML string: `feed`, `detail`, `compose`,
   `reports`, `calendar`, `evDetail`, `mapView`, `profiles`, `learn`, `lesson`,
   `vnView`, `collection`, `sheet`
5. `render()` — picks a view by `S.view`, writes it into `#main`
6. One delegated `click` handler at the bottom, dispatching on `data-*` attributes

To add a screen: write a view function, add it to the map in `render()`, add a
`data-*` branch to the click handler. To add a control: give it a `data-*`
attribute and handle it there. Do not attach listeners to individual elements —
`render()` replaces the DOM and they would be lost.

## Rules that are easy to break by accident

- **Every user-facing string goes in `T`, in all three languages.** A hardcoded
  string is a bug even if it reads fine in English.
- **Escape interpolated content with `esc()`.** Anything from data, always.
- **`\uXXXX` escapes only work inside the script.** Characters placed directly in
  the HTML body must be literal — a `⚑` in markup renders as that text.
- **Japanese is the shortest language, Korean the longest.** Size anything with a
  fixed width against Korean.
- **The map is Leaflet, created once.** Filtering or selecting a pin calls
  `updateMap()`, which patches markers in place. Do not re-render the whole view —
  it destroys the map and resets the zoom.
- **Bump `CACHE` in `sw.js` when the deployed output changes.**

## Testing

There is no test runner. Before saying a change works, render every view in every
language headlessly and look for thrown errors and for `undefined` leaking into
the output:

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
  const out=[],views={feed,post:detail,compose,reports,cal:calendar,
    event:evDetail,map:mapView,profiles,learn,lesson,collection};
  for(const lang of ["en","ja","ko"]){ S.lang=lang;
    for(const v in views){ S.view=v;
      try{ const o=views[v]()+sheet();
        if(/undefined|\\[object Object\\]/.test(o)) out.push(lang+"/"+v+" suspicious");
      }catch(e){ out.push(lang+"/"+v+" "+e.message); } } }
  return out;`);
const errs=f(doc,{},console,()=>{},()=>{},{createObjectURL:()=>"",revokeObjectURL(){}},class{},undefined);
console.log(errs.length?errs.join("\n"):"clean");
'
```

A syntax check alone is not enough. A patch that deletes a function leaves valid
JavaScript behind; this has already happened once.

## When editing by script

Prefer targeted edits. If you patch `index.html` with a script that replaces a
range between two markers, verify afterwards that every view function and data
constant still exists — not just that the file parses.

## The schema

`schema.sql` is the design, not yet applied anywhere. Its central invariant:
a post's text and its author live in different tables, and `post_authors` has RLS
enabled with no policies, so only a `service_role` connection can read it. Keep
that property. Inserts of authored content go through the `SECURITY DEFINER`
functions at the bottom of the file, never direct table inserts from a client.
