# ADR-0014 · 지도 컨테이너를 `render()` 바깥에 두어 다시 그려도 지도가 살아남게 한다 (BUG-01)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-MLP ML-M11, ML-M5, ML-M9, ML-C2, [QA 리포트](../08-qa/qa-report.md) BUG-01 · TC-P-06 · TC-P-07, CLAUDE.md 지도 규칙 |
| 관련 | [RFC-0002 §7](../architecture/rfc/0002-mlp-client-only.md#7-지도-수명-주기--adr-0014-adr-0012-adr-0013), ADR-0012, ADR-0013 |

## 배경

앱은 `render()` 가 `#main.innerHTML` 을 통째로 바꾸는 구조다(CLAUDE.md). 프로토타입에서 Leaflet 컨테이너 `#lmap` 은 `#main` 안에 있었다. 그래서 언어 메뉴만 열어도(`render()`) 컨테이너가 새 빈 `div` 로 바뀌고, `LMAP` 변수는 남아 있어 `initMap()` 이 다시 불리지 않았다 → 빈 지도(BUG-01, 높음). 지도 탭을 떠날 때는 지도를 제거해 돌아올 때마다 새로 만들었다(줌·위치 초기화, 타일 재요청).

MLP 는 언어 기억(ML-C2), 모드 전환(ML-M1), 경계 레이어(ML-M5)가 더해져 `render()` 와 지도가 만나는 지점이 늘었다. ML-M11: 지도는 한 번만 만들고 화면 전환·필터·모드·언어 변경에도 유지한다.

## 결정 (현행 구현과 같다)

1. Leaflet 컨테이너 `LBOX`(`<div id="lmap">`)는 **모듈 변수로 보관**하고 어떤 뷰 HTML 에도 들어가지 않는다.
2. `mapView()` 는 빈 자리 `<div id="lmapslot">`(로딩 문구 포함)만 그린다.
3. `render()` 끝에서 지도 화면이면 `mountMap()` 이 `LBOX` 를 슬롯에 **다시 붙이고** `invalidateSize()` → `labelMap()`(Leaflet 이 그리는 확대 버튼·結 마커·내 위치 제목을 현재 언어로) → `syncMap(MAPSTALE)`(레이어를 상태에 맞추고, 화면 밖에서 결과가 왔으면 다시 맞춤) 한다. `LBOX` 가 없을 때만 Leaflet 을 불러와 `initMap()` 으로 한 번 만든다.
4. 지도 화면을 떠나면 `LBOX` 는 DOM 에서 떨어질 뿐 **파괴하지 않는다**(`map.remove()` 를 부르지 않는다). 돌아오면 같은 줌·중심.
5. 지도 화면 안의 컨트롤(모드, 위치, 도도부현, 카테고리, 핀·목록 선택)은 `render()` 를 부르지 않고 `updateMap()` 을 부른다. `updateMap()` 은 하위 컨테이너 5개(`#mmodes`, `#mstatus`, `#mfilters`, `#pcardwrap`, `#plist`)의 `innerHTML` 과 Leaflet 레이어만 고친다.
6. 비동기 결과(위치, 경계 데이터)는 `mapChanged()`/`locChanged()` 로 들어온다. 지도 화면이면 바로 `updateMap(true)`, 아니면 `MAPSTALE=true` 로 표시해 다음 `mountMap()` 이 반영한다. 위치 결과는 near 모드에서만 지도를 다시 맞춘다.
7. 모드 전환(`setMode`)은 떠나는 모드의 중심·줌을 `MODEVIEW` 에 두고, 돌아온 모드에 저장된 화면이 있으면 맞춤 없이 되돌린다.
8. 지도 안의 history 이동(도도부현 선택을 OS 뒤로 가기로 되돌림)은 `popstate` 가 `render()` 없이 `updateMap(true)` 로 제자리에서 처리한다.

결정 6~8 은 코드 리뷰 뒤 추가됐다(`dd094f4`, `04cb476`, `78e2b4e`).

## 고려한 대안

| 대안 | 장점 | 단점 / 기각 이유 |
|---|---|---|
| `#lmap` 을 `#main` 밖 고정 위치에 두고 CSS 로 보이기·숨기기 | 떼었다 붙이지 않는다 | 지도가 문서 흐름의 고정 위치에 묶여 지도 화면 레이아웃(상태줄·칩 아래, 목록 위)을 `#main` 과 따로 맞춰야 한다. 스크롤·sticky 헤더와 어긋난다 |
| 렌더마다 `map.remove()` 후 재생성 | 상태 동기화 문제가 없다 | 줌·위치 초기화, 타일 재요청(OSM 정책상 불필요한 요청), 깜박임. ML-M11 위반 |
| 재생성 + 중심·줌 저장·복원 | 위치는 유지 | 타일·레이어 재생성 비용, 클러스터 펼침 상태 소실. 근본 원인(컨테이너 교체)은 그대로 |
| DOM 비교(diff) 렌더러·프레임워크 도입 | 일반 해법 | 빌드·의존성(ADR-0013 결정 1 "빌드 없음"). 화면 하나의 문제에 과하다 |
| 지도 화면만 부분 렌더(지도 화면에서는 `render()` 금지) | 단순 | 언어 변경·popstate 는 결국 전체 렌더가 필요하다 — 결정 5 가 이 대안을 부분적으로 포함한다 |

## 결과

- 좋은 점: BUG-01 이 구조적으로 사라졌다(언어 메뉴·언어 변경·탭 왕복·모드 전환·뒤로 가기 후 같은 인스턴스 — Playwright 로 확인, RFC-0002 §11.2). 타일 재요청이 줄었다. 규칙이 짧다: "지도 컨트롤은 `updateMap()`".
- 나쁜 점:
  - 두 갈래의 갱신 경로(`render()` / `updateMap()`)를 개발자가 구분해야 한다. 지도 화면에 새 컨트롤을 넣을 때 `updateMap()` 의 컨테이너 목록에도 넣어야 한다.
  - **해결:** 이 ADR 첫 판의 "재부착 때 레이어를 상태와 맞추지 않는다(화면 밖에서 끝난 위치·경계 로드, 언어 변경 후 라벨)" 는 결정 3·6 의 `labelMap()`·`syncMap(MAPSTALE)`·`MAPSTALE` 로 해결됐다(Playwright "off-map location and boundaries", "translated zoom label"). 핀 `title` 도 해결: 언어 변경은 늘 `render()` → `mountMap()` → `syncMap()` 을 거쳐 핀을 현재 언어로 다시 만든다(`index.html:1576`, `:1618-1621`) — RFC-0002 R-4.
  - 갱신 경로가 셋(`render()`/`mountMap()`, `updateMap()`, `popstate` 제자리 갱신)이 되었다. 비동기 결과는 반드시 `mapChanged()`/`locChanged()` 를 거쳐야 한다 — 새 비동기 로더를 넣을 때 지킬 규칙.
  - 떨어진 지도도 메모리에 남는다(한 개, 무시할 수준).
  - `dragScroll()` 이 `#mfilters` 에 직접 리스너를 단다 — "`#main` 안 요소에 리스너 금지" 의 예외. `updateMap()` 은 `#mfilters` 의 내용만 바꾸므로 유지되고, `render()` 때는 새 요소에 `el._ds` 플래그로 한 번만 단다.

## 열린 질문

| # | 질문 |
|---|---|
| M-Q1 | `mountMap()` 에서 레이어를 재조정할 것인가 — **해결** (`syncMap(MAPSTALE)`, 결정 3) |
| M-Q2 | 모드별 마지막 화면을 기억할지 (ML-M5 "모드를 오가도 줌 보존") — **해결** (`MODEVIEW`, 결정 7). 남은 것: 지도 탭 재진입 때 마지막 모드를 유지하는 것이 ML-M1 "진입 시 내 주위" 와 맞는가 (RFC-0002 OQ-7, 열림) |
