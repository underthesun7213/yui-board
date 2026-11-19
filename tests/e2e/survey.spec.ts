import { expect, go, test } from './fixtures';

/* The residents' survey: one link at a game's ending and one on the terms
   screen, to the Google Form, in a new tab with no referrer, until it closes
   on 30 Nov 2026 23:59 JST. The clock is fixed so the tests hold after that. */
const OPEN = new Date('2026-11-20T12:00:00+09:00');
const CLOSED = new Date('2026-12-01T00:00:00+09:00');
const FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSeGHXb0GKZrBV6RiyfWZCsTCwFtF47jXYI5Azqy_hdQWkLQ0g/viewform';
type Handle = {
  __yunabi: { nextScene(): void; collection: { get(): { cg: Record<string, boolean> } } };
};

const isFormLink = async (link: import('@playwright/test').Locator) => {
  await expect(link).toHaveAttribute('href', FORM);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noreferrer/);
};

test('survey: the terms screen links to the form, in the screen language', async ({
  page,
  errors,
}) => {
  void errors;
  await page.clock.setFixedTime(OPEN);
  await go(page, 'legal');
  const link = page.locator('.legal a.surveylink');
  await isFormLink(link);
  await expect(link).toContainText('Help with a class project survey');
  await page.evaluate(() => localStorage.setItem('yui.v1.lang', '"ko"'));
  await page.reload();
  await expect(page.locator('.legal a.surveylink')).toContainText(
    '수업 프로젝트 설문에 협조해 주세요',
  );
});

test("survey: a game's ending links to the form", async ({ page, errors }) => {
  void errors;
  await page.clock.setFixedTime(OPEN);
  await go(page, 'japanese/l8');
  await page.locator('[data-route="osaka"]').click();
  const ended = () =>
    page.evaluate(
      () => Object.keys((window as unknown as Handle).__yunabi.collection.get().cg).length > 0,
    );
  for (let i = 0; i < 60 && !(await ended()); i++)
    await page.evaluate(() => (window as unknown as Handle).__yunabi.nextScene());
  await isFormLink(page.locator('a.surveylink'));
});

test('survey: after it closes, the terms screen has no link', async ({ page, errors }) => {
  void errors;
  await page.clock.setFixedTime(CLOSED);
  await go(page, 'legal');
  await expect(page.locator('.legal .statsopt')).toBeVisible();
  await expect(page.locator('a.surveylink')).toHaveCount(0);
});
