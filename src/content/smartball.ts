import type { L3 } from './types';

/* What Yuki says during the smart-ball match (level 8, Osaka scene 7).
   Furigana as {漢字|かな}. His win and lose lines at the end are the scene's
   own (vn.ts), as the storyboard gives them. */
export type SbLine =
  | 'intro'
  | 'weak'
  | 'meBig'
  | 'meSmall'
  | 'meOut'
  | 'yukiTurn'
  | 'yukiBig'
  | 'yukiSmall'
  | 'yukiOut'
  | 'yukiDrainBig'
  | 'tie'
  | 'practice';

export const SB_LINES: Record<SbLine, { jp: string; t: L3 }> = {
  intro: {
    jp: 'ほな、{先攻|せんこう}どうぞ。{一人|ひとり}{三球|さんきゅう}な！',
    t: {
      ja: 'お先にどうぞ。一人三球ずつ！',
      en: 'You go first. Three balls each!',
      ko: '먼저 해. 한 사람에 세 개씩!',
    },
  },
  weak: {
    jp: 'もうちょい{強|つよ}く{引|ひ}いてみ！',
    t: {
      ja: 'もう少し強く引いて！',
      en: 'Pull it back a bit harder!',
      ko: '조금 더 세게 당겨 봐!',
    },
  },
  meBig: {
    jp: 'うわ、やるやん！',
    t: { ja: 'うわ、すごい！', en: 'Whoa, nice one!', ko: '와, 제법인데!' },
  },
  meSmall: {
    jp: 'お、{入|はい}った{入|はい}った！',
    t: { ja: 'お、入った！', en: 'Oh, that went in!', ko: '오, 들어갔다 들어갔다!' },
  },
  meOut: {
    jp: 'あ〜、{落|お}ちてもうた！',
    t: { ja: 'あ〜、落ちちゃった！', en: 'Aw, it dropped!', ko: '아~, 떨어져 버렸네!' },
  },
  yukiTurn: {
    jp: 'よっしゃ、{俺|おれ}の{番|ばん}や。',
    t: { ja: 'よし、僕の番だ。', en: 'Right, my turn.', ko: '좋아, 내 차례다.' },
  },
  yukiBig: {
    jp: '{見|み}たか！',
    t: { ja: '見た？', en: 'Did you see that?!', ko: '봤냐!' },
  },
  yukiSmall: {
    jp: 'まあまあやな。',
    t: { ja: 'まあまあだね。', en: 'Not bad.', ko: '그럭저럭이네.' },
  },
  yukiOut: {
    jp: 'なんでやねん！',
    t: { ja: 'なんでだよ！', en: 'Oh, come on!', ko: '이게 왜 이래!' },
  },
  yukiDrainBig: {
    jp: 'あ〜、もうちょい{粘|ねば}りたかったわ……',
    t: {
      ja: 'あ〜、もう少し粘りたかった……',
      en: 'Aw, I wanted to keep that one going a bit longer...',
      ko: '아~, 조금만 더 버티고 싶었는데……',
    },
  },
  tie: {
    jp: '{同点|どうてん}やん！もう{一球|いっきゅう}ずつ！',
    t: {
      ja: '同点だ！もう一球ずつ！',
      en: "We're tied! One more ball each!",
      ko: '동점이네! 한 개씩 더!',
    },
  },
  practice: {
    jp: 'せやな、さっきのは{練習|れんしゅう}やったもんな？ほな、ここからが{本番|ほんばん}や！',
    t: {
      ja: 'そうだね、さっきのは練習だったよね？じゃあ、ここからが本番だ！',
      en: "Right, that one was just practice, wasn't it? Okay, this one's for real!",
      ko: '그래, 아까 건 연습이었지? 그럼 지금부터가 진짜다!',
    },
  },
};
