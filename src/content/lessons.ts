import type { Lesson } from './types';

/* Ported from v1.3, laid out as two pages of four panels (owner, 2026-10-25).
   `s` is the scene note the artwork is drawn from; it is kept for the artist
   and not rendered (Y-J2). `tr` are drafts awaiting the owner's review. */
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
    pages: [
      {
        panels: [
          {
            jp: 'いらっしゃいませ。',
            tr: { en: 'Welcome!', ko: '어서 오세요.' },
            s: 'Student walking into a Japanese konbini at night, bento in hand',
          },
          {
            jp: 'お弁当、温めますか？',
            tr: { en: 'Shall I heat up your bento?', ko: '도시락 데워 드릴까요?' },
            s: 'Cashier holding the bento over the microwave',
          },
          {
            jp: 'お願いします。',
            tr: { en: 'Yes, please.', ko: '네, 부탁해요.' },
            s: 'Student nodding',
          },
          {
            jp: '袋は5円かかりますが、よろしいですか？',
            tr: { en: 'A bag is 5 yen. Is that all right?', ko: '봉투는 5엔인데 괜찮으세요?' },
            s: 'Cashier holding up a plastic bag',
          },
        ],
      },
      {
        panels: [
          {
            jp: 'あ、大丈夫です。持ってます。',
            tr: { en: 'Oh, no thanks. I have one.', ko: '아, 괜찮아요. 가지고 있어요.' },
            s: 'Student pulling out an eco bag',
          },
          {
            jp: 'ポイントカードはお持ちですか？',
            tr: { en: 'Do you have a point card?', ko: '포인트 카드 있으세요?' },
            s: 'Cashier at the register screen',
          },
          {
            jp: '持ってないです。',
            tr: { en: "No, I don't.", ko: '없어요.' },
            s: 'Student shaking their head slightly',
          },
          {
            cap: 'スーパーは夜8時すぎると半額シールが貼られる',
            tr: {
              en: 'After 8 p.m., supermarkets put half-price stickers on.',
              ko: '슈퍼는 밤 8시가 지나면 반값 스티커가 붙는다.',
            },
            s: 'Supermarket deli shelf in the evening, red half-price stickers on bento',
          },
        ],
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
    pages: [
      {
        panels: [
          {
            jp: 'すみません、京都に行きたいんですが。',
            tr: { en: "Excuse me, I'd like to go to Kyoto.", ko: '저기요, 교토에 가고 싶은데요.' },
            s: 'Student at the small ticket window of Gotenyama Station',
          },
          {
            jp: 'ここは特急が止まらないんですよ。',
            tr: { en: "Limited expresses don't stop here.", ko: '여기는 특급이 안 서요.' },
            s: 'Station staff behind the window',
          },
          {
            jp: 'どこで乗り換えですか？',
            tr: { en: 'Where do I change?', ko: '어디서 갈아타요?' },
            s: 'Student checking a route app on their phone',
          },
          {
            jp: '樟葉で特急に乗り換えてください。',
            tr: {
              en: 'Change to a limited express at Kuzuha.',
              ko: '구즈하에서 특급으로 갈아타세요.',
            },
            s: 'Staff pointing at Kuzuha on a route map on the wall',
          },
        ],
      },
      {
        panels: [
          {
            cap: '樟葉駅',
            jp: '特急は何番ホームですか？',
            tr: {
              en: '(Kuzuha Station) Which platform is the limited express?',
              ko: '(구즈하역) 특급은 몇 번 승강장이에요?',
            },
            s: 'Student on a busy platform concourse at Kuzuha',
          },
          {
            jp: '1番か2番、出町柳行きです。',
            tr: {
              en: 'Platform 1 or 2, bound for Demachiyanagi.',
              ko: '1번이나 2번, 데마치야나기행이에요.',
            },
            s: 'Staff gesturing toward a staircase, departure board overhead',
          },
          {
            jp: '祇園四条で降りると便利ですよ。',
            tr: {
              en: "Get off at Gion-Shijo, it's handy.",
              ko: '기온시조에서 내리면 편해요.',
            },
            s: 'Staff adding a tip with a smile, finger on the route map',
          },
          {
            jp: 'ありがとうございます！',
            tr: { en: 'Thank you!', ko: '감사합니다!' },
            s: 'Student hurrying up the stairs as the train pulls in',
          },
        ],
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
      ja: '受付から薬局まで',
      en: 'From the reception desk to the pharmacy',
      ko: '접수부터 약국까지',
    },
    pages: [
      {
        panels: [
          {
            jp: '初めてなんですが。',
            tr: { en: "It's my first time here.", ko: '처음 왔는데요.' },
            s: 'Student at a small clinic reception counter',
          },
          {
            jp: '保険証と、この問診票をお願いします。',
            tr: {
              en: 'Your insurance card and this questionnaire, please.',
              ko: '보험증하고 이 문진표 부탁드려요.',
            },
            s: 'Receptionist handing over a clipboard and form',
          },
          {
            cap: '問診票に記入する',
            jp: 'いつから、どこが……',
            tr: {
              en: '(Filling in the questionnaire) Since when, and where…',
              ko: '(문진표를 쓴다) 언제부터, 어디가……',
            },
            s: 'Student filling in the form in a waiting room chair, slightly stuck',
          },
          {
            jp: '3日前から熱が下がらなくて。',
            tr: {
              en: "My fever hasn't gone down for three days.",
              ko: '사흘 전부터 열이 안 내려가서요.',
            },
            s: 'In the consulting room, doctor listening',
          },
        ],
      },
      {
        panels: [
          {
            jp: '喉を見せてください。あーんして。',
            tr: { en: 'Let me see your throat. Say "ah."', ko: '목 좀 볼게요. 아 해 보세요.' },
            s: 'Doctor with a tongue depressor',
          },
          {
            jp: '風邪ですね。お薬を出しておきます。',
            tr: {
              en: "It's a cold. I'll prescribe some medicine.",
              ko: '감기네요. 약을 처방해 드릴게요.',
            },
            s: 'Doctor typing at a terminal',
          },
          {
            jp: '処方箋は向かいの薬局で出してください。',
            tr: {
              en: 'Please take the prescription to the pharmacy across the street.',
              ko: '처방전은 맞은편 약국에 내 주세요.',
            },
            s: 'Receptionist pointing out of the window',
          },
          {
            jp: 'お大事に。',
            tr: { en: 'Take care of yourself.', ko: '몸조리 잘하세요.' },
            s: 'Student leaving with a prescription slip',
          },
        ],
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
    pages: [
      {
        panels: [
          {
            jp: 'すみません、風邪薬はどこですか？',
            tr: {
              en: "Excuse me, where's the cold medicine?",
              ko: '저기요, 감기약은 어디 있어요?',
            },
            s: 'Student lost between tall drugstore aisles',
          },
          {
            jp: '症状はどんな感じですか？',
            tr: { en: 'What are your symptoms like?', ko: '증상이 어떠세요?' },
            s: 'Staff in a uniform turning to help',
          },
          {
            jp: '喉の痛みと、鼻水です。',
            tr: { en: 'A sore throat and a runny nose.', ko: '목이 아프고 콧물이 나요.' },
            s: 'Student touching their throat',
          },
          {
            jp: 'それならこちらですね。',
            tr: { en: 'Then this one.', ko: '그럼 이쪽이에요.' },
            s: 'Staff pulling a box off the shelf',
          },
        ],
      },
      {
        panels: [
          {
            jp: '1日何回飲みますか？',
            tr: { en: 'How many times a day do I take it?', ko: '하루에 몇 번 먹어요?' },
            s: 'Student turning the box over, reading the back',
          },
          {
            jp: '食後に3回。眠くなる成分が入っています。',
            tr: {
              en: 'Three times, after meals. It has an ingredient that makes you drowsy.',
              ko: '식후에 세 번이요. 졸음이 오는 성분이 들어 있어요.',
            },
            s: 'Staff pointing at the label',
          },
          {
            jp: 'もう少し安いのはありますか？',
            tr: { en: 'Do you have anything a bit cheaper?', ko: '조금 더 싼 건 있어요?' },
            s: 'Student comparing two boxes',
          },
          {
            jp: 'でしたら、こちらのほうが。',
            tr: { en: "In that case, this one's cheaper.", ko: '그러시면 이쪽이 더 싸요.' },
            s: 'Staff offering a cheaper box',
          },
        ],
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
      ja: '冬服を探す。試着と品切れ',
      en: 'Looking for winter clothes, trying on, sold out',
      ko: '겨울옷 찾기. 입어 보기와 품절',
    },
    pages: [
      {
        panels: [
          {
            jp: '何かお探しですか？',
            tr: { en: 'Can I help you find anything?', ko: '뭐 찾으시는 거 있으세요?' },
            s: 'Shop assistant approaching a browsing customer',
          },
          {
            jp: '冬に着る暖かい服を見に来ました。',
            tr: {
              en: "I'm looking for something warm to wear this winter.",
              ko: '겨울에 입을 따뜻한 옷을 보러 왔어요.',
            },
            s: 'Student describing what they want, hugging themselves as if cold',
          },
          {
            jp: 'それでしたら、この服はどうですか？',
            tr: { en: 'In that case, how about this one?', ko: '그러시면 이 옷은 어떠세요?' },
            s: 'Assistant holding up a thick winter coat',
          },
          {
            jp: '試着してもいいですか？',
            tr: { en: 'May I try this on?', ko: '입어 봐도 돼요?' },
            s: 'Student holding the coat on a hanger',
          },
        ],
      },
      {
        panels: [
          {
            jp: 'サイズ、いかがですか？',
            tr: { en: "How's the size?", ko: '사이즈 어떠세요?' },
            s: 'Assistant calling through the fitting-room curtain',
          },
          {
            jp: 'ちょっと大きいです。Mはありますか？',
            tr: { en: "It's a little big. Do you have a medium?", ko: '좀 커요. M 있어요?' },
            s: 'Student in the coat, sleeves too long',
          },
          {
            jp: '申し訳ありません、Mは品切れで。',
            tr: { en: "I'm sorry, the medium is sold out.", ko: '죄송합니다, M은 품절이라서요.' },
            s: 'Assistant checking a tablet, apologetic',
          },
          {
            jp: 'じゃあ、また来ます。',
            tr: { en: "Then I'll come back another time.", ko: '그럼 다음에 올게요.' },
            s: 'Student handing the coat back, leaving',
          },
        ],
      },
    ],
    ex: [
      {
        jp: '〜を見に来ました',
        rd: '...o mi ni kimashita',
        g: {
          ja: '来た目的を一言で。店員が合うものを探してくれる',
          en: 'Say what you came for in one line, and the staff will find something that fits',
          ko: '온 목적을 한마디로. 점원이 맞는 걸 찾아 준다',
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
      ja: 'お通し、お冷、お会計',
      en: 'The cover charge, water, splitting the bill',
      ko: '오토시, 찬물, 계산',
    },
    pages: [
      {
        panels: [
          {
            jp: '何名様ですか？',
            tr: { en: 'How many in your party?', ko: '몇 분이세요?' },
            s: 'Staff greeting a group at an izakaya entrance',
          },
          {
            jp: '3人です。',
            tr: { en: 'Three.', ko: '세 명이요.' },
            s: 'Student holding up three fingers',
          },
          {
            jp: 'とりあえず生でお願いします。',
            tr: { en: 'A draft beer to start, please.', ko: '일단 생맥주로 부탁해요.' },
            s: 'A friend ordering the moment they sit down',
          },
          {
            jp: 'お冷、3つもらえますか？',
            tr: { en: 'Could we get three glasses of water?', ko: '찬물 세 잔 주시겠어요?' },
            s: 'Student asking the staff for water, three fingers up again',
          },
        ],
      },
      {
        panels: [
          {
            jp: 'すみません、これ、頼んでないんですが……',
            tr: { en: "Excuse me, we didn't order this…", ko: '저기요, 이거 안 시켰는데요……' },
            s: 'Student pointing at a small dish that arrived unordered, asking the staff',
          },
          {
            cap: 'お通しは席料のようなもの',
            jp: 'こちら、お通しです。',
            tr: {
              en: 'This is your otoushi. (Otoushi works like a cover charge.)',
              ko: '이건 오토시입니다. (오토시는 자릿세 같은 것)',
            },
            s: 'Staff smiling, gesturing at the small dish',
          },
          {
            jp: 'お箸、替えてもらえますか？',
            tr: { en: 'Could I get a new pair of chopsticks?', ko: '젓가락 바꿔 주시겠어요?' },
            s: 'Chopsticks on the floor, student raising a hand to the staff',
          },
          {
            jp: 'お会計、別々でお願いします。',
            tr: { en: 'Separate checks, please.', ko: '계산은 따로따로 해 주세요.' },
            s: 'At the register, three people with wallets out',
          },
        ],
      },
    ],
    ex: [
      {
        jp: 'とりあえず生でお願いします',
        rd: 'toriaezu nama de onegai shimasu',
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
    pages: [
      {
        panels: [
          {
            jp: 'お電話ありがとうございます、〇〇でございます。',
            tr: {
              en: 'Thank you for calling, this is 〇〇.',
              ko: '전화 주셔서 감사합니다, 〇〇입니다.',
            },
            s: 'Restaurant staff answering a phone behind a counter',
          },
          {
            jp: 'あの、予約をお願いしたいんですが。',
            tr: { en: "Um, I'd like to make a reservation.", ko: '저, 예약을 하고 싶은데요.' },
            s: 'Student sitting on a dorm bed, phone to ear, notes in hand',
          },
          {
            jp: '何日の何時でしょうか。',
            tr: { en: 'For what day and time?', ko: '며칠 몇 시로 하시겠어요?' },
            s: 'Staff reaching for a reservation book',
          },
          {
            jp: '土曜の7時、4名です。',
            tr: { en: 'Saturday at seven, for four.', ko: '토요일 7시, 4명이요.' },
            s: 'Student reading from their own notes',
          },
        ],
      },
      {
        panels: [
          {
            jp: '申し訳ありません、7時は満席でして。',
            tr: {
              en: "I'm very sorry, we're fully booked at seven.",
              ko: '죄송합니다, 7시는 만석이라서요.',
            },
            s: 'Staff scanning the page',
          },
          {
            jp: 'では、8時は空いていますか？',
            tr: { en: "Then is eight o'clock available?", ko: '그럼 8시는 비어 있나요?' },
            s: 'Student adjusting, pen in hand',
          },
          {
            jp: '8時でしたら。お名前をお願いします。',
            tr: {
              en: "Eight o'clock is fine. May I have your name?",
              ko: '8시라면 괜찮습니다. 성함 부탁드립니다.',
            },
            s: 'Staff writing it down',
          },
          {
            jp: 'ジェームズと申します。よろしくお願いします。',
            tr: {
              en: 'My name is James. Thank you very much.',
              ko: '제임스라고 합니다. 잘 부탁드립니다.',
            },
            s: 'Student hanging up, visibly relieved',
          },
        ],
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
    ex: [],
  },
];
