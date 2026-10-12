# 6단계 · YUNABI 디자인 레퍼런스 연구 (oh-my-design)

| | |
|---|---|
| 상태 | 초안 v0.1 — 방향 선택은 책임자 결정 대기 (§9) |
| 작성일 | 2026-10-12 |
| 근거 | [PRD-YUNABI v2.3](../02-requirements/PRD-YUNABI.md), [디자인 시스템 v0.1](design-system.md), 현행 화면 캡처 8장(home, ending, ko-home, ko-calendar, map-notice, map-near, map-japan, map-osaka), 로고 `assets/brand/yunabi-mark.svg` |
| 레퍼런스 원본 | github.com/kwakseongjae/oh-my-design (MIT), 커밋 `c0ec4385616d1fb5b0e7ca6a6bb66ff5a3d57f96` (2026-10-01), `design-md/<id>/DESIGN.md` |
| 관련 | [ADR-0023](../adr/0023-frontend-framework-react.md) (React + Vite + TS, 첫 화면 gzip 75 KB 목표 — 처음 제안이던 Svelte·60 KB 는 D24 로 대체) |

이 문서는 재작성(D19) 전에 시각 방향을 정하기 위한 **레퍼런스 연구**다. 토큰을 확정하지 않는다. 방향이 정해지면 §7 의 방법으로 프로젝트 `DESIGN.md` 를 만들고, 그 파일이 디자인의 기준이 된다.

모든 명암비는 WCAG 2.x 상대 휘도 공식으로 **계산한 값**이다(소수 둘째 자리 반올림). 본문 글자는 4.5:1, 18.66px 굵게/24px 이상 큰 글자와 비텍스트 요소(입력 테두리, 포커스 링, 지도 핀)는 3:1 을 기준으로 삼았다.

---

## 0. 요약

- **쇼트리스트:** Karrot(동네 UGC·빈 상태·신뢰), Toss(한 화면 한 결정·행동색 하나), 디지털청 DADS(일본어 가독성·접근성), SmartHR(토큰 2층 구조·장애 없는 상태 표시), LINE(다국어 라벨 길이 규칙), Duolingo·mikan(일본어 탭의 게임 피드백만), Citymapper·komoot(지도 위 크롬), Cookpad(사용자 투고 카드). MUJI·Mercari·Studysapuri·Naver Webtoon 은 부분 참고.
- **계산으로 확인한 사실:** 나비의 연파랑 `#8ECDF2`(흰 바탕 1.73:1)과 몸통 `#5FB3E6`(2.31:1)은 밝은 바탕에서 **글자로도, 테두리로도 쓸 수 없다**. 남색 `#1D3E5C` 위에서는 6.42:1 로 통과한다. 그래서 세 방향 모두 "나비색은 남색 위 또는 장식에만" 이라는 규칙을 공유한다.
- **추천:** 방향 A **「맑은 하늘」** — 흰 바탕, 남색 크롬(로고 바탕색과 같은 `#1D3E5C`), 행동색 하나 `#1769AA`(흰 바탕 5.77:1), 연파랑 나비는 강조 장식. 게임다운 표현(Duolingo 식)은 일본어 탭 안에서만 허용.
- **oh-my-design 사용법:** 저장소에 전체 번들을 설치하지 않는다(훅 4개가 `.claude/settings.json` 에 병합되고, `omd:init`/`omd:sync` 가 `CLAUDE.md`·`AGENTS.md` 에 관리 블록을 넣는다). 대신 Core v2 형식(7개 앵커)으로 루트 `DESIGN.md` 를 직접 쓰고, 필요하면 버전을 고정한 검증 명령만 일회성으로 쓴다. 레퍼런스 파일 복사는 기본적으로 **하지 않는다**(§8).

---

## 1. 현재 화면에서 본 것

| 관찰 | 근거(캡처) | 의미 |
|---|---|---|
| 나비 로고는 남색 헤더에서만 산다. 본문 영역에는 나비의 연파랑이 한 번도 나오지 않는다 | home, ko-home | 브랜드 앵커가 헤더에 갇혀 있다. 본문 주색은 여전히 藍·紅 |
| 홈 카드의 아이콘 타일 색이 紅(あ)·ai-mid(지도)·藍(캘린더) 로 제각각 | home | 카테고리 색과 기능 색이 섞여 있다. "빨강 = 일본어" 는 의미가 없다 |
| 보조 글자(`--sumi-faint` `#8D9299`)가 washi 위 2.59:1 | ending "Replies that landed 5/5", calendar "CAFÉ COMMONS · GIP", map 도보 시간 | WCAG 미달. 메타 정보가 가장 많이 쓰는 색이다 |
| 토스트가 회색 반투명 바탕 위 흰 글자 | ending "New card unlocked" | 게임의 가장 큰 보상 순간이 가장 흐리다 |
| 지도 영역이 분홍·적갈색 단색 | map-near, map-japan, map-osaka | 헤드리스 캡처에서 타일이 로드되지 않은 상태로 보인다(추정). 핀 대비 판단은 OSM 바탕색 `#F2EFE9` 기준으로 했다 |
| 카테고리 칩이 한 줄 가로 스크롤, 한국어·일본어 모두 잘림 없이 hug | map-notice(en "Getting around" 가 가장 김), map-near | Karrot SEED Tabs 의 "hug + 스크롤" 과 같은 방식. 유지할 가치가 있다 |
| 위치 안내 카드의 버튼 두 개가 영어에서 2줄로 접힘 ("Show around 結 instead") | map-notice | LINE 의 "번역이 길면 가로 배치를 세로로" 규칙이 필요하다 |
| 캘린더 날짜 셀 점 색 4종(종류별) | ko-calendar | Y-K5 로 종류가 "일반" 하나가 된다. 점은 한 색이면 된다 |

---

## 2. 읽은 레퍼런스와 품질 등급

oh-my-design 은 `data/reference-quality.json`(2026-10-01 생성, 521건)에 레퍼런스마다 상태를 둔다. `verified_v2` 는 출처·측정 표면이 붙은 재검증본(299건), `partial` 은 v2 검증 누락(109건), `legacy_snapshot` 은 토큰 출처가 검증되지 않은 옛 스냅숏(113건)이다. 이 문서는 `legacy_snapshot` 의 **수치**를 인용하지 않고 **원칙과 패턴**만 빌린다.

| id | 상태 | 검증일 | 출처 수 | 비고 |
|---|---|---|---|---|
| karrot | verified_v2 | 2026-07-11 | 10 | SEED v2 공식 소스 기반 |
| toss | verified_v2 | 2026-07-11 | 10 | 이미 Core v2 형식(7개 앵커)으로 작성됨 |
| line | verified_v2 | 2026-07-11 | 15 | 다국어 반응형 규칙이 명시됨 |
| mercari | verified_v2 | 2026-07-13 | 8 | 미국 공개 웹만 측정. 일본 앱은 범위 밖 |
| smarthr | verified_v2 | 2026-09-21 | 6 | smarthr-ui Storybook 측정 |
| citymapper | verified_v2 | 2026-09-23 | 4 | 데스크톱 웹 홈만 |
| komoot | verified_v2 | 2026-09-27 | 3 | 데스크톱 웹 홈만 |
| digital-agency-jp | partial | 2026-06-17 | 0 | 라이브 측정은 있으나 v2 검증 누락. 원 시스템은 CC BY 4.0 |
| duolingo | legacy_snapshot | 2026-06-06 | 0 | `freshness_conflict` |
| cookpad | legacy_snapshot | 2026-05-19 | 0 | `conflict_unresolved`, 일부 컴포넌트 "inferred" |
| muji | legacy_snapshot | 2026-06-06 | 0 | `token_source_unverified` |
| **추가** studysapuri | verified_v2 | 2026-09-23 | 3 | 일본 학습 서비스. 과목별 색 토큰 |
| **추가** naverwebtoon | verified_v2 | 2026-07-13 | 7 | 만화 플랫폼. Pretendard 단일 서체 |
| **추가** mikan | partial | 2026-06-17 | 0 | 일본 영어 단어 학습 앱. 3D 버튼 |
| 검토 후 제외 weverse | verified_v2 | 2026-09-30 | 6 | 다국어 커뮤니티지만 측정 표면이 로그아웃 홈·쇼핑뿐이라 UGC 패턴을 얻을 수 없음 |

`ls design-md` 에서 캘린더(cal, legacy), 지도(tmap, verified_v2), 일본 생활(timee, rakuten, smartnews 등)도 확인했으나, 위 목록보다 YUNABI 에 더 줄 것이 없거나 등급이 낮아 읽지 않았다.

---

## 3. 쇼트리스트

"반영" 열의 ID 는 PRD-YUNABI §5 의 요구사항과 IA 화면 ID 다.

| 레퍼런스 | 빌릴 것 | 빌리지 않을 것과 이유 | 반영 |
|---|---|---|---|
| **Karrot** | ① 내용이 주인공, 크롬은 가볍게: 한 화면에 목록 3–4개가 보이는 밀도. ② 모든 사용자 콘텐츠에 위치 정보(동네)를 메타로 노출 → YUNABI 는 도보 시간·도도부현. ③ 빈 상태 = "왜 비었는지 한 줄 + 부담 없는 버튼 하나", 일러스트 없음. ④ 신뢰는 배지가 아니라 차분함: 첫 화면에 빨간 경고를 두지 않는다. ⑤ 4px 그리드, 16px 좌우 여백. ⑥ 스켈레톤은 최종 카드와 같은 치수, 위치 칸은 확정 전까지 비움 | 오렌지 주색(브랜드 다름). 스프링 금지 원칙은 일본어 게임 영역에는 적용하지 않는다(그곳은 축하가 목적). 48px 제목 스케일(마케팅용) | Y-M5, Y-K3 (빈 상태), Y-M9 (장소 카드), Y-M10·Y-K10 (신고 동선), MAP-01, MAP-02, HOME |
| **Toss** | ① 행동색 하나를 기능에만(`color.primary` 하나). ② 버튼 상태 계약: loading·disabled·pressed·keyboard focus 를 빠짐없이, loading 중 폭 유지. ③ 큰 터치 버튼(56px, 반경 16)과 작은 버튼 스케일. ④ "가치 먼저, 비용 나중": 등록 화면에서 공개 범위 경고(Y-M7)를 확인 단계에 둔다. ⑤ Core v2 문서 구조 자체(§7) | Toss Product Sans(독점 서체). 금융용 중립 회색 전체. 마케팅 웹 버튼(7px 반경)을 앱에 섞는 것 | Y-M6·Y-K4 (등록 폼), Y-M7 (경고 확인), Y-C4 (재전송), MAP-04, CAL-03 |
| **디지털청 DADS** | ① 일본어 본문 행간 1.7, 본문 16–17px. ② 채움색과 글자색을 분리하는 2단 파랑(채움은 선명, 글자는 더 진하게). ③ 그림자 없이 회색 면과 헤어라인으로 구분. ④ 44–56px 터치 대상. ⑤ 색만으로 의미 전달 금지. ⑥ 공식 컴포넌트 목록에 ランゲージセレクター, 日付ピッカー／カレンダー, ボトムナビゲーション 이 있음 — 접근성 동작 참고처 | 관공서 파랑 `#0017C1`(브랜드 다름). Noto Sans JP 웹폰트 의무화 — 첫 화면 75 KB 예산(ADR-0023)과 충돌하므로 시스템 서체 우선 | Y-C1 (44px·줄바꿈), Y-C2, 언어 선택, CAL-01, 전체 타이포 |
| **SmartHR** | ① 원시 토큰 / 의미 토큰 2층 구조. ② 비활성 상태는 투명도가 아니라 색 교체(글자 대비가 부모를 따라 흐려지지 않게). ③ 상태 라벨은 글자색+테두리를 함께 바꾸고, 경고만 채움. ④ 알림 박스 4종(info·success·warning·error)을 연한 바탕 + 진한 글자로 | 4–8px 의 업무용 작은 반경(학생 앱에는 딱딱함). 왼쪽 내비게이션 앱 셸 | Y-R8 ("신고로 숨겨짐 — 검토 중" 라벨), Y-C3 (오프라인 배너), Y-A2 안내, ME-02, ADM-01 |
| **LINE** | ① 번역이 길어 라벨이 잘리면 가로 버튼 묶음을 **세로로** 바꾼다. ② 탭은 가로 스크롤 허용, 선택 탭은 항상 완전히 보이게. ③ 12pt 미만 글자 금지. ④ 팝업은 한 번에 하나, 닫는 길 필수, 긍정 버튼은 오른쪽 또는 위. ⑤ 화면·카드 좌우 16pt | LINE Green, 밑줄형 입력(오류 표시가 약함) | Y-C1, Y-C2, SYS-03 (신고 시트), 위치 안내 카드(Y-M2), 모든 2버튼 묶음 |
| **Duolingo** *(legacy)* | 원칙만: ① 한 화면 한 행동. ② 정답·오답 피드백 바(연한 바탕 + 진한 글자 + 문장, 색만이 아님). ③ 실수에 친절한 문구. ④ 숫자(모은 카드 수)를 크게 | 수치 토큰 전부(검증 안 됨). 대문자 버튼(일본어·한국어에 의미 없음). 하트·연속 기록 같은 압박 장치. Feather Bold·DIN Next Rounded(독점) | Y-J1 (분기형 게임·컬렉션), JP-03~JP-06 |
| **mikan** *(partial)* | 일본 학습 앱의 "3D 하드섀도 버튼"(`0 4px 0` 진한 같은 색)과 따뜻한 격려 톤 — 일본 사용자에게 익숙한 게임 버튼 문법의 국내 사례 | 오렌지 주색, Oswald 숫자 | JP-04 선택지, JP-05 엔딩 |
| **Citymapper** | ① 지도 앱의 "키 색 하나" + 둥근 버튼. ② 헤어라인을 테두리가 아니라 그림자 1px 로. ③ 주된 목적지 버튼은 눌림/호버 때 떠오름 | 검색창의 포커스 표시 없음(레퍼런스가 스스로 "따라하지 말 것" 으로 적음). 데스크톱만 측정 | MAP-01 크롬, Y-M1 (내 주위 버튼) |
| **komoot** | ① 채움 토큰과 내용 토큰을 항상 짝으로(`actionBaseFill*` ↔ `actionContentFill*`). ② 지도 타일의 따뜻한 베이지와 다투지 않는 크롬 | 올리브·오렌지 아웃도어 팔레트, Nohemi/Satoshi 웹폰트 | 토큰 명명, 지도 위 칩·버튼 |
| **Cookpad** *(legacy)* | 원칙만: ① 커뮤니티가 곧 제품 — 투고를 쉽고 따뜻하게. ② 투고 카드에서 크롬이 콘텐츠와 경쟁하지 않게. ③ 크게 누를 수 있는 카테고리 타일(64px) | 크림 바탕 수치·오렌지(검증 안 됨, 일부 "inferred") | MAP-02 카드, 홈 진입 타일, MAP-04 |
| **MUJI** *(legacy)* | 원칙만: 브랜드색을 "귀하게" — 로고와 드문 강조에만. 공기와 헤어라인으로 구분 | 0–2px 직각 모서리, 굵기 300 제목(한국어·일본어 작은 글자에서 가독성 저하), 넓은 여백(밀도 목표와 충돌) | 나비색 사용 규칙(D-P3-*) |
| **Mercari** | 원칙만: P2P 교환에서 안전 경계는 장식적 안심 문구가 아니라 맥락 속 명확한 안내 | 측정 토큰(미국 마케팅 웹, Averta 상용 서체) | Y-M7, Y-P6 안내 문구 |
| **Studysapuri** | 과목마다 색을 토큰으로 둔 방식 → 장소 카테고리 6색을 **토큰**으로(현행은 `CATCOLOR` 하드코딩, DG-9) | 서비스별 원색 다수, 호버마다 다른 페이드 값(일관성 없음을 레퍼런스가 기록) | Y-M2 (카테고리 필터), 핀·칩 |
| **Naver Webtoon** | 만화 플랫폼 크롬은 흰 바탕·검은 글자로 비워 두고 그림이 색을 가진다 | 측정이 웹 홈 탐색 화면뿐이라 리더 화면 근거 없음 | JP-02 만화 컷 |

---

## 4. 세 방향 공통 규칙

방향과 관계없이 지킬 것. 각 방향의 결정표(§5)는 이 위에 얹는다.

### 4.1 나비색의 쓰임 (계산 결과)

| 쌍 | 비율 | 판정 | 규칙 |
|---|---|---|---|
| `#8ECDF2` 날개 / 흰색 | 1.73 | 글자·비텍스트 모두 불합격 | 밝은 바탕에서 글자·테두리·아이콘 단독 금지 |
| `#5FB3E6` 몸통 / 흰색 | 2.31 | 불합격 | 〃 |
| 흰색 / `#5FB3E6` | 2.31 | 불합격 | 몸통색을 버튼 채움으로 쓰지 않는다 |
| `#8ECDF2` / OSM 땅 `#F2EFE9` | 1.50 | 불합격 | 지도 위 강조 후광은 반드시 남색 링과 함께 |
| `#8ECDF2` / 남색 `#1D3E5C` | 6.42 | 통과 | 남색 위 글자·아이콘 가능 |
| `#C9E9FB` 안쪽 / 남색 | 8.72 | 통과 | 남색 위 보조 글자 |
| 남색 / `#8ECDF2` | 6.42 | 통과 | 연파랑 채움 위 글자는 남색 |
| 남색 / `#C9E9FB` | 8.72 | 통과 | 〃 |

→ 로고를 흰 바탕에 놓을 때는 남색 판(앱 아이콘과 같은 형태)을 깐다. PRD Y-B2 의 로고 색은 바꾸지 않는다.

### 4.2 장소 카테고리 6색 (A·C 공용, B 는 같은 값을 와시 위에서 검증)

현행 `CATCOLOR` 의 의료 `#B07A2E` 는 흰 글자 3.70:1, 카드 위 3.42:1 로 불합격이었다(design-system §7.2). 아래로 바꾼다.

| 카테고리 | 값 | 흰 바탕 글자 | 흰 글자 / 채움 | `#F4F7FA` 위 | `#F5F3EE`(B) 위 | OSM 땅 위 핀 (3:1) |
|---|---|---|---|---|---|---|
| 교통 transit | `#1D3E5C` | 11.08 | 11.08 | — | 9.99 | 9.65 |
| 생활 daily | `#1769AA` | 5.77 | 5.77 | 5.37 | 5.21 | 5.03 |
| 음식 food | `#B53D2E` | 5.72 | 5.72 | 5.32 | 5.16 | 4.98 |
| 공부 study | `#2B7A4B` | 5.27 | 5.27 | 4.90 | 4.75 | 4.59 |
| 행정 admin | `#6A4C9C` | 6.72 | 6.72 | 6.25 | 6.06 | 5.85 |
| 의료 health | `#9A5B00` | 5.43 | 5.43 | 5.05 | 4.89 | 4.73 |

전부 통과. 단 음식(빨강)과 공부(초록)는 적록 색각에서 구분이 어렵다 → **핀과 칩에 카테고리 아이콘을 반드시 함께**(DADS "색만으로 의미 전달 금지", design-system §7.4).

### 4.3 서체

- **웹폰트를 기본으로 싣지 않는다.** CJK 웹폰트는 첫 화면 75 KB 예산(ADR-0023)을 넘는다. Karrot·SmartHR·LINE·Cookpad 모두 제품 UI 는 시스템 서체다.
- 언어별 스택을 `:lang()` 로 나눈다(DG-10 해결):
  - `ja`: `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif`
  - `ko`: `"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif`
  - `en`: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- 사용자 글은 **작성 언어**의 `lang` 속성으로 감싼다(Y-C5). 한국어 화면에서 일본어 장소 이름이 일본어 글꼴로 나온다.
- 굵기는 400·600·700 세 단계. 최소 크기 12px(LINE). 한국어 본문 행간 1.6, 일본어 1.7(DADS).
- 선택지로 남겨 둘 것: 한국어 Pretendard(SIL OFL 1.1, Naver Webtoon·Weverse 가 사용). 넣는다면 한국어 화면에서만 지연 로드.

### 4.4 한국어 길이와 배치

- 고정 폭 금지. 칩·탭은 hug + 가로 스크롤, 선택 항목은 `scrollIntoView` 로 완전히 보이게(LINE, SEED Tabs).
- 버튼 두 개 묶음은 가로 기본, 어느 한 라벨이라도 두 줄이 되면 세로로 쌓는다(LINE). 현재 map-notice 가 해당.
- 헤더 부제는 360px 이하에서 숨긴다(DG-14).
- 하단 탭 라벨은 4등분, 12px 이상, 한 줄. 현재 "캘린더"·"カレンダー" 가 가장 길며 들어간다.

### 4.5 상태

- 비활성은 색 교체(SmartHR), 높이·폭 유지(Karrot). 로딩 버튼은 폭 유지(Toss).
- 숨김·검토 중·수정됨(Y-R8, Y-E1)은 **상태 라벨**: 연한 바탕 없음, 글자색+테두리, 문장으로.
- 토스트는 진한 바탕(`#15202B` 위 흰색 16.49:1), `role="status"`.
- 움직임은 150/250/350ms 세 단계, `prefers-reduced-motion` 에서 0ms(Karrot).

---

## 5. 후보 방향

oh-my-design 방식대로 각 방향은 **무엇을 얻으려고 무엇을 버리는지** 밝힌다. 결정 ID 는 `D-<원칙>-<번호>`.

### 방향 A — 「맑은 하늘」 (Clear Sky)

**철학.** YUNABI 는 낯선 나라에서 오늘 할 일을 정하는 도구다. 흰 바탕과 남색 크롬, 행동색 하나만 두고 나머지는 사용자가 등록한 장소·일정·만화가 채운다. 나비의 연파랑은 남색 위에서만 빛나는 **표식**이다. 이를 위해 **일본 전통색 이름 체계(washi·sumi·beni)와 그 따뜻한 질감을 버린다.** 현재 앱이 가진 "일본다움" 은 색이 아니라 콘텐츠(만화, 장소 이름, 간사이 사투리)가 맡는다. 또 앱 전체의 게임화는 버리고, 놀이는 일본어 탭 안에 가둔다.

**원칙**

| ID | 원칙 | 희생 |
|---|---|---|
| P1 | 내용이 주인공, 크롬은 조용히 (Karrot) | 화면마다의 브랜드 표현 |
| P2 | 행동색은 하나 (Toss) | 카테고리 색을 버튼에 쓰는 자유 |
| P3 | 나비는 남색 위에서만 빛난다 (MUJI 의 "귀한 한 색") | 연파랑으로 넓은 면을 칠하는 밝은 인상 |
| P4 | 세 언어가 동등하다 (LINE, DADS) | 서체로 만드는 개성 |
| P5 | 놀이는 일본어 탭 안에서만 (Duolingo 를 부분 적용) | 홈·지도·캘린더의 보상감 |

**팔레트와 명암비**

| 토큰 | 값 | 역할 | 결정 |
|---|---|---|---|
| `canvas` | `#FFFFFF` | 기본 바탕, 카드 | D-P1-1 |
| `surface` | `#F4F7FA` | 섹션 띠, 날짜 라벨, 비활성 면 | D-P1-1 |
| `line` | `#DCE3EA` | 장식용 구분선(대비 요구 없음) | D-P1-3 |
| `line-strong` | `#7D8995` | 입력 테두리 (흰 바탕 3.57) | D-P1-3 |
| `ink` | `#15202B` | 제목·본문 | D-P1-1 |
| `body` | `#3B4855` | 보조 본문, 설명 | D-P1-1 |
| `muted` | `#5B6875` | 메타, 시간, 힌트 (현행 `--sumi-faint` 대체) | D-P1-4 |
| `brand-navy` | `#1D3E5C` | 헤더, 선택된 날짜, 클러스터, 교통 카테고리 | D-P3-1 |
| `on-navy-muted` | `#B9D9EE` | 남색 위 부제 | D-P3-1 |
| `primary` | `#1769AA` | 주 버튼 채움, 링크, 포커스 링, 오늘 표시 | D-P2-1 |
| `primary-pressed` | `#105688` | 눌림 | D-P2-1 |
| `primary-tint` / `on-tint` | `#E6F3FC` / `#0F4C7A` | 선택 칩, 정보 알림 | D-P2-2 |
| `butterfly-sky` | `#8ECDF2` | 남색 위 아이콘·밑줄, 지도 선택 후광(남색 링과 함께), 진행 막대 | D-P3-2 |
| `butterfly-mist` | `#C9E9FB` | 남색 위 보조 글자, 엔딩 카드 테두리 | D-P3-2 |
| `danger` | `#C2372F` | 삭제·오류·일요일 | D-P2-3 |
| `success` | `#1F7A4D` | 완료 | D-P2-3 |
| `warning-bg` / `warning-fg` | `#FFF4D6` / `#8A5A00` | Y-M7 공개 경고, Y-C3 오프라인 | D-P2-3 |
| `placeholder` | `#E3E8EE` | 그림 없는 컷·엔딩 (D15) | D-P5-2 |

| 글자 / 바탕 | 비율 | 판정 |
|---|---|---|
| ink / canvas | 16.49 | 통과 |
| ink / surface | 15.34 | 통과 |
| body / canvas | 9.36 | 통과 |
| body / surface | 8.70 | 통과 |
| muted / canvas | 5.70 | 통과 |
| muted / surface | 5.30 | 통과 |
| primary / canvas | 5.77 | 통과 |
| primary / surface | 5.37 | 통과 |
| primary / primary-tint | 5.11 | 통과 |
| 흰색 / primary | 5.77 | 통과 |
| 흰색 / primary-pressed | 7.75 | 통과 |
| on-tint / primary-tint | 7.96 | 통과 |
| ink / primary-tint | 14.60 | 통과 |
| 흰색 / brand-navy | 11.08 | 통과 |
| on-navy-muted / brand-navy | 7.50 | 통과 |
| butterfly-sky / brand-navy | 6.42 | 통과 |
| butterfly-mist / brand-navy | 8.72 | 통과 |
| danger / canvas, 흰색 / danger | 5.41 | 통과 |
| success / canvas | 5.32 | 통과 |
| warning-fg / warning-bg | 5.41 | 통과 |
| muted / placeholder ("???" 잠긴 카드) | 4.63 | 통과 (현행 1.36 → 해결) |
| body / placeholder | 7.59 | 통과 |
| 흰색 / ink (토스트) | 16.49 | 통과 |
| line-strong / canvas (입력 테두리, 3:1) | 3.57 | 통과 |
| primary / canvas (포커스 링, 3:1) | 5.77 | 통과 |

**결정표**

| ID | 결정 | 근거 한 줄 |
|---|---|---|
| D-P1-1 | 바탕은 흰색, 면 구분은 `surface` 한 단계 | DADS 의 평면 구분, Karrot 의 Canvas/Background |
| D-P1-2 | 4px 그리드, 화면 좌우 16px, 목록 행 최소 56px | Karrot·LINE 16, 현행 18px 은 그리드 밖 |
| D-P1-3 | 카드에 그림자 없음. `line` 1px. 그림자는 시트·FAB·지도 컨트롤만 | DADS, Citymapper |
| D-P1-4 | 보조 글자는 `muted` 하나로 통일, 4.5:1 이상 | DG-6 해결 |
| D-P2-1 | 주 행동은 `primary` 채움 하나. 한 화면에 채움 버튼 하나 | Toss, LINE "한 화면 한 주 버튼" |
| D-P2-2 | 선택 상태는 `primary-tint` + `on-tint`, `aria-pressed`/`aria-selected` 로 | 현행 DP-8 유지 |
| D-P2-3 | 빨강은 삭제·오류·일요일에만. 신고 버튼은 빨강이 아니다 | Karrot "신뢰는 차분함에서" |
| D-P3-1 | 헤더·하단 탭 선택·캘린더 선택일은 `brand-navy` | 로고 바탕과 같은 색, 현행 `--ai` 계승 |
| D-P3-2 | 나비 연파랑은 남색 위 또는 남색 링과 함께만 | §4.1 계산 |
| D-P4-1 | `:lang()` 별 시스템 서체 스택 | §4.3 |
| D-P4-2 | 2버튼 묶음은 넘치면 세로 | LINE |
| D-P5-1 | 게임 전용 토큰(피드백 바·3D 버튼)은 JP-03~JP-06 에서만 | Duolingo 원칙을 범위 한정 |
| D-P5-2 | 그림 없는 칸은 `placeholder` 단색, 글자 없음 | D15, Y-J2 |

**타입.** `title-l` 22/1.4/700(상세 제목) · `title` 18/1.45/700(시트·섹션) · `headline` 16/1.5/600(목록 행 제목) · `body` 16/1.6(ko)·1.7(ja)/400 · `body-s` 14/1.55/400 · `label` 13/1.45/600 · `caption` 12/1.45/400. 현행 22종을 7종으로. 본문을 15 → 16px 로 올리는 것은 DADS·SmartHR·Cookpad·LINE 모두 16 이 기본이기 때문.

**모양과 반경.** 입력·작은 버튼 8 · 큰 버튼 12 · 카드 12 · 바텀 시트 위 모서리 16 · 칩·핀·클러스터 full. 버튼 높이 40/48/56(Toss 사이즈 사다리 축약).

**밀도.** 중간. 지도 목록은 한 화면 4행 이상, 장소 카드는 3장 이상 보이게(Karrot P8). 홈 진입 카드는 지금보다 낮게(아이콘 40px, 패딩 16).

**화면별 처리**

- **지도 (MAP-01~04, Y-M1~M10).** 지도 위 크롬은 흰 알약(칩 줄, 내 주위/일본 전체 세그먼트)으로 띄우고 그림자 1단계. 핀은 카테고리색 채움 + 흰 2px 링 + 흰 아이콘. 선택 핀은 1.4배 + 남색 링 + 바깥 `butterfly-sky` 후광. 클러스터는 남색 원 흰 숫자. 도도부현 경계는 남색 1.5px, 선택된 현은 `butterfly-sky` 30% 채움(장식). 장소 카드는 바텀 시트(Karrot·SEED Bottom Sheet). 빈 상태(Y-M5)는 지도 위가 아니라 시트 안에 한 줄 + `＋ 장소 등록`. 위치 경고(Y-M7)는 `warning` 알림 박스, 확인 체크 후 버튼 활성.
- **캘린더 (CAL-01~03, Y-K1~K11).** 월 격자는 흰 바탕, 선택일 남색 채움 흰 글자, 오늘은 `primary` 2px 링. 일정 점은 한 색(`primary`, Y-K5 로 종류 없음), 셀당 최대 3점 + "+n". 일정 행은 시각 열 + 제목 + 장소, 반복은 텍스트 라벨("매주 화요일"). 지난 일정은 `muted` 글자 + "지난 일정" 라벨(색만이 아님). Y-K11 문구는 `.ics` 버튼 바로 아래 `caption`.
- **만화·게임 (JP-01~06, Y-J1~J3).** 만화 컷은 가로 꽉 차게 4:3, 반경 12, 그림이 색을 가진다(Naver Webtoon). 대사는 컷 아래 `body`. 게임은 D-P5-1 구역: 선택지는 2px 테두리 큰 타일(Duolingo 답 타일), 고른 뒤 피드백 바(정답 `#E3F4E1`/`#1E5B22` 7.11, 아쉬움 `#FDE8E6`/`#A3241B` 6.32) + 문장. 엔딩 카드는 3:2 그림 + 남색 액자 + `butterfly-mist` 테두리, "새 카드" 순간은 남색 바탕 모달에 나비가 한 번 날갯짓(≤600ms, 감속 모드 생략). 잠긴 카드는 `placeholder` + `muted` "？？？"(4.63).
- **사용자 투고 카드 (Y-M9, Y-E1, Y-C5, Y-R8, Y-S4).** 순서: 카테고리(아이콘+글자) · 이름(`headline`) · 설명 3줄 말줄임 · 메타 한 줄(도보 약 n분 · 등록일 · 수정됨 날짜) · 작성 언어 배지(화면 언어와 다를 때만, `surface` 바탕 `body` 글자). 등록자 정보 없음. 신고는 카드 오른쪽 위 `⋯` 메뉴 안(첫 화면에 빨간 깃발 없음). 내 항목의 숨김 상태는 상태 라벨 "신고로 숨겨짐 — 검토 중". 사용자 글은 항상 텍스트 보간.

### 방향 B — 「와시와 나비」 (Washi & Butterfly)

**철학.** 지금 앱이 쌓은 일본다운 따뜻함을 지키면서 나비를 들인다. 와시 바탕, 墨 글자, 藍 행동, 연파랑 나비 강조. Cookpad 의 "따뜻함이 곧 브랜드", komoot 의 따뜻한 중립, MUJI 의 "한 색을 귀하게" 를 따른다. 이를 위해 **선명함과 대비의 여유를 버린다**(와시 위 보조 글자는 4.69–5.22 로 A 보다 빠듯하다). 또 **나비의 연파랑은 차가운 색이라 따뜻한 바탕 위에서 주인공이 되지 못하고 작은 장식으로 남는다.** 紅은 오류·일요일로 강등한다.

| 토큰 | 값 | 역할 |
|---|---|---|
| `washi` | `#F5F3EE` | 기본 바탕 |
| `washi-deep` | `#EAE7DF` | 섹션 띠 |
| `card` | `#FFFFFF` | 카드 |
| `sumi` | `#1A1D20` | 본문 |
| `sumi-soft` | `#4A4F55` | 보조 본문 |
| `sumi-muted` | `#61666C` | 메타 (현행 `#8D9299` 대체) |
| `ai` | `#1D3E5C` | 주 버튼, 링크, 헤더 |
| `sky-tint` | `#E1F0F8` | 선택 칩 (글자는 `ai`) |
| `butterfly-sky` | `#8ECDF2` | 남색 위 장식만 |
| `beni` | `#A8352F` | 오류·삭제·일요일 |
| `line-strong` | `#8E8A80` | 입력 테두리 |
| `notice-bg` / `notice-fg` | `#FFF6D8` / `#7A4E00` | 경고 |

| 글자 / 바탕 | 비율 | 판정 |
|---|---|---|
| sumi / washi | 15.27 | 통과 |
| sumi / card | 16.93 | 통과 |
| sumi-soft / washi | 7.45 | 통과 |
| sumi-muted / washi | 5.22 | 통과 |
| sumi-muted / card | 5.79 | 통과 |
| sumi-muted / washi-deep | 4.69 | 통과 (여유 적음) |
| sumi-muted / sky-tint | 4.97 | 통과 |
| ai / washi | 9.99 | 통과 |
| ai / washi-deep | 8.96 | 통과 |
| ai / sky-tint | 9.51 | 통과 |
| 흰색 / ai | 11.08 | 통과 |
| beni / washi | 5.89 | 통과 |
| 흰색 / beni | 6.53 | 통과 |
| notice-fg / notice-bg | 6.66 | 통과 |
| ai / notice-bg | 10.25 | 통과 |
| line-strong / washi (3:1) | 3.11 | 통과 (여유 적음) |
| 카테고리 6색 / washi | 4.75–9.99 | 통과 (§4.2) |

- **타입·모양·밀도.** A 와 같은 스케일, 반경은 8(버튼·입력·카드)·16(시트)·full(칩). 밀도 중간. 그림자 없음, 헤어라인.
- **지도.** OSM 타일의 베이지와 와시가 비슷해 지도와 크롬의 경계가 흐려진다 → 지도 위 크롬은 흰 카드 + `line` 테두리가 필요. 핀 규칙은 A 와 같다.
- **캘린더.** 현행과 거의 같다(점 한 색으로 통일, 선택일 藍).
- **만화·게임.** 컷 바탕 와시, 엔딩 카드는 흰 종이 위 藍 액자. 축하는 차분하게(토스트를 藍 바탕으로).
- **투고 카드.** 흰 카드가 와시 위에 뜨는 Cookpad 식. 메타·신고 동선은 A 와 같다.

### 방향 C — 「나비 놀이」 (Butterfly Play)

**철학.** 유학생에게 일본 생활은 매일의 퀘스트다. 나비를 캐릭터처럼 쓰고, 버튼은 눌리는 키처럼(Duolingo·mikan), 숫자와 수집을 크게 보인다. 이를 위해 **사용자 등록 콘텐츠와 신고·관리 화면에 필요한 차분한 신뢰감을 버린다**(Karrot 이 스프링과 축하를 금지하는 이유와 정확히 반대 선택). 또 **밀도를 버린다** — 큰 버튼과 굵은 글자는 한국어에서 가장 먼저 줄바꿈된다.

| 토큰 | 값 | 역할 |
|---|---|---|
| `canvas` | `#FFFFFF` | 바탕 |
| `surface` | `#F0F7FC` | 면 |
| `ink` / `body` / `muted` | `#1B2A38` / `#44525F` / `#5D6B78` | 글자 3단 |
| `primary` / `primary-lip` | `#0B6FB0` / `#08568A` | 3D 버튼 채움과 아래 4px 단 |
| `butterfly-sky` | `#8ECDF2` | 보조 버튼 채움 (글자는 남색) |
| `reward` | `#FFC83D` | 카드 수·보상 (글자는 `ink`) |
| `correct` / `correct-tint` / `correct-fg` | `#2E7D32` / `#E3F4E1` / `#1E5B22` | 정답 |
| `wrong` / `wrong-tint` / `wrong-fg` | `#C9372C` / `#FDE8E6` / `#A3241B` | 아쉬움 |

| 글자 / 바탕 | 비율 | 판정 |
|---|---|---|
| ink / canvas | 14.64 | 통과 |
| ink / surface | 13.53 | 통과 |
| body / canvas | 8.02 | 통과 |
| body / surface | 7.42 | 통과 |
| muted / canvas | 5.47 | 통과 |
| muted / surface | 5.06 | 통과 |
| 흰색 / primary | 5.36 | 통과 |
| primary / canvas | 5.36 | 통과 |
| primary / surface | 4.96 | 통과 |
| primary / `#DDF0FB` (연한 선택면) | 4.58 | 통과 (여유 거의 없음 → 선택면 글자는 남색 9.46 권장) |
| 남색 / butterfly-sky | 6.42 | 통과 |
| ink / reward | 9.46 | 통과 |
| 흰색 / correct | 5.13 | 통과 |
| correct-fg / correct-tint | 7.11 | 통과 |
| 흰색 / wrong | 5.16 | 통과 |
| wrong-fg / wrong-tint | 6.32 | 통과 |
| primary-lip / canvas (비텍스트 3:1) | 7.75 | 통과 |

- **타입.** 제목 700, 버튼 라벨 700 16px. 둥근 서체가 세 언어를 모두 덮는 무료 단일 패밀리를 찾기 어렵다 — 둥근 느낌은 반경과 굵기로만 낸다.
- **모양.** 반경 12(버튼)·16(카드)·full. 카드 2px 테두리, 버튼 아래 `0 4px 0` 단.
- **밀도.** 낮음. 장소 목록은 한 화면 2–3행.
- **지도.** 핀이 나비 모양 마커가 될 수 있으나, 카테고리 아이콘을 넣을 자리가 줄어 §4.2 의 "아이콘 함께" 규칙과 충돌한다.
- **캘린더.** 일정이 있는 날을 큰 점·스티커로. 일정이 0건인 초기(D16)에는 빈 격자가 더 허전해 보인다.
- **만화·게임.** 가장 잘 맞는다. 피드백 바, 진행 막대, 수집 카운터, 축하 모달.
- **투고 카드.** 큰 카테고리 스티커, 굵은 이름. 신고·숨김 상태가 놀이 톤 속에서 가볍게 보일 위험.

---

## 6. 추천: 방향 A 「맑은 하늘」

1. **나비가 실제로 브랜드가 된다.** B 에서는 따뜻한 와시 위에 차가운 연파랑이 겉돌고, C 에서는 연파랑이 보조 버튼 채움으로 흔해진다. A 는 남색 헤더 + 나비라는 지금 가장 강한 브랜드 장면(home 캡처)을 기준 장면으로 삼고, 나비색을 "선택·완료·수집" 의 표식으로만 써서 의미를 지킨다.
2. **대비 여유가 가장 크다.** 본문 15.34–16.49, 가장 약한 보조 글자도 5.30. B 는 4.69 까지 내려가고, C 는 선택면 위 행동색이 4.58 이다. 600명 중 저시력·작은 화면 사용자를 생각하면 여유가 곧 품질이다.
3. **사용자 등록 콘텐츠의 신뢰에 맞는다.** D16~D18 로 앱의 중심이 큐레이션에서 UGC 로 옮겨 갔다. 신고·숨김·관리자 복원이 있는 앱은 Karrot 처럼 차분해야 한다. C 는 이 점에서 가장 위험하다.
4. **지도와 다투지 않는다.** OSM 타일은 따뜻한 베이지다. 차갑고 하얀 크롬이 지도와 분리되어 보이고(B 는 섞인다), 카테고리 6색이 모두 지도 위 3:1 을 넘는다.
5. **세 언어와 예산에 맞다.** 시스템 서체, 고정 폭 없음, 한 화면 한 주 버튼은 한국어 길이에 가장 관대하다. 웹폰트 없이 첫 화면 60 KB 안에 들어간다.
6. **게임의 즐거움은 버리지 않는다.** D-P5-1 로 일본어 탭(JP-03~06)에만 C 의 피드백 바·3D 버튼·축하를 들인다.

**A 가 잃는 것과 보완.** 와시·紅 의 일본 전통색 정체성은 사라진다. 이것이 아쉬우면 B 의 와시를 `surface` 한 곳(만화 컷 둘레, 엔딩 카드 액자 안)에만 남기는 절충이 가능하다 — 단, 그 자리의 글자 대비는 다시 계산해야 한다.

---

## 7. 재작성에서 oh-my-design 을 쓰는 방법

### 7.1 저장소에 실제로 있는 것 (커밋 `c0ec438`, 패키지 `oh-my-design-cli` 2.0.2)

- **DESIGN.md Core v2 규격** (`spec/design-md-core-v2.md`): YAML 머리말 없이 `# <제품> Design System` 으로 시작하고, 7개 섹션 앞에 `<!-- design-md:section <id> -->` 앵커를 순서대로 둔다 — `experience`, `foundations`, `typography-assets`, `components-states`, `layout-platforms`, `content-locales`, `governance`. 권장 분량 600–1,800 단어. 확정되지 않은 값은 `TBD` 로 적지 말고 **빼며**, Governance 에 권위·적용 우선순위·미정 처리·변경 절차를 적어야 "Portable Core" 다. 도구 없이도 쓸 수 있는 형식이다.
- **유도 사슬** (`skills/omd-autopilot/references/derivation-chain.md`): 철학 → 결정표 → 토큰 → 컴포넌트 계약 → 레이아웃 → 빌드 → 렌더 비평. 토큰은 결정 ID(`D-<원칙>-<번호>`)를 되가리킨다. 이 문서 §5 가 그 형식을 따랐다.
- **레퍼런스 카탈로그** `design-md/<id>/DESIGN.md` 521건과 품질 데이터 `data/reference-quality.json`.
- **CLI** (`bin/oh-my-design.ts`): `install-skills`, `doctor`, `design-md inspect|validate|migrate|prepare-review|approve-review|compile|prepare-checkpoint|adopt`, `book`(토큰과 결정을 로컬 포트에 띄움), `workflows`.

### 7.2 설치하면 무엇이 어디에 생기나 (`src/cli/install-skills.ts` 확인)

| 범위 | 생기는 것 |
|---|---|
| 프로젝트(기본) | `.claude/skills/` 스킬 28개, `.claude/agents/` 전문 역할(저장소 `agents/` 21개 파일), `.claude/data/` 카탈로그(레퍼런스 DESIGN.md 포함), `.claude/hooks/*.cjs` 4개, 그리고 **`.claude/settings.json` 에 훅 병합** — `UserPromptSubmit`(skill-activation), `SessionStart`(session-state-loader), `PostToolUse` `Edit|Write|MultiEdit`(post-edit-watch), `Stop`(session-end-foldin). 매 프롬프트·매 편집마다 node 스크립트가 돈다 |
| `--global` | `~/.claude/` 아래 스킬·역할·카탈로그. 전역 훅·settings 는 건드리지 않음 |
| `--skills <이름> --skills-only` | 지정한 스킬 파일만. 역할·훅·settings·카탈로그 없음 |
| `--proof-policy` | 선택. 프로젝트 로컬 차단 훅 추가 |
| 스킬 실행 시 | `omd:init` 이 루트 `DESIGN.md` 와 선택적 `.omd/system/`(manifest·graph·provenance·coverage)을 만들고, `omd:sync` 가 `CLAUDE.md`·`AGENTS.md` 에 해시가 붙은 관리 블록을 넣고 `.cursor/rules/omd-design.mdc` 를 만든다 |

README 의 설치 예시는 `npx oh-my-design-cli@latest` 로 **버전이 고정되어 있지 않다.** `postinstall` 스크립트는 안내 문구만 출력한다(내용 확인함). 이 연구에서는 저장소의 어떤 스크립트도 실행하지 않았다.

### 7.3 권장

1. **설치하지 않고 형식만 쓴다.** 방향이 정해지면 저장소 루트에 Core v2 형식의 `YUNABI Design System` `DESIGN.md` 를 사람이 쓴다. 이 문서 §4·§5 의 해당 방향을 옮기고, 토큰마다 결정 ID 를 단다. 재작성 코드의 CSS 변수(또는 React 테마 모듈)는 이 문서에서 생성·검사한다. 이 파일이 디자인의 단일 기준이 되고, `design-system.md` 는 "v1.3 추출 기록" 으로 남긴다.
2. **전체 번들 설치는 권하지 않는다.** 이유: (a) 훅 4개가 이 저장소의 모든 세션에 상주한다. (b) `CLAUDE.md` 는 이 프로젝트의 작업 규칙 문서인데 외부 도구가 관리 블록을 쓴다. (c) 버전 미고정 `@latest`. (d) 28개 스킬 중 이 프로젝트가 쓸 것은 사실상 DESIGN.md 작성·검증뿐이다.
3. **도구를 쓰고 싶다면 범위를 좁힌다.** ① 버전 고정 일회성 검증: `npx oh-my-design-cli@2.0.2 design-md validate ./DESIGN.md` (provider-free 라고 문서화됨). ② 스킬이 필요하면 `--global --skills omd-init --skills-only` 처럼 저장소 밖에 두거나, 별도 브랜치에서 시험한 뒤 결과 `DESIGN.md` 만 가져온다. ③ `omd book --static` 은 핸드오프용 단일 HTML 을 만든다고 README 에 적혀 있다 — 디자인 리뷰 자료로 쓸 수 있으나 생성물은 커밋하지 않는다.
4. 어느 쪽이든 CI 에 **명암비 검사**를 넣는다(이 문서의 계산을 스크립트로). oh-my-design 의 "Proven System" 수준이 요구하는 대비 검사와 같은 일을 의존성 없이 할 수 있다.

---

## 8. 라이선스와 출처 표기

- **oh-my-design 저장소:** MIT, `Copyright (c) 2026 oh-my-design`. 같은 README 는 "레퍼런스는 각 기업의 자산이며, 교육적 참조 목적으로만 재구성되었다" 고 적는다. 즉 **문서 텍스트는 MIT 로 복사할 수 있지만, 그 안의 브랜드 이름·로고·색 정체성·서체에 대한 권리를 주지 않는다.**
- **서체:** Toss Product Sans, Feather Bold, DIN Next Rounded, Averta(상용 EULA), Proxima Soft, Nohemi, Satoshi 는 쓰지 않는다. 쓸 수 있는 것: 시스템 서체, Noto Sans JP/KR(SIL OFL 1.1), Pretendard(SIL OFL 1.1).
- **DADS:** 원 시스템이 CC BY 4.0 이다. DADS 의 가이드·컴포넌트를 직접 옮기거나 각색하면 "出典：デジタル庁デザインシステム (https://design.digital.go.jp/dads/)" 와 라이선스 표기, 변경 여부를 적어야 한다. 원칙만 참고한 이 문서는 해당하지 않는다.
- **이 문서:** 레퍼런스의 문장을 옮기지 않고 요약·인용(짧은 hex 값, 원칙 이름)만 했다. 각 수치의 출처는 §2 표의 id 와 커밋으로 추적된다.

**복사 권고.** 기본은 **복사하지 않는다** — 필요할 때 커밋 고정 링크(`https://github.com/kwakseongjae/oh-my-design/blob/c0ec438/design-md/<id>/DESIGN.md`)로 읽으면 된다. 에이전트 맥락용으로 저장소 안에 두기로 한다면 아래 3개만, 수정 없이:

| 파일 | 이유 | 둘 곳 |
|---|---|---|
| `design-md/digital-agency-jp/DESIGN.md` | 일본어 타이포·접근성 기준 | `docs/06-design/references/omd/digital-agency-jp/DESIGN.md` |
| `design-md/karrot/DESIGN.md` | UGC·빈 상태·신뢰 원칙 (verified_v2) | `docs/06-design/references/omd/karrot/DESIGN.md` |
| `design-md/toss/DESIGN.md` | Core v2 형식의 실제 예, 버튼 상태 계약 (verified_v2) | `docs/06-design/references/omd/toss/DESIGN.md` |

필요한 표기: 같은 폴더에 `NOTICE.md` 를 두고 ① oh-my-design MIT 라이선스 전문과 저작권 줄, ② 원본 URL·커밋 `c0ec4385616d1fb5b0e7ca6a6bb66ff5a3d57f96`·원본 경로, ③ "레퍼런스에 나오는 상표·브랜드·서체는 각 회사의 자산이며 YUNABI 는 사용 권리를 갖지 않는다", ④ digital-agency-jp 에는 위 DADS CC BY 4.0 출처 표기를 추가. Duolingo·Cookpad·MUJI 는 `legacy_snapshot`(토큰 출처 미검증)이라 복사하지 않는다.

---

## 9. 책임자가 정할 것

| # | 질문 | 제안 |
|---|---|---|
| DQ-1 | 방향 A·B·C 중 무엇으로 | A. 와시를 아끼면 A + 만화·엔딩 영역에만 와시(§6 끝) |
| DQ-2 | 일본 전통색 이름 체계(washi·sumi·ai·beni)를 토큰 이름으로 남길까 | A 를 고르면 역할 이름(`canvas`, `ink`, `primary`)으로 바꾼다. 남색은 `brand-navy` |
| DQ-3 | Y-B2 의 "색 변경은 책임자 확인" — 로고 색은 그대로 두고, 흰 바탕에서는 남색 판을 까는 규칙(§4.1)을 받아들일까 | 받아들임. 로고 SVG 는 바꾸지 않는다 |
| DQ-4 | 장소 카테고리 6색 교체(§4.2), 특히 의료 `#B07A2E` → `#9A5B00` | 교체 (현행 값은 WCAG 미달) |
| DQ-5 | 웹폰트를 넣을까 | 넣지 않음. 한국어 Pretendard 는 이후 선택지 |
| DQ-6 | 게임 표현의 범위 — 일본어 탭 밖(홈의 카드 수, 지도 첫 등록)에도 축하를 둘까 | 일본어 탭 안에서만(D-P5-1) |
| DQ-7 | 다크 모드를 재작성 범위에 넣을까 (DG-1) | 토큰 2층 구조만 먼저 만들고 다크 값은 다음 단계. A 는 남색 크롬이 있어 옮기기 쉽다 |
| DQ-8 | oh-my-design 을 설치할까 | 설치하지 않음. 형식만 쓰고, 검증 명령은 버전 고정으로 일회성(§7.3) |
| DQ-9 | 레퍼런스 DESIGN.md 를 저장소에 복사할까 | 하지 않음. 한다면 §8 의 3개 + NOTICE |
| DQ-10 | 본문 기본 크기를 15 → 16px 로 올릴까 | 올림. 단 지도 목록 밀도(4행 이상)를 실기기에서 확인 |
