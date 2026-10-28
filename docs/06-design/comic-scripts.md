# 만화 콘티 대본 (레벨 1~7)

> **생성 문서 — 고치지 말 것.** `src/content/lessons.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 lessons.ts 를 고치고 다시 생성한다.

## 파일 규칙 (Y-J3)

- 레벨마다 2쪽: `src/art/lessons/<레벨 id>/p1`, `p2` — `.webp`·`.png`·`.jpg` 중 하나(한 쪽에 파일 하나).
- **세로 2:3**(오차 1%), 짧은 변 **1000px 이상**, 한 장 **400KB 이하**(넘으면 webp 로). 맞지 않으면 단위 시험이 실패한다.
- 말풍선 글자 = 아래 표의 **말풍선**과 글자까지 같게. 네모 상자(내레이션) = **내레이션** — 괄호 없이.
- **읽기** = 앱이 그림 아래 대사에 다는 후리가나(한자 뒤 괄호). 그림에는 넣지 않아도 된다.
- 칸 나누기와 배치는 책임자의 콘티대로. 칸 번호는 읽는 순서(일본 만화식: 오른쪽→왼쪽, 위→아래)이고, 앱은 그림 아래에 그 순서로 대사와 번역을 보여 준다.
- 그림 생성기(Gemini 등)가 일본어 글자를 틀리게 그리면, 그림만 만들고 글자는 편집기에서 넣는 것을 권한다.
- 확인: 그림을 넣은 뒤 표의 **대조** 칸에 표시.

## 레벨 1 · コンビニのレジ / 편의점 계산대 (`l1`)

계산대에서 반드시 묻는 것

### 1쪽 — `src/art/lessons/l1/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student walking into a Japanese konbini at night, bento in hand | — | いらっしゃいませ。 | いらっしゃいませ。 | 어서 오세요. | [ ] |
| 2 | Cashier holding the bento over the microwave | — | お弁当、温めますか？ | お弁当(べんとう)、温(あたた)めますか？ | 도시락 데워 드릴까요? | [ ] |
| 3 | Student nodding | — | お願いします。 | お願(ねが)いします。 | 네, 부탁해요. | [ ] |
| 4 | Cashier holding up a plastic bag | — | 袋は5円かかりますが、よろしいですか？ | 袋(ふくろ)は5円(えん)かかりますが、よろしいですか？ | 봉투는 5엔인데 괜찮으세요? | [ ] |

### 2쪽 — `src/art/lessons/l1/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student pulling out an eco bag | — | あ、大丈夫です。持ってます。 | あ、大丈夫(だいじょうぶ)です。持(も)ってます。 | 아, 괜찮아요. 가지고 있어요. | [ ] |
| 2 | Cashier at the register screen | — | ポイントカードはお持ちですか？ | ポイントカードはお持(も)ちですか？ | 포인트 카드 있으세요? | [ ] |
| 3 | Student shaking their head slightly | — | 持ってないです。 | 持(も)ってないです。 | 없어요. | [ ] |
| 4 | Student holding out a card toward the payment terminal | — | カードでお願いします。 | カードでお願(ねが)いします。 | 카드로 할게요. | [ ] |

## 레벨 2 · 京都へ行く / 교토 가는 길 (`l2`)

역무원에게 묻기. 특급·급행·각역정차

### 1쪽 — `src/art/lessons/l2/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student at the small ticket window of Gotenyama Station | — | すみません、京都に行きたいんですが。 | すみません、京都(きょうと)に行(い)きたいんですが。 | 저기요, 교토에 가고 싶은데요. | [ ] |
| 2 | Station staff behind the window | — | ここは特急が止まらないんですよ。 | ここは特急(とっきゅう)が止(と)まらないんですよ。 | 여기는 특급이 안 서요. | [ ] |
| 3 | Student checking a route app on their phone | — | どこで乗り換えですか？ | どこで乗(の)り換(か)えですか？ | 어디서 갈아타요? | [ ] |
| 4 | Staff pointing at Kuzuha on a route map on the wall | — | 樟葉で特急に乗り換えてください。 | 樟葉(くずは)で特急(とっきゅう)に乗(の)り換(か)えてください。 | 구즈하에서 특급으로 갈아타세요. | [ ] |

### 2쪽 — `src/art/lessons/l2/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student on a busy platform concourse at Kuzuha | 樟葉駅 | 特急は何番ホームですか？ | 樟葉駅(くずはえき) / 特急(とっきゅう)は何番(なんばん)ホームですか？ | (구즈하역) 특급은 몇 번 승강장이에요? | [ ] |
| 2 | Staff gesturing toward a staircase, departure board overhead | — | 1番か2番、出町柳行きです。 | 1番(ばん)か2番(ばん)、出町柳(でまちやなぎ)行(ゆ)きです。 | 1번이나 2번, 데마치야나기행이에요. | [ ] |
| 3 | Staff adding a tip with a smile, finger on the route map | — | 祇園四条で降りると便利ですよ。 | 祇園四条(ぎおんしじょう)で降(お)りると便利(べんり)ですよ。 | 기온시조에서 내리면 편해요. | [ ] |
| 4 | Student hurrying up the stairs as the train pulls in | — | ありがとうございます！ | ありがとうございます！ | 감사합니다! | [ ] |

## 레벨 3 · 病院へ行く / 병원 가기 (`l3`)

접수부터 약국까지

### 1쪽 — `src/art/lessons/l3/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student at a small clinic reception counter | — | 初めてなんですが。 | 初(はじ)めてなんですが。 | 처음 왔는데요. | [ ] |
| 2 | Receptionist handing over a clipboard and form | — | 保険証と、この問診票をお願いします。 | 保険証(ほけんしょう)と、この問診票(もんしんひょう)をお願(ねが)いします。 | 보험증하고 이 문진표 부탁드려요. | [ ] |
| 3 | Student filling in the form in a waiting room chair, slightly stuck | 問診票に記入する | いつから、どこが…… | 問診票(もんしんひょう)に記入(きにゅう)する / いつから、どこが…… | (문진표를 쓴다) 언제부터, 어디가…… | [ ] |
| 4 | In the consulting room, doctor listening | — | 3日前から熱が下がらなくて。 | 3日前(みっかまえ)から熱(ねつ)が下(さ)がらなくて。 | 사흘 전부터 열이 안 내려가서요. | [ ] |

### 2쪽 — `src/art/lessons/l3/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Doctor with a tongue depressor | — | 喉を見せてください。あーんして。 | 喉(のど)を見(み)せてください。あーんして。 | 목 좀 볼게요. 아 해 보세요. | [ ] |
| 2 | Doctor typing at a terminal | — | 風邪ですね。お薬を出しておきます。 | 風邪(かぜ)ですね。お薬(くすり)を出(だ)しておきます。 | 감기네요. 약을 처방해 드릴게요. | [ ] |
| 3 | Receptionist pointing out of the window | — | 処方箋は向かいの薬局で出してください。 | 処方箋(しょほうせん)は向(む)かいの薬局(やっきょく)で出(だ)してください。 | 처방전은 맞은편 약국에 내 주세요. | [ ] |
| 4 | Student leaving with a prescription slip | — | お大事に。 | お大事(だいじ)に。 | 몸조리 잘하세요. | [ ] |

## 레벨 4 · ドラッグストアで探す / 드럭스토어에서 찾기 (`l4`)

증상만 말하면 점원이 골라준다

### 1쪽 — `src/art/lessons/l4/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student lost between tall drugstore aisles | — | すみません、風邪薬はどこですか？ | すみません、風邪薬(かぜぐすり)はどこですか？ | 저기요, 감기약은 어디 있어요? | [ ] |
| 2 | Staff in a uniform turning to help | — | 症状はどんな感じですか？ | 症状(しょうじょう)はどんな感(かん)じですか？ | 증상이 어떠세요? | [ ] |
| 3 | Student touching their throat | — | 喉の痛みと、鼻水です。 | 喉(のど)の痛(いた)みと、鼻水(はなみず)です。 | 목이 아프고 콧물이 나요. | [ ] |
| 4 | Staff pulling a box off the shelf | — | それならこちらですね。 | それならこちらですね。 | 그럼 이쪽이에요. | [ ] |

### 2쪽 — `src/art/lessons/l4/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student turning the box over, reading the back | — | 1日何回飲みますか？ | 1日(いちにち)何回(なんかい)飲(の)みますか？ | 하루에 몇 번 먹어요? | [ ] |
| 2 | Staff pointing at the label | — | 食後に3回。眠くなる成分が入っています。 | 食後(しょくご)に3回(かい)。眠(ねむ)くなる成分(せいぶん)が入(はい)っています。 | 식후에 세 번이요. 졸음이 오는 성분이 들어 있어요. | [ ] |
| 3 | Student comparing two boxes | — | もう少し安いのはありますか？ | もう少(すこ)し安(やす)いのはありますか？ | 조금 더 싼 건 있어요? | [ ] |
| 4 | Staff offering a cheaper box | — | でしたら、こちらのほうが。 | でしたら、こちらのほうが。 | 그러시면 이쪽이 더 싸요. | [ ] |

## 레벨 5 · 服を買う / 옷 사기 (`l5`)

겨울옷 찾기. 입어 보기와 품절

### 1쪽 — `src/art/lessons/l5/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Shop assistant approaching a browsing customer | — | 何かお探しですか？ | 何(なに)かお探(さが)しですか？ | 뭐 찾으시는 거 있으세요? | [ ] |
| 2 | Student describing what they want, hugging themselves as if cold | — | 冬に着る暖かい服を見に来ました。 | 冬(ふゆ)に着(き)る暖(あたた)かい服(ふく)を見(み)に来(き)ました。 | 겨울에 입을 따뜻한 옷을 보러 왔어요. | [ ] |
| 3 | Assistant holding up a thick winter coat | — | それでしたら、この服はどうですか？ | それでしたら、この服(ふく)はどうですか？ | 그러시면 이 옷은 어떠세요? | [ ] |
| 4 | Student holding the coat on a hanger | — | 試着してもいいですか？ | 試着(しちゃく)してもいいですか？ | 입어 봐도 돼요? | [ ] |

### 2쪽 — `src/art/lessons/l5/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Assistant calling through the fitting-room curtain | — | サイズ、いかがですか？ | サイズ、いかがですか？ | 사이즈 어떠세요? | [ ] |
| 2 | Student in the coat, sleeves too long | — | ちょっと大きいです。Mはありますか？ | ちょっと大(おお)きいです。Mはありますか？ | 좀 커요. M 있어요? | [ ] |
| 3 | Assistant checking a tablet, apologetic | — | 申し訳ありません、Mは品切れで。 | 申(もう)し訳(わけ)ありません、Mは品切(しなぎ)れで。 | 죄송합니다, M은 품절이라서요. | [ ] |
| 4 | Student handing the coat back, leaving | — | じゃあ、また来ます。 | じゃあ、また来(き)ます。 | 그럼 다음에 올게요. | [ ] |

## 레벨 6 · 居酒屋に行く / 이자카야 가기 (`l6`)

오토시, 찬물, 계산

### 1쪽 — `src/art/lessons/l6/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Staff greeting a group at an izakaya entrance | — | 何名様ですか？ | 何名様(なんめいさま)ですか？ | 몇 분이세요? | [ ] |
| 2 | Student holding up three fingers | — | 3人です。 | 3人(にん)です。 | 세 명이요. | [ ] |
| 3 | A friend ordering the moment they sit down | — | とりあえず生でお願いします。 | とりあえず生(なま)でお願(ねが)いします。 | 일단 생맥주로 부탁해요. | [ ] |
| 4 | Student asking the staff for water, three fingers up again | — | お冷、3つもらえますか？ | お冷(ひや)、3つもらえますか？ | 찬물 세 잔 주시겠어요? | [ ] |

### 2쪽 — `src/art/lessons/l6/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Student pointing at a small dish that arrived unordered, asking the staff | — | すみません、これ、頼んでないんですが…… | すみません、これ、頼(たの)んでないんですが…… | 저기요, 이거 안 시켰는데요…… | [ ] |
| 2 | Staff smiling, gesturing at the small dish | お通しは席料のようなもの | こちら、お通しです。 | お通(とお)しは席料(せきりょう)のようなもの / こちら、お通(とお)しです。 | 이건 오토시입니다. (오토시는 자릿세 같은 것) | [ ] |
| 3 | Chopsticks on the floor, student raising a hand to the staff | — | お箸、替えてもらえますか？ | お箸(はし)、替(か)えてもらえますか？ | 젓가락 바꿔 주시겠어요? | [ ] |
| 4 | At the register, three people with wallets out | — | お会計、別々でお願いします。 | お会計(かいけい)、別々(べつべつ)でお願(ねが)いします。 | 계산은 따로따로 해 주세요. | [ ] |

## 레벨 7 · 電話で予約する / 전화로 예약하기 (`l7`)

얼굴이 안 보이니 정형구로 충분하다

### 1쪽 — `src/art/lessons/l7/p1`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Restaurant staff answering a phone behind a counter | — | お電話ありがとうございます、〇〇でございます。 | お電話(でんわ)ありがとうございます、〇〇でございます。 | 전화 주셔서 감사합니다, 〇〇입니다. | [ ] |
| 2 | Student sitting on a dorm bed, phone to ear, notes in hand | — | あの、予約をお願いしたいんですが。 | あの、予約(よやく)をお願(ねが)いしたいんですが。 | 저, 예약을 하고 싶은데요. | [ ] |
| 3 | Staff reaching for a reservation book | — | 何日の何時でしょうか。 | 何日(なんにち)の何時(なんじ)でしょうか。 | 며칠 몇 시로 하시겠어요? | [ ] |
| 4 | Student reading from their own notes | — | 土曜の7時、4名です。 | 土曜(どよう)の7時(じ)、4名(めい)です。 | 토요일 7시, 4명이요. | [ ] |

### 2쪽 — `src/art/lessons/l7/p2`

| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | Staff scanning the page | — | 申し訳ありません、7時は満席でして。 | 申(もう)し訳(わけ)ありません、7時(じ)は満席(まんせき)でして。 | 죄송합니다, 7시는 만석이라서요. | [ ] |
| 2 | Student adjusting, pen in hand | — | では、8時は空いていますか？ | では、8時(じ)は空(あ)いていますか？ | 그럼 8시는 비어 있나요? | [ ] |
| 3 | Staff writing it down | — | 8時でしたら。お名前をお願いします。 | 8時(じ)でしたら。お名前(なまえ)をお願(ねが)いします。 | 8시라면 괜찮습니다. 성함 부탁드립니다. | [ ] |
| 4 | Student hanging up, visibly relieved | — | ジェームズと申します。よろしくお願いします。 | ジェームズと申(もう)します。よろしくお願(ねが)いします。 | 제임스라고 합니다. 잘 부탁드립니다. | [ ] |

