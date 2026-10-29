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

/* The screen's own words, in three languages. They load with the game, not
   with the first screen (the home bundle budget), as the 유우키 미니게임's do. */
export const SB_TEXT = {
  sbTitle: {
    ja: 'スマートボール・新世界',
    en: 'Smart-ball · Shinsekai',
    ko: '스마트볼 · 신세카이',
  },
  sbBall: {
    ja: '{k}球中{n}球目',
    en: 'Ball {n} of {k}',
    ko: '{k}개 중 {n}번째 공',
  },
  sbYourTurn: {
    ja: 'あなたの番',
    en: 'Your turn',
    ko: '내 차례',
  },
  sbTheirTurn: {
    ja: '{name}の番',
    en: "{name}'s turn",
    ko: '{name} 차례',
  },
  sbYou: {
    ja: 'あなた',
    en: 'You',
    ko: '나',
  },
  sbHow: {
    ja: '一人三球ずつ交代で。合計の多い方の勝ち。一球20秒、穴に入るたびに時間が増える。',
    en: 'Three balls each, taking turns. The higher total wins. Each ball has 20 seconds; every hole adds more.',
    ko: '한 사람에 세 개씩 번갈아. 합계가 많은 쪽이 이긴다. 공 하나에 20초, 구멍에 넣을 때마다 시간이 늘어난다.',
  },
  sbG1: {
    ja: '発射を長押しして、離す。',
    en: 'Hold LAUNCH, then let go.',
    ko: '발사를 꾹 눌렀다가 떼자.',
  },
  sbG1d: {
    ja: '押している間ゲージが上下する。離した時のゲージの強さで玉が飛ぶ。',
    en: 'The gauge goes up and down while you hold; the ball flies as hard as the gauge shows when you let go.',
    ko: '누르고 있는 동안 게이지가 오르내린다. 뗄 때의 게이지 세기로 공이 날아간다.',
  },
  sbG2: {
    ja: 'フリッパーで玉を弾き返す。',
    en: 'Bounce the ball with the paddles.',
    ko: '패들로 공을 튕겨 내자.',
  },
  sbG2d: {
    ja: '左・右のボタン（または台のその側をタップ）で玉を上へ。間に落ちたらその玉は終わり。',
    en: 'LEFT and RIGHT (or a tap on that side of the table) flick the ball back up. If it falls between them, that ball is over.',
    ko: '왼쪽·오른쪽 버튼(또는 판의 그쪽을 탭)으로 공을 위로 쳐 올린다. 둘 사이로 떨어지면 그 공은 끝.',
  },
  sbG3: {
    ja: '当てて点を取ろう！',
    en: 'Hit things to score!',
    ko: '맞혀서 점수를 얻자!',
  },
  sbG3d: {
    ja: '穴は数字の点（3・5・10）と時間がもらえる。赤いバンパーは1点。',
    en: 'A hole scores its number (3, 5, 10) and adds time; a red bumper scores 1.',
    ko: '구멍은 숫자만큼(3·5·10) 점수와 시간을 준다. 빨간 범퍼는 1점.',
  },
  sbTipLaunch: {
    ja: '発射を長押し…離す！',
    en: 'Hold LAUNCH… and let go!',
    ko: '발사를 꾹… 떼면 발사!',
  },
  sbTipFlip: {
    ja: 'フリッパーで弾き返せ！',
    en: 'Bounce it back with the paddles!',
    ko: '패들로 튕겨 내!',
  },
  sbStart: {
    ja: '勝負を始める',
    en: 'Start the match',
    ko: '승부 시작',
  },
  sbStartRe: {
    ja: '再戦を始める',
    en: 'Start the rematch',
    ko: '재대결 시작',
  },
  sbLeft: {
    ja: '左',
    en: 'LEFT',
    ko: '왼쪽',
  },
  sbLaunch: {
    ja: '発射',
    en: 'LAUNCH',
    ko: '발사',
  },
  sbRight: {
    ja: '右',
    en: 'RIGHT',
    ko: '오른쪽',
  },
  sbLeftA: {
    ja: '左のフリッパー',
    en: 'Left flipper',
    ko: '왼쪽 플리퍼',
  },
  sbRightA: {
    ja: '右のフリッパー',
    en: 'Right flipper',
    ko: '오른쪽 플리퍼',
  },
  sbLaunchA: {
    ja: '長押しでばねを引き、離すと発射',
    en: 'Hold to pull the plunger, let go to launch',
    ko: '꾹 눌러 스프링을 당기고, 떼면 발사',
  },
  sbHintLaunch: {
    ja: '発射を長押し。ゲージが上がって下がる。ちょうどいい所で離そう。',
    en: 'Hold LAUNCH: the gauge rises and falls. Let go when it is where you want it.',
    ko: '발사를 꾹 누르면 게이지가 올라갔다 내려간다. 원하는 곳에서 떼자.',
  },
  sbHintFlip: {
    ja: '左右のボタン、台の左右をタップ、または ← → で弾く。',
    en: 'Flip with LEFT and RIGHT, a tap on either half of the table, or ← →.',
    ko: '왼쪽·오른쪽 버튼, 판의 왼쪽·오른쪽 탭, 또는 ← → 로 친다.',
  },
  sbTheyPlay: {
    ja: '{name}がプレイ中。',
    en: '{name} is playing.',
    ko: '{name} 플레이 중.',
  },
  sbTheyWon: {
    ja: '{name}の勝ち。',
    en: '{name} won.',
    ko: '{name} 승리.',
  },
  sbScore: {
    ja: '{a}対{b}。',
    en: '{a} to {b}.',
    ko: '{a} 대 {b}.',
  },
  sbAgain: {
    ja: 'もう一回（一度だけ）',
    en: 'Play again (once)',
    ko: '한 판 더 (한 번만)',
  },
  sbFinal: {
    ja: '再戦はここまで。この結果で決まり。',
    en: 'That was the rematch. The result stands.',
    ko: '재대결 끝. 이 결과로 확정.',
  },
  sbSoundOn: {
    ja: '音あり',
    en: 'Sound on',
    ko: '소리 켬',
  },
  sbSoundOff: {
    ja: '音なし',
    en: 'Sound off',
    ko: '소리 끔',
  },
  sbTable: {
    ja: 'フリッパーが二つあるスマートボール台',
    en: 'Smart-ball table with two flippers',
    ko: '플리퍼가 두 개 달린 스마트볼 판',
  },
} satisfies Record<string, L3>;
export type SbText = keyof typeof SB_TEXT;
