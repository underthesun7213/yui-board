/* v2 checks beyond v1.3 parity. */
import { expect, mapReady, tap, test, y } from './fixtures';

test.describe('offline (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });
  test('Y-C3 the app shell, lessons and map screen open offline after one visit', async ({
    page,
    context,
    errors,
  }) => {
    void errors;
    await page.goto('./');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    /* let the idle preload finish so every screen chunk is cached too */
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.goto('./learn');
    await expect(page.locator('.lesson')).toHaveCount(8);
    await page.goto('./map');
    await mapReady(page);
    await tap(page, '[data-loc="skip"]');
    await tap(page, '[data-mode="japan"]');
    await page.waitForFunction(() => !!window.__yunabi.map().prefLayer);
    await context.setOffline(false);
  });
});

test.describe('user text stays text', () => {
  test.use({
    geolocation: { latitude: 34.8252, longitude: 135.653 },
    permissions: ['geolocation'],
  });
  test('Y-S4 a place named with markup renders as text in the list, card and pin', async ({
    page,
    errors,
  }) => {
    void errors;
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>"\'&';
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs++;
      void d.dismiss();
    });
    await page.goto('./map');
    await mapReady(page);
    await page.waitForFunction(() => window.__yunabi.data.get().status === 'ok');
    await page.evaluate((name) => {
      const d = window.__yunabi.data;
      const p = d.get().places;
      d.set({ places: p.map((x, i) => (i === 0 ? { ...x, name, description: name } : x)) });
    }, payload);
    await tap(page, '[data-loc="skip"]');
    await tap(page, '[data-pl="1"]');
    await expect(page.locator('.pcard h3')).toHaveText(payload);
    await expect(page.locator('.plist [data-pl="1"] b')).toHaveText(payload);
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(await page.locator('#lmap img[src="x"], #main img[src="x"]').count()).toBe(0);
    expect(dialogs).toBe(0);
    /* zoom in until the pin leaves its cluster */
    await page.evaluate(() => {
      const p = window.__yunabi.data.get().places[0] as unknown as { lat: number; lng: number };
      window.__yunabi.map().map!.setView([p.lat, p.lng], 19, { animate: false });
    });
    await page.waitForTimeout(500);
    const titles = await y(page, (a) =>
      [...a.map().container!.querySelectorAll('.leaflet-marker-icon')].map((e) =>
        e.getAttribute('title'),
      ),
    );
    expect(titles).toContain(payload);
  });

  test('Y-S4 an event with markup renders as text on home and in its detail', async ({
    page,
    errors,
  }) => {
    void errors;
    const NAME = `<img src=x onerror="window.__xss=1">"'&`;
    const BODY = `<script>window.__xss=2</script><img src=x onerror="window.__xss=3">"'&`;
    let dialogs = 0;
    page.on('dialog', (d) => {
      dialogs++;
      void d.dismiss();
    });
    await page.goto('./cal');
    await page.waitForFunction(() => window.__yunabi?.data.get().status === 'ok');
    /* tomorrow in Tokyo, and the only event, so it is the home card's "next" */
    const day = new Date(Date.now() + 9 * 3600e3 + 86400e3).toISOString().slice(0, 10);
    const ev = {
      id: 99,
      title: NAME,
      start_date: day,
      start_time: '09:00',
      end_time: '10:00',
      weekly_until: null,
      place_text: NAME,
      body: BODY,
      lang: 'en',
      created_on: day,
      edited_on: null,
    };
    await page.evaluate((e) => {
      const y = window.__yunabi;
      const d = y.data.get();
      /* the same version, so opening the detail does not read the fixtures again */
      y.setData(d.places, [e], [], new Date().toISOString(), d.version);
    }, ev);
    await page.goto('./');
    await expect(page.locator('.hcard.cal small span[lang]')).toHaveText(NAME);
    await page.goto(`./cal/event/99/${day}`);
    await expect(page.locator('.evwrap h1[lang]')).toHaveText(NAME);
    await expect(page.locator('.evwrap .facts dd[lang]')).toHaveText(NAME);
    await expect(page.locator('.evwrap .body[lang]')).toHaveText(BODY);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(await page.locator('#main img[src="x"]').count()).toBe(0);
    expect(dialogs).toBe(0);
  });
});

/* Japan date `n` days from now, as the app counts days */
const jpDay = (n: number) =>
  new Date(Date.now() + 9 * 3600_000 + n * 864e5).toISOString().slice(0, 10);

test.describe('long text without spaces', () => {
  test.use({
    geolocation: { latitude: 34.8252, longitude: 135.653 },
    permissions: ['geolocation'],
  });
  test('a link or handle as a name, title or detail wraps on every screen', async ({
    page,
    errors,
  }) => {
    void errors;
    const run = 'https://instagram.com/the_corner_bakery_official_account_x';
    const link = 'https://www.example.com/slides/study-group/week-1-introduction-to-keigo.pdf';
    const day = jpDay(1);
    await page.goto('./map');
    await mapReady(page);
    await page.waitForFunction(() => window.__yunabi.data.get().status === 'ok');
    /* with the current version kept, a screen change does not read the fixtures again */
    await page.evaluate(
      ({ run, link, day }) => {
        const d = window.__yunabi.data.get();
        const near = {
          ...d.places[0]!,
          id: 900,
          name: run,
          description: link,
          lat: 34.8251,
          lng: 135.6529,
        };
        const ev = {
          id: 900,
          title: run,
          start_date: day,
          start_time: '18:00',
          end_time: '19:00',
          weekly_until: null,
          place_text: 'Room_B204_next_to_the_laundry_and_the_vending_machines',
          body: link,
          lang: 'en',
          created_on: day,
          edited_on: null,
        };
        const places = d.places.filter((x) => x.id !== 900);
        window.__yunabi.setData([...places, near], [ev], [], new Date().toISOString(), d.version);
      },
      { run, link, day },
    );
    const wide = () => page.evaluate(() => document.documentElement.scrollWidth);
    await tap(page, '[data-loc="skip"]');
    await page.locator('.plist button', { hasText: run }).click();
    await expect(page.locator('.pcard h3')).toHaveText(run);
    expect(await wide(), 'map').toBeLessThanOrEqual(375);
    for (const [path, shown] of [
      ['/', run],
      ['/cal', run],
      [`/cal/event/900/${day}`, link],
    ] as const) {
      /* a step through history, as system back and forward make */
      await page.evaluate((p) => {
        history.pushState(null, '', p);
        dispatchEvent(new PopStateEvent('popstate'));
      }, path);
      await expect(page.getByText(shown).first()).toBeVisible();
      expect(await wide(), path).toBeLessThanOrEqual(375);
    }
  });
});

test('Y-K4 after 19:00 in Japan a new event starts tomorrow, not in a slot already over', async ({
  page,
  errors,
}) => {
  void errors;
  await page.clock.install({ time: new Date('2026-10-25T19:30:00+09:00') });
  await page.goto('./cal/new');
  await expect(page.locator('#ef-date')).toHaveValue('2026-10-26');
  /* moved back to today, the slot is refused before anything is sent */
  await page.fill('#ef-title', 'Study group');
  await page.fill('#ef-date', '2026-10-25');
  await page.click('.form button[type=submit]');
  await expect(
    page.getByText('The end has to be after the start, and not already past.'),
  ).toBeVisible();
});

test('a picked prefecture shows its introduction, in the app language', async ({
  page,
  errors,
}) => {
  void errors;
  await page.addInitScript(() => localStorage.setItem('yui.v1.lang', JSON.stringify('ko')));
  await page.goto('./map');
  await mapReady(page);
  await tap(page, '[data-mode="japan"]');
  await tap(page, '.preflist [data-pref="26"]');
  await expect(page.locator('.prefintro')).toContainText('게이한선');
  await expect(page.locator('.prefintro')).toHaveAttribute('lang', 'ko');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  /* back to all of Japan: no introduction */
  await tap(page, '.prefbar [data-pref=""]');
  await expect(page.locator('.prefintro')).toHaveCount(0);
});

test('Y-M12 a place name needs a Latin letter; the form says so before sending', async ({
  page,
  errors,
}) => {
  void errors;
  await page.addInitScript(() => localStorage.setItem('yui.v1.lang', JSON.stringify('ko')));
  await page.goto('./map/new');
  /* opened straight from a link, the form's map still has Leaflet's styles: clipped, not covering the page */
  await expect(page.locator('#lmap')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('#pf-name-hint')).toContainText('Mandai');
  await page.fill('#pf-name', '만다이');
  await page.click('.form button[type=submit]');
  await expect(page.locator('#pf-name-err')).toHaveText(
    '이름은 영어로 써 주세요(로마자 한 글자 이상). 일본어는 괄호로 덧붙일 수 있어요.',
  );
  await expect(page.locator('#pf-name')).toHaveAttribute('aria-invalid', 'true');
  /* with Japanese kept in brackets the name is fine: the next problem is another field */
  await page.fill('#pf-name', 'Academic Affairs Office (教務課)');
  await page.click('.form button[type=submit]');
  await expect(page.locator('#pf-name-err')).toHaveCount(0);
});

test.describe('D32 description translation', () => {
  test.use({
    geolocation: { latitude: 34.8252, longitude: 135.653 },
    permissions: ['geolocation'],
  });
  test('a description written in another language shows translated, with the original one tap away', async ({
    page,
    errors,
  }) => {
    void errors;
    await page.addInitScript(() => localStorage.setItem('yui.v1.lang', JSON.stringify('ko')));
    await page.goto('./map');
    await mapReady(page);
    await tap(page, '[data-loc="skip"]');
    await tap(page, '[data-pl="1"]');
    const card = page.locator('.pcard');
    await expect(card).toContainText('가장 가까운 역.');
    await expect(card.locator('.trnote')).toContainText('자동 번역');
    await card.getByRole('button', { name: '원문 보기' }).click();
    await expect(card).toContainText('いちばん近い駅。');
    await expect(card.locator('p[lang="ja"]').first()).toBeVisible();
    await card.getByRole('button', { name: '번역 보기' }).click();
    await expect(card).toContainText('가장 가까운 역.');
    /* a place with no translation shows its own text and no note */
    await tap(page, '[data-pl="2"]');
    await expect(page.locator('.pcard .trnote')).toHaveCount(0);
  });
});

test('TR-Q2 an event shows translated, with the original one tap away and rewritten weeks as written', async ({
  page,
  errors,
}) => {
  void errors;
  await page.addInitScript(() => localStorage.setItem('yui.v1.lang', JSON.stringify('ko')));
  await page.goto('./cal/event/2/2026-09-11');
  const ev = page.locator('.evwrap');
  await expect(ev.locator('h1')).toHaveText('소방 설비 점검');
  await expect(ev.locator('h1')).toHaveAttribute('lang', 'ko');
  await expect(ev.locator('.trnote')).toContainText('자동 번역');
  await ev.getByRole('button', { name: '원문 보기' }).click();
  await expect(ev.locator('h1')).toHaveText('消防設備点検');
  await expect(ev.locator('.body')).toHaveAttribute('lang', 'ja');
  /* this week rewrote the title and body: they stay as written, the place is the series' */
  await page.goto('./cal/event/4/2026-09-15');
  await expect(ev.locator('h1')).toHaveText('GIP: Board Game Day');
  await expect(ev.locator('h1')).toHaveAttribute('lang', 'en');
  await expect(ev.locator('.trnote')).toHaveCount(1);
});

test('Y-BL-01 every screen has a path that reloads, and an old hash link becomes its path', async ({
  page,
  errors,
}) => {
  void errors;
  await page.goto('./#/cal/new');
  await expect(page).toHaveURL(/\/cal\/new$/);
  expect(await page.evaluate(() => location.hash)).toBe('');
  /* a deep path loaded or reloaded straight away still finds the app and its files */
  await page.goto('./learn/l8');
  await page.reload();
  await expect(page.locator('[data-route="osaka"]')).toBeVisible();
  await expect(page).toHaveURL(/\/learn\/l8$/);
  /* a path that is no screen opens home */
  await page.goto('./nowhere/at/all');
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test('SYS-04 the terms, privacy policy and contact open from home and from a first post', async ({
  page,
  errors,
}) => {
  void errors;
  await page.goto('./');
  await page.getByRole('button', { name: /Terms, privacy and contact/ }).click();
  await expect(page).toHaveURL(/\/legal$/);
  const doc = page.locator('article.legal');
  await expect(doc.locator('h2')).toHaveText(['Terms of Use', 'Privacy Policy', 'Contact']);
  await expect(doc.locator('table')).toHaveCount(3);
  await expect(doc.getByRole('link', { name: 'Email the operator' })).toHaveAttribute(
    'href',
    'mailto:yunabi@juha.dev',
  );
  /* in the screen's language */
  await page.evaluate(() => localStorage.setItem('yui.v1.lang', JSON.stringify('ja')));
  await page.reload();
  await expect(doc.locator('h2').first()).toHaveText('利用規約');
  /* before the first post, the form links here too */
  await page.goto('./cal/new');
  await page.getByRole('button', { name: /利用規約・プライバシー・お問い合わせ/ }).click();
  await expect(page).toHaveURL(/\/legal$/);
});

test('유우키 미니게임: order on the phone, dip once, Yuki teases a second dip', async ({
  page,
  errors,
}) => {
  void errors;
  /* level 8 with Yuki: the game is scene 4, after three scenes of talk */
  await page.goto('./learn/l8');
  await tap(page, '[data-route="osaka"]');
  for (let i = 0; i < 3; i++) {
    await tap(page, '[data-opt="0"]');
    await tap(page, '[data-next]');
  }
  await expect(page.locator('.vnwrap .yk')).toHaveCount(1);
  await expect(page).toHaveURL(/\/learn\/l8$/);
  /* far too polite for a friend: marked, and another answer can be tried */
  await tap(page, '.yk [data-opt="2"]');
  await expect(page.locator('.yk .fb.hm')).toBeVisible();
  await tap(page, '.yk [data-opt="0"]');
  await expect(page.locator('.yk .fb.ok')).toBeVisible();
  await tap(page, '[data-yk="next"]');
  /* the mobile order: four kinds, then the order button opens */
  await expect(page.locator('[data-yk="order"]')).toBeDisabled();
  for (const id of ['gyu', 'uzura', 'tama', 'ebi']) await tap(page, `[data-add="${id}"]`);
  await tap(page, '[data-yk="order"]');
  await tap(page, '[data-unit="0"]');
  await tap(page, '[data-yk="next"]');
  /* dip the chosen skewer, bite it, dip it again: Yuki's teasing picture */
  await expect(page.locator('.yk-stage img')).toHaveAttribute('src', /table/);
  await tap(page, '.yk-sauce');
  await page.locator('.yk-kushi[data-k="0"]').press('Enter');
  await tap(page, '.yk-sauce');
  await expect(page.locator('.yk-stage img')).toHaveAttribute('src', /tease/);
  await expect(page.locator('.yk .fb.hm')).toBeVisible();
});
