import type { Lang } from '../domain/types';

/* The residents' survey: a Google Form in English, with its own consent
   section and privacy note, run as a class project. Linked from the game's
   ending and the terms screen (ui/SurveyLink.tsx) until it closes; the
   poster carries the same address and the same closing date. */
export const SURVEY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScFD0VQa0GU5X9Nz2Eer-HNB-wrl5rbrkqkrDSQhoif3G89LA/viewform';

/* Monday 30 November 2026, 23:59 JST; the form stops taking answers then. */
export const SURVEY_CLOSES = Date.parse('2026-11-30T23:59:59+09:00');

export const surveyOpen = (now: number) => now <= SURVEY_CLOSES;

export const SURVEY_TEXT: Record<Lang, { t: string; b: string }> = {
  en: {
    t: 'Help with a class project survey',
    b: 'A 2-minute anonymous survey in English, open until 30 Nov (Mon). Opens Google Forms.',
  },
  ja: {
    t: '授業プロジェクトのアンケートにご協力ください',
    b: '2分の匿名アンケート（英語）です。11月30日（月）まで。Google フォームが開きます。',
  },
  ko: {
    t: '수업 프로젝트 설문에 협조해 주세요',
    b: '2분 걸리는 익명 설문이에요(영어). 11월 30일(월)까지예요. Google 설문지가 열려요.',
  },
};
