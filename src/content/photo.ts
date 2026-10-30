import type { L3 } from './types';

/* The fireworks photo on the bridge (level 8's Kyoto route, the last scene):
   the phone held up, the frame moved and zoomed over Ayano and the sky, three
   shots at most. Her lines in Japanese with furigana as {漢字|かな}; the
   screen's own words in all three languages, here and not in i18n (as the
   smart-ball's SB_TEXT). */

/** who is in the photo: Ayano with the fireworks, or the sky only */
export type PhMode = 'friend' | 'sky';
/** how a shot came out */
export type PhGrade = 'best' | 'good' | 'face' | 'few' | 'skyGood' | 'skyFew';

export const PH_TRIES = 3;

export const PH_TEXT = {
  title: { ja: '花火の写真', en: 'Fireworks photo', ko: '불꽃놀이 사진' },
  shot: { ja: '写真 {n}/{all}', en: 'Shot {n}/{all}', ko: '사진 {n}/{all}' },
  done: { ja: '撮影おわり', en: 'All done', ko: '촬영 끝' },
  ayano: { ja: 'あやの', en: 'Ayano', ko: '아야노' },
  view: {
    ja: 'スマホの画面。ドラッグで動かす',
    en: 'The phone screen. Drag to move it',
    ko: '휴대폰 화면. 드래그해서 움직인다',
  },
  leadFriend: {
    ja: 'ドラッグで画面を動かし、ズームで大きさを決める。あやのの顔と花火を三つ以上入れて、シャッター。',
    en: 'Drag to move the frame and zoom to size it. Get Ayano’s face and three or more fireworks in, then press the shutter.',
    ko: '드래그로 화면을 옮기고 줌으로 크기를 맞춘다. 아야노의 얼굴과 불꽃 세 개 이상을 넣고 셔터.',
  },
  leadSky: {
    ja: 'ドラッグで画面を動かし、ズームで大きさを決める。花火を三つ以上入れて、シャッター。',
    en: 'Drag to move the frame and zoom to size it. Get three or more fireworks in, then press the shutter.',
    ko: '드래그로 화면을 옮기고 줌으로 크기를 맞춘다. 불꽃을 세 개 이상 넣고 셔터.',
  },
  zoom: { ja: 'ズーム', en: 'Zoom', ko: '줌' },
  shutter: { ja: 'シャッター', en: 'Shutter', ko: '셔터' },
  again: { ja: 'もう一枚', en: 'Take another', ko: '한 장 더' },
  /* in a heading: the fireworks in the shot */
  count: { ja: '花火 {n}つ', en: '{n} fireworks', ko: '불꽃 {n}개' },
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

/* How a shot came out: a heading (○ right, × or △ a miss, with the count of
   fireworks), what to change, and Ayano's words. */
export const PH_FB: Record<PhGrade, { head: L3; body: L3; say: string }> = {
  best: {
    head: {
      ja: '○ 完璧な一枚 — 花火 {n}つ',
      en: '○ A perfect shot — {n} fireworks',
      ko: '○ 완벽한 한 장 — 불꽃 {n}개',
    },
    body: {
      ja: 'あやのの顔も、空いっぱいの花火も入った。',
      en: 'Ayano’s face and a sky full of fireworks, all in.',
      ko: '아야노의 얼굴도, 하늘 가득한 불꽃도 다 들어왔다.',
    },
    say: 'わぁ、{上手|じょうず}に{撮|と}らはりましたなぁ。おおきに、{大事|だいじ}にしますえ。',
  },
  good: {
    head: {
      ja: '○ いい写真 — 花火 {n}つ',
      en: '○ A good shot — {n} fireworks',
      ko: '○ 좋은 사진 — 불꽃 {n}개',
    },
    body: {
      ja: '顔はきれいに入った。花火がもう少しあると、なおいい。',
      en: 'Her face is in nicely. A few more fireworks would make it even better.',
      ko: '얼굴이 잘 들어왔다. 불꽃이 조금 더 있으면 더 좋다.',
    },
    say: 'ええ{写真|しゃしん}どすなぁ。おおきに。',
  },
  face: {
    head: {
      ja: '× 顔が切れている',
      en: '× Her face is cut off',
      ko: '× 얼굴이 잘렸다',
    },
    body: {
      ja: 'あやのの顔が全部入るように、画面を動かすかズームを引く。',
      en: 'Move the frame or zoom out until her whole face is in.',
      ko: '아야노의 얼굴이 다 들어오게 화면을 옮기거나 줌을 줄인다.',
    },
    say: 'あら……うち、{半分|はんぶん}しか{写|うつ}ってしまへんなぁ。もういっぺん、よろしおす？',
  },
  few: {
    head: {
      ja: '△ 花火が少ない — {n}つ',
      en: '△ Not enough fireworks — {n}',
      ko: '△ 불꽃이 적다 — {n}개',
    },
    body: {
      ja: '顔は入った。空の方へ画面を動かすか、ズームを引いて花火を二つ以上入れる。',
      en: 'Her face is in. Move up toward the sky or zoom out to get two or more fireworks.',
      ko: '얼굴은 들어왔다. 하늘 쪽으로 옮기거나 줌을 줄여서 불꽃을 두 개 이상 넣는다.',
    },
    say: '{花火|はなび}、あんまり{入|はい}ってしまへんなぁ。',
  },
  skyGood: {
    head: {
      ja: '○ きれいに撮れた — 花火 {n}つ',
      en: '○ A lovely shot — {n} fireworks',
      ko: '○ 예쁘게 찍혔다 — 불꽃 {n}개',
    },
    body: {
      ja: '空いっぱいの花火。……あやのは写っていない。',
      en: 'A sky full of fireworks. …Ayano is not in it.',
      ko: '하늘 가득한 불꽃. ……아야노는 찍히지 않았다.',
    },
    say: 'きれいに{撮|と}れましたなぁ。',
  },
  skyFew: {
    head: {
      ja: '△ 花火が少ない — {n}つ',
      en: '△ Not enough fireworks — {n}',
      ko: '△ 불꽃이 적다 — {n}개',
    },
    body: {
      ja: '空の方へ画面を動かすか、ズームを引いて花火を三つ以上入れる。',
      en: 'Move up toward the sky or zoom out to get three or more fireworks.',
      ko: '하늘 쪽으로 옮기거나 줌을 줄여서 불꽃을 세 개 이상 넣는다.',
    },
    say: 'あら、{花火|はなび}が{終|お}わったとこどしたなぁ。',
  },
};
