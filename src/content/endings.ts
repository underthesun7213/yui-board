import type { Ending } from './types';

/* Cards collected by playing episode 8. Ids are stored on the device
   (yui.v1.cg), so never rename one. */
export const ENDINGS: Ending[] = [
  {
    id: 'e_osaka_best',
    route: 'osaka',
    tier: 'good',
    t: {
      ja: 'また明日も会おう',
      en: 'See you again tomorrow',
      ko: '내일 또 보자',
    },
    jp: 'ほな、{明日|あした}も{空|あ}いてる？',
    s: 'Dotonbori at night, two friends laughing on the river wall, neon reflections',
    n: {
      ja: '冗談を返せた回。テンポが合うと、次の約束はその場で決まる',
      en: 'The run where you returned the jokes. Match the tempo and the next plan gets made on the spot',
      ko: '농담을 되돌려준 회차. 템포가 맞으면 다음 약속은 그 자리에서 정해진다',
    },
  },
  {
    id: 'e_osaka_norm',
    route: 'osaka',
    tier: 'normal',
    t: {
      ja: 'ほな、また今度',
      en: 'Next time, then',
      ko: '그럼 다음에',
    },
    jp: 'ほな、また{今度|こんど}な。',
    s: 'Station ticket gates at night, one friend waving from the far side',
    n: {
      ja: '悪くない一日。ただ敬語が残ると、距離も少し残る',
      en: 'A fine day out. But keigo left in means a little distance left in too',
      ko: '나쁘지 않은 하루. 다만 경어가 남으면 거리도 조금 남는다',
    },
  },
  {
    id: 'e_osaka_bad',
    route: 'osaka',
    tier: 'bad',
    t: {
      ja: '行けたら行くわ',
      en: "I'll go if I can",
      ko: '갈 수 있으면 갈게',
    },
    jp: '{次|つぎ}？……{行|い}けたら{行|い}くわ。',
    s: 'Station ticket gates at dusk, the friend half-turned away with a vague wave',
    n: {
      ja: '大阪の「行けたら行くわ」は、たいてい来ないという意味。敬語のままで冗談も返せないと、次の約束は生まれない',
      en: 'In Osaka, 行けたら行くわ ("I\'ll go if I can") usually means no. Stay in keigo and leave the jokes unanswered, and no next plan gets made',
      ko: '오사카의 「行けたら行くわ(갈 수 있으면 갈게)」는 대개 안 온다는 뜻. 경어만 쓰고 농담도 못 받으면 다음 약속은 생기지 않는다',
    },
  },
  {
    id: 'e_kyoto_best',
    route: 'kyoto',
    tier: 'good',
    t: {
      ja: '来年の夏も',
      en: 'Next summer too',
      ko: '내년 여름에도',
    },
    jp: '{今日|きょう}はほんまにおおきに。……{来年|らいねん}の{花火|はなび}も、{一緒|いっしょ}に{来|き}てくれはります？',
    s: 'The red bridge after the last firework, Ayano smiling openly, her sleeve raised to her lips',
    n: {
      ja: '遠回しを全部拾えた一日。京都の人から言い出した「また」は、本当の約束',
      en: 'You caught every sideways line today. When someone from Kyoto brings up "next time" first, it is a real plan',
      ko: "돌려 말한 걸 전부 알아챈 하루. 교토 사람이 먼저 꺼낸 '다음'은 진짜 약속이다",
    },
  },
  {
    id: 'e_kyoto_norm',
    route: 'kyoto',
    tier: 'normal',
    t: {
      ja: '気ぃつけて',
      en: 'Safe home',
      ko: '조심히 들어가세요',
    },
    jp: '{今日|きょう}はおおきに。{気|き}ぃつけて{帰|かえ}っておくれやす。',
    s: 'The end of the red bridge, the crowd thinning, Ayano bowing politely',
    n: {
      ja: '悪くない一日。いくつか取りこぼしても、あやのは最後までやさしかった。京都のやさしさは、距離でもある',
      en: 'Not a bad day. You missed a few, and Ayano stayed kind to the end. In Kyoto, kindness can also be distance',
      ko: '나쁘지 않은 하루. 몇 개를 놓쳤지만 아야노는 끝까지 상냥했다. 교토의 상냥함은 거리이기도 하다',
    },
  },
  {
    id: 'e_kyoto_bad',
    route: 'kyoto',
    tier: 'bad',
    t: {
      ja: 'またご縁があれば',
      en: 'If fate allows',
      ko: '인연이 닿으면',
    },
    jp: 'ほな、またご{縁|えん}がありましたら。',
    s: 'The red bridge in drifting smoke after the fireworks, Ayano walking away with a small polite bow over her shoulder',
    n: {
      ja: '京都の「またご縁があれば」は、たいてい「もう会うことはない」。大阪の「行けたら行くわ」と同じ',
      en: 'In Kyoto, "if fate allows" usually means you will not meet again: the same as Osaka\'s 行けたら行くわ',
      ko: "교토의 「またご縁があれば」는 대개 '다시 볼 일은 없을 것'. 오사카의 「行けたら行くわ」와 같다",
    },
  },
];
