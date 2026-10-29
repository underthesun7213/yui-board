import type { L3 } from './types';

/* 유우키 미니게임 (docs/06-design/minigames/yuki-minigame): kushikatsu with
   Yuki in Shinsekai. You order on the shop's mobile-order screen, dip each
   skewer in the shared sauce once, pay and leave. No score: every answer
   gets feedback, a wrong one is tried again. Lines are Japanese with
   furigana ({漢字|かな}); what they mean and why is in all three languages. */

export type Look = 'meat' | 'egg' | 'ring' | 'long' | 'block';
export interface MenuItem {
  id: string;
  ja: string;
  name: L3;
  yen: number;
  look: Look;
}
export const MENU: MenuItem[] = [
  {
    id: 'gyu',
    ja: '{牛|ぎゅう}かつ',
    name: { ja: '牛かつ', en: 'Beef', ko: '소고기' },
    yen: 150,
    look: 'meat',
  },
  {
    id: 'buta',
    ja: '{豚|ぶた}かつ',
    name: { ja: '豚かつ', en: 'Pork', ko: '돼지고기' },
    yen: 130,
    look: 'meat',
  },
  {
    id: 'uzura',
    ja: 'うずら',
    name: { ja: 'うずら', en: 'Quail egg', ko: '메추리알' },
    yen: 120,
    look: 'egg',
  },
  {
    id: 'tama',
    ja: '{玉|たま}ねぎ',
    name: { ja: '玉ねぎ', en: 'Onion', ko: '양파' },
    yen: 110,
    look: 'ring',
  },
  {
    id: 'renk',
    ja: 'れんこん',
    name: { ja: 'れんこん', en: 'Lotus root', ko: '연근' },
    yen: 110,
    look: 'ring',
  },
  { id: 'ebi', ja: 'えび', name: { ja: 'えび', en: 'Shrimp', ko: '새우' }, yen: 220, look: 'long' },
  {
    id: 'chz',
    ja: 'チーズ',
    name: { ja: 'チーズ', en: 'Cheese', ko: '치즈' },
    yen: 160,
    look: 'block',
  },
  {
    id: 'mochi',
    ja: 'もち',
    name: { ja: 'もち', en: 'Rice cake', ko: '떡' },
    yen: 140,
    look: 'block',
  },
];
export type Drink = 'beer' | 'oolong';
export const DRINKS: Record<Drink, { ja: string; yen: number }> = {
  beer: { ja: '{生|なま}ビール', yen: 550 },
  oolong: { ja: 'ウーロン{茶|ちゃ}', yen: 300 },
};
export const BUDGET = 2000;
export const KINDS = 4;
export const MAX_EACH = 5;

export const WHO: Record<'yuki' | 'staff' | 'me', L3> = {
  yuki: { ja: 'ユウキ', en: 'Yuki', ko: '유우키' },
  staff: { ja: '店員', en: 'Staff', ko: '점원' },
  me: { ja: 'あなた', en: 'You', ko: '나' },
};

export interface Line {
  jp: string;
  mean: L3;
}
export interface Opt extends Line {
  ok: boolean;
  fb: L3;
  drink?: Drink;
}
export interface Talk {
  who: keyof typeof WHO | null;
  line: Line | null;
  lead: L3 | null;
  opts: Opt[];
}

export const TALK: Record<'drink' | 'bill' | 'leave', Talk> = {
  drink: {
    who: 'yuki',
    line: {
      jp: 'とりあえず{飲|の}み{物|もの}{決|き}めよか。{何|なに}にする？',
      mean: {
        ja: 'まず飲み物を決めよう。何にする？',
        en: "Let's pick drinks first. What are you having?",
        ko: '일단 음료부터 정하자. 뭐 마실래?',
      },
    },
    lead: null,
    opts: [
      {
        jp: 'とりあえず{生|なま}で！',
        ok: true,
        drink: 'beer',
        mean: { ja: 'とりあえず生ビール！', en: 'Draft beer to start!', ko: '일단 생맥주!' },
        fb: {
          ja: '「とりあえず生」は友達同士でも言う。生は生ビール、串かつの最初の一杯の定番。',
          en: '"Draft for now." Friends say it too. 生 (なま) is draft beer, the classic first drink with kushikatsu.',
          ko: '"일단 생으로"는 친구끼리도 쓴다. 生(なま)는 생맥주, 쿠시카츠의 첫 잔으로 딱.',
        },
      },
      {
        jp: 'ウーロン{茶|ちゃ}にしようかな。',
        ok: true,
        drink: 'oolong',
        mean: {
          ja: 'ウーロン茶にしようかな。',
          en: "I think I'll have oolong tea.",
          ko: '우롱차로 할까.',
        },
        fb: {
          ja: '「〜にしようかな」は気軽に選ぶ言い方。ウーロン茶は揚げ物によく合う。',
          en: '〜にしようかな ("I think I\'ll go with…") is a casual way to choose. Oolong tea goes well with fried food.',
          ko: '〜にしようかな("~로 할까")는 가볍게 고르는 말. 우롱차는 튀김과 잘 맞는다.',
        },
      },
      {
        jp: '{生|なま}ビールをいただけますでしょうか。',
        ok: false,
        mean: {
          ja: '生ビールをいただけますでしょうか。',
          en: 'Might I possibly have a draft beer?',
          ko: '생맥주를 받을 수 있을까요?',
        },
        fb: {
          ja: '友達に言うには丁寧すぎる。店員に話す客の言い方。ユウキにはくだけて。',
          en: 'Far too polite for a friend: this is how a customer might speak to staff. With Yuki, keep it casual.',
          ko: '친구에게는 너무 정중하다. 손님이 점원에게 하는 말투. 유우키에게는 편하게.',
        },
      },
    ],
  },
  bill: {
    who: null,
    line: null,
    lead: {
      ja: 'そろそろ出よう。レジで払う。何と言う？',
      en: 'Time to go. You pay at the register on the way out. You say:',
      ko: '이제 나가자. 계산대에서 낸다. 뭐라고 할까?',
    },
    opts: [
      {
        jp: 'すみません、お{会計|かいけい}お{願|ねが}いします。',
        ok: true,
        mean: {
          ja: 'すみません、お会計お願いします。',
          en: 'Excuse me, the bill please.',
          ko: '저기요, 계산 부탁해요.',
        },
        fb: {
          ja: 'レジでは「お会計お願いします」で十分。「すみません」から始めると丁寧。',
          en: 'お会計お願いします is all you need at the register; starting with すみません makes it polite.',
          ko: '계산대에서는 お会計お願いします면 충분. すみません으로 시작하면 정중하다.',
        },
      },
      {
        jp: 'おあいそ！',
        ok: false,
        mean: { ja: 'おあいそ！', en: '(Check!)', ko: '(계산이요!)' },
        fb: {
          ja: '「おあいそ」はもともと店側の言葉。客が言うと変に聞こえることも。「お会計」が無難。',
          en: 'おあいそ started as shop-side slang, so some people find it odd from a customer. お会計 is the safe choice.',
          ko: 'おあいそ는 원래 가게 쪽 말이라 손님이 쓰면 어색하게 듣는 사람도 있다. お会計가 무난하다.',
        },
      },
      {
        jp: 'お{金|かね}を{払|はら}いたいです。',
        ok: false,
        mean: {
          ja: 'お金を払いたいです。',
          en: 'I would like to pay money.',
          ko: '돈을 내고 싶어요.',
        },
        fb: {
          ja: '間違いではないが教科書のように硬い。店では「お会計お願いします」。',
          en: 'Not wrong, but stiff, like a textbook. In a shop, say お会計お願いします.',
          ko: '틀린 말은 아니지만 교과서처럼 딱딱하다. 가게에서는 お会計お願いします.',
        },
      },
    ],
  },
  leave: {
    who: null,
    line: null,
    lead: {
      ja: '払った。店を出るとき、店員に言う：',
      en: 'Paid. As you step out, you say to the staff:',
      ko: '계산했다. 가게를 나서며 점원에게:',
    },
    opts: [
      {
        jp: 'ごちそうさまでした！',
        ok: true,
        mean: { ja: 'ごちそうさまでした！', en: 'Thank you for the meal!', ko: '잘 먹었습니다!' },
        fb: {
          ja: '食べた後のあいさつ。店を出るときに店員に言ってもいい。',
          en: 'Said after eating. You can say it to the staff as you leave.',
          ko: '먹고 나서 하는 인사. 가게를 나설 때 점원에게 해도 좋다.',
        },
      },
      {
        jp: 'いただきます！',
        ok: false,
        mean: { ja: 'いただきます！', en: "Let's eat!", ko: '잘 먹겠습니다!' },
        fb: {
          ja: '「いただきます」は食べる前。食べた後は「ごちそうさまでした」。',
          en: 'いただきます comes before eating. After, it is ごちそうさまでした.',
          ko: 'いただきます는 먹기 전에. 먹은 뒤에는 ごちそうさまでした.',
        },
      },
      {
        jp: 'お{疲|つか}れさまでした。',
        ok: false,
        mean: { ja: 'お疲れさまでした。', en: 'Thanks for your hard work.', ko: '수고하셨습니다.' },
        fb: {
          ja: '一緒に働いた人へのあいさつ。客から店員に言うと変。',
          en: 'Said to people you worked with. From a customer to the staff it sounds odd.',
          ko: '함께 일한 사람에게 하는 인사. 손님이 점원에게 쓰면 어색하다.',
        },
      },
    ],
  },
};

/* Yuki's other lines */
export const LINES = {
  order: {
    jp: 'ここはスマホで{注文|ちゅうもん}するんやで。{好|す}きなん{頼|たの}み！',
    mean: {
      ja: 'ここはスマホで注文するんだよ。好きなのを頼んで！',
      en: 'Here you order on your phone. Get whatever you like!',
      ko: '여기는 스마트폰으로 주문하는 거야. 먹고 싶은 거 시켜!',
    },
  },
  reply: {
    jp: 'ええやん！ええ{感|かん}じやな。',
    mean: { ja: 'いいね！いい感じだね。', en: 'Nice picks!', ko: '좋은데! 잘 골랐네.' },
  },
  rule: {
    jp: 'ソースの{二度漬|にどづ}けは{禁止|きんし}やで！',
    mean: {
      ja: 'ソースの二度漬けは禁止だよ！',
      en: 'No double-dipping in the sauce!',
      ko: '소스 두 번 찍기는 금지야!',
    },
  },
  tease: {
    jp: '{二度漬|にどづ}けはアカンで〜',
    mean: { ja: '二度漬けはだめだよ〜', en: 'No double-dipping~', ko: '두 번 찍으면 안 돼~' },
  },
  end: {
    jp: 'おおきに！またどうぞ〜',
    mean: {
      ja: 'ありがとう！またどうぞ〜',
      en: 'Thank you! Come again~',
      ko: '고마워요! 또 오세요~',
    },
  },
} satisfies Record<string, Line>;

/* the one blank: 牛かつを2＿頼んだよ */
export const UNITS: { u: string; ok: boolean; fb: L3 }[] = [
  {
    u: '本',
    ok: true,
    fb: {
      ja: '串のように細長いものは「〜本」。1本(いっぽん)、2本(にほん)、3本(さんぼん)と音が変わる。',
      en: 'Long, thin things like skewers are counted with 〜本, and its sound changes: 1本 (いっぽん), 2本 (にほん), 3本 (さんぼん).',
      ko: '꼬치처럼 가늘고 긴 것은 〜本. 1本(いっぽん), 2本(にほん), 3本(さんぼん)처럼 소리가 바뀐다.',
    },
  },
  {
    u: '個',
    ok: false,
    fb: {
      ja: '「〜個」はりんごや卵のような丸いもの。串は「〜本」。',
      en: '〜個 counts round things such as apples and eggs. Skewers take 〜本.',
      ko: '〜個는 사과·달걀처럼 동그란 것을 셀 때. 꼬치는 〜本.',
    },
  },
  {
    u: '枚',
    ok: false,
    fb: {
      ja: '「〜枚」は紙や皿のような薄く平らなもの。串は「〜本」。',
      en: '〜枚 counts thin, flat things such as paper and plates. Skewers take 〜本.',
      ko: '〜枚는 종이·접시처럼 얇고 평평한 것. 꼬치는 〜本.',
    },
  },
];
export const HON = ['', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん'];

/* Shown only in Japanese, as the sounds and the shop's own words they are */
export const SFX_TEXT = {
  cart: 'カートに入れた！',
  sent: '注文を送信しました',
  arrived: 'お待たせしました〜！',
  dip: 'ジュッ',
  already: 'もう付いてるよ',
  yum: 'うまっ！',
  munch: 'もぐもぐ',
  paid: 'チャリーン',
};

export const END_NOTE: L3 = {
  ja: '「おおきに」は関西の「ありがとう」。店の人からよく聞く。',
  en: 'おおきに is Kansai for "thank you". You hear it a lot from shop staff.',
  ko: 'おおきに는 간사이의 "고마워요". 가게 사람에게서 자주 듣는다.',
};

/* yen read aloud, for the bill (1–9999) */
export function yenKana(n: number): string {
  const d = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const sen = [
    '',
    'せん',
    'にせん',
    'さんぜん',
    'よんせん',
    'ごせん',
    'ろくせん',
    'ななせん',
    'はっせん',
    'きゅうせん',
  ];
  const hyaku = [
    '',
    'ひゃく',
    'にひゃく',
    'さんびゃく',
    'よんひゃく',
    'ごひゃく',
    'ろっぴゃく',
    'ななひゃく',
    'はっぴゃく',
    'きゅうひゃく',
  ];
  const a = Math.floor(n / 1000) % 10;
  const b = Math.floor(n / 100) % 10;
  const c = Math.floor(n / 10) % 10;
  const e = n % 10;
  return sen[a]! + hyaku[b]! + (c === 0 ? '' : (c === 1 ? '' : d[c]!) + 'じゅう') + d[e]! + 'えん';
}

export const orderTotal = (order: Record<string, number>, drink: Drink | null) =>
  MENU.reduce((t, m) => t + m.yen * (order[m.id] ?? 0), 0) + (drink ? DRINKS[drink].yen : 0);
export const kindsIn = (order: Record<string, number>) =>
  MENU.filter((m) => (order[m.id] ?? 0) > 0).length;
export const orderOk = (order: Record<string, number>, drink: Drink | null) =>
  kindsIn(order) >= KINDS && orderTotal(order, drink) <= BUDGET;

/* art slots (src/content/art.ts) */
export const YUKI_ART = {
  street: 'minigames/yuki/street',
  table: 'minigames/yuki/table',
  tease: 'minigames/yuki/tease',
} as const;
