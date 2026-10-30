import type { Achievement, Bet } from './types';

/* Achievement illustrations of episode 8, unlocked during the game (the
   storyboard's §5): each once, the moment its condition is met. Ids are
   stored on the device with the ending cards (yui.v1.cg), so never rename one. */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a_osaka_kushikatsu',
    route: 'osaka',
    t: {
      ja: '二度漬けなしの串カツ',
      en: 'Dipped once',
      ko: '한 번만 찍은 쿠시카츠',
    },
    jp: 'やっぱ{串|くし}カツは{最高|さいこう}やな！',
    s: 'Yuki at the kushikatsu table taking a big happy bite of a skewer, the shared sauce tray in front',
    n: {
      ja: '二度漬けせずに食べきった。ソースの決まりを守れば、店も友達も笑顔になる',
      en: 'You ate the lot without a second dip. Keep the sauce rule and the shop and your friend both smile',
      ko: '두 번 찍지 않고 다 먹었다. 소스 규칙을 지키면 가게도 친구도 웃는다',
    },
  },
  {
    id: 'a_osaka_juice',
    route: 'osaka',
    t: {
      ja: '勝負のジュース',
      en: 'The juice bet',
      ko: '내기 주스',
    },
    jp: '{勝負|しょうぶ}の{後|あと}のジュースは{格別|かくべつ}やな！',
    s: 'Yuki outside the smart-ball arcade taking a can of orange soda out of a drink vending machine',
    n: {
      ja: 'スマートボールの賭けを受けて立った。小さな賭けはノリで乗るのが大阪流。勝っても負けても同じ一枚',
      en: 'You took the smart-ball bet. A small bet is taken on the mood of the moment, Osaka style. The same picture whoever wins',
      ko: '스마트볼 내기를 받아들였다. 작은 내기는 분위기로 받는 게 오사카식. 누가 이기든 같은 그림',
    },
  },
  {
    id: 'a_osaka_takoyaki',
    route: 'osaka',
    t: {
      ja: '賭けはたこ焼きに',
      en: 'Raised to takoyaki',
      ko: '판돈은 타코야키로',
    },
    jp: 'ほら、{熱|あつ}いうちに{食|た}べよ',
    s: 'Yuki by a takoyaki stall on a Shinsekai street, turned away at 45 degrees and glancing back with a slight smile, a paper boat of takoyaki in his hand',
    n: {
      ja: 'ジュースをたこ焼きに上げて返した。冗談を広げて返すと、もっと盛り上がる。勝っても負けても同じ一枚',
      en: 'You raised the juice to takoyaki. Build on a joke and the fun gets bigger. The same picture whoever wins',
      ko: '주스를 타코야키로 키워 받았다. 농담을 키워 받으면 더 신난다. 누가 이기든 같은 그림',
    },
  },
  {
    id: 'a_kyoto_latte',
    route: 'kyoto',
    t: {
      ja: 'ラテを飲むあやの',
      en: 'Ayano with her latte',
      ko: '라테를 마시는 아야노',
    },
    jp: 'ハートのラテ、{飲|の}むのもったいないわぁ',
    s: 'Ayano at the matcha tea house table holding a latte cup with a heart in the milk, smiling softly',
    n: {
      ja: 'あやののラテにハートを描いた。小さな心づかいは、言葉にしなくても伝わる',
      en: 'You drew a heart in her latte. A small kindness gets through without a word',
      ko: '아야노의 라테에 하트를 그렸다. 작은 배려는 말하지 않아도 전해진다',
    },
  },
  {
    id: 'a_kyoto_ringo',
    route: 'kyoto',
    t: {
      ja: 'りんご飴とあやの',
      en: 'Ayano and the candy apple',
      ko: '링고아메와 아야노',
    },
    jp: 'やっぱり、お{祭|まつ}りはりんご{飴|あめ}どすなぁ',
    s: 'Ayano in her kimono at a festival stall at dusk, holding a shiny red candy apple, smiling',
    n: {
      ja: '着物に似合う甘い物をすすめた。相手の服や場面まで考えると、選択がやさしくなる',
      en: 'You suggested a sweet that suits a kimono. Thinking of what she is wearing makes the choice a kind one',
      ko: '기모노에 어울리는 단것을 권했다. 상대의 옷차림까지 생각하면 선택이 상냥해진다',
    },
  },
  {
    id: 'a_kyoto_hanabi',
    route: 'kyoto',
    t: {
      ja: '花火とあやの',
      en: 'Ayano under the fireworks',
      ko: '불꽃놀이와 아야노',
    },
    jp: 'ええ{写真|しゃしん}、おおきに。{大事|だいじ}にしますえ',
    s: 'Ayano on the red bridge at night, looking back over her shoulder with a gentle smile, fireworks bursting above the hills behind',
    n: {
      ja: '「撮ってさしあげまひょか」に気づいて、あやのを花火と一緒に撮った。言われなくても、してほしいことを汲む',
      en: 'You heard what her offer meant and took her photo with the fireworks. Doing what someone wanted without being asked',
      ko: '「撮ってさしあげまひょか」의 속뜻을 알아채고 아야노를 불꽃과 함께 찍었다. 말하지 않아도 바라는 것을 헤아린다',
    },
  },
];

/** a good photo of Ayano with the fireworks (the photo game) */
export const ACH_HANABI = 'a_kyoto_hanabi';
/** a heart in Ayano's latte (the 아야노 미니게임) */
export const ACH_LATTE = 'a_kyoto_latte';
/** finishing the 유우키 미니게임 without a second dip */
export const ACH_NO_DOUBLE_DIP = 'a_osaka_kushikatsu';
/** finishing the smart-ball match, by what it was played for */
export const ACH_BET: Record<Bet, string> = {
  juice: 'a_osaka_juice',
  takoyaki: 'a_osaka_takoyaki',
};
