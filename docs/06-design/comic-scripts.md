# 만화 콘티 대본 (레벨 1~7)

> **생성 문서 — 고치지 말 것.** `src/content/lessons.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 lessons.ts 를 고치고 다시 생성한다.

## 파일 규칙 (Y-J3)

- 레벨마다 2쪽: `src/art/lessons/<레벨 id>/p1`, `p2` — `.webp`·`.png`·`.jpg` 중 하나(한 쪽에 파일 하나).
- **세로 2:3**(오차 1%), 짧은 변 **1000px 이상**, 한 장 **400KB 이하**(넘으면 webp 로). 맞지 않으면 단위 시험이 실패한다.
- 말풍선 글자 = 아래 표의 **말풍선**과 글자까지 같게. 네모 상자(내레이션) = **내레이션** — 괄호 없이.
- 칸 순서는 일본 만화식(오른쪽→왼쪽, 위→아래). 앱은 그림 아래에 칸 번호 순서로 대사와 번역을 보여 준다.
- 권장 배치: 한 쪽에 칸 4개를 세로로(맨 위 → 맨 아래). 다른 배치를 쓰면 번호 순서만 지킨다.
- 그림 생성기(Gemini 등)가 일본어 글자를 틀리게 그리면, 그림만 만들고 글자는 편집기에서 넣는 것을 권한다.
- 확인: 그림을 넣은 뒤 표의 **대조** 칸에 표시.

## 레벨 1 · コンビニとスーパー / 편의점과 슈퍼 (`l1`)

계산대에서 반드시 묻는 것

### 1쪽 — `src/art/lessons/l1/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student walking into a Japanese konbini at night, bento in hand | — | いらっしゃいませ。 | 어서 오세요. | [ ] |
| 2 | 둘째 | Cashier holding the bento over the microwave | — | お弁当、温めますか？ | 도시락 데워 드릴까요? | [ ] |
| 3 | 셋째 | Student nodding | — | お願いします。 | 네, 부탁해요. | [ ] |
| 4 | 맨 아래 | Cashier holding up a plastic bag | — | 袋は5円かかりますが、よろしいですか？ | 봉투는 5엔인데 괜찮으세요? | [ ] |

### 2쪽 — `src/art/lessons/l1/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student pulling out an eco bag | — | あ、大丈夫です。持ってます。 | 아, 괜찮아요. 가지고 있어요. | [ ] |
| 2 | 둘째 | Cashier at the register screen | — | ポイントカードはお持ちですか？ | 포인트 카드 있으세요? | [ ] |
| 3 | 셋째 | Student shaking their head slightly | — | 持ってないです。 | 없어요. | [ ] |
| 4 | 맨 아래 | Supermarket deli shelf in the evening, red half-price stickers on bento | スーパーは夜8時すぎると半額シールが貼られる | — | 슈퍼는 밤 8시가 지나면 반값 스티커가 붙는다. | [ ] |

## 레벨 2 · 京都へ行く / 교토 가는 길 (`l2`)

역무원에게 묻기. 특급·급행·각역정차

### 1쪽 — `src/art/lessons/l2/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student at the small ticket window of Gotenyama Station | — | すみません、京都に行きたいんですが。 | 저기요, 교토에 가고 싶은데요. | [ ] |
| 2 | 둘째 | Station staff behind the window | — | ここは各駅停車だけなんですよ。 | 여기는 각역 정차만 서요. | [ ] |
| 3 | 셋째 | Student checking a route app on their phone | — | 枚方市で乗り換えですか？ | 히라카타시에서 갈아타나요? | [ ] |
| 4 | 맨 아래 | Staff pointing at a route map on the wall | — | はい。枚方市から特急が出ています。 | 네. 히라카타시에서 특급이 출발해요. | [ ] |

### 2쪽 — `src/art/lessons/l2/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student on a busy platform concourse at Hirakatashi | 枚方市駅 | 特急は何番ホームですか？ | (히라카타시역) 특급은 몇 번 승강장이에요? | [ ] |
| 2 | 둘째 | Staff gesturing toward a staircase, departure board overhead | — | 3番ホーム、出町柳行きです。 | 3번 승강장, 데마치야나기행이에요. | [ ] |
| 3 | 셋째 | Staff adding a warning, finger raised | — | この電車、樟葉には止まりませんからね。 | 이 전철은 구즈하에는 안 서니까요. | [ ] |
| 4 | 맨 아래 | Student hurrying up the stairs as the train pulls in | — | ありがとうございます！ | 감사합니다! | [ ] |

## 레벨 3 · 病院へ行く / 병원 가기 (`l3`)

접수부터 약국까지

### 1쪽 — `src/art/lessons/l3/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student at a small clinic reception counter | — | 初めてなんですが。 | 처음 왔는데요. | [ ] |
| 2 | 둘째 | Receptionist handing over a clipboard and form | — | 保険証と、この問診票をお願いします。 | 보험증하고 이 문진표 부탁드려요. | [ ] |
| 3 | 셋째 | Student filling in the form in a waiting room chair, slightly stuck | 問診票に記入する | いつから、どこが…… | (문진표를 쓴다) 언제부터, 어디가…… | [ ] |
| 4 | 맨 아래 | In the consulting room, doctor listening | — | 3日前から熱が下がらなくて。 | 사흘 전부터 열이 안 내려가서요. | [ ] |

### 2쪽 — `src/art/lessons/l3/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Doctor with a tongue depressor | — | 喉を見せてください。あーんして。 | 목 좀 볼게요. 아 해 보세요. | [ ] |
| 2 | 둘째 | Doctor typing at a terminal | — | 風邪ですね。お薬を出しておきます。 | 감기네요. 약을 처방해 드릴게요. | [ ] |
| 3 | 셋째 | Receptionist pointing out of the window | — | 処方箋は向かいの薬局で出してください。 | 처방전은 맞은편 약국에 내 주세요. | [ ] |
| 4 | 맨 아래 | Student leaving with a prescription slip | — | お大事に。 | 몸조리 잘하세요. | [ ] |

## 레벨 4 · ドラッグストアで探す / 드럭스토어에서 찾기 (`l4`)

증상만 말하면 점원이 골라준다

### 1쪽 — `src/art/lessons/l4/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student lost between tall drugstore aisles | — | すみません、風邪薬はどこですか？ | 저기요, 감기약은 어디 있어요? | [ ] |
| 2 | 둘째 | Staff in a uniform turning to help | — | 症状はどんな感じですか？ | 증상이 어떠세요? | [ ] |
| 3 | 셋째 | Student touching their throat | — | 喉の痛みと、鼻水です。 | 목이 아프고 콧물이 나요. | [ ] |
| 4 | 맨 아래 | Staff pulling a box off the shelf | — | それならこちらですね。 | 그럼 이쪽이에요. | [ ] |

### 2쪽 — `src/art/lessons/l4/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Student turning the box over, reading the back | — | 1日何回飲みますか？ | 하루에 몇 번 먹어요? | [ ] |
| 2 | 둘째 | Staff pointing at the label | — | 食後に3回。眠くなる成分が入っています。 | 식후에 세 번이요. 졸음이 오는 성분이 들어 있어요. | [ ] |
| 3 | 셋째 | Student comparing two boxes | — | もう少し安いのはありますか？ | 조금 더 싼 건 있어요? | [ ] |
| 4 | 맨 아래 | Staff offering a cheaper box | — | でしたら、こちらのほうが。 | 그러시면 이쪽이 더 싸요. | [ ] |

## 레벨 5 · 服を買う / 옷 사기 (`l5`)

점원이 말 걸 때 빠져나가는 법도

### 1쪽 — `src/art/lessons/l5/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Shop assistant approaching a browsing customer | — | 何かお探しですか？ | 뭐 찾으시는 거 있으세요? | [ ] |
| 2 | 둘째 | Student holding up a hand, smiling politely | — | 見てるだけです。 | 그냥 보는 거예요. | [ ] |
| 3 | 셋째 | Student holding a coat on a hanger | — | 試着してもいいですか？ | 입어 봐도 돼요? | [ ] |
| 4 | 맨 아래 | Assistant pulling back a fitting-room curtain | — | どうぞ。試着室はこちらです。 | 네. 피팅룸은 이쪽이에요. | [ ] |

### 2쪽 — `src/art/lessons/l5/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Assistant calling through the curtain | — | サイズ、いかがですか？ | 사이즈 어떠세요? | [ ] |
| 2 | 둘째 | Student in the coat, sleeves too long | — | ちょっと大きいです。Mはありますか？ | 좀 커요. M 있어요? | [ ] |
| 3 | 셋째 | Assistant checking a tablet, apologetic | — | 申し訳ありません、Mは品切れで。 | 죄송합니다, M은 품절이라서요. | [ ] |
| 4 | 맨 아래 | Student handing the coat back, leaving | — | じゃあ、また来ます。 | 그럼 다음에 올게요. | [ ] |

## 레벨 6 · 居酒屋に行く / 이자카야 가기 (`l6`)

오토시, 앞접시, 계산

### 1쪽 — `src/art/lessons/l6/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Staff greeting a group at an izakaya entrance | — | 何名様ですか？ | 몇 분이세요? | [ ] |
| 2 | 둘째 | Student holding up three fingers | — | 3人です。 | 세 명이요. | [ ] |
| 3 | 셋째 | A friend ordering the moment they sit down | — | とりあえず生で。 | 일단 생맥주요. | [ ] |
| 4 | 맨 아래 | Student staring at a small dish that arrived unordered | — | これ、頼んでないけど…… | 이거 안 시켰는데…… | [ ] |

### 2쪽 — `src/art/lessons/l6/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Friend explaining across the table | — | お通しやで。席料みたいなもん。 | 오토시야. 자릿세 같은 거. | [ ] |
| 2 | 둘째 | Student raising a hand toward the staff | — | すみません、注文お願いします。 | 저기요, 주문할게요. | [ ] |
| 3 | 셋째 | Shared fried food in the middle of the table | — | 取り皿、もらえますか？ | 앞접시 좀 주시겠어요? | [ ] |
| 4 | 맨 아래 | At the register, three people with wallets out | — | お会計、別々でお願いします。 | 계산은 따로따로 해 주세요. | [ ] |

## 레벨 7 · 電話で予約する / 전화로 예약하기 (`l7`)

얼굴이 안 보이니 정형구로 충분하다

### 1쪽 — `src/art/lessons/l7/p1`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Restaurant staff answering a phone behind a counter | — | お電話ありがとうございます、〇〇でございます。 | 전화 주셔서 감사합니다, 〇〇입니다. | [ ] |
| 2 | 둘째 | Student sitting on a dorm bed, phone to ear, notes in hand | — | あの、予約をお願いしたいんですが。 | 저, 예약을 하고 싶은데요. | [ ] |
| 3 | 셋째 | Staff reaching for a reservation book | — | 何日の何時でしょうか。 | 며칠 몇 시로 하시겠어요? | [ ] |
| 4 | 맨 아래 | Student reading from their own notes | — | 土曜の7時、4名です。 | 토요일 7시, 4명이요. | [ ] |

### 2쪽 — `src/art/lessons/l7/p2`

| 칸 | 위치 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |
|---|---|---|---|---|---|---|
| 1 | 맨 위 | Staff scanning the page | — | 申し訳ありません、7時は満席でして。 | 죄송합니다, 7시는 만석이라서요. | [ ] |
| 2 | 둘째 | Student adjusting, pen in hand | — | では、8時は空いていますか？ | 그럼 8시는 비어 있나요? | [ ] |
| 3 | 셋째 | Staff writing it down | — | 8時でしたら。お名前をお願いします。 | 8시라면 괜찮습니다. 성함 부탁드립니다. | [ ] |
| 4 | 맨 아래 | Student hanging up, visibly relieved | — | パクと申します。よろしくお願いします。 | 박이라고 합니다. 잘 부탁드립니다. | [ ] |

