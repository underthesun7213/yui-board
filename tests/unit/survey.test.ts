import { describe, expect, it } from 'vitest';
import { SURVEY_CLOSES, surveyOpen } from '../../src/content/survey';

/* The survey closes on Monday 30 November 2026, 23:59 JST, as the poster says. */
describe('survey deadline', () => {
  it('is 30 Nov 2026 23:59:59 in Japan', () => {
    expect(new Date(SURVEY_CLOSES).toISOString()).toBe('2026-11-30T14:59:59.000Z');
  });
  it('is open up to the last second and closed after', () => {
    expect(surveyOpen(Date.parse('2026-11-30T23:59:59+09:00'))).toBe(true);
    expect(surveyOpen(Date.parse('2026-12-01T00:00:00+09:00'))).toBe(false);
  });
});
