import type { L3 } from './types';

/* The fireworks photo on the bridge (level 8's Kyoto route, the last scene):
   the phone held up swings on its own, first up and down, then side to side;
   each swing is stopped on a gauge (bad / good / great / good / bad), and the
   second stop is the shutter. Three shots at most. Her lines in Japanese with
   furigana as {漢字|かな}; the screen's own words in all three languages, here
   and not in i18n (as the smart-ball's SB_TEXT). */

/** who is in the photo: Ayano with the fireworks, or the sky only */
export type PhMode = 'friend' | 'sky';
/** where a gauge was stopped */
export type PhZone = 'great' | 'good' | 'bad';
/** how a shot came out: of her, perfect, good, or cut at the feet, at the face,
    or off to a side; of the sky, steady or not */
export type PhGrade = 'best' | 'good' | 'feet' | 'face' | 'side' | 'skyGood' | 'skyMiss';

export const PH_TRIES = 3;

export const PH_TEXT = {
  title: { ja: '花火の写真', en: 'Fireworks photo', ko: '불꽃놀이 사진' },
  shot: { ja: '写真 {n}/{all}', en: 'Shot {n}/{all}', ko: '사진 {n}/{all}' },
  done: { ja: '撮影おわり', en: 'All done', ko: '촬영 끝' },
  ayano: { ja: 'あやの', en: 'Ayano', ko: '아야노' },
  view: {
    ja: 'スマホの画面',
    en: 'The phone screen',
    ko: '휴대폰 화면',
  },
  stepV: { ja: '① 上下', en: '① Up and down', ko: '① 위아래' },
  stepH: { ja: '② 左右', en: '② Side to side', ko: '② 좌우' },
  leadV: {
    ja: 'スマホが上下に揺れている。ゲージが真ん中の黄色に来たら、下のボタンで止める。',
    en: 'The phone is swinging up and down. When the gauge is in the yellow middle, stop it with the button below.',
    ko: '휴대폰이 위아래로 흔들린다. 게이지가 가운데 노란 칸에 올 때 아래 버튼으로 멈춘다.',
  },
  leadH: {
    ja: '次は左右。もう一度、黄色で止めるとシャッターが切れる。',
    en: 'Now side to side. Stop it in the yellow again and the shutter goes.',
    ko: '이제 좌우. 다시 노란 칸에서 멈추면 셔터가 눌린다.',
  },
  stop: { ja: '止める', en: 'Stop', ko: '멈추기' },
  shutter: { ja: 'シャッター', en: 'Shutter', ko: '셔터' },
  again: { ja: 'もう一枚', en: 'Take another', ko: '한 장 더' },
  /* the two stops, as tags under a shot */
  great: { ja: 'GREAT', en: 'GREAT', ko: 'GREAT' },
  good: { ja: 'GOOD', en: 'GOOD', ko: 'GOOD' },
  bad: { ja: 'BAD', en: 'BAD', ko: 'BAD' },
} satisfies Record<string, L3>;
export type PhText = keyof typeof PH_TEXT;

export interface PhSay {
  jp: string;
  t: L3;
}
/** what Ayano says as the phone comes up */
export const PH_OPEN: Record<PhMode, PhSay> = {
  friend: {
    jp: 'ほな、お{願|ねが}いします。{花火|はなび}も{一緒|いっしょ}に{入|はい}るように{撮|と}っておくれやす。',
    t: {
      ja: 'じゃあ、お願いします。花火も一緒に入るように撮ってください。',
      en: 'Go on, then. Please get the fireworks in with me.',
      ko: '그럼 부탁해요. 불꽃도 같이 들어가게 찍어 주세요.',
    },
  },
  sky: {
    jp: '{花火|はなび}、きれいに{撮|と}れるとよろしおすなぁ。',
    t: {
      ja: '花火、きれいに撮れるといいですね。',
      en: 'I hope the fireworks come out nicely.',
      ko: '불꽃, 예쁘게 찍히면 좋겠네요.',
    },
  },
};
/** after three missed shots of her: she lets it go kindly */
export const PH_LAST: PhSay = {
  jp: 'ふふ、ほな、うちの{目|め}に{焼|や}き{付|つ}けときます。',
  t: {
    ja: 'ふふ、じゃあ、私の目に焼き付けておきます。',
    en: 'Hehe. Then I’ll keep this one in my eyes.',
    ko: '후후, 그럼 제 눈에 담아 둘게요.',
  },
};

/* How a shot came out: a heading (○ right, × a miss), what happened or what to
   change, and Ayano's words. */
export const PH_FB: Record<PhGrade, { head: L3; body: L3; say: string }> = {
  best: {
    head: {
      ja: '○ 完璧な一枚',
      en: '○ A perfect shot',
      ko: '○ 완벽한 한 장',
    },
    body: {
      ja: '頭から足の先まで、花火も一緒にぴったり入った。',
      en: 'Head to toe, with the fireworks around her: just right.',
      ko: '머리부터 발끝까지, 불꽃까지 딱 맞게 들어왔다.',
    },
    say: 'わぁ、{上手|じょうず}に{撮|と}らはりましたなぁ。おおきに、{大事|だいじ}にしますえ。',
  },
  good: {
    head: {
      ja: '○ いい写真',
      en: '○ A good shot',
      ko: '○ 좋은 사진',
    },
    body: {
      ja: '少しずれたけれど、あやのも花火もちゃんと入った。',
      en: 'A little off, but Ayano and the fireworks are both in.',
      ko: '조금 어긋났지만 아야노도 불꽃도 잘 들어왔다.',
    },
    say: 'ええ{写真|しゃしん}どすなぁ。おおきに。',
  },
  feet: {
    head: {
      ja: '× 足が切れている',
      en: '× Her feet are cut off',
      ko: '× 발이 잘렸다',
    },
    body: {
      ja: '上で止めすぎた。ゲージが真ん中に来るのを待つ。',
      en: 'Stopped too high. Wait for the gauge to reach the middle.',
      ko: '너무 위에서 멈췄다. 게이지가 가운데 올 때까지 기다린다.',
    },
    say: 'あら、{足|あし}が{切|き}れてしもてますなぁ。もういっぺん、よろしおす？',
  },
  face: {
    head: {
      ja: '× 顔が切れている',
      en: '× Her face is cut off',
      ko: '× 얼굴이 잘렸다',
    },
    body: {
      ja: '下で止めすぎた。ゲージが真ん中に来るのを待つ。',
      en: 'Stopped too low. Wait for the gauge to reach the middle.',
      ko: '너무 아래에서 멈췄다. 게이지가 가운데 올 때까지 기다린다.',
    },
    say: 'あら……うち、{半分|はんぶん}しか{写|うつ}ってしまへんなぁ。もういっぺん、よろしおす？',
  },
  side: {
    head: {
      ja: '× 端に寄っている',
      en: '× She is off to one side',
      ko: '× 한쪽으로 치우쳤다',
    },
    body: {
      ja: '左右で止めるのが早すぎるか遅すぎた。真ん中を狙う。',
      en: 'The side-to-side stop came too early or too late. Aim for the middle.',
      ko: '좌우에서 너무 빨리 또는 늦게 멈췄다. 가운데를 노린다.',
    },
    say: 'うち、{端|はし}っこにおりますなぁ。もういっぺん、よろしおす？',
  },
  skyGood: {
    head: {
      ja: '○ きれいに撮れた',
      en: '○ A lovely shot',
      ko: '○ 예쁘게 찍혔다',
    },
    body: {
      ja: '空いっぱいの花火。……あやのは写っていない。',
      en: 'A sky full of fireworks. …Ayano is not in it.',
      ko: '하늘 가득한 불꽃. ……아야노는 찍히지 않았다.',
    },
    say: 'きれいに{撮|と}れましたなぁ。',
  },
  skyMiss: {
    head: {
      ja: '× 花火が切れている',
      en: '× The fireworks are cut off',
      ko: '× 불꽃이 잘렸다',
    },
    body: {
      ja: 'ゲージが真ん中に来たときに止める。',
      en: 'Stop when the gauge is in the middle.',
      ko: '게이지가 가운데 올 때 멈춘다.',
    },
    say: 'あら、{花火|はなび}が{終|お}わったとこどしたなぁ。',
  },
};
