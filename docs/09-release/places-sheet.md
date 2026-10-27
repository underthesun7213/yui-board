# 장소 데이터 양식

첫 데이터(책임자·RA 가 직접 등록, PRD Q-Y1)를 미리 준비하는 양식이다. 칸은 장소 등록 폼과 같고, 규칙은 서버가 검사하는 것과 같다(`src/domain/validation.ts`, `app.create_place`). 여기를 지키면 등록할 때 거절되지 않는다.

- 파일: [`places-sheet.csv`](places-sheet.csv) — 엑셀이나 Google 스프레드시트에서 연다(UTF-8). 후보 55곳(#19)의 이름·분류를 미리 채워 두었다.
- 한 줄이 장소 하나. 등록하지 않을 줄은 지운다.

## 칸

| 칸 | 필수 | 규칙 | 예 |
|---|---|---|---|
| `region` | — | 정리용(Hirakata, Osaka, Kyoto, Nara). 등록하지 않는다. 도도부현은 좌표로 정해진다 | `Hirakata` |
| `name` | ✔ | **영어**, 1~60자, 로마자(A–Z, a–z) 1글자 이상(D31). 고유명사는 소리대로, 일반명사는 뜻대로. 현장에서 일본어가 필요하면 괄호로 붙인다. 이름은 번역되지 않는다 | `Mandai Hirakata`, `Hirakata City Hall (枚方市役所)` |
| `category` | ✔ | 아래 7개 중 하나(영어 키) | `daily` |
| `description` | — | 0~500자, ja·en·ko 아무 언어. 줄바꿈 가능. 화면 언어로 자동 번역된다(D32, 번역을 켠 뒤) | `가장 가깝고 싼 슈퍼. 밤 11시까지.` |
| `lang` | ✔ | `description` 을 쓴 언어: `ja`, `en`, `ko`. 설명이 없으면 아무거나 | `ko` |
| `gmaps_url` | — | 그 장소의 Google 지도 링크. `https://www.google.com/maps/…`, `https://www.google.co.jp/maps/…`, `https://maps.app.goo.gl/…`(공유 링크)만. `goo.gl/maps/…` 는 받지 않는다 | `https://maps.app.goo.gl/AbC123` |
| `lat`, `lng` | ✔ | 핀 위치(소수, 일본 안). Google 지도에서 그 자리를 **오른쪽 클릭 → 맨 위 숫자**를 누르면 `34.82, 135.65` 가 복사된다 | `34.8293`, `135.6541` |
| `ja_ref` | — | 일본어 이름(현장 확인용). 등록하지 않는다 | `万代 枚方店` |
| `check` | — | ✔ = v1.3 때 확인한 곳, ? = 이름·위치를 꼭 확인. 등록하지 않는다 | |
| `why` | — | 후보에 넣은 이유(한국어 메모). 설명 초안으로 써도 된다. 등록하지 않는다 | |

**분류 키**

| 키 | 화면 (ko / en) |
|---|---|
| `transit` | 교통 / Getting around |
| `daily` | 생활 / Daily |
| `food` | 먹을 곳 / Food |
| `study` | 공부 / Study |
| `admin` | 행정 / Paperwork |
| `health` | 의료 / Health |
| `sights` | 관광 / Sights |

## 쓰지 않는 것

- 전화번호·영업시간·가격 같은 **바뀌는 정보**는 설명에 꼭 필요할 때만, "확인 날짜"와 함께 쓴다.
- Google 지도의 설명·사진·리뷰를 옮겨 적지 않는다(이용약관). 이름·위치는 현장과 공식 사이트로 확인한다.
- 사람 이름, 개인 연락처, 개인 SNS 는 쓰지 않는다.

## 등록

- 하루 한도는 계정당 장소 15건(D30). 55곳이면 4일, 또는 공지 전에만 한도를 잠시 올린다(책임자가 `app.settings`).
- 등록 화면에서 `name`·`category`·`description`·`gmaps_url`·`lang` 을 옮겨 적고, 지도에서 `lat`, `lng` 자리를 누른다.
