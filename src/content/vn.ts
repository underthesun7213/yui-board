import type { Route, VnRoute } from './types';

/* Episode 8. Two routes, drawn with a broad brush on purpose: the Osaka friend
   is loud and direct, the Kyoto friend says things sideways. Real people are
   not their prefecture, and the notes say so where it matters. */
export const VN: Record<Route, VnRoute> = {
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
        s: 'Two friends meeting at a crowded Osaka Station concourse, one waving hard',
        jp: 'おー、こっちこっち！めっちゃ待ったで〜',
        opts: [
          {
            jp: 'ごめん、遅れた！',
            ok: true,
            fb: {
              ja: '友達には「すみません」より「ごめん」。敬語は距離になる',
              en: 'With friends ごめん beats すみません. Keigo puts a wall up',
              ko: '친구에겐 すみません보다 ごめん. 경어는 거리를 만든다',
            },
          },
          {
            jp: '申し訳ありません。',
            ok: false,
            fb: {
              ja: '丁寧すぎる。バイトの面接みたいに聞こえる',
              en: 'Too formal — this is job-interview register',
              ko: '지나치게 정중하다. 알바 면접처럼 들린다',
            },
          },
          {
            jp: 'えー、めっちゃ待った？',
            ok: true,
            fb: {
              ja: '相手の言葉を拾って返すと、会話が転がる',
              en: 'Picking up their own word keeps the conversation rolling',
              ko: '상대의 말을 받아 되돌리면 대화가 굴러간다',
            },
          },
        ],
      },
      {
        s: 'A takoyaki stall, steam rising, friend already eating',
        jp: 'ここのたこ焼き、めっちゃうまいねん。',
        opts: [
          {
            jp: 'ほんま？',
            ok: true,
            fb: {
              ja: '相づちはこれで足りる。関西では「本当？」よりこちら',
              en: 'This is a complete reply. In Kansai it lands better than 本当？',
              ko: '맞장구는 이걸로 충분. 간사이에선 本当？보다 이쪽',
            },
          },
          {
            jp: 'ねん、って何？',
            ok: true,
            fb: {
              ja: '聞いていい。「〜ねん」は「〜んだ」。説明を喜ぶ人が多い',
              en: 'Fine to ask. 〜ねん is the Kansai 〜んだ, and most people enjoy explaining',
              ko: '물어봐도 된다. 〜ねん은 〜んだ에 해당. 설명을 반기는 사람이 많다',
            },
          },
          {
            jp: 'そうですか。',
            ok: false,
            fb: {
              ja: '敬語に戻ると会話が止まる。友達の前では崩していい',
              en: 'Sliding back into keigo stops the conversation dead',
              ko: '경어로 돌아가면 대화가 멈춘다. 친구 앞에선 풀어도 된다',
            },
          },
        ],
      },
      {
        s: 'A covered shopping arcade, an older shopkeeper leaning out of her stall',
        jp: 'お姉ちゃん、ええの入ってるで。',
        opts: [
          {
            jp: 'ちょっと高いなあ。',
            ok: true,
            fb: {
              ja: '値段の話は失礼じゃない。商店街では会話の一部',
              en: 'Talking price is not rude here. In an arcade it is part of the chat',
              ko: '가격 얘기는 실례가 아니다. 상점가에선 대화의 일부',
            },
          },
          {
            jp: 'まけてくれます？',
            ok: true,
            fb: {
              ja: '商店街なら通じることも。スーパーやチェーン店では言わない',
              en: 'Works in an arcade. Never try it in a supermarket or a chain',
              ko: '상점가에선 통하기도. 슈퍼나 체인점에선 쓰지 않는다',
            },
          },
          {
            jp: '（黙って値札を見る）',
            ok: false,
            fb: {
              ja: '聞くだけならタダ、というのが大阪の感覚',
              en: 'Asking costs nothing — that is the local instinct',
              ko: '물어보는 건 공짜, 가 오사카의 감각',
            },
          },
        ],
      },
      {
        s: 'Both sitting on a river wall at Dotonbori, neon reflected in the water',
        jp: '俺な、昨日道で100万円拾ってん。',
        opts: [
          {
            jp: '嘘つけ！',
            ok: true,
            fb: {
              ja: 'ここは驚くところじゃない。疑うのが正解のツッコミ',
              en: 'Not a moment to be impressed. Doubting them is the correct move',
              ko: '놀랄 자리가 아니다. 의심하는 게 정답인 츳코미',
            },
          },
          {
            jp: 'えー、すごい！',
            ok: false,
            fb: {
              ja: '信じると話が終わる。冗談は受け止めるより返す',
              en: 'Believing it ends the joke. Return the serve instead of catching it',
              ko: '믿으면 얘기가 끝난다. 농담은 받기보다 되돌린다',
            },
          },
          {
            jp: 'ほんまに？',
            ok: true,
            fb: {
              ja: '半信半疑。弱いが、使える返し',
              en: 'Half-believing. Weaker, but it works',
              ko: '반신반의. 약하지만 쓸 만한 반응',
            },
          },
        ],
      },
      {
        /* owner, 2026-10-25: the Yoshimoto Shinkigeki door gag */
        s: 'Yuki sliding open the door of a small okonomiyaki shop, grinning back over a shoulder',
        jp: '邪魔すんでー。',
        opts: [
          {
            jp: '邪魔すんなら帰ってー。',
            ok: true,
            fb: {
              ja: '吉本新喜劇の定番のかけ合い。ユウキ「わかってるやん！」',
              en: "The classic Yoshimoto Shinkigeki comeback. Yuki: 'You get it!'",
              ko: '요시모토 신희극의 단골 주고받기. 유우키 "알고 있네!"',
            },
          },
          {
            jp: 'どうぞ、どうぞ。',
            ok: false,
            fb: {
              ja: '普通に通すとボケが宙に浮く。ここは返すところ',
              en: 'Letting it pass leaves the joke hanging. This is your cue to hit back',
              ko: '그냥 들여보내면 보케가 허공에 뜬다. 여기선 받아칠 차례',
            },
          },
          {
            jp: 'お邪魔します。',
            ok: false,
            fb: {
              ja: '丁寧で正しいが、ユウキが待っているのはツッコミ',
              en: 'Polite and correct, but Yuki is waiting for the comeback',
              ko: '정중하고 맞는 말이지만, 유우키가 기다리는 건 츳코미',
            },
          },
        ],
      },
      {
        s: 'Ticket gates at night, the friend already walking backwards, waving',
        jp: 'ほな、またな！',
        opts: [
          {
            jp: 'ほな、また。',
            ok: true,
            fb: {
              ja: '「ほな」は「じゃあ」。真似して返すと一気に近くなる',
              en: 'ほな is じゃあ. Echoing it back closes the distance fast',
              ko: 'ほな는 じゃあ. 따라서 돌려주면 단숨에 가까워진다',
            },
          },
          {
            jp: 'さようなら。',
            ok: false,
            fb: {
              ja: '重い。もう会わない人に言う言葉に聞こえる',
              en: 'Heavy — it sounds like you are not planning to meet again',
              ko: '무겁다. 다시 안 볼 사람에게 하는 말처럼 들린다',
            },
          },
          {
            jp: 'お疲れさまでした。',
            ok: false,
            fb: {
              ja: 'バイト先の別れ方。友達には少し他人行儀',
              en: 'How you leave a shift, not a friend',
              ko: '알바 끝나고 하는 인사. 친구에겐 조금 남 같다',
            },
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
        jp: 'わざわざ来てくれはって、おおきに。',
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
            jp: '来たかったから。',
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
        jp: 'これ、食べてみはる？',
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
            jp: '結構です。',
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
        jp: 'ここ、静かにしといた方がええかもしれへんね。',
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
            jp: '（声を小さくする）',
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
        jp: 'そろそろ、お茶漬けでもどうどす？',
        opts: [
          {
            jp: 'あ、もうこんな時間。そろそろ失礼します。',
            ok: true,
            fb: {
              ja: '有名な遠回し。「そろそろ帰っては」の合図とされる',
              en: "The famous one. Traditionally read as 'it may be time to go'",
              ko: "유명한 돌려말하기. '슬슬 갈 때'라는 신호로 통한다",
            },
          },
          {
            jp: 'お構いなく。',
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
        jp: 'また寄っとくれやす。',
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
            jp: '必ず行きます。',
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
