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
      ja: '言わはらへんこと',
      en: 'The things left unsaid',
      ko: '말하지 않은 것들',
    },
    jp: 'あんた、よう{気|き}づかはるね。',
    s: 'A narrow Kyoto lane at dusk, two friends walking slowly, lanterns lit',
    n: {
      ja: '遠回しを全部拾えた回。京都では、気づくことが礼儀になる',
      en: 'The run where you caught every indirect line. Here, noticing is the courtesy',
      ko: '돌려 말한 걸 전부 알아챈 회차. 교토에선 알아채는 것이 예의가 된다',
    },
  },
  {
    id: 'e_kyoto_norm',
    route: 'kyoto',
    tier: 'normal',
    t: {
      ja: 'お茶漬けの話',
      en: 'The ochazuke story',
      ko: '오차즈케 이야기',
    },
    jp: '……まあ、ゆっくりしていっておくれやす。',
    s: 'A traditional room, teapot on the table, afternoon light going amber',
    n: {
      ja: 'いくつか取りこぼした回。気づけなくても、嫌われたわけではない',
      en: 'A few lines went past you. Missing them does not mean you were disliked',
      ko: '몇 개를 놓친 회차. 못 알아챘다고 미움받은 건 아니다',
    },
  },
  {
    id: 'e_both',
    route: 'both',
    tier: 'good',
    t: {
      ja: '二つの関西',
      en: 'Two Kansais',
      ko: '두 개의 간사이',
    },
    jp: '{大阪|おおさか}と{京都|きょうと}、{電車|でんしゃ}で40{分|ぷん}。',
    s: 'A split scene: Osaka neon on one side, a quiet Kyoto lane on the other, the same student in both',
    n: {
      ja: '両方を歩いた人だけのカード。40分しか離れていないのに、話し方がこれだけ違う',
      en: 'Only for those who walked both. Forty minutes apart, and the way people speak is this different',
      ko: '양쪽을 모두 걸은 사람만의 카드. 40분 거리인데 말하는 방식이 이만큼 다르다',
    },
  },
];
