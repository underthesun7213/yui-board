import type { Route, VnRoute } from './types';

/* Episode 8. Two routes, drawn with a broad brush on purpose: the Osaka friend
   is loud and direct, the Kyoto friend says things sideways. Real people are
   not their prefecture, and the notes say so where it matters. */
/* How the score picks the ending, counted over the scenes that ask for a
   reply (Osaka five since 2026-10-29, Kyoto five; the mini-games and walks are
   not scored). Good: at most goodMisses missed. Bad: at most badMax right, on
   a route that has a bad card. Normal: anything between. Osaka (owner,
   2026-10-30): all five good, two to four normal, one or none bad. Kyoto
   (2026-10-31) the same, with its three goodbyes on the bridge. */
export const ENDING_RULE: Record<Route, { goodMisses: number; badMax: number | null }> = {
  osaka: { goodMisses: 0, badMax: 1 },
  kyoto: { goodMisses: 0, badMax: 1 },
};

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
  /* The day with Ayano, from the owner's storyboard
     (docs/06-design/game-storyboard-template.md, 2026-10-31): Gion, the matcha
     tea house (the 아야노 미니게임), the festival stalls, the fireworks from a
     red bridge (the photo game), goodbye on the bridge. */
  kyoto: {
    name: {
      ja: 'あやの（京都）',
      en: 'Ayano (Kyoto)',
      ko: '아야노 (교토)',
    },
    blurb: {
      ja: '声が小さい。言いたいことは、いつも一歩うしろにある',
      en: 'Soft-spoken; what she means is always one step behind what she says',
      ko: '목소리가 작다. 하고 싶은 말은 늘 한 걸음 뒤에 있다',
    },
    scenes: [
      {
        s: 'Gion Shirakawa at 3 pm, a stone path and willows, few people, Ayano in kimono waiting quietly',
        jp: '{遠|とお}いとこ、ようおこしやす。……えらい{動|うご}きやすそうな{格好|かっこう}してはりますなぁ。',
        note: {
          ja: '花火大会の日。あやのは着物で来た。こちらは普段着だ。あやのの「どす」「おくれやす」は昔ながらの京言葉で、今の京都の若い人はあまり使わない。',
          en: 'Fireworks day. Ayano came in a kimono; you came in everyday clothes. Her どす and おくれやす are old Kyoto speech that young people there rarely use today.',
          ko: '불꽃놀이 날. 아야노는 기모노를 입고 왔고, 나는 평상복이다. 아야노의 どす·おくれやす는 옛 교토 말투로, 요즘 교토 젊은이는 잘 쓰지 않는다.',
        },
        opts: [
          {
            jp: 'あ、そうなんです！すごく{楽|らく}なんですよ。',
            ok: false,
            fb: {
              ja: 'ほめ言葉ではない。「動きやすそう」は「今日その格好？」という京都流のひと言。相手は着物で来ている',
              en: 'Not a compliment. 「動きやすそう」 is Kyoto for "you came like that, today?" She came in a kimono',
              ko: "칭찬이 아니다. 「動きやすそう」는 '오늘 같은 날 그 옷이에요?'라는 교토식 꼬집기. 상대는 기모노를 차려입고 왔다",
            },
            reply: [{ who: 'friend', jp: 'あらまぁ、それはよろしおしたなぁ。' }],
          },
          {
            jp: '{大変|たいへん}{申|もう}し{訳|わけ}ございません。',
            ok: false,
            fb: {
              ja: '丁寧すぎる。軽いひと言が本気のお叱りになって、かえって相手が気をつかう',
              en: 'Far too polite. A light jab turns into a real telling-off, and now she is the one who feels bad',
              ko: '너무 정중하다. 가볍게 꼬집은 말이 진짜 꾸중이 되어, 오히려 상대가 미안해진다',
            },
            reply: [{ who: 'friend', jp: 'いえいえ、そないなこと{気|き}にせんといておくれやす。' }],
          },
          {
            jp: 'わっ、あやのさん、{着物|きもの}すごく{似合|にあ}ってますね！せっかくの{花火|はなび}なのに、{普段着|ふだんぎ}でごめんなさい。',
            ok: true,
            fb: {
              ja: 'おしゃれしてきた相手を先にほめて、普段着は軽くあやまった。どちらも押さえた満点の返事',
              en: 'You praised her kimono first and apologised lightly for your clothes. Both covered: a perfect reply',
              ko: '차려입은 상대를 먼저 칭찬하고, 편한 옷은 가볍게 사과했다. 둘 다 챙긴 완벽한 대답',
            },
            reply: [{ who: 'friend', jp: 'おおきに。{謝|あやま}らはることあらしまへん。' }],
          },
        ],
      },
      {
        s: 'The same Gion street in the afternoon sun, Ayano tilting her head, thinking',
        jp: '{始|はじ}まるまで、まだ{時間|じかん}おすなぁ。どこぞ{行|い}きまひょか？',
        opts: [
          {
            jp: 'この{辺|へん}にいい{雰囲気|ふんいき}の{抹茶|まっちゃ}カフェがあるらしいんですけど、どうですか？',
            ok: true,
            fb: {
              ja: '近くて気軽、着物の相手が座って休める場所を選んだ。気づかいが伝わる',
              en: 'Close by, easy, and somewhere she can sit down in her kimono. The thought shows',
              ko: '가까워서 부담이 없고, 기모노 차림의 상대가 앉아 쉴 수 있는 곳. 배려가 느껴진다',
            },
            reply: [
              {
                who: 'friend',
                jp: 'よろしおすなぁ。ちょうど{三時|さんじ}やし、おやつの{時間|じかん}どすなぁ。',
              },
            ],
          },
          {
            jp: '{京都|きょうと}の{観光|かんこう}がしたいです！{嵐山|あらしやま}はどうですか？',
            ok: false,
            fb: {
              ja: '花火の前に行くには遠すぎる。京都の「また今度」はていねいな断り',
              en: 'Too far to go before the fireworks. In Kyoto, 「また今度」 is a polite no',
              ko: '불꽃놀이 전에 다녀오기엔 멀다. 교토의 「また今度」는 정중한 거절이다',
            },
            reply: [
              {
                who: 'friend',
                jp: '{嵐山|あらしやま}どすか。よろしおすなぁ。また{今度|こんど}、ゆっくりの{時|とき}にでも。',
              },
            ],
          },
          {
            jp: 'ハイキングはどうですか？あそこにちょうどいい{山|やま}が{見|み}えますよ！',
            ok: false,
            fb: {
              ja: '下駄と着物の相手のことを考えていない。「お元気どすなぁ」はほめ言葉ではない',
              en: 'She is in geta and a kimono. 「お元気どすなぁ」 is not a compliment',
              ko: '게타에 기모노 차림인 상대를 생각하지 않았다. 「お元気どすなぁ」는 칭찬이 아니다',
            },
            reply: [
              {
                who: 'friend',
                jp: 'ハイキング……お{元気|げんき}どすなぁ。うち、この{格好|かっこう}どすさかい。',
              },
            ],
          },
        ],
      },
      {
        s: 'Inside a quiet Kyoto matcha tea house at 4 pm, tatami and low tables, Ayano holding a menu',
        jp: 'デザートセット{頼|たの}める{時間|じかん}どすなぁ、うれしおすわぁ。{何|なに}にしはります？',
        opts: [
          {
            jp: '{私|わたし}、あんまり{欲|ほ}しいものないんで、お{水|みず}で{大丈夫|だいじょうぶ}です。あやのさんだけ{注文|ちゅうもん}しますか？',
            ok: false,
            fb: {
              ja: '日本のカフェは一人一品が基本。相手だけ頼ませると困らせる。しかもこの店を選んだのは自分',
              en: 'Japanese cafés expect one order each, and leaving her to order alone puts her on the spot. You chose this place, too',
              ko: '일본 카페는 1인 1주문이 기본. 혼자만 시키게 하면 상대가 곤란하다. 게다가 이 가게를 고른 건 나다',
            },
            reply: [
              {
                who: 'friend',
                jp: 'そうどすか。ここはあんまりお{口|くち}に{合|あ}わへんみたいどすなぁ。ほな、{他|ほか}のとこ{行|い}きまひょか？',
              },
            ],
          },
          {
            jp: '{抹茶|まっちゃ}とみたらし{団子|だんご}のセットが{美味|おい}しそうですね。',
            ok: true,
            fb: {
              ja: 'ごく自然で、常識的ないい返事',
              en: 'Natural and sensible: a good reply',
              ko: '무난하고 상식적인 좋은 대답',
            },
            reply: [
              {
                who: 'friend',
                jp: 'みたらし{団子|だんご}、{美味|おい}しそうどすなぁ。うちはアーモンドのパウンドケーキにしまひょ。',
              },
            ],
          },
          {
            jp: 'チョコレートケーキが{美味|おい}しそうですね。{分|わ}けて{食|た}べませんか？',
            ok: true,
            fb: {
              ja: '一人一品が基本だけど、それぞれ頼んで分けるのはいい',
              en: 'One each is the rule, but ordering one each and sharing is fine',
              ko: '1인 1디저트가 기본이지만, 각자 시켜서 나눠 먹는 건 괜찮다',
            },
            reply: [
              {
                who: 'friend',
                jp: 'よろしおすなぁ。ほな、うちも{頼|たの}んで{半分|はんぶん}こしまひょか。',
              },
            ],
          },
        ],
      },
      {
        /* the 아야노 미니게임 (src/features/learn/MatchaGame.tsx) */
        kind: 'matcha',
        s: 'A Kyoto matcha tea house by day, the two at a table with a self-serve matcha set',
        jp: '',
        note: {
          ja: '頼んだセットは、お茶を自分で点てるもの。自分の抹茶と、あやのの抹茶ラテを作る。',
          en: 'The set you ordered lets you whisk the tea yourself: a matcha for you and a matcha latte for Ayano.',
          ko: '주문한 세트는 차를 직접 만드는 방식이다. 내 말차 한 잔과 아야노의 말차 라테 한 잔을 만든다.',
        },
        opts: [],
      },
      {
        kind: 'move',
        s: 'The Kamo riverbank at dusk, a little sunset, the two walking toward the festival, lanterns being lit',
        /* draft: the storyboard has no line here */
        jp: 'ええ{時間|じかん}になってきましたなぁ。ほな、そろそろ{行|い}きまひょか。',
        note: {
          ja: 'カフェを出て、花火の会場へ向かう。',
          en: 'You leave the café and head for the fireworks.',
          ko: '카페를 나와 불꽃놀이 장소로 향한다.',
        },
        opts: [],
      },
      {
        s: 'A festival street lined with yatai stalls, lively and packed, Ayano looking over the stalls',
        jp: 'ほんま{迷|まよ}いますなぁ。{何|なに}がよろしおすやろ？',
        opts: [
          {
            jp: 'りんご{飴|あめ}とか{綿|わた}あめみたいな{甘|あま}いもの、どうですか？',
            ok: true,
            ach: 'a_kyoto_ringo',
            fb: {
              ja: '屋台の定番。きれいな着物にも似合う、かわいい選択',
              en: 'The festival classic, and a pretty one that suits her kimono',
              ko: '노점의 정석. 예쁜 옷에 어울리는 귀여운 선택',
            },
            reply: [
              {
                who: 'friend',
                jp: 'りんご{飴|あめ}、{食|た}べはったことあります？お{祭|まつ}りいうたら、やっぱりりんご{飴|あめ}どすなぁ。',
              },
            ],
          },
          {
            jp: 'たこ{焼|や}きとかベビーカステラなら{一口|ひとくち}で{食|た}べられるし、{食|た}べやすそうですね！',
            ok: true,
            fb: {
              ja: '一口で食べられて、着物でも食べやすい',
              en: 'One bite each, easy to eat even in a kimono',
              ko: '한 입 크기라 기모노를 입고도 먹기 편하다',
            },
            reply: [
              {
                who: 'friend',
                jp: 'ベビーカステラ、{懐|なつ}かしおすなぁ。{小|ちい}さい{頃|ころ}、ほんまに{好|す}きどしたんえ。{一緒|いっしょ}に{食|た}べまひょか？',
              },
            ],
          },
          {
            jp: '{焼|や}きとうもろこしとか、イカ{焼|や}きはどうですか？すごくいい{匂|にお}いがしますね。',
            ok: false,
            fb: {
              ja: 'かじって食べる物は着物を汚しやすい。「匂いは」の「は」が「食べるのはちょっと」の合図',
              en: 'Food you bite off the cob or stick is easy to spill on a kimono. The は in 「匂いは」 means "the eating, less so"',
              ko: "뜯어 먹는 음식은 기모노를 더럽히기 쉽다. 「匂いは」의 は가 '먹기는 글쎄'라는 신호",
            },
            reply: [
              {
                who: 'friend',
                jp: '{匂|にお}いはほんまによろしおすなぁ。……{着物|きもの}で、{上手|じょうず}に{食|た}べられますやろか。',
              },
            ],
          },
        ],
      },
      {
        s: 'A red wooden bridge over a river at 7 pm, fireworks in full bloom, Ayano holding her phone out with a small smile',
        jp: 'ほんまに{見事|みごと}な{景色|けしき}どすなぁ。お{写真|しゃしん}、{撮|と}ってさしあげまひょか？',
        opts: [
          {
            jp: 'そうですね！こういう{所|ところ}だと{写真|しゃしん}{撮|と}りたくなりますね。{私|わたし}もあやのさんの{撮|と}りますよ！',
            ok: true,
            fb: {
              ja: '「撮ってさしあげまひょか」は「うちも撮ってほしい」の合図。気づいて、撮り合った',
              en: '「撮ってさしあげまひょか」 is her way of saying she would like one too. You caught it and offered',
              ko: "「撮ってさしあげまひょか」는 '나도 찍히고 싶다'는 신호. 알아채고 서로 찍어 주었다",
            },
            reply: [
              {
                who: 'friend',
                jp: 'あら、よろしおすなぁ。おおきに。{二人|ふたり}のも、どなたかに{頼|たの}んでみまひょか？',
              },
            ],
          },
          {
            jp: 'あ、ありがとうございます！はい、チーズ！',
            ok: false,
            shot: 'sky',
            fb: {
              ja: '自分だけ撮ってもらって終わった。「よろしおすこと」は「よろしいこと（うちは？）」に近い',
              en: 'You had yours taken and left it there. 「よろしおすこと」 is closer to "how nice for you (and me?)"',
              ko: "자기만 찍고 끝냈다. 「よろしおすこと」는 '좋겠네요(나는?)'에 가깝다",
            },
            reply: [{ who: 'friend', jp: 'えらい{楽|たの}しそうどすなぁ。よろしおすこと。' }],
          },
          {
            jp: 'うーん、{私|わたし}あんまり{写真|しゃしん}{撮|と}られるの{得意|とくい}じゃなくて……あやのさんはどうですか？{撮|と}りますよ！',
            ok: true,
            fb: {
              ja: '自分の好みで断ってもいい。そのかわり、相手はどうかを聞いたのがポイント',
              en: 'Saying no for yourself is fine; asking what she would like is what counts',
              ko: '내 성향대로 거절해도 된다. 대신 상대는 어떤지 물어본 게 포인트',
            },
            reply: [
              {
                who: 'friend',
                jp: 'そうどすか、{残念|ざんねん}やけどしゃあおへんなぁ。ほな、かんにんどすけど、うちだけ{撮|と}ってもろてもよろしおす？',
              },
            ],
          },
        ],
      },
      {
        /* the photo game (src/features/learn/PhotoGame.tsx) */
        kind: 'photo',
        s: 'Ayano on the red bridge, looking back over her shoulder, fireworks over the hills behind',
        jp: '',
        note: {
          ja: 'スマホを構える。花火とあやのが一緒に入るように撮ろう。',
          en: 'Hold up the phone and frame the shot: Ayano and the fireworks together.',
          ko: '휴대폰을 든다. 아야노와 불꽃이 함께 들어오게 찍자.',
        },
        opts: [],
      },
    ],
  },
};
