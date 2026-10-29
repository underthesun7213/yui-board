import type { Route, VnRoute } from './types';

/* Episode 8. Two routes, drawn with a broad brush on purpose: the Osaka friend
   is loud and direct, the Kyoto friend says things sideways. Real people are
   not their prefecture, and the notes say so where it matters. */
/* The best ending allows one miss on any route, counted over the scenes that
   ask for a reply (Osaka five since 2026-10-29, Kyoto five): the mini-game
   and walking scenes are not scored. */
export const BEST_MISSES = 1;

export const VN: Record<Route, VnRoute> = {
  /* The day with Yuki, from the owner's storyboard
     (docs/06-design/game-storyboard-template.md, 2026-10-29): Shinsekai,
     kushikatsu (the 유우키 미니게임), smart ball, goodbye at sunset. */
  osaka: {
    name: {
      ja: 'ユウキ（大阪）',
      en: 'Yuki (Osaka)',
      ko: '유우키 (오사카)',
    },
    blurb: {
      ja: '声が大きい。黙っていると心配される',
      en: 'Loud, fast, and worried about you if you go quiet',
      ko: '목소리가 크다. 조용히 있으면 걱정받는다',
    },
    scenes: [
      {
        s: 'Shinsekai street by day, crowded, Yuki waving hard',
        jp: 'おー、こっちこっち！めっちゃ{待|ま}ったで〜。{何|なに}しとってん！',
        opts: [
          {
            jp: 'ちゃうねん、ちゃうねん！{聞|き}いて、{踏切|ふみきり}にひっかかってん！',
            ok: true,
            fb: {
              ja: '大阪では言い訳もネタにして笑いに変える。',
              en: 'Osaka style: turn the excuse into a joke and the mood lifts.',
              ko: '오사카에서는 변명도 개그로 넘긴다. 웃기면 분위기가 산다.',
            },
            reply: [{ who: 'friend', jp: '{自分|じぶん}、{地下鉄|ちかてつ}で{来|き}たやろ！' }],
          },
          {
            jp: '{大変|たいへん}{申|もう}し{訳|わけ}ございません。',
            ok: false,
            fb: {
              ja: '丁寧すぎて、面接のように聞こえる。',
              en: 'Far too polite: it sounds like a job interview.',
              ko: '너무 정중하다. 면접처럼 들린다.',
            },
            reply: [{ who: 'friend', jp: 'まあまあ、そんな{謝|あやま}らんでもええって' }],
          },
          {
            jp: 'わるいわるい！めっちゃ{待|ま}った？',
            ok: true,
            fb: {
              ja: '相手の言葉(めっちゃ待った)を拾って返すと、会話が転がる。',
              en: 'Picking up his own words (めっちゃ待った) keeps the conversation rolling.',
              ko: '상대의 말(めっちゃ待った)을 받아 되돌리면 대화가 굴러간다.',
            },
            reply: [{ who: 'friend', jp: '{次|つぎ}は{許|ゆる}さへんで〜' }],
          },
        ],
      },
      {
        s: 'Shinsekai street by day, Yuki relaxed with his hands in his pockets',
        jp: '{腹|はら}{減|へ}ったなぁ、{何|なに}{食|た}べる？',
        opts: [
          {
            jp: 'うーん、もんじゃ{焼|や}き{食|た}べよっか？',
            ok: false,
            fb: {
              ja: 'もんじゃは東京の名物。大阪ならお好み焼きや串カツ。',
              en: 'Monjayaki is a Tokyo dish; in Osaka it would be okonomiyaki or kushikatsu.',
              ko: '몬자야키는 도쿄 명물. 오사카라면 오코노미야키나 쿠시카츠.',
            },
            reply: [
              {
                who: 'friend',
                jp: 'もんじゃ？それ{東京|とうきょう}やん！せっかく{新世界|しんせかい}やし、{串|くし}カツいこうや',
              },
            ],
          },
          {
            jp: '{串|くし}カツ{食|た}べてみたい！',
            ok: true,
            fb: {
              ja: '新世界の名物、串カツ。いい選択！',
              en: "Shinsekai's famous kushikatsu: good choice!",
              ko: '신세카이 명물 쿠시카츠, 좋은 선택!',
            },
            reply: [
              {
                who: 'friend',
                jp: 'せやな、{新世界|しんせかい}なら{串|くし}カツやんな。{串|くし}カツのソースは{二度漬|にどづ}け{禁止|きんし}やで',
              },
            ],
          },
          {
            jp: 'マックはどう？',
            ok: false,
            fb: {
              ja: '大阪ではマックではなく「マクド」。',
              en: "In Osaka, McDonald's is マクド, not マック.",
              ko: '오사카에서는 マック가 아니라 マクド라고 부른다.',
            },
            reply: [
              {
                who: 'friend',
                jp: 'マック？{大阪|おおさか}ではマクドやで！{昨日|きのう}マクド{食|た}べたから、{今日|きょう}はちょっとなぁ。{串|くし}カツにせぇへん？{新世界|しんせかい}やし',
              },
            ],
          },
        ],
      },
      {
        s: 'The doorway of a kushikatsu shop at lunchtime, Yuki pushing the noren aside',
        jp: '{邪魔|じゃま}するで〜',
        more: [{ who: 'staff', jp: '{邪魔|じゃま}すんなら{帰|かえ}って〜' }],
        opts: [
          {
            jp: 'え、どういう{意味|いみ}？',
            ok: false,
            fb: {
              ja: '吉本新喜劇の定番ギャグ。本気で「帰れ」と言っているのではない。',
              en: "A stock gag from Yoshimoto Shinkigeki, not a real 'go away'.",
              ko: '요시모토 신희극의 정석 개그. 진심으로 "돌아가"라는 게 아니다.',
            },
            reply: [
              {
                who: 'friend',
                jp: '{急|きゅう}に{新喜劇|しんきげき}かい！……あー、これただのギャグやから',
              },
            ],
          },
          {
            jp: 'はいよ〜（{店|みせ}を{出|で}る）',
            ok: true,
            fb: {
              ja: '完璧！乗っかって帰るふりをするのがお約束。',
              en: 'Perfect: play along and pretend to leave.',
              ko: '퍼펙트! 받아서 나가는 척하는 게 정석.',
            },
            reply: [
              { who: 'staff', jp: 'ほんまに{帰|かえ}るんかい！いらっしゃい、いらっしゃい〜' },
              { who: 'friend', jp: '{新喜劇|しんきげき}{知|し}ってるやん！やるやん！' },
            ],
          },
          {
            jp: 'ほな、お{邪魔|じゃま}しました〜（{店|みせ}を{出|で}る）',
            ok: true,
            fb: {
              ja: 'いいボケ。ギャグを続けて返している。',
              en: 'A good boke: you keep the gag going.',
              ko: '좋은 보케(ボケ). 개그를 이어서 받아쳤다.',
            },
            reply: [
              { who: 'staff', jp: 'ほんまに{帰|かえ}るんかい！いらっしゃい、いらっしゃい〜' },
              { who: 'friend', jp: '{自分|じぶん}、なかなかやるやん！' },
            ],
          },
        ],
      },
      {
        /* the 유우키 미니게임 (src/features/learn/YukiGame.tsx) */
        kind: 'yuki',
        s: 'At a table inside the kushikatsu shop, Yuki across, the shared sauce tray between',
        jp: '',
        note: {
          ja: 'テーブルに座った。この店はスマホで注文する。',
          en: 'You sit down at a table. This shop takes orders on your phone.',
          ko: '테이블에 앉았다. 이 가게는 스마트폰으로 주문한다.',
        },
        opts: [],
      },
      {
        kind: 'move',
        s: 'Shinsekai street around 3 pm, still daytime, the two walking',
        /* draft: the storyboard has no line here */
        jp: 'ほな、{次|つぎ}はスマートボール{行|い}こか！',
        note: {
          ja: '店を出て、一緒にレトロなゲームセンターへ向かう。',
          en: 'You leave the shop and head to a retro game arcade together.',
          ko: '가게를 나와 함께 레트로 게임센터로 간다.',
        },
        opts: [],
      },
      {
        s: 'Inside the Shinsekai smart-ball arcade, retro, Yuki grinning',
        jp: 'よっしゃ、{勝負|しょうぶ}しよか。{負|ま}けた{方|ほう}がジュースおごりな！',
        opts: [
          {
            jp: 'よっしゃ、{受|う}けて{立|た}つで！',
            ok: true,
            fb: {
              ja: '賭けにノリよく乗ると盛り上がる。',
              en: 'Taking the bet with the same energy (ノリ) lifts the mood.',
              ko: '내기를 노리(ノリ)로 받아치면 분위기가 산다.',
            },
            reply: [{ who: 'friend', jp: 'おっ、ええやん！ほな{手加減|てかげん}せえへんで〜' }],
            bet: 'juice',
          },
          {
            jp: 'え、お{金|かね}{賭|か}けるのはちょっと……',
            ok: false,
            fb: {
              ja: 'ジュース一本の冗談を、真面目に受け取りすぎ。',
              en: 'Taking a joke bet over one juice far too seriously.',
              ko: '주스 한 병짜리 장난을 너무 진지하게 받았다.',
            },
            reply: [
              {
                who: 'friend',
                jp: 'いやいや、ジュースやで！？そんな{大|おお}げさな{話|はなし}ちゃうって',
              },
            ],
          },
          {
            jp: 'ほな、ジュースやなくてたこ{焼|や}きにしよ！',
            ok: true,
            fb: {
              ja: '賭けを大きくして返す、大阪らしいノリ。',
              en: 'Raising the stakes back at him: Osaka-style ノリ.',
              ko: '판을 키워서 되받는 오사카식 노리.',
            },
            reply: [{ who: 'friend', jp: 'おっ、{上|あ}げてきたな！ええで、{乗|の}った！' }],
            bet: 'takoyaki',
          },
        ],
      },
      {
        /* the smart-ball mini-game (SmartBall): win or lose, the bet's achievement unlocks */
        kind: 'smartball',
        s: 'The smart-ball machines, the two playing side by side',
        jp: '',
        win: 'えーっ！！もう{一回|いっかい}！……いや、わかったわかった、{俺|おれ}の{負|ま}けや。しゃあないな、おごったるわ',
        lose: 'よっしゃー！{俺|おれ}の{勝|か}ちや！ごちそうさまで〜す',
        note: {
          ja: 'スマートボールで勝負！フリッパーで玉を落とさずに、穴の数字を稼ごう。',
          en: 'A smart-ball match! Keep the marble up with the flippers and score the numbers on the holes.',
          ko: '스마트볼 승부! 플리퍼로 구슬을 떨어뜨리지 말고 구멍의 숫자를 모으자.',
        },
        opts: [],
      },
      {
        s: 'Back where they met in Shinsekai, the sky just turning to sunset',
        jp: '{今日|きょう}{楽|たの}しかったわ！また{遊|あそ}ぼな！',
        opts: [
          {
            jp: 'うん、また{遊|あそ}ぼな！',
            ok: true,
            fb: {
              ja: '大阪弁で返すと、一日でなじんだのが伝わる。',
              en: 'Answering in Osaka speech shows the day rubbed off on you.',
              ko: '오사카 말투로 받아치면 하루 동안 익숙해진 게 드러난다.',
            },
            reply: [{ who: 'friend', jp: 'おっ、もう{大阪弁|おおさかべん}うつってるやん！' }],
          },
          {
            jp: '{本日|ほんじつ}はありがとうございました。',
            ok: false,
            fb: {
              ja: '一日遊んだ友達に、堅すぎる。',
              en: 'Too formal for a friend you spent the whole day with.',
              ko: '하루 종일 같이 논 친구에게 너무 격식 차렸다.',
            },
            reply: [{ who: 'friend', jp: '{急|きゅう}にかしこまるやん！{友達|ともだち}やろ〜' }],
          },
          {
            jp: '{次|つぎ}も{勝負|しょうぶ}しよな！',
            ok: true,
            fb: {
              ja: 'スマートボールの勝負を持ち出して、次の約束につなげる。',
              en: 'Bringing back the smart-ball bet turns it into the next plan.',
              ko: '스마트볼 내기를 다시 꺼내 다음 약속으로 이어진다.',
            },
            reply: [{ who: 'friend', jp: '{望|のぞ}むところや！ほな、またな〜' }],
          },
        ],
      },
    ],
  },
  kyoto: {
    name: {
      ja: 'あやの（京都）',
      en: 'Ayano (Kyoto)',
      ko: '아야노 (교토)',
    },
    blurb: {
      ja: 'やわらかく言う。本音は少し後ろにある',
      en: 'Says things gently; the real meaning sits one step behind',
      ko: '부드럽게 말한다. 속뜻은 한 걸음 뒤에 있다',
    },
    scenes: [
      {
        s: "Kyoto Station's great staircase, one friend waiting with a small bow",
        jp: 'わざわざ{来|き}てくれはって、おおきに。',
        opts: [
          {
            jp: 'いえいえ、こちらこそ。',
            ok: true,
            fb: {
              ja: '謙遜で受けるのが自然。「〜はる」は京都のやわらかい敬語',
              en: "Deflecting is the natural reply. 〜はる is Kyoto's gentle honorific",
              ko: '겸손으로 받는 게 자연스럽다. 〜はる는 교토의 부드러운 경어',
            },
          },
          {
            jp: '{来|き}たかったから。',
            ok: true,
            fb: {
              ja: '素直もいい。ただし京都では少し直球に響く',
              en: 'Honest works too, though it lands a little straight here',
              ko: '솔직한 것도 좋다. 다만 교토에선 조금 직구로 들린다',
            },
          },
          {
            jp: 'はい。',
            ok: false,
            fb: {
              ja: '短すぎる。返事が一語だと「怒ってる？」と思われる',
              en: "Too short. A one-word reply reads as 'are you annoyed?'",
              ko: "너무 짧다. 한 마디면 '화났나?'로 읽힌다",
            },
          },
        ],
      },
      {
        s: 'Nishiki Market, narrow and crowded, a skewer held out',
        jp: 'これ、{食|た}べてみはる？',
        opts: [
          {
            jp: 'じゃあ、ちょっとだけ。',
            ok: true,
            fb: {
              ja: '遠慮の形。全部もらうより収まりがいい',
              en: 'The polite middle. Better than taking the whole thing',
              ko: '사양의 형태. 다 받는 것보다 자연스럽다',
            },
          },
          {
            jp: 'いただきます。',
            ok: true,
            fb: {
              ja: 'まっすぐ受け取るのも失礼ではない',
              en: 'Simply accepting is not rude either',
              ko: '그대로 받는 것도 실례는 아니다',
            },
          },
          {
            jp: '{結構|けっこう}です。',
            ok: false,
            fb: {
              ja: '強い。断るなら「お腹いっぱいで」と理由を添える',
              en: 'Too blunt. If refusing, give a reason — お腹いっぱいで',
              ko: '강하다. 거절하려면 お腹いっぱいで처럼 이유를 붙인다',
            },
          },
        ],
      },
      {
        s: 'A temple garden, gravel path, the friend speaking very quietly',
        jp: 'ここ、{静|しず}かにしといた{方|ほう}がええかもしれへんね。',
        opts: [
          {
            jp: 'あ、うるさかった？ごめん。',
            ok: true,
            fb: {
              ja: '遠回しの注意に気づけた。京都の注意はこの形で来る',
              en: 'You caught an indirect correction. This is how it arrives here',
              ko: '돌려 말한 주의를 알아챘다. 교토의 지적은 이 형태로 온다',
            },
          },
          {
            jp: '（{声|こえ}を{小|ちい}さくする）',
            ok: true,
            fb: {
              ja: '言葉より行動。これがいちばん自然',
              en: 'Act rather than answer. The most natural response of the three',
              ko: '말보다 행동. 이게 가장 자연스럽다',
            },
          },
          {
            jp: 'そうですね。',
            ok: false,
            fb: {
              ja: '同意しただけ。注意されたことに気づいていない返事',
              en: 'You agreed without noticing you were being corrected',
              ko: '동의만 했다. 지적받았다는 걸 못 알아챈 대답',
            },
          },
        ],
      },
      {
        s: 'A traditional living room, late afternoon light, a teapot being lifted',
        jp: 'そろそろ、お{茶漬|ちゃづ}けでもどうどす？',
        opts: [
          {
            jp: 'あ、もうこんな{時間|じかん}。そろそろ{失礼|しつれい}します。',
            ok: true,
            fb: {
              ja: '有名な遠回し。「そろそろ帰っては」の合図とされる',
              en: "The famous one. Traditionally read as 'it may be time to go'",
              ko: "유명한 돌려말하기. '슬슬 갈 때'라는 신호로 통한다",
            },
          },
          {
            jp: 'お{構|かま}いなく。',
            ok: true,
            fb: {
              ja: '曖昧に受け流す。角が立たない',
              en: 'Deflects without committing. Nothing is bruised',
              ko: '애매하게 넘긴다. 모서리가 안 생긴다',
            },
          },
          {
            jp: 'いただきます！',
            ok: false,
            fb: {
              ja: '言い伝えでは誤読。ただし現代の京都で本当にこう言う人は稀で、都市伝説として語られることが多い',
              en: 'The classic misread — though few people in Kyoto actually say this today; it survives mostly as a story about the city',
              ko: '전설적인 오독. 다만 요즘 교토에서 실제로 이렇게 말하는 사람은 드물고, 도시전설처럼 회자된다',
            },
          },
        ],
      },
      {
        s: 'A narrow lane at dusk, the friend standing in a doorway',
        jp: 'また{寄|よ}っとくれやす。',
        opts: [
          {
            jp: 'おおきに、また。',
            ok: true,
            fb: {
              ja: '真似して返すと距離が縮まる。観光客はまず使わない言葉',
              en: 'Echo it back and the distance shrinks. Visitors almost never try it',
              ko: '따라 돌려주면 거리가 줄어든다. 관광객은 거의 쓰지 않는 말',
            },
          },
          {
            jp: 'ありがとう、またね。',
            ok: true,
            fb: {
              ja: '標準語でも十分。無理に方言を使わなくていい',
              en: 'Standard Japanese is plenty. No need to force the dialect',
              ko: '표준어로도 충분하다. 억지로 사투리를 쓸 필요는 없다',
            },
          },
          {
            jp: '{必|かなら}ず{行|い}きます。',
            ok: false,
            fb: {
              ja: '社交辞令に真顔で答えた形。約束として重く響く',
              en: 'You answered a pleasantry as if it were a plan. Lands heavily',
              ko: '인사치레에 정색으로 답한 셈. 약속처럼 무겁게 들린다',
            },
          },
        ],
      },
    ],
  },
};
