import type { Lang } from '../domain/types';

/* The residents' survey: a Google Form in English, with its own consent
   section and privacy note. Linked from the game's ending and the terms
   screen (ui/SurveyLink.tsx); the poster carries the same address. */
export const SURVEY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeGHXb0GKZrBV6RiyfWZCsTCwFtF47jXYI5Azqy_hdQWkLQ0g/viewform';

export const SURVEY_TEXT: Record<Lang, { t: string; b: string }> = {
  en: {
    t: 'Tell us what you think',
    b: 'A 2-minute anonymous survey in English. Opens Google Forms.',
  },
  ja: {
    t: 'ご意見をお聞かせください',
    b: '2分の匿名アンケート（英語）です。Google フォームが開きます。',
  },
  ko: {
    t: '의견을 들려주세요',
    b: '2분 걸리는 익명 설문이에요(영어). Google 설문지가 열려요.',
  },
};
