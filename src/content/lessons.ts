import type { Lesson } from './types';

/* Ported from v1.3. `s` is the scene note the artwork is drawn from; it is
   kept for the artist and not rendered (Y-J2). */
export const LESSONS: Lesson[] = [
  {
    id: 'l1',
    lv: 1,
    t: {
      ja: 'コンビニとスーパー',
      en: 'Konbini and supermarket',
      ko: '편의점과 슈퍼',
    },
    d: {
      ja: 'レジで必ず聞かれること',
      en: 'What the register always asks you',
      ko: '계산대에서 반드시 묻는 것',
    },
    cuts: [
      {
        jp: 'いらっしゃいませ。',
        s: 'Student walking into a Japanese konbini at night, bento in hand',
      },
      {
        jp: 'お弁当、温めますか？',
        s: 'Cashier holding the bento over the microwave',
      },
      {
        jp: 'お願いします。',
        s: 'Student nodding',
      },
      {
        jp: '袋は5円かかりますが、よろしいですか？',
        s: 'Cashier holding up a plastic bag',
      },
      {
        jp: 'あ、大丈夫です。持ってます。',
        s: 'Student pulling out an eco bag',
      },
      {
        jp: 'ポイントカードはお持ちですか？',
        s: 'Cashier at the register screen',
      },
      {
        jp: '持ってないです。',
        s: 'Student shaking their head slightly',
      },
      {
        jp: '（スーパーは夜8時すぎると半額シールが貼られる）',
        s: 'Supermarket deli shelf in the evening, red half-price stickers on bento',
      },
    ],
    ex: [
      {
        jp: '温めますか',
        rd: 'atatamemasu ka',
        g: {
          ja: '弁当を買うたびに聞かれる。「お願いします」か「大丈夫です」で答える',
          en: 'Asked every single time you buy a bento. Answer with お願いします or 大丈夫です',
          ko: '도시락 살 때마다 듣는다. お願いします나 大丈夫です로 답하면 된다',
        },
      },
      {
        jp: '大丈夫です',
        rd: 'daijoubu desu',
        g: {
          ja: 'ここでは「いりません」の意味。断りの定番',
          en: "Here it means 'no thanks', not 'I'm fine'. The standard soft refusal",
          ko: "여기선 '필요 없습니다'라는 뜻. 거절의 기본형",
        },
      },
      {
        jp: '半額シール',
        rd: 'hangaku shiiru',
        g: {
          ja: '閉店前の値引き。スーパーは夜が狙い目',
          en: 'The discount sticker before closing. Supermarkets are worth a late visit',
          ko: '폐점 전 할인 스티커. 슈퍼는 밤이 노려볼 만하다',
        },
      },
    ],
  },
  {
    id: 'l2',
    lv: 2,
    t: {
      ja: '京都へ行く',
      en: 'Getting to Kyoto',
      ko: '교토 가는 길',
    },
    d: {
      ja: '駅員に聞く。特急・急行・各停',
      en: 'Asking station staff. Express, rapid, local',
      ko: '역무원에게 묻기. 특급·급행·각역정차',
    },
    cuts: [
      {
        jp: 'すみません、京都に行きたいんですが。',
        s: 'Student at the small ticket window of Gotenyama Station',
      },
      {
        jp: 'ここは各駅停車だけなんですよ。',
        s: 'Station staff behind the window',
      },
      {
        jp: '枚方市で乗り換えですか？',
        s: 'Student checking a route app on their phone',
      },
      {
        jp: 'はい。枚方市から特急が出ています。',
        s: 'Staff pointing at a route map on the wall',
      },
      {
        jp: '（枚方市駅）特急は何番ホームですか？',
        s: 'Student on a busy platform concourse at Hirakatashi',
      },
      {
        jp: '3番ホーム、出町柳行きです。',
        s: 'Staff gesturing toward a staircase, departure board overhead',
      },
      {
        jp: 'この電車、樟葉には止まりませんからね。',
        s: 'Staff adding a warning, finger raised',
      },
      {
        jp: 'ありがとうございます！',
        s: 'Student hurrying up the stairs as the train pulls in',
      },
    ],
    ex: [
      {
        jp: '乗り換え',
        rd: 'norikae',
        g: {
          ja: '関西の私鉄は種別が多い。まずこれを聞く',
          en: "Kansai's private lines run many train grades. This is the first thing to ask",
          ko: '간사이 사철은 등급이 많다. 우선 이것부터 묻는다',
        },
      },
      {
        jp: '何番ホームですか',
        rd: 'nanban hoomu desu ka',
        g: {
          ja: '時刻より先にホーム。迷ったらこれ',
          en: 'Platform before timetable. Ask this when lost',
          ko: '시간보다 승강장부터. 헤맬 땐 이 한마디',
        },
      },
      {
        jp: '〜行き',
        rd: '...yuki',
        g: {
          ja: '行き先表示。「出町柳行き」なら京都方面',
          en: 'The destination on the board. 出町柳行き means it runs toward Kyoto',
          ko: '행선지 표시. 出町柳行き면 교토 방면',
        },
      },
    ],
  },
  {
    id: 'l3',
    lv: 3,
    t: {
      ja: '病院へ行く',
      en: 'Going to the clinic',
      ko: '병원 가기',
    },
    d: {
      ja: '受付から会計まで',
      en: 'From the reception desk to the pharmacy',
      ko: '접수부터 약국까지',
    },
    cuts: [
      {
        jp: '初めてなんですが。',
        s: 'Student at a small clinic reception counter',
      },
      {
        jp: '保険証と、この問診票をお願いします。',
        s: 'Receptionist handing over a clipboard and form',
      },
      {
        jp: '（問診票に記入する）いつから、どこが……',
        s: 'Student filling in the form in a waiting room chair, slightly stuck',
      },
      {
        jp: '3日前から熱が下がらなくて。',
        s: 'In the consulting room, doctor listening',
      },
      {
        jp: '喉を見せてください。あーんして。',
        s: 'Doctor with a tongue depressor',
      },
      {
        jp: '風邪ですね。お薬を出しておきます。',
        s: 'Doctor typing at a terminal',
      },
      {
        jp: '処方箋は向かいの薬局で出してください。',
        s: 'Receptionist pointing out of the window',
      },
      {
        jp: 'お大事に。',
        s: 'Student leaving with a prescription slip',
      },
    ],
    ex: [
      {
        jp: '問診票',
        rd: 'monshinhyou',
        g: {
          ja: '初診で必ず書く用紙。症状・既往歴・アレルギー',
          en: 'The intake form every first visit. Symptoms, history, allergies',
          ko: '초진 때 반드시 쓰는 서류. 증상·병력·알레르기',
        },
      },
      {
        jp: '〜が下がらなくて',
        rd: '...ga sagaranakute',
        g: {
          ja: '熱・痛みが続くときの言い方。「下がりません」より自然',
          en: 'For a fever or pain that will not let up. Softer than 下がりません',
          ko: '열·통증이 계속될 때. 下がりません보다 자연스럽다',
        },
      },
      {
        jp: 'お大事に',
        rd: 'odaiji ni',
        g: {
          ja: '帰りに必ず言われる。「ありがとうございます」で返す',
          en: 'You will be told this on the way out. Reply with ありがとうございます',
          ko: '나올 때 반드시 듣는다. ありがとうございます로 답한다',
        },
      },
    ],
  },
  {
    id: 'l4',
    lv: 4,
    t: {
      ja: 'ドラッグストアで探す',
      en: 'Finding things at the drugstore',
      ko: '드럭스토어에서 찾기',
    },
    d: {
      ja: '症状を言えば、店員が選んでくれる',
      en: 'Say the symptom and the staff will pick for you',
      ko: '증상만 말하면 점원이 골라준다',
    },
    cuts: [
      {
        jp: 'すみません、風邪薬はどこですか？',
        s: 'Student lost between tall drugstore aisles',
      },
      {
        jp: '症状はどんな感じですか？',
        s: 'Staff in a uniform turning to help',
      },
      {
        jp: '喉の痛みと、鼻水です。',
        s: 'Student touching their throat',
      },
      {
        jp: 'それならこちらですね。',
        s: 'Staff pulling a box off the shelf',
      },
      {
        jp: '1日何回飲みますか？',
        s: 'Student turning the box over, reading the back',
      },
      {
        jp: '食後に3回。眠くなる成分が入っています。',
        s: 'Staff pointing at the label',
      },
      {
        jp: 'もう少し安いのはありますか？',
        s: 'Student comparing two boxes',
      },
      {
        jp: 'でしたら、こちらのほうが。',
        s: 'Staff offering a cheaper box',
      },
    ],
    ex: [
      {
        jp: '症状',
        rd: 'shoujou',
        g: {
          ja: '薬を探すときの鍵語。商品名より症状を言う',
          en: 'The key word here. Describe the symptom, not a product name',
          ko: '약 찾을 때의 핵심어. 제품명보다 증상을 말한다',
        },
      },
      {
        jp: '食後／食前',
        rd: 'shokugo / shokuzen',
        g: {
          ja: '飲むタイミング。箱と薬袋に必ず書いてある',
          en: 'After or before meals. Always printed on the box and the bag',
          ko: '복용 시점. 상자와 약봉투에 반드시 적혀 있다',
        },
      },
      {
        jp: '眠くなる',
        rd: 'nemuku naru',
        g: {
          ja: '授業前に飲む薬では重要。必ず確認する',
          en: 'Matters if you take it before class. Worth checking every time',
          ko: '수업 전에 먹을 약이라면 중요. 꼭 확인할 것',
        },
      },
    ],
  },
  {
    id: 'l5',
    lv: 5,
    t: {
      ja: '服を買う',
      en: 'Buying clothes',
      ko: '옷 사기',
    },
    d: {
      ja: '声をかけられたときの逃げ方も',
      en: 'Including how to escape when staff approach',
      ko: '점원이 말 걸 때 빠져나가는 법도',
    },
    cuts: [
      {
        jp: '何かお探しですか？',
        s: 'Shop assistant approaching a browsing customer',
      },
      {
        jp: '見てるだけです。',
        s: 'Student holding up a hand, smiling politely',
      },
      {
        jp: '試着してもいいですか？',
        s: 'Student holding a coat on a hanger',
      },
      {
        jp: 'どうぞ。試着室はこちらです。',
        s: 'Assistant pulling back a fitting-room curtain',
      },
      {
        jp: 'サイズ、いかがですか？',
        s: 'Assistant calling through the curtain',
      },
      {
        jp: 'ちょっと大きいです。Mはありますか？',
        s: 'Student in the coat, sleeves too long',
      },
      {
        jp: '申し訳ありません、Mは品切れで。',
        s: 'Assistant checking a tablet, apologetic',
      },
      {
        jp: 'じゃあ、また来ます。',
        s: 'Student handing the coat back, leaving',
      },
    ],
    ex: [
      {
        jp: '見てるだけです',
        rd: 'miteru dake desu',
        g: {
          ja: '声をかけられたらこれ一つ。失礼にならない',
          en: "The one phrase for 'just browsing'. Not rude at all",
          ko: '말 걸어오면 이 한마디. 전혀 실례가 아니다',
        },
      },
      {
        jp: '試着してもいいですか',
        rd: 'shichaku shitemo ii desu ka',
        g: {
          ja: '試着は必ず一声かけてから',
          en: 'Always ask before trying anything on',
          ko: '입어보기 전엔 반드시 한마디',
        },
      },
      {
        jp: '品切れ',
        rd: 'shinagire',
        g: {
          ja: '在庫なし。「売り切れ」とほぼ同じ',
          en: 'Out of stock. Near enough the same as 売り切れ',
          ko: '재고 없음. 売り切れ와 거의 같다',
        },
      },
    ],
  },
  {
    id: 'l6',
    lv: 6,
    t: {
      ja: '居酒屋に行く',
      en: 'At an izakaya',
      ko: '이자카야 가기',
    },
    d: {
      ja: 'お通し、取り皿、お会計',
      en: 'The cover charge, shared plates, splitting the bill',
      ko: '오토시, 앞접시, 계산',
    },
    cuts: [
      {
        jp: '何名様ですか？',
        s: 'Staff greeting a group at an izakaya entrance',
      },
      {
        jp: '3人です。',
        s: 'Student holding up three fingers',
      },
      {
        jp: 'とりあえず生で。',
        s: 'A friend ordering the moment they sit down',
      },
      {
        jp: 'これ、頼んでないけど……',
        s: 'Student staring at a small dish that arrived unordered',
      },
      {
        jp: 'お通しやで。席料みたいなもん。',
        s: 'Friend explaining across the table',
      },
      {
        jp: 'すみません、注文お願いします。',
        s: 'Student raising a hand toward the staff',
      },
      {
        jp: '取り皿、もらえますか？',
        s: 'Shared fried food in the middle of the table',
      },
      {
        jp: 'お会計、別々でお願いします。',
        s: 'At the register, three people with wallets out',
      },
    ],
    ex: [
      {
        jp: 'とりあえず生',
        rd: 'toriaezu nama',
        g: {
          ja: '「まずは生ビール」。飲まないなら「ウーロン茶で」',
          en: "'A draft beer to start.' If you don't drink, ウーロン茶で works the same way",
          ko: "'일단 생맥주'. 안 마시면 ウーロン茶で로 같은 자리를 채운다",
        },
      },
      {
        jp: 'お通し',
        rd: 'otoushi',
        g: {
          ja: '頼んでいないのに出る小皿。実質は席料で、断れない店が多い',
          en: 'The small dish you did not order. Effectively a cover charge, rarely refusable',
          ko: '주문 안 했는데 나오는 작은 접시. 사실상 자릿세라 거절이 어려운 집이 많다',
        },
      },
      {
        jp: '別々でお願いします',
        rd: 'betsubetsu de onegai shimasu',
        g: {
          ja: '割り勘。店によっては「まとめて」と言われることも',
          en: 'Splitting the bill. Some places will ask you to pay together instead',
          ko: "각자 계산. 가게에 따라 '한꺼번에'를 요구하기도 한다",
        },
      },
    ],
  },
  {
    id: 'l7',
    lv: 7,
    t: {
      ja: '電話で予約する',
      en: 'Booking by phone',
      ko: '전화로 예약하기',
    },
    d: {
      ja: '顔が見えない分、型どおりでいい',
      en: 'No face to read, so the set phrases carry you',
      ko: '얼굴이 안 보이니 정형구로 충분하다',
    },
    cuts: [
      {
        jp: 'お電話ありがとうございます、〇〇でございます。',
        s: 'Restaurant staff answering a phone behind a counter',
      },
      {
        jp: 'あの、予約をお願いしたいんですが。',
        s: 'Student sitting on a dorm bed, phone to ear, notes in hand',
      },
      {
        jp: '何日の何時でしょうか。',
        s: 'Staff reaching for a reservation book',
      },
      {
        jp: '土曜の7時、4名です。',
        s: 'Student reading from their own notes',
      },
      {
        jp: '申し訳ありません、7時は満席でして。',
        s: 'Staff scanning the page',
      },
      {
        jp: 'では、8時は空いていますか？',
        s: 'Student adjusting, pen in hand',
      },
      {
        jp: '8時でしたら。お名前をお願いします。',
        s: 'Staff writing it down',
      },
      {
        jp: 'パクと申します。よろしくお願いします。',
        s: 'Student hanging up, visibly relieved',
      },
    ],
    ex: [
      {
        jp: '〜をお願いしたいんですが',
        rd: '...o onegai shitain desu ga',
        g: {
          ja: '用件の切り出し。電話はこの一文で始まる',
          en: 'How you open. Nearly every phone call starts with this shape',
          ko: '용건을 꺼내는 형태. 전화는 이 한 문장으로 시작한다',
        },
      },
      {
        jp: '満席',
        rd: 'manseki',
        g: {
          ja: '席が埋まっている。「予約がいっぱい」の意味',
          en: "Fully booked. You will hear it before you hear 'no'",
          ko: "만석. '예약이 다 찼다'는 뜻",
        },
      },
      {
        jp: '〜と申します',
        rd: '...to moushimasu',
        g: {
          ja: '電話での名乗り。「〜です」より丁寧',
          en: 'Giving your name on the phone. A step above 〜です',
          ko: '전화에서 이름을 밝힐 때. 〜です보다 정중하다',
        },
      },
    ],
  },
  {
    id: 'l8',
    lv: 8,
    vn: true,
    t: {
      ja: '友だちと出かける',
      en: 'A day out with a friend',
      ko: '친구와 놀러가기',
    },
    d: {
      ja: '大阪か京都か。選んで進む会話',
      en: 'Osaka or Kyoto. A conversation you choose your way through',
      ko: '오사카냐 교토냐. 골라서 진행하는 회화',
    },
    cuts: [],
    ex: [],
  },
];
