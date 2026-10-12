# YUI 설계 문서

기획 문서([docs/README.md](../README.md))를 이어받는 개발 설계 문서다.

**현재 기준은 MLP 다** ([PRD-MLP](../02-requirements/PRD-MLP.md) v1.2 + 그 뒤 책임자 결정). 서버 없는 클라이언트 단독 PWA 이고, 2026-10-12 구현된 코드(브랜치 머리 `78e2b4e` 기준)를 [RFC-0002](rfc/0002-mlp-client-only.md) 가 현행대로 기록한다. 2026-10-11 에 쓴 게시판·백엔드 설계(RFC-0001 등)는 **보류**다 — 지우지 않았다([ADR-0009](../adr/0009-client-only-mlp.md)).

**형식: SAD 대신 RFC 하나 + ADR.** MLP 는 컨테이너가 브라우저 하나뿐이라 아키텍처·저장·지도·캘린더·SW·데이터 형식·테스트를 RFC-0002 한 문서에 모았다. DB·API 가 없으므로 ERD·OpenAPI·인프라 문서는 MLP 용으로 만들지 않았다.

## MLP (현행)

| 문서 | 내용 | 기획 짝 |
|---|---|---|
| [rfc/0002-mlp-client-only.md](rfc/0002-mlp-client-only.md) | C4 컨텍스트·컨테이너, 스크립트 모듈 구조, 상태(`S`, `locState`), 내비게이션, 저장, 지도 수명 주기(시퀀스 3개), 캘린더·.ics, SW·오프라인, 데이터 형식, 테스트, 성능, 개인정보, 리스크, ML-\* 추적표 | PRD-MLP |
| [conventions.md](conventions.md) | 개발 컨벤션 — **일부 낡음**, 아래 "컨벤션 점검" | CLAUDE.md |

### ADR (새로 쓴 것은 모두 "제안됨")

| # | 결정 | 상태 |
|---|---|---|
| [0009](../adr/0009-client-only-mlp.md) | MLP 는 서버 없는 클라이언트 단독, 백엔드 계획 보류 | 제안됨 |
| [0010](../adr/0010-device-storage-localstorage.md) | 기기 저장 = `localStorage` + `yui.v1.*` 키 + 메모리 폴백 (쿠키·sessionStorage 기각) | 제안됨 |
| [0011](../adr/0011-curated-static-data.md) | 장소·일정은 직접 넣은 정적 데이터, Overpass 등 런타임 검색 기각 | 제안됨 |
| [0012](../adr/0012-prefecture-boundary-map.md) | 도도부현 경계 = Natural Earth 단순화본, 별도 파일 지연 로드, 같은 지도의 GeoJSON 레이어 | 제안됨 |
| [0013](../adr/0013-drop-single-file-vendor-leaflet.md) | 단일 파일 원칙 폐기(빌드 없음 유지), Leaflet vendor | 제안됨 — ADR-0003 대체 |
| [0014](../adr/0014-map-container-survives-render.md) | 지도 컨테이너를 `render()` 밖에 (BUG-01 수정) | 제안됨 |

## 게시판·백엔드 계획 — 보류 (ADR-0009)

M0 → M1(백엔드 기반) 전환 직전인 2026-10-11 에 작성. 게시판(PRD v0.4)을 다시 시작할 때 출발점이다. 본문은 고치지 않았다.

| 문서 | 내용 | 상태 |
|---|---|---|
| [tech-stack.md](tech-stack.md) | 기술 검토서 · 스택 선정 (가격·한도 확인일 2026-10-11) | **보류** |
| [rfc/0001-m1-backend-foundation.md](rfc/0001-m1-backend-foundation.md) | 백엔드 아키텍처: C4, 신뢰 경계, 쓰기 경로, 데이터 계층 | **보류** — RFC-0002 가 MLP 범위를 대신함 |
| [erd.md](erd.md) | 현행 vs 제안 ERD, 권한, 함수, 마이그레이션 순서 | **보류** |
| [openapi.yaml](openapi.yaml) | Edge Function + PostgREST RPC 설계 명세 | **보류** |
| [infra.md](infra.md) | 구성도, 환경, 배포, 백업 | **보류** (GitHub Pages 배포 부분은 MLP 에도 해당 — RFC-0002 §9, ADR-0008) |

| ADR | 결정 | 상태 |
|---|---|---|
| [0001](../adr/0001-structural-anonymity.md) | 익명성은 DB 구조로 강제 | 보류 (ADR-0009) — 게시판 전용이라 판단, RFC-0002 OQ-15 |
| [0002](../adr/0002-write-path-and-translation.md) | 본문 쓰기 = Edge Function 번역 후 service RPC | 보류 (ADR-0009) |
| [0003](../adr/0003-keep-single-file-client.md) | 단일 `index.html` 유지, SDK 없이 데이터 계층 | ADR-0013으로 대체됨 |
| [0004](../adr/0004-login-method.md) | 이메일 OTP + 방 초대 코드 | 보류 (ADR-0009) |
| [0005](../adr/0005-exchange-request-redesign.md) | 교환 요청 재설계 | 보류 (ADR-0009) |
| [0006](../adr/0006-append-only-moderation-log.md) | 운영 기록 추가 전용 | 보류 (ADR-0009) |
| [0007](../adr/0007-anonymous-metrics.md) | 익명 일별 카운터 지표 | 보류 (ADR-0009) |
| [0008](../adr/0008-hosting.md) | GitHub Pages 유지 + meta CSP·SRI | 제안됨 — **호스팅은 MLP 에도 유효.** CSP 초안(cdnjs·Supabase)과 SRI(cdnjs)는 MLP 와 맞지 않음 (RFC-0002 OQ-14) |

## 컨벤션 점검 (2026-10-12, `index.html`·`CLAUDE.md` 대조)

[conventions.md](conventions.md) 는 **부분적으로 유효**하다. 낡은 절에는 본문 안에 표시를 달았다(본문은 다시 쓰지 않음).

| 절 | 판정 | 이유 |
|---|---|---|
| §1.1 구조 | **낡음** | `change` 핸들러 없음. 지금 순서는 `T` → 데이터 → `S`/`store` → 뷰·`VIEWS` → 지도 런타임 → `render`/`go` → `click` → 경계 아래 시작 코드 (CLAUDE.md "The shape of the code" 가 원본) |
| §1.2 이름 | 규칙은 유효, **예시 낡음** | `POSTS`, `CBOARDS`, `REPORTS`, `feed()`, `sheet()`, `plistHTML()`, `ago`, `who`, `data-like` 등 없음. 새 이름: `store`, `VIEWS`, `PARENT`, 지도 모듈 변수 `L*` |
| §1.3 규칙 | 대부분 유효, **일부 낡음** | `fadeBoards` 없음. 지도 규칙은 "`LBOX` 가 `render()` 를 넘어 산다" 로 바뀜. CLAUDE.md 의 새 규칙 "뷰는 바깥 세계를 건드리지 않는다", "위치는 안내 후에만", "`SHELL` 에 새 파일" 이 빠져 있음 |
| §1.4 코드 모양 | 유효 | |
| §2 서비스 워커 | 유효, 보완 필요 | `.geojson` 도 network-first, `SHELL` 에 vendor·data 포함 |
| §3 SQL | 보류 | 백엔드 보류 |
| §4 실데이터 연결 | 대부분 보류 | C-2(경계 아래 부수 효과), C-7(`yui.` 접두어 + try/catch → 지금은 `yui.v1.` + `store`), C-8(`esc()` 는 `'` 를 바꾸지 않음)은 유효. C-3 의 상수·id 목록과 C-11 `refresh()` 는 낡음 |
| §5, §6 | 보류 | 백엔드 |
| §7 저장소·브랜치 | **일부 낡음** | 디렉터리에 `vendor/`, `data/` 가 없고 `art/`, `supabase/` 는 아직 없음. PR 체크의 "마이그레이션 익명성 케이스" 는 보류 |

## 열린 질문 (MLP 착수 후 정해야 할 상위 항목)

각 문서 끝의 "열린 질문" 이 원본이다.

| # | 질문 | 원본 |
|---|---|---|
| 1 | 앱 이름 (Q-M5). 저장 키 `yui.v1.*`·캐시 이름은 이름과 무관하게 유지할 것 | RFC-0002 OQ-1, ADR-0010 S-Q3 |
| 2 | 영어 장면 메모(`s`)가 모든 언어 사용자에게 보이는 것 — 그림 전까지 숨길지 | RFC-0002 OQ-2, R-1 |
| 3 | ~~"結 기준으로 보기" 를 고른 사용자가 위치를 다시 켤 길이 없음~~ — **해결** (`skip` 상태줄의 [위치 사용]) | RFC-0002 OQ-3 |
| 4 | `github.io` 출처 공유 — SW 캐시 삭제는 **해결**(`yui-` 접두어, `sw.js`). `localStorage` 공유는 열림 | RFC-0002 R-6 |
| 5 | 2차 데이터 규모, `data/*.json` 분리 여부, 언어 누락 처리, 갱신 담당(Q-M11). 형식 검사는 **해결**(헤드리스 데이터 검사) | ADR-0011 D-Q1~Q5 |
| 6 | Playwright 검사 50개를 저장소에 둘지 ("테스트 러너 없음" 예외), MLP 기준 QA 테스트 계획 | RFC-0002 OQ-10, OQ-11 |
| 7 | MLP 용 CSP (ADR-0008 초안 대체) | RFC-0002 OQ-14 |
| 8 | ADR-0001 을 보류로 둔 판단 확인 | RFC-0002 OQ-15, ADR-0009 C-Q1 |
| 9 | 지도 탭 재진입 때 마지막 모드 유지가 ML-M1 "진입 시 내 주위" 와 맞는가 | RFC-0002 OQ-7 |
| 10 | 부수 효과 경계가 주석 문자열(`/* Manifest shortcuts`) | RFC-0002 OQ-9 |
| 11 | network-first 에 시간 제한 없음 | RFC-0002 OQ-17 |

코드 리뷰 수정(`dd094f4`, `04cb476`, 브랜치 머리 `78e2b4e`)으로 해결된 항목은 RFC-0002·ADR 안에 **해결** 로 표시해 남겼다: 지도 재부착 동기화, 모드별 줌 보존, 도도부현 선택의 history, 섬 있는 도도부현 맞춤, 타일 실패 안내, 44px, SW 의 `res.ok`·캐시 접두어, 회차 취소, 데이터 검사, 경계 데이터 재현 절차.
