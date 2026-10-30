import type { L3 } from './types';

/* 아야노 미니게임 (docs/06-design/minigames/ayano-matcha): a self-serve
   matcha set in a Kyoto tea house, level 8's Kyoto route. You whisk your own
   matcha and make Ayano a latte; a heart in the milk unlocks her picture.
   Japanese with furigana as {漢字|かな}; what it means and why in all three
   languages. The screen's own words are here too (MT_TEXT), not in i18n, so
   the first screen does not carry them (as the smart-ball's SB_TEXT). */

export type MtTool = 'chasen' | 'chashaku' | 'natsume' | 'yuzamashi' | 'pitcher' | 'chawan' | 'cup';
export const MT_TOOLS: Record<MtTool, { ja: string; name: L3; look?: L3 }> = {
  chasen: {
    ja: '{茶筅|ちゃせん}',
    name: { ja: '茶筅', en: 'tea whisk', ko: '차선(대나무 거품기)' },
    look: {
      ja: '左下の、細い穂がたくさんある丸い竹の道具',
      en: 'the round bamboo whisk with many fine tines, bottom left',
      ko: '왼쪽 아래, 가는 살이 잔뜩 달린 둥근 대나무 도구',
    },
  },
  chashaku: {
    ja: '{茶杓|ちゃしゃく}',
    name: { ja: '茶杓', en: 'bamboo tea scoop', ko: '차샤쿠(대나무 찻숟가락)' },
    look: {
      ja: '上の、細長い竹の棒',
      en: 'the long, thin bamboo stick along the top',
      ko: '위쪽의 가늘고 긴 대나무 막대',
    },
  },
  natsume: { ja: '{棗|なつめ}', name: { ja: '棗', en: 'tea caddy', ko: '나쓰메(차통)' } },
  yuzamashi: {
    ja: '{湯冷|ゆざ}まし',
    name: { ja: '湯冷まし', en: 'pitcher of hot water', ko: '유자마시(물 식힘 그릇)' },
  },
  pitcher: {
    ja: 'ミルクピッチャー',
    name: { ja: 'ミルクピッチャー', en: 'milk pitcher', ko: '우유 피처' },
  },
  chawan: { ja: '{茶碗|ちゃわん}', name: { ja: '茶碗', en: 'tea bowl', ko: '다완(찻사발)' } },
  cup: { ja: 'カップ', name: { ja: 'カップ', en: 'cup', ko: '컵' } },
};
/** the two tools Ayano asks about, in order */
export const MT_QUIZ: MtTool[] = ['chasen', 'chashaku'];

export interface MtSay {
  who: 'ayano' | 'staff';
  jp: string;
  t: L3;
}
export type MtLine =
  | 'staff'
  | 'ask'
  | 'quiz0'
  | 'quiz1'
  | 'powder'
  | 'water'
  | 'whisk'
  | 'base'
  | 'serve'
  | 'end'
  | 'last';
export const MT_LINES: Record<MtLine, MtSay> = {
  staff: {
    who: 'staff',
    jp: 'お{待|ま}たせいたしました。{抹茶|まっちゃ}セットでございます。お{茶|ちゃ}はご{自分|じぶん}で{点|た}てていただけます。',
    t: {
      ja: '抹茶セットです。お茶はご自分で点ててください。',
      en: 'Here is your matcha set. You whisk the tea yourselves.',
      ko: '말차 세트 나왔습니다. 차는 직접 만들어 드시면 됩니다.',
    },
  },
  ask: {
    who: 'ayano',
    jp: 'わぁ、{自分|じぶん}で{点|た}てるんどすて。うちのは、ミルク{入|い}れてラテにしてもろてもよろしおす？',
    t: {
      ja: 'わあ、自分で点てるんだって。私のは、ミルクを入れてラテにしてもらってもいい？',
      en: 'Oh, we whisk it ourselves! Could you make mine a latte, with milk?',
      ko: '와, 직접 만드는 거래요. 제 건 우유 넣어서 라테로 만들어 줄 수 있어요?',
    },
  },
  quiz0: {
    who: 'ayano',
    jp: '{茶筅|ちゃせん}いうの、どれかわからはります？',
    t: {
      ja: '茶筅って、どれかわかる？',
      en: 'Can you tell which one is the tea whisk?',
      ko: '차선이 어느 건지 알겠어요?',
    },
  },
  quiz1: {
    who: 'ayano',
    jp: 'ほな、{茶杓|ちゃしゃく}はどれどすやろ？',
    t: {
      ja: 'じゃあ、茶杓はどれかな？',
      en: 'And which is the tea scoop?',
      ko: '그럼 차샤쿠는 어느 걸까요?',
    },
  },
  powder: {
    who: 'ayano',
    jp: 'お{抹茶|まっちゃ}は、お{茶杓|ちゃしゃく}で{二杯|にはい}くらいが{目安|めやす}どす。',
    t: {
      ja: '抹茶は茶杓で二杯くらいが目安です。',
      en: 'About two scoops of matcha is the rule of thumb.',
      ko: '말차는 차샤쿠로 두 숟갈 정도가 기준이에요.',
    },
  },
  water: {
    who: 'ayano',
    jp: 'お{湯|ゆ}は{七十|ななじゅう}ミリくらい。ゆっくり{注|そそ}いでおくれやす。',
    t: {
      ja: 'お湯は70ミリくらい。ゆっくり注いでね。',
      en: 'About 70 ml of hot water. Pour slowly.',
      ko: '뜨거운 물은 70ml 정도. 천천히 부어요.',
    },
  },
  whisk: {
    who: 'ayano',
    jp: '{茶筅|ちゃせん}で、Wの{字|じ}を{描|か}くようにシャカシャカ。くるくる{回|まわ}したらあきまへんえ。',
    t: {
      ja: '茶筅でWの字を描くようにシャカシャカ。くるくる回したらだめだよ。',
      en: 'Whisk in a W, shaka-shaka. No stirring in circles.',
      ko: '차선으로 W자를 그리듯 샤카샤카. 빙빙 돌리면 안 돼요.',
    },
  },
  base: {
    who: 'ayano',
    jp: 'ラテの{方|ほう}は、お{湯|ゆ}{少|すく}なめで{濃|こ}いめにしておくれやす。',
    t: {
      ja: 'ラテのは、お湯を少なめにして濃いめにね。',
      en: 'For the latte, less water, so it comes out strong.',
      ko: '라테용은 물을 적게 해서 진하게요.',
    },
  },
  serve: {
    who: 'ayano',
    jp: 'わぁ、ええ{香|かお}り。',
    t: { ja: 'わあ、いい香り。', en: 'Oh, it smells lovely.', ko: '와, 향 좋다.' },
  },
  end: {
    who: 'ayano',
    jp: 'ええお{茶|ちゃ}の{時間|じかん}どしたなぁ。おおきに。',
    t: {
      ja: 'いいお茶の時間でしたね。ありがとう。',
      en: 'That was a lovely tea time. Thank you.',
      ko: '좋은 차 시간이었네요. 고마워요.',
    },
  },
  last: {
    who: 'ayano',
    jp: 'ふふ、これはこれで、うちだけのラテどすな。',
    t: {
      ja: 'ふふ、これはこれで、私だけのラテだね。',
      en: 'Hehe. Well, this makes it a latte only I have.',
      ko: '후후, 이건 이것대로 저만의 라테네요.',
    },
  },
};

/** a reply to pick: what it means, why it works or not, and what Ayano says back */
export interface MtOpt {
  jp: string;
  ok: boolean;
  t: L3;
  fb: L3;
  reply: string;
}
export const MT_OPTS: Record<'intro' | 'serve', MtOpt[]> = {
  intro: [
    {
      jp: 'もちろん！まかせてください。',
      ok: true,
      t: {
        ja: 'もちろん！任せてください。',
        en: 'Of course! Leave it to me.',
        ko: '물론이죠! 맡겨 주세요.',
      },
      fb: {
        ja: 'とても控えめなお願い。明るく引き受けると、頼んだ側も気が楽になる。',
        en: 'She asked a favour very softly. A cheerful yes makes it easy for her to have asked.',
        ko: '아주 조심스러운 부탁이다. 밝게 받아 주면 부탁한 쪽도 마음이 편하다.',
      },
      reply: 'おおきに。{楽|たの}しみにしてますえ。',
    },
    {
      jp: 'え、{自分|じぶん}で{作|つく}ったらどうですか？',
      ok: false,
      t: {
        ja: 'え、自分で作ったらどうですか？',
        en: 'Why not make it yourself?',
        ko: '네? 직접 만들면 어때요?',
      },
      fb: {
        ja: '京都らしいやわらかいお願いを、そのまま突き返した形。「そうどすなぁ」は同意ではなく、丁寧に引いただけ。',
        en: 'A gentle Kyoto request, turned straight back on her. Her "I see…" is a polite retreat, not agreement.',
        ko: '교토식 부드러운 부탁을 그대로 되돌려 보냈다. "그렇네요…"는 동의가 아니라 정중하게 물러선 것.',
      },
      reply: 'あら……そうどすなぁ。',
    },
    {
      jp: 'ラテはメニューにないので、{無理|むり}です。',
      ok: false,
      t: {
        ja: 'ラテはメニューにないので、無理です。',
        en: "There's no latte on the menu, so no.",
        ko: '라테는 메뉴에 없어서 안 돼요.',
      },
      fb: {
        ja: 'セットにはミルクピッチャーが付いている。彼女はもう見ている。テーブルをよく見て！',
        en: 'The set comes with a milk pitcher; she has already seen it. Look at the table!',
        ko: '세트에 우유 피처가 딸려 있고, 그녀는 이미 봤다. 테이블을 잘 보자!',
      },
      reply: 'ミルク、ちゃんと{付|つ}いてますえ？',
    },
  ],
  serve: [
    {
      jp: 'はい、どうぞ。{熱|あつ}いから{気|き}をつけてね。',
      ok: true,
      t: {
        ja: 'はい、どうぞ。熱いから気をつけてね。',
        en: "Here you go. Careful, it's hot.",
        ko: '자, 여기요. 뜨거우니까 조심해요.',
      },
      fb: {
        ja: '友達に飲み物を渡すときの、気軽で気づかいのある言い方。',
        en: 'Easy and caring, the way you would hand a friend a drink.',
        ko: '친구에게 음료를 건넬 때처럼 편하고 배려 있는 말.',
      },
      reply: 'おおきに。ほな、いただきます。',
    },
    {
      jp: 'お{召|め}し{上|あ}がりくださいませ。',
      ok: false,
      t: {
        ja: 'お召し上がりくださいませ。',
        en: 'Please enjoy (waiter-style).',
        ko: '드시옵소서. (점원 말투)',
      },
      fb: {
        ja: 'それは店員の言葉。同じテーブルの友達に言うと、ここで働いている人のよう。',
        en: "That is the staff's line. At the same table as a friend, it sounds like you work here.",
        ko: '그건 점원의 말이다. 같은 테이블의 친구에게 하면 여기 직원처럼 들린다.',
      },
      reply: 'あら、{店員|てんいん}さんみたいやわぁ。',
    },
    {
      jp: '{早|はや}く{飲|の}んで！{感想|かんそう}{聞|き}かせて！',
      ok: false,
      t: {
        ja: '早く飲んで！感想聞かせて！',
        en: 'Drink it, quick! Tell me what you think!',
        ko: '빨리 마셔 봐요! 소감 들려줘요!',
      },
      fb: {
        ja: '急かして感想を求めると相手が困る。自分のペースで楽しんでもらおう。',
        en: 'Rushing her to drink and rate it puts her on the spot. Let her enjoy it at her pace.',
        ko: '재촉하며 소감을 묻으면 상대가 곤란하다. 자기 속도로 즐기게 두자.',
      },
      reply: 'そない{急|せ}かさんといて〜。',
    },
  ],
};

/* What shows under the table: a heading, the explanation, and sometimes what
   Ayano says. {n} is a number (ml, scoops, per cent), {tool} {hit} {look}
   name tools. */
export type MtFbKey =
  | 'quiz'
  | 'toolWrong'
  | 'chasenOk'
  | 'chashakuOk'
  | 'scoop'
  | 'powderOk'
  | 'powderThin'
  | 'powderStrong'
  | 'pourBowl'
  | 'pourCup'
  | 'pourOk'
  | 'overBowl'
  | 'overCup'
  | 'whisk'
  | 'whiskBest'
  | 'whiskGood'
  | 'whiskLively'
  | 'baseOk'
  | 'artFill'
  | 'artTrace'
  | 'artBest'
  | 'artGood'
  | 'artMiss';
export const MT_FB: Record<MtFbKey, { head: L3; body: L3; say?: string }> = {
  quiz: {
    head: { ja: '{tool}はどれ？', en: 'Which one is the {tool}?', ko: '{tool}는 어느 것?' },
    body: {
      ja: 'テーブルの上でタップ。タップできる道具には点線の輪が付いている。',
      en: 'Tap it on the table. Every tool you can tap has a dashed ring.',
      ko: '테이블 위에서 탭하세요. 탭할 수 있는 도구에는 점선 테두리가 있어요.',
    },
  },
  toolWrong: {
    head: { ja: '× それじゃない', en: '× Not that one', ko: '× 그게 아니에요' },
    body: {
      ja: 'それは{hit}。{tool}は{look}。',
      en: "That's the {hit}. The {tool} is {look}.",
      ko: '그건 {hit}. {tool}는 {look}.',
    },
  },
  chasenOk: {
    head: { ja: '○ 茶筅', en: '○ 茶筅 (ちゃせん)', ko: '○ 茶筅 (ちゃせん)' },
    body: {
      ja: '一本の竹を八十本ほどの細い穂に削った泡立て器。お茶を泡立てることを「点てる（たてる）」と言う。',
      en: 'A whisk carved from one piece of bamboo into some 80 fine tines. 点てる (たてる) is the verb for whisking tea.',
      ko: '대나무 하나를 80가닥쯤으로 가늘게 깎은 거품기. 차를 거품 내는 것을 点てる(たてる)라고 한다.',
    },
  },
  chashakuOk: {
    head: { ja: '○ 茶杓', en: '○ 茶杓 (ちゃしゃく)', ko: '○ 茶杓 (ちゃしゃく)' },
    body: {
      ja: '抹茶をすくう匙。数えるときは杯：一杯（いっぱい）、二杯（にはい）、三杯（さんばい）。',
      en: 'The scoop. Scoops are counted with 杯: 一杯 いっぱい, 二杯 にはい, 三杯 さんばい.',
      ko: '말차를 뜨는 숟가락. 셀 때는 杯: 一杯(いっぱい), 二杯(にはい), 三杯(さんばい).',
    },
  },
  scoop: {
    head: {
      ja: 'すくう · 点線のとおりに',
      en: 'Scoop · follow the dashed line',
      ko: '뜨기 · 점선을 따라',
    },
    body: {
      ja: '竹の茶杓を押さえて棗まで引き（ふたが少し開く）、少し止めてから茶碗の上へ。二回。',
      en: 'Press the bamboo scoop and drag it into the caddy (the lid slides open), hold it there a moment, then drag it over the bowl. Twice.',
      ko: '대나무 차샤쿠를 눌러 차통까지 끌고(뚜껑이 살짝 열려요) 잠깐 멈췄다가 다완 위로. 두 번.',
    },
  },
  powderOk: {
    head: { ja: '○ 二杯（にはい）', en: '○ 二杯 (にはい)', ko: '○ 二杯 (にはい)' },
    body: {
      ja: 'およそ2グラム、ふつうの一杯分。杯の読みは いっぱい・にはい・さんばい と変わる。本と同じ。',
      en: 'About 2 g, a usual bowl. Count scoops and cups with 杯: いっぱい, にはい, さんばい — the sound changes, like 本.',
      ko: '약 2g, 보통 한 잔 분량. 杯는 いっぱい·にはい·さんばい로 소리가 바뀐다. 本과 같다.',
    },
  },
  powderThin: {
    head: { ja: '× もう少し', en: '× A little more', ko: '× 조금 더' },
    body: {
      ja: '「薄いお茶になりそう」— 京都の言葉は「もっと入れて」と言わずにほのめかす。',
      en: '"It might turn out a bit thin" — Kyoto speech hints rather than says "add more".',
      ko: '"좀 연한 차가 되겠네요" — 교토 말은 "더 넣어"라고 하지 않고 넌지시 말한다.',
    },
    say: 'ちょっと{薄|うす}いお{茶|ちゃ}になりそうどすなぁ。',
  },
  powderStrong: {
    head: { ja: '× 多すぎ。やり直し', en: '× Too much — start again', ko: '× 너무 많아요. 다시' },
    body: {
      ja: '「濃いお茶がお好きなんですね」はほめ言葉に聞こえるが、意味は「多すぎ」。茶碗を空にした。',
      en: '"You must like it strong" sounds like a compliment, but it means: that is too much. The bowl is emptied.',
      ko: '"진한 차를 좋아하시나 봐요"는 칭찬처럼 들리지만 뜻은 "너무 많다". 다완을 비웠다.',
    },
    say: 'まぁ、{濃|こ}いお{茶|ちゃ}がお{好|す}きなんどすなぁ。',
  },
  pourBowl: {
    head: { ja: '注ぐ', en: 'Pour', ko: '붓기' },
    body: {
      ja: '湯冷ましを茶碗の上まで引くと、その間お湯が出る。帯の中で指を離す。70ミリは ななじゅうミリ。',
      en: "Drag the water pitcher over the bowl: it pours while it's there. Lift your finger in the band. 70 ml is ななじゅうミリ.",
      ko: '유자마시를 다완 위로 끌면 그동안 물이 나와요. 띠 안에서 손가락을 떼요. 70ml는 ななじゅうミリ.',
    },
  },
  pourCup: {
    head: { ja: '注ぐ', en: 'Pour', ko: '붓기' },
    body: {
      ja: '抹茶は二杯入れておいた。湯冷ましをカップの上へ。今度は40ミリくらい（よんじゅうミリ）。',
      en: 'The scoops went in for you. Drag the water pitcher over the cup: about 40 ml this time (よんじゅうミリ).',
      ko: '말차 두 숟갈은 넣어 뒀어요. 유자마시를 컵 위로. 이번엔 40ml 정도(よんじゅうミリ).',
    },
  },
  pourOk: {
    head: { ja: '○ {n} ml', en: '○ {n} ml', ko: '○ {n} ml' },
    body: { ja: 'ちょうどいい。', en: 'Just right.', ko: '딱 좋아요.' },
  },
  overBowl: {
    head: { ja: '× 多すぎ', en: '× Too much', ko: '× 너무 많아요' },
    body: {
      ja: '「たっぷりですね」— お湯が多すぎて薄くなる。もう一度注ごう。',
      en: '"How generous" — too much water; the tea would be weak. Let\'s pour it again.',
      ko: '"듬뿍이네요" — 물이 너무 많아 차가 연해진다. 다시 붓자.',
    },
    say: 'あらまぁ、たっぷりどすなぁ。',
  },
  overCup: {
    head: { ja: '× 多すぎ', en: '× Too much', ko: '× 너무 많아요' },
    body: {
      ja: 'お湯が多いとミルクに抹茶が負ける。もう一度注ごう。',
      en: 'Too much water and the milk will drown the matcha. Pour it again.',
      ko: '물이 많으면 우유에 말차 맛이 묻혀요. 다시 부어요.',
    },
    say: 'あら、ラテが{薄|うす}うなりますえ。',
  },
  whisk: {
    head: { ja: '点てる', en: 'Whisk', ko: '휘젓기' },
    body: {
      ja: 'どこからでも茶筅を持って、点線のWを左右に素早くなぞる。キー：← → を交互に。',
      en: 'Pick up the whisk anywhere and follow the dashed W across the tea, back and forth, quickly. Keys: ← → in turn.',
      ko: '아무 데서나 차선을 잡고 점선 W를 좌우로 빠르게 따라가요. 키: ← → 번갈아.',
    },
  },
  whiskBest: {
    head: { ja: '○ 正確さ {n}%', en: '○ Accuracy {n}%', ko: '○ 정확도 {n}%' },
    body: {
      ja: 'Wに沿って速く、まっすぐ。細かく均一な泡。',
      en: 'Fast, straight strokes along the W: tiny even bubbles.',
      ko: 'W를 따라 빠르고 곧게. 곱고 고른 거품.',
    },
    say: 'お{見事|みごと}。きめ{細|こま}かい{泡|あわ}どすなぁ。',
  },
  whiskGood: {
    head: { ja: '○ 正確さ {n}%', en: '○ Accuracy {n}%', ko: '○ 정확도 {n}%' },
    body: {
      ja: 'いい泡。もっとWに近づけると、泡がさらに細かくなる。',
      en: 'A good froth. Stay closer to the W and the bubbles get finer.',
      ko: '좋은 거품. W에 더 붙으면 거품이 더 고와져요.',
    },
    say: 'ええ{泡|あわ}が{立|た}ってますなぁ。',
  },
  whiskLively: {
    head: { ja: '△ 正確さ {n}%', en: '△ Accuracy {n}%', ko: '△ 정확도 {n}%' },
    body: {
      ja: '「元気な泡」は粗い泡をやわらかく言ったもの。茶筅がWから外れていた。',
      en: '"Lively bubbles" is a soft way of saying they\'re coarse: the whisk wandered off the W.',
      ko: '"기운찬 거품"은 거품이 거칠다는 걸 부드럽게 말한 것. 차선이 W에서 벗어났어요.',
    },
    say: '{泡|あわ}が、ちょっと{元気|げんき}どすなぁ。',
  },
  baseOk: {
    head: { ja: '○ ミルクの準備ができた', en: '○ Ready for milk', ko: '○ 우유 준비 완료' },
    body: {
      ja: '濃くなめらかなベースは、ミルクの下でも色が残る。',
      en: 'A thick, smooth base keeps its colour under the milk.',
      ko: '진하고 매끈한 베이스는 우유 밑에서도 색이 남아요.',
    },
  },
  artFill: {
    head: { ja: '高いところから注ぐ', en: 'Pour from high', ko: '높은 곳에서 붓기' },
    body: {
      ja: 'ミルクピッチャーをカップの上まで引き、指を離さずに。高いところからだとミルクは抹茶の下に沈んで、カップが満ちる。',
      en: 'Drag the milk pitcher over the cup and keep your finger down. From up high the milk sinks under the matcha and fills the cup.',
      ko: '우유 피처를 컵 위로 끌고 손가락을 떼지 마세요. 높은 곳에서 부으면 우유가 말차 밑으로 가라앉으며 컵이 차요.',
    },
  },
  artTrace: {
    head: { ja: '点線のとおりに', en: 'Follow the dashed line', ko: '점선을 따라' },
    body: {
      ja: 'ピッチャーを低くして点線に沿って注ぐ。真ん中の点から渦を描いて外へ、最後はまっすぐ上へ、上の端を越えるまで。',
      en: 'Bring the pitcher low and pour along it: start at the dot in the middle, spiral out, then pull straight up through the middle and past the top.',
      ko: '피처를 낮추고 점선을 따라 부어요. 가운데 점에서 나선으로 바깥까지, 마지막엔 가운데를 지나 위로 쭉, 끝을 넘을 때까지.',
    },
  },
  artBest: {
    head: {
      ja: '○ ハート！ · 正確さ {n}%',
      en: '○ A heart! · accuracy {n}%',
      ko: '○ 하트! · 정확도 {n}%',
    },
    body: {
      ja: '線のとおりに注げた。きれいでそろったハート。とがった先はあやののほうを向いている。',
      en: 'Right along the line: a clean, even heart. The point faces Ayano, so it is the right way up for her.',
      ko: '선대로 부었어요. 깔끔하고 고른 하트. 뾰족한 끝이 아야노 쪽이라 그녀에게 바로 보여요.',
    },
    say: 'わぁ、ハートや！{可愛|かわい}らしいなぁ。{飲|の}むのもったいないわぁ。',
  },
  artGood: {
    head: {
      ja: '○ ハート！ · 正確さ {n}%',
      en: '○ A heart! · accuracy {n}%',
      ko: '○ 하트! · 정확도 {n}%',
    },
    body: {
      ja: 'ハート。線から外れたところが少しゆがんだ。先はあやののほうを向いている。',
      en: 'A heart, a little uneven where the pour wandered off the line. The point faces Ayano.',
      ko: '하트. 선에서 벗어난 곳이 조금 삐뚤어요. 끝은 아야노 쪽.',
    },
    say: 'ハートやね。{可愛|かわい}らしいわぁ。',
  },
  artMiss: {
    head: {
      ja: '× ハートにならなかった · 正確さ {n}%',
      en: '× Not quite a heart · accuracy {n}%',
      ko: '× 하트가 안 됐어요 · 정확도 {n}%',
    },
    body: {
      ja: '「個性的な模様」は京都で「ちょっと違う」の意味。点線から外れすぎた。ゆっくりでいいので、線にぴったり。',
      en: '"What a distinctive pattern" is Kyoto for "that isn\'t quite it". The pour wandered off the dashed line too often. Slower is fine: follow it closely.',
      ko: '"개성적인 무늬네요"는 교토식으로 "좀 아니네요". 점선에서 너무 자주 벗어났어요. 천천히 해도 되니 선에 딱 붙여요.',
    },
    say: 'まぁ、{個性的|こせいてき}な{模様|もよう}どすなぁ。',
  },
};

/** what Ayano says over the table when the hand keeps wandering */
export const MT_TIPS = {
  w: {
    jp: 'Wの{字|じ}を{描|か}くように{振|ふ}っておくれやす',
    t: { ja: 'Wを描くように', en: 'Whisk along the W', ko: 'W를 그리듯이' },
  },
  dash: {
    jp: '{点線|てんせん}のとおりに{注|そそ}いでおくれやす',
    t: { ja: '点線のとおりに', en: 'Pour along the dashed line', ko: '점선대로 부어요' },
  },
} satisfies Record<string, { jp: string; t: L3 }>;
export type MtTip = keyof typeof MT_TIPS;

/** words worth keeping, collected as they come up and listed at the end */
export interface MtPhrase {
  jp: string;
  t: L3;
}
export const MT_PHRASES = {
  chasen: { jp: '{茶筅|ちゃせん}', t: { ja: '茶筅', en: 'tea whisk', ko: '차선' } },
  chashaku: { jp: '{茶杓|ちゃしゃく}', t: { ja: '茶杓', en: 'bamboo tea scoop', ko: '차샤쿠' } },
  nihai: {
    jp: '{二杯|にはい}',
    t: { ja: '二杯（杯で数える）', en: 'two scoops (cups, glasses: 杯)', ko: '두 잔(杯로 센다)' },
  },
  tateru: {
    jp: '{点|た}てる',
    t: { ja: 'お茶を点てる', en: 'to whisk (tea)', ko: '(차를) 거품 내어 만들다' },
  },
  kawaii: {
    jp: '{可愛|かわい}らしい',
    t: { ja: 'かわいらしい', en: 'lovely, sweet', ko: '사랑스럽다' },
  },
  koseiteki: {
    jp: '{個性的|こせいてき}どすなぁ',
    t: {
      ja: '「個性的ですね」— 京都で、うまくいかなかったことをやわらかく言う',
      en: '"How distinctive" — a soft Kyoto way of saying it missed',
      ko: '"개성적이네요" — 교토식으로 빗나간 걸 부드럽게 하는 말',
    },
  },
} satisfies Record<string, MtPhrase>;

/** the screen's own words */
export const MT_TEXT = {
  title: { ja: '抹茶セット', en: 'Matcha set', ko: '말차 세트' },
  ayano: { ja: 'あやの', en: 'Ayano', ko: '아야노' },
  staff: { ja: '店員', en: 'Staff', ko: '점원' },
  stage: { ja: 'ステージ {n} / 6', en: 'Stage {n} / 6', ko: '스테이지 {n} / 6' },
  done: { ja: 'おしまい', en: 'Finished', ko: '끝' },
  soundOn: { ja: '音 オン', en: 'Sound on', ko: '소리 켬' },
  soundOff: { ja: '音 オフ', en: 'Sound off', ko: '소리 끔' },
  table: {
    ja: '上から見たテーブル：お茶の道具、茶碗、ラテのカップ',
    en: 'The table seen from above: the tea set, a tea bowl and a latte cup',
    ko: '위에서 본 테이블: 다도 도구, 다완, 라테 컵',
  },
  leadIntro: {
    ja: '京都・抹茶の店・午後',
    en: 'Kyoto · a matcha tea house · afternoon',
    ko: '교토 · 말차 카페 · 오후',
  },
  leadTools: {
    ja: 'ステージ1 · お道具 — 言われた道具をタップ',
    en: 'Stage 1 · Tools — tap the one she names',
    ko: '스테이지 1 · 도구 — 말한 도구를 탭',
  },
  leadPowder: {
    ja: 'ステージ2 · 自分の抹茶 — 粉をすくう',
    en: 'Stage 2 · Your matcha — scoop the powder',
    ko: '스테이지 2 · 내 말차 — 가루 뜨기',
  },
  leadWater: {
    ja: 'ステージ2 · 自分の抹茶 — お湯を注ぐ',
    en: 'Stage 2 · Your matcha — pour the hot water',
    ko: '스테이지 2 · 내 말차 — 뜨거운 물 붓기',
  },
  leadWhisk: {
    ja: 'ステージ3 · 点てる',
    en: 'Stage 3 · Whisk the tea',
    ko: '스테이지 3 · 차 휘젓기',
  },
  leadBase: {
    ja: 'ステージ4 · あやののラテ — 濃いベース',
    en: "Stage 4 · Ayano's latte — a strong base",
    ko: '스테이지 4 · 아야노의 라테 — 진한 베이스',
  },
  leadArt: {
    ja: 'ステージ5 · ラテアート — ハートを描く',
    en: 'Stage 5 · Latte art — draw a heart',
    ko: '스테이지 5 · 라테 아트 — 하트 그리기',
  },
  leadServe: {
    ja: 'ステージ6 · あやのにラテを渡す',
    en: 'Stage 6 · Hand Ayano her latte',
    ko: '스테이지 6 · 아야노에게 라테 건네기',
  },
  makeTea: { ja: 'お茶を点てる ▶', en: 'Make the tea ▶', ko: '차 만들기 ▶' },
  next: { ja: '次へ ▶', en: 'Next ▶', ko: '다음 ▶' },
  scooped: { ja: 'できた', en: 'Done', ko: '다 떴어요' },
  whiskIt: { ja: '点てる ▶', en: 'Whisk it ▶', ko: '휘젓기 ▶' },
  herLatte: { ja: '次はあやののラテ ▶', en: 'Now her latte ▶', ko: '이제 그녀의 라테 ▶' },
  pourMilk: { ja: 'ミルクを注ぐ ▶', en: 'Pour the milk ▶', ko: '우유 붓기 ▶' },
  handIt: { ja: 'あやのに渡す ▶', en: 'Hand it to her ▶', ko: '아야노에게 건네기 ▶' },
  again: { ja: 'もう一度', en: 'Try once more', ko: '한 번 더' },
  asIs: { ja: 'このまま出す', en: 'Serve it as it is', ko: '이대로 내기' },
  ml: { ja: '{n} ml', en: '{n} ml', ko: '{n} ml' },
  mlMore: { ja: '{n} ml · もう少し', en: '{n} ml · a little more', ko: '{n} ml · 조금 더' },
  froth: {
    ja: '泡 {n}% · 正確さ {a}%',
    en: 'Froth {n}% · accuracy {a}%',
    ko: '거품 {n}% · 정확도 {a}%',
  },
  accuracy: { ja: '正確さ {a}%', en: 'Accuracy {a}%', ko: '정확도 {a}%' },
  gotLatte: {
    ja: '実績「ラテを飲むあやの」を手に入れた。',
    en: 'Achievement "Ayano with her latte" unlocked with your heart.',
    ko: '업적 "라테를 마시는 아야노"를 하트로 얻었어요.',
  },
  noLatte: {
    ja: 'ラテにハートを描くと、実績「ラテを飲むあやの」が手に入る。',
    en: 'Draw a heart in her latte to unlock "Ayano with her latte".',
    ko: '라테에 하트를 그리면 업적 "라테를 마시는 아야노"를 얻어요.',
  },
  phrases: { ja: 'お店で出てきた言葉', en: 'Words from the tea house', ko: '찻집에서 나온 말' },
  nice: { ja: 'ナイス！', en: 'Nice!', ko: '좋아요!' },
  retry: { ja: 'もう一度選んでみよう。', en: 'Pick again.', ko: '다시 골라 봐요.' },
} satisfies Record<string, L3>;
export type MtText = keyof typeof MT_TEXT;

/** scoops in the bowl, counted with 杯 */
export const MT_COUNT = [
  '—',
  '{一杯|いっぱい}',
  '{二杯|にはい}',
  '{三杯|さんばい}',
  '{四杯|よんはい}',
];
/** the end card's title, and the powder step's 'done' */
export const MT_FINISH = '{抹茶|まっちゃ}、いただきます';
export const MT_SCOOPED = 'できた';
