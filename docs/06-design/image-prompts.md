# 그림 생성 프롬프트 (Gemini)

> **생성 문서 — 고치지 말 것.** 대본(`lessons.ts`·`vn.ts`·`endings.ts`)과 `scripts/gen-comic-scripts.mjs` 의 그림체·인물 설정에서 만든다. 대사나 장면 메모를 바꾸면 다시 생성한다.

## 순서

1. 기준 그림: 유우키·아야노와 그림체는 `docs/06-design/characters/` 의 책임자 그림이다. **제임스와 플레이어 시트 2장**만 먼저 만들어 같은 폴더에 `james-sheet`·`player-sheet` 로 저장한다(아래 "인물").
2. 그림마다 새 대화에서 프롬프트를 붙여 넣고, **첫 줄 `Attach:` 의 그림을 함께 첨부**한다.
3. 만화의 일본어 글자가 틀리면 같은 프롬프트 끝에 `Leave every speech balloon and caption box empty.` 를 붙여 다시 만들고, 글자는 편집기에서 넣는다(글자는 대본의 **말풍선**과 똑같이).
4. 저장: 만화 `src/art/lessons/<id>/p1`·`p2`(세로 2:3, 짧은 변 1000px 이상, 400KB 이하), 게임 `src/art/vn/<친구>/<nn>`(가로 4:3), 엔딩 `src/art/endings/<id>`(가로 3:2). `.webp`·`.png`·`.jpg`. 크기·이름은 맞추지 못해도 파일을 주면 맞춰 넣는다.

## 인물

### 제임스 (만화 레벨 1~7 의 학생) → `james-sheet`

```text
Attach: docs/06-design/characters/yuki-front.webp (for the style only).
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
Make a character reference sheet on a plain light-grey background: the same person front, three-quarter and back view, full body, plus three head shots (smiling, surprised, thinking). No text.
```

### 플레이어 (게임, 뒷모습만) → `player-sheet`

```text
Attach: docs/06-design/characters/yuki-front.webp (for the style only).
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
Make a character reference sheet on a plain light-grey background: the same person front, three-quarter and back view, full body, plus three head shots (smiling, surprised, thinking). No text.
```

## 만화 (레벨 1~7)

### 레벨 1 편의점과 슈퍼 — 1쪽 → `src/art/lessons/l1/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student walking into a Japanese konbini at night, bento in hand. Speech balloon from the person speaking, Japanese text exactly: 「いらっしゃいませ。」
Panel 2: Cashier holding the bento over the microwave. Speech balloon from the person speaking, Japanese text exactly: 「お弁当、温めますか？」
Panel 3: Student nodding. Speech balloon from the person speaking, Japanese text exactly: 「お願いします。」
Panel 4: Cashier holding up a plastic bag. Speech balloon from the person speaking, Japanese text exactly: 「袋は5円かかりますが、よろしいですか？」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 1 편의점과 슈퍼 — 2쪽 → `src/art/lessons/l1/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student pulling out an eco bag. Speech balloon from the person speaking, Japanese text exactly: 「あ、大丈夫です。持ってます。」
Panel 2: Cashier at the register screen. Speech balloon from the person speaking, Japanese text exactly: 「ポイントカードはお持ちですか？」
Panel 3: Student shaking their head slightly. Speech balloon from the person speaking, Japanese text exactly: 「持ってないです。」
Panel 4: Supermarket deli shelf in the evening, red half-price stickers on bento. Rectangular caption box, Japanese text exactly: スーパーは夜8時すぎると半額シールが貼られる
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 2 교토 가는 길 — 1쪽 → `src/art/lessons/l2/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student at the small ticket window of Gotenyama Station. Speech balloon from the person speaking, Japanese text exactly: 「すみません、京都に行きたいんですが。」
Panel 2: Station staff behind the window. Speech balloon from the person speaking, Japanese text exactly: 「ここは特急が止まらないんですよ。」
Panel 3: Student checking a route app on their phone. Speech balloon from the person speaking, Japanese text exactly: 「どこで乗り換えですか？」
Panel 4: Staff pointing at Kuzuha on a route map on the wall. Speech balloon from the person speaking, Japanese text exactly: 「樟葉で特急に乗り換えてください。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 2 교토 가는 길 — 2쪽 → `src/art/lessons/l2/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student on a busy platform concourse at Kuzuha. Rectangular caption box, Japanese text exactly: 樟葉駅 Speech balloon from the person speaking, Japanese text exactly: 「特急は何番ホームですか？」
Panel 2: Staff gesturing toward a staircase, departure board overhead. Speech balloon from the person speaking, Japanese text exactly: 「1番か2番、出町柳行きです。」
Panel 3: Staff adding a tip with a smile, finger on the route map. Speech balloon from the person speaking, Japanese text exactly: 「祇園四条で降りると便利ですよ。」
Panel 4: Student hurrying up the stairs as the train pulls in. Speech balloon from the person speaking, Japanese text exactly: 「ありがとうございます！」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 3 병원 가기 — 1쪽 → `src/art/lessons/l3/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student at a small clinic reception counter. Speech balloon from the person speaking, Japanese text exactly: 「初めてなんですが。」
Panel 2: Receptionist handing over a clipboard and form. Speech balloon from the person speaking, Japanese text exactly: 「保険証と、この問診票をお願いします。」
Panel 3: Student filling in the form in a waiting room chair, slightly stuck. Rectangular caption box, Japanese text exactly: 問診票に記入する Speech balloon from the person speaking, Japanese text exactly: 「いつから、どこが……」
Panel 4: In the consulting room, doctor listening. Speech balloon from the person speaking, Japanese text exactly: 「3日前から熱が下がらなくて。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 3 병원 가기 — 2쪽 → `src/art/lessons/l3/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Doctor with a tongue depressor. Speech balloon from the person speaking, Japanese text exactly: 「喉を見せてください。あーんして。」
Panel 2: Doctor typing at a terminal. Speech balloon from the person speaking, Japanese text exactly: 「風邪ですね。お薬を出しておきます。」
Panel 3: Receptionist pointing out of the window. Speech balloon from the person speaking, Japanese text exactly: 「処方箋は向かいの薬局で出してください。」
Panel 4: Student leaving with a prescription slip. Speech balloon from the person speaking, Japanese text exactly: 「お大事に。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 4 드럭스토어에서 찾기 — 1쪽 → `src/art/lessons/l4/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student lost between tall drugstore aisles. Speech balloon from the person speaking, Japanese text exactly: 「すみません、風邪薬はどこですか？」
Panel 2: Staff in a uniform turning to help. Speech balloon from the person speaking, Japanese text exactly: 「症状はどんな感じですか？」
Panel 3: Student touching their throat. Speech balloon from the person speaking, Japanese text exactly: 「喉の痛みと、鼻水です。」
Panel 4: Staff pulling a box off the shelf. Speech balloon from the person speaking, Japanese text exactly: 「それならこちらですね。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 4 드럭스토어에서 찾기 — 2쪽 → `src/art/lessons/l4/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student turning the box over, reading the back. Speech balloon from the person speaking, Japanese text exactly: 「1日何回飲みますか？」
Panel 2: Staff pointing at the label. Speech balloon from the person speaking, Japanese text exactly: 「食後に3回。眠くなる成分が入っています。」
Panel 3: Student comparing two boxes. Speech balloon from the person speaking, Japanese text exactly: 「もう少し安いのはありますか？」
Panel 4: Staff offering a cheaper box. Speech balloon from the person speaking, Japanese text exactly: 「でしたら、こちらのほうが。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 5 옷 사기 — 1쪽 → `src/art/lessons/l5/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Shop assistant approaching a browsing customer. Speech balloon from the person speaking, Japanese text exactly: 「何かお探しですか？」
Panel 2: Student describing what they want, hugging themselves as if cold. Speech balloon from the person speaking, Japanese text exactly: 「冬に着る暖かい服を見に来ました。」
Panel 3: Assistant holding up a thick winter coat. Speech balloon from the person speaking, Japanese text exactly: 「それでしたら、この服はどうですか？」
Panel 4: Student holding the coat on a hanger. Speech balloon from the person speaking, Japanese text exactly: 「試着してもいいですか？」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 5 옷 사기 — 2쪽 → `src/art/lessons/l5/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Assistant calling through the fitting-room curtain. Speech balloon from the person speaking, Japanese text exactly: 「サイズ、いかがですか？」
Panel 2: Student in the coat, sleeves too long. Speech balloon from the person speaking, Japanese text exactly: 「ちょっと大きいです。Mはありますか？」
Panel 3: Assistant checking a tablet, apologetic. Speech balloon from the person speaking, Japanese text exactly: 「申し訳ありません、Mは品切れで。」
Panel 4: Student handing the coat back, leaving. Speech balloon from the person speaking, Japanese text exactly: 「じゃあ、また来ます。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 6 이자카야 가기 — 1쪽 → `src/art/lessons/l6/p1`

```text
Attach: docs/06-design/characters/james-sheet, docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: oversized black hoodie, light-wash jeans, white sneakers.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: white blouse, soft grey cardigan, long camel skirt.
James is "the student" below. Yuki and Ayano are his friends, the rest of his party.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Staff greeting a group at an izakaya entrance. Speech balloon from the person speaking, Japanese text exactly: 「何名様ですか？」
Panel 2: Student holding up three fingers. Speech balloon from the person speaking, Japanese text exactly: 「3人です。」
Panel 3: A friend ordering the moment they sit down. Speech balloon from the person speaking, Japanese text exactly: 「とりあえず生でお願いします。」
Panel 4: Student asking the staff for water, three fingers up again. Speech balloon from the person speaking, Japanese text exactly: 「お冷、3つもらえますか？」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 6 이자카야 가기 — 2쪽 → `src/art/lessons/l6/p2`

```text
Attach: docs/06-design/characters/james-sheet, docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: oversized black hoodie, light-wash jeans, white sneakers.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: white blouse, soft grey cardigan, long camel skirt.
James is "the student" below. Yuki and Ayano are his friends, the rest of his party.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Student pointing at a small dish that arrived unordered, asking the staff. Speech balloon from the person speaking, Japanese text exactly: 「すみません、これ、頼んでないんですが……」
Panel 2: Staff smiling, gesturing at the small dish. Rectangular caption box, Japanese text exactly: お通しは席料のようなもの Speech balloon from the person speaking, Japanese text exactly: 「こちら、お通しです。」
Panel 3: Chopsticks on the floor, student raising a hand to the staff. Speech balloon from the person speaking, Japanese text exactly: 「お箸、替えてもらえますか？」
Panel 4: At the register, three people with wallets out. Speech balloon from the person speaking, Japanese text exactly: 「お会計、別々でお願いします。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 7 전화로 예약하기 — 1쪽 → `src/art/lessons/l7/p1`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Restaurant staff answering a phone behind a counter. Speech balloon from the person speaking, Japanese text exactly: 「お電話ありがとうございます、〇〇でございます。」
Panel 2: Student sitting on a dorm bed, phone to ear, notes in hand. Speech balloon from the person speaking, Japanese text exactly: 「あの、予約をお願いしたいんですが。」
Panel 3: Staff reaching for a reservation book. Speech balloon from the person speaking, Japanese text exactly: 「何日の何時でしょうか。」
Panel 4: Student reading from their own notes. Speech balloon from the person speaking, Japanese text exactly: 「土曜の7時、4名です。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

### 레벨 7 전화로 예약하기 — 2쪽 → `src/art/lessons/l7/p2`

```text
Attach: docs/06-design/characters/james-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
James: an American exchange student, about 20, short wavy light-brown hair, friendly open face. Wearing: navy hoodie over a white T-shirt, dark jeans, grey backpack.
James is "the student" below.
One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.
Panel 1: Staff scanning the page. Speech balloon from the person speaking, Japanese text exactly: 「申し訳ありません、7時は満席でして。」
Panel 2: Student adjusting, pen in hand. Speech balloon from the person speaking, Japanese text exactly: 「では、8時は空いていますか？」
Panel 3: Staff writing it down. Speech balloon from the person speaking, Japanese text exactly: 「8時でしたら。お名前をお願いします。」
Panel 4: Student hanging up, visibly relieved. Speech balloon from the person speaking, Japanese text exactly: 「ジェームズと申します。よろしくお願いします。」
Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.
```

## 게임 장면 (레벨 8)

### 유우키 (오사카) 장면 1 → `src/art/vn/osaka/01`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. Two friends meeting at a crowded Osaka Station concourse, one waving hard.
Mood of the moment (do not write it): he has just said 「おー、こっちこっち！めっちゃ待ったで〜」
No text, no speech balloons.
```

### 유우키 (오사카) 장면 2 → `src/art/vn/osaka/02`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. A takoyaki stall, steam rising, friend already eating.
Mood of the moment (do not write it): he has just said 「ここのたこ焼き、めっちゃうまいねん。」
No text, no speech balloons.
```

### 유우키 (오사카) 장면 3 → `src/art/vn/osaka/03`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. A covered shopping arcade, an older shopkeeper leaning out of her stall.
Mood of the moment (do not write it): he has just said 「お姉ちゃん、ええの入ってるで。」
No text, no speech balloons.
```

### 유우키 (오사카) 장면 4 → `src/art/vn/osaka/04`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. Both sitting on a river wall at Dotonbori, neon reflected in the water.
Mood of the moment (do not write it): he has just said 「俺な、昨日道で100万円拾ってん。」
No text, no speech balloons.
```

### 유우키 (오사카) 장면 5 → `src/art/vn/osaka/05`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. Yuki sliding open the door of a small okonomiyaki shop, grinning back over a shoulder.
Mood of the moment (do not write it): he has just said 「邪魔すんでー。」
No text, no speech balloons.
```

### 유우키 (오사카) 장면 6 → `src/art/vn/osaka/06`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Yuki faces the viewer; if the player appears, only from behind. Ticket gates at night, the friend already walking backwards, waving.
Mood of the moment (do not write it): he has just said 「ほな、またな！」
No text, no speech balloons.
```

### 아야노 (교토) 장면 1 → `src/art/vn/kyoto/01`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Ayano faces the viewer; if the player appears, only from behind. Kyoto Station's great staircase, one friend waiting with a small bow.
Mood of the moment (do not write it): she has just said 「わざわざ来てくれはって、おおきに。」
No text, no speech balloons.
```

### 아야노 (교토) 장면 2 → `src/art/vn/kyoto/02`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Ayano faces the viewer; if the player appears, only from behind. Nishiki Market, narrow and crowded, a skewer held out.
Mood of the moment (do not write it): she has just said 「これ、食べてみはる？」
No text, no speech balloons.
```

### 아야노 (교토) 장면 3 → `src/art/vn/kyoto/03`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Ayano faces the viewer; if the player appears, only from behind. A temple garden, gravel path, the friend speaking very quietly.
Mood of the moment (do not write it): she has just said 「ここ、静かにしといた方がええかもしれへんね。」
No text, no speech balloons.
```

### 아야노 (교토) 장면 4 → `src/art/vn/kyoto/04`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Ayano faces the viewer; if the player appears, only from behind. A traditional living room, late afternoon light, a teapot being lifted.
Mood of the moment (do not write it): she has just said 「そろそろ、お茶漬けでもどうどす？」
No text, no speech balloons.
```

### 아야노 (교토) 장면 5 → `src/art/vn/kyoto/05`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: Ayano faces the viewer; if the player appears, only from behind. A narrow lane at dusk, the friend standing in a doorway.
Mood of the moment (do not write it): she has just said 「また寄っとくれやす。」
No text, no speech balloons.
```

## 엔딩 카드

### 내일 또 보자 → `src/art/endings/e_osaka_best`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 3:2, a memorable closing shot: Dotonbori at night, two friends laughing on the river wall, neon reflections. The player only from behind or the side.
No text, no speech balloons.
```

### 그럼 다음에 → `src/art/endings/e_osaka_norm`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 3:2, a memorable closing shot: Station ticket gates at night, one friend waving from the far side. The player only from behind or the side.
No text, no speech balloons.
```

### 말하지 않은 것들 → `src/art/endings/e_kyoto_best`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 3:2, a memorable closing shot: A narrow Kyoto lane at dusk, two friends walking slowly, lanterns lit. The player only from behind or the side.
No text, no speech balloons.
```

### 오차즈케 이야기 → `src/art/endings/e_kyoto_norm`

```text
Attach: docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 3:2, a memorable closing shot: A traditional room, teapot on the table, afternoon light going amber. The player only from behind or the side.
No text, no speech balloons.
```

### 두 개의 간사이 → `src/art/endings/e_both`

```text
Attach: docs/06-design/characters/yuki-front.webp, docs/06-design/characters/yuki-back-laugh.webp, docs/06-design/characters/ayano-front.webp, docs/06-design/characters/ayano-pose.webp, docs/06-design/characters/player-sheet.
Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.
Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily. Wearing: olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference).
Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures. Wearing: everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers.
The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown. Wearing: beige coat, small cross-body bag.
One horizontal illustration, aspect ratio 3:2, a memorable closing shot: A split scene: Osaka neon on one side, a quiet Kyoto lane on the other, the same student in both. The player only from behind or the side.
No text, no speech balloons.
```

