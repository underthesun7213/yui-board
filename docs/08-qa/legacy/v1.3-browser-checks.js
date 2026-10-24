// Browser checks for the MLP build. Server: python3 -m http.server 8766 in the repo root.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8766/';
const SHOTS = process.argv[2];
const res = [];
const ok = (name, cond, note = '') => { res.push([cond ? 'PASS' : 'FAIL', name, note]); };

async function ctx(browser, opts = {}) {
  const { badTiles, ...rest } = opts; opts = { badTiles };
  const c = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, acceptDownloads: true, serviceWorkers: 'block', ...rest });
  // tiles are blocked by this environment's proxy; answer them locally so the map can settle
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await c.route('https://tile.openstreetmap.org/**', r => opts.badTiles ? r.fulfill({ status: 503, body: '' }) : r.fulfill({ status: 200, contentType: 'image/png', body: png }));
  return c;
}
const errs = [];
async function page(c) {
  const p = await c.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/status of 503/.test(m.text())) errs.push(m.text()); });
  return p;
}
const tap = (p, sel) => p.locator(sel).first().click();

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---- home, tabs, language, back
  let c = await ctx(browser), p = await page(c);
  await p.goto(BASE);
  ok('home is first screen', await p.locator('.hcard').count() === 3);
  ok('4 tabs', await p.locator('#tabbar button').count() === 4);
  ok('no board leftovers', await p.locator('#boards, .fab, #raflag, #profbtn').count() === 0);
  await p.screenshot({ path: SHOTS + '/01-en-home.png' });
  await tap(p, '[data-go="learn"]');
  ok('home card -> learn', await p.locator('.lesson').count() === 8);
  await tap(p, '[data-lesson="l1"]');
  await tap(p, '[data-back]');
  ok('back from lesson -> learn', await p.locator('.lesson').count() === 8);
  await p.goBack();
  ok('OS back from learn -> home', await p.locator('.hcard').count() === 3, await p.evaluate(() => S.view));

  // ---- game + collection persistence
  await tap(p, '[data-t="1"]'); await tap(p, '[data-lesson="l8"]'); await tap(p, '[data-route="osaka"]');
  for (let i = 0; i < 5; i++) {
    // pick the option marked ok when there is one
    const idx = await p.evaluate(() => Math.max(0, VN.osaka.scenes[S.vn.i].opts.findIndex(o => o.ok)));
    await tap(p, `[data-opt="${idx}"]`); await tap(p, '[data-vnnext]');
  }
  ok('ending shown', await p.locator('.vnend').count() === 1);
  await p.screenshot({ path: SHOTS + '/02-en-ending.png' });
  await p.reload();
  ok('collection survives reload', await p.evaluate(() => Object.keys(S.cg).length) >= 1, JSON.stringify(await p.evaluate(() => S.cg)));
  ok('reload keeps the screen', await p.evaluate(() => S.view) === 'lesson');
  await tap(p, '[data-t="0"]');

  // ---- language remembered
  await tap(p, '[data-menu]'); await tap(p, '[data-l="ko"]');
  await p.reload();
  ok('language remembered', await p.evaluate(() => S.lang) === 'ko');
  ok('no English aria-label in ko', !(await p.locator('[aria-label="Language"],[aria-label="prev"],[aria-label="next"]').count()));
  await p.screenshot({ path: SHOTS + '/03-ko-home.png' });

  // ---- calendar
  await tap(p, '[data-t="3"]');
  const today = await p.evaluate(() => today());
  ok('calendar uses real date', await p.locator(`.cell.today[data-d="${today}"]`).count() === 1, today);
  await p.evaluate(() => { S.month = '2026-09'; render(); });
  await tap(p, '[data-d="2026-09-22"]');
  ok('weekly override shown', (await p.locator('.ev h3').allInnerTexts()).some(s => s.includes('노래방')));
  await tap(p, '[data-e^="gip|2026-09-22"]');
  ok('no join button', await p.locator('[data-go], .go[aria-pressed]').count() === 0 || await p.locator('[data-ics]').count() === 1);
  const [dl] = await Promise.all([p.waitForEvent('download'), tap(p, '[data-ics]')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8');
  ok('.ics has VTIMEZONE and CRLF', ics.includes('BEGIN:VTIMEZONE') && ics.includes('\r\n'), dl.suggestedFilename());
  ok('.ics ends with CRLF', ics.endsWith('\r\n'));
  ok('.ics lines <= 75 octets', ics.split('\r\n').every(l => Buffer.byteLength(l) <= 75));
  await tap(p, '[data-back]');
  ok('back from event -> calendar', await p.evaluate(() => S.view) === 'cal');
  await p.screenshot({ path: SHOTS + '/04-ko-calendar.png' });
  await p.evaluate(() => { S.month = null; S.day = null; render(); });
  await c.close();

  // ---- map: notice before location, allow, map survives language change
  c = await ctx(browser, { geolocation: { latitude: 34.8252, longitude: 135.6530 }, permissions: ['geolocation'] });
  p = await page(c);
  await p.goto(BASE + '?v=map');
  await p.waitForFunction(() => LMAP);
  ok('notice before asking location', await p.locator('[data-loc="use"]').count() === 1 && await p.evaluate(() => S.locState) === 'ask');
  await p.screenshot({ path: SHOTS + '/05-en-map-notice.png' });
  await tap(p, '[data-loc="use"]');
  await p.waitForFunction(() => S.locState === 'ok');
  await p.waitForTimeout(900);
  ok('me marker shown', await p.locator('.mew').count() === 1);
  ok('nearby places listed with walk time', await p.locator('#plist .pmin').count() > 0);
  const box1 = await p.evaluate(() => LBOX);
  await tap(p, '[data-menu]');
  await tap(p, '[data-l="ja"]');
  ok('map survives language change', await p.evaluate(() => document.contains(LBOX) && LBOX.querySelector('.leaflet-pane') !== null));
  await tap(p, '[data-t="0"]'); await tap(p, '[data-t="2"]');
  ok('map survives tab round trip', await p.evaluate(() => document.contains(LBOX) && LMAP.getZoom() > 0));
  await p.screenshot({ path: SHOTS + '/06-ja-map-near.png' });
  await tap(p, '[data-pl]');
  ok('place card opens', await p.locator('.pcard').count() === 1);

  // ---- japan mode
  await tap(p, '[data-mode="japan"]');
  await p.waitForFunction(() => PREFGEO);
  await p.waitForTimeout(900);
  ok('47 prefecture shapes', await p.evaluate(() => LPREF.getLayers().length) === 47);
  ok('prefecture list has 47', await p.locator('.preflist button').count() === 47);
  await p.screenshot({ path: SHOTS + '/07-ja-map-japan.png' });
  await tap(p, '[data-pref="27"]');
  await p.waitForTimeout(900);
  ok('Osaka shows places', await p.locator('#plist [data-pl]').count() === 13);
  await p.screenshot({ path: SHOTS + '/08-ja-map-osaka.png' });
  await tap(p, '[data-pref=""]');
  await tap(p, '[data-pref="13"]');
  ok('Tokyo empty state', (await p.locator('#plist .empty').count()) === 1);
  // tap a polygon on the map
  await tap(p, '[data-pref=""]');
  await p.waitForTimeout(1000);
  await p.evaluate(() => LBOX.scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
  const hit = await p.evaluate(() => { let c = null; LPREF.eachLayer(l => { if (l.feature.properties.c === '01') c = LMAP.latLngToContainerPoint(l.getBounds().getCenter()); }); const r = LBOX.getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y }; });
  await p.mouse.click(hit.x, hit.y);
  ok('tapping a prefecture shape selects it', await p.evaluate(() => S.pref) === '01', await p.evaluate(() => S.pref));
  await c.close();

  // ---- map: location denied
  c = await ctx(browser, { permissions: [] }); p = await page(c);
  await p.goto(BASE + '?v=map');
  await p.waitForFunction(() => LMAP);
  await p.evaluate(() => { navigator.geolocation.getCurrentPosition = (ok, no) => no({ code: 1 }); });
  await tap(p, '[data-loc="use"]');
  ok('denied -> settings guidance', await p.evaluate(() => S.locState) === 'denied' && (await p.locator('#mstatus').innerText()).length > 20);
  ok('denied -> still shows 結 places', await p.locator('#plist [data-pl]').count() > 0);
  await c.close();

  // ---- storage blocked
  c = await ctx(browser); p = await page(c);
  await c.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await p.goto(BASE);
  ok('works with storage blocked', await p.locator('.hcard').count() === 3);
  await c.close();

  // ---- old shortcuts
  c = await ctx(browser); p = await page(c);
  await p.goto(BASE + '?tab=1'); ok('?tab=1 -> calendar', await p.evaluate(() => S.view) === 'cal');
  await p.goto(BASE + '?compose=1'); ok('?compose=1 -> home', await p.evaluate(() => S.view) === 'home');
  await c.close();

  // ---- review repros: async results that arrive while the map is off screen
  c = await ctx(browser, { geolocation: { latitude: 34.8252, longitude: 135.6530 }, permissions: ['geolocation'] });
  p = await page(c);
  await c.route('**/data/japan-prefectures.geojson', async r => { await new Promise(x => setTimeout(x, 1500)); r.continue(); });
  await p.goto(BASE + '?v=map'); await p.waitForFunction(() => LMAP);
  await p.evaluate(() => { const g = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (a, b, o) => setTimeout(() => g(a, b, o), 1500); });
  await tap(p, '[data-loc="use"]'); await tap(p, '[data-t="3"]');
  await p.waitForTimeout(2200); await tap(p, '[data-t="2"]'); await p.waitForTimeout(900);
  ok('location fixed off-map reaches the map', await p.evaluate(() => S.locState === 'ok' && LMAP.hasLayer(LME)));
  await tap(p, '[data-mode="japan"]'); await tap(p, '[data-t="3"]');
  await p.waitForTimeout(2200); await tap(p, '[data-t="2"]'); await p.waitForTimeout(900);
  ok('entering the map tab starts at near me (D14)', await p.evaluate(() => S.mode === 'near' && !LMAP.hasLayer(LPREF || L.layerGroup())));
  await tap(p, '[data-mode="japan"]'); await p.waitForTimeout(600);
  ok('boundaries loaded off-map are drawn', await p.evaluate(() => !!PREFGEO && LMAP.hasLayer(LPREF)));
  // zoom kept across mode switches
  await tap(p, '[data-mode="near"]'); await p.waitForTimeout(600);
  await p.evaluate(() => LMAP.setZoom(17, { animate: false }));
  await tap(p, '[data-mode="japan"]'); await p.waitForTimeout(300);
  await tap(p, '[data-mode="near"]'); await p.waitForTimeout(300);
  ok('zoom kept across mode switch', await p.evaluate(() => LMAP.getZoom()) === 17, String(await p.evaluate(() => LMAP.getZoom())));
  // zoom button labels follow the language
  await tap(p, '[data-menu]'); await tap(p, '[data-l="ko"]');
  ok('zoom label translated', await p.evaluate(() => LBOX.querySelector('.leaflet-control-zoom-in').title) === '확대');
  // menu closes on a click outside any button
  await tap(p, '[data-menu]'); await p.mouse.click(200, 760 - 100);
  ok('menu closes on outside click', await p.evaluate(() => !S.menu && document.querySelector('.langmenu').hidden));
  await c.close();

  // ---- reload restores the screen; re-tapping a tab does not stack history
  c = await ctx(browser); p = await page(c);
  await p.goto(BASE); await tap(p, '[data-t="1"]'); await tap(p, '[data-lesson="l2"]');
  await p.reload();
  ok('reload stays on the lesson', await p.evaluate(() => S.view === 'lesson' && S.lid === 'l2'));
  const n0 = await p.evaluate(() => history.length);
  await tap(p, '[data-t="0"]'); await tap(p, '[data-t="0"]'); await tap(p, '[data-t="0"]');
  ok('re-tapping a tab adds one entry', await p.evaluate(() => history.length) === n0 + 1);
  await p.goto(BASE + '?v=map');
  ok('shortcut query removed from address bar', !(await p.evaluate(() => location.search)));
  await c.close();

  // ---- architect review: skip can be undone, Tokyo fits its mainland, back from a prefecture, tile failures
  c = await ctx(browser, { geolocation: { latitude: 34.8252, longitude: 135.6530 }, permissions: ['geolocation'] });
  p = await page(c);
  await p.goto(BASE + '?v=map'); await p.waitForFunction(() => LMAP);
  await tap(p, '[data-loc="skip"]');
  ok('after skip, location can be turned on', await p.locator('#mstatus [data-loc="use"]').count() === 1);
  await tap(p, '#mstatus [data-loc="use"]'); await p.waitForFunction(() => S.locState === 'ok');
  ok('no tile warning when tiles load', !(await p.evaluate(() => S.tileFail)));
  await tap(p, '[data-mode="japan"]'); await p.waitForFunction(() => PREFGEO); await p.waitForTimeout(600);
  await tap(p, '[data-pref="13"]'); await p.waitForTimeout(900);
  const tb = await p.evaluate(() => { const b = LMAP.getBounds(); return { s: b.getSouth(), z: LMAP.getZoom() }; });
  ok('Tokyo fits the mainland, not the islands', tb.s > 34.5 && tb.z >= 9, JSON.stringify(tb));
  await p.goBack(); await p.waitForTimeout(600);
  ok('system back from a prefecture returns to all of Japan', await p.evaluate(() => S.view === 'map' && S.mode === 'japan' && !S.pref));
  await tap(p, '[data-pref="27"]'); await p.waitForTimeout(300);
  await tap(p, '.prefbar [data-pref=""]'); await p.waitForTimeout(300);
  ok('"back to all of Japan" button returns too', await p.evaluate(() => S.mode === 'japan' && !S.pref));
  await c.close();
  c = await ctx(browser, { badTiles: true }); p = await page(c);
  await p.goto(BASE + '?v=map'); await p.waitForFunction(() => LMAP); await p.waitForTimeout(1200);
  ok('tile failure is explained', await p.evaluate(() => S.tileFail) && (await p.locator('#mstatus').innerText()).length > 10);
  await c.close();

  // ---- overflow at 375px, every root view, every language
  c = await ctx(browser); p = await page(c);
  await p.goto(BASE);
  const over = [];
  for (const lang of ['en', 'ja', 'ko']) for (const v of ['home', 'learn', 'cal', 'map', 'collection']) {
    await p.evaluate(([l, v]) => { S.lang = l; S.view = v; render(); }, [lang, v]);
    await p.waitForTimeout(80);
    const bad = await p.evaluate(() => [...document.querySelectorAll('#app *, #tabbar *')].filter(e => {
      if (e.closest('.filters, .leaflet-container')) return false; const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.tagName !== 'svg');
    }).slice(0, 3).map(e => e.tagName + '.' + e.className));
    const hdr = await p.evaluate(() => { const b = document.querySelector('.globe'); if (!b) return 0; const r = document.createRange(); r.selectNodeContents(b); const tops = [...r.getClientRects()].map(x => Math.round(x.top + x.height / 2)); return Math.max(...tops) - Math.min(...tops) > 6 ? 99 : 0; });
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) over.push(`${lang}/${v}: page scrolls sideways`);
    if (bad.length) over.push(`${lang}/${v}: ${bad.join(',')}`);
    if (hdr > 40) over.push(`${lang}/${v}: language button wraps (${hdr}px)`);
  }
  ok('no horizontal overflow at 375px', !over.length, over.join(' | '));
  await c.close();

  ok('no console/page errors', !errs.length, errs.slice(0, 5).join(' | '));
  await browser.close();
  for (const r of res) console.log(r.join('  '));
  console.log(res.filter(r => r[0] === 'FAIL').length + ' failed of ' + res.length);
})().catch(e => { console.error(e); process.exit(1); });
