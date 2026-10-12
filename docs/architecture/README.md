# YUI 설계 문서

기획 문서([docs/README.md](../README.md))를 이어받는 개발 설계 문서다.

**다음 기준은 YUNABI v2 다** ([PRD-YUNABI](../02-requirements/PRD-YUNABI.md) v2.3 — D12~D20). 아래 "YUNABI v2 (제안)" 절의 문서가 설계이고 아직 구현되지 않았다. 코드는 여전히 v1.3 MLP(`index.html` @`8ce701a`, 브랜드·D14·D15 반영)다.

**현행 코드의 기준은 MLP 다** ([PRD-MLP](../02-requirements/PRD-MLP.md) v1.3 — v1.2 승인 + 책임자 결정 D8~D11). 서버 없는 클라이언트 단독 PWA 이고, 2026-10-12 구현된 코드(브랜치 머리 `7b6d631` 기준)를 [RFC-0002](rfc/0002-mlp-client-only.md) 가 현행대로 기록한다. 2026-10-11 에 쓴 게시판·백엔드 설계(RFC-0001 등)는 **보류**다 — 지우지 않았다([ADR-0009](../adr/0009-client-only-mlp.md)).

**형식: SAD 대신 RFC 하나 + ADR.** MLP 는 컨테이너가 브라우저 하나뿐이라 아키텍처·저장·지도·캘린더·SW·데이터 형식·테스트를 RFC-0002 한 문서에 모았다. DB·API 가 없으므로 ERD·OpenAPI·인프라 문서는 MLP 용으로 만들지 않았다.

## YUNABI v2 (제안, 2026-10-12)

형식은 RFC 하나 + ADR 에 ERD·OpenAPI 를 따로 둔다(컨테이너 셋: 사용자 PWA, 관리자 콘솔, Supabase).

| 문서 | 내용 | 기획 짝 |
|---|---|---|
| [tech-stack-v2.md](tech-stack-v2.md) | 기술 검토·선정: 프레임워크(Svelte 5 제안, React 전환 조건), Vite 8·TS, 테스트(Vitest 4·Playwright·pgTAP), 린트, 백엔드(Supabase 92 / Firebase 72 / Cloudflare 57 / PocketBase 47), 호스팅, 보안 도구·사실 확인(2026-10-12) | PRD-YUNABI §7, §6.1 |
| [rfc/0003-yunabi-v2.md](rfc/0003-yunabi-v2.md) | C4 컨텍스트·컨테이너·신뢰 경계, 폴더 구조, 라우팅·뒤로 가기 대응, 상태, i18n, 지도 수명 주기, 그림 파일 규칙, 데이터·캐시·오프라인, 익명·관리자 인증, 쓰기 경로·검증, 빈도 제한, 신고·자동 숨김·관리, 개인정보·보관, **위협 모델(STRIDE → Y-S)**, v1.3 이전, 테스트·CI, 배포, 추적표 | PRD-YUNABI 전체 |
| [erd-v2.md](erd-v2.md) | ERD, 테이블·제약(열마다 근거), 권한·RLS, 함수 시그니처, 정기 작업, 마이그레이션 순서, pgTAP 권한 매트릭스 | 기능 요구 Y-M·K·R·E·A, Y-P5, Y-S |
| [openapi-v2.yaml](openapi-v2.yaml) | 클라이언트·관리자 API (PostgREST 뷰·RPC, Auth) | 같음 |

| ADR | 결정 | 상태 |
|---|---|---|
| [0015](../adr/0015-frontend-framework-svelte.md) | Svelte 5 + Vite + TS 정적 SPA (SvelteKit 없음), React 전환 조건 | 제안됨 |
| [0016](../adr/0016-toolchain-test-ci.md) | 도구·테스트·CI (ESLint+Prettier, Vitest 4, Playwright, pgTAP, GitHub Actions) | 제안됨 |
| [0017](../adr/0017-shared-data-server.md) | 장소·일정을 서버에 공유 — ADR-0009 일부 대체 | 제안됨 |
| [0018](../adr/0018-backend-supabase-anonymous.md) | Supabase, 첫 쓰기 때 익명 계정, 관리자 = 허용 목록 + 비밀번호 + TOTP. **ADR-0001~0008 재사용 판정표** | 제안됨 |
| [0019](../adr/0019-moderation-autohide.md) | 서로 다른 계정 3개 → 자동 숨김, 복원 보호(수정 시 해제), 정지, 감사 기록 (D20 으로 단순화) | 제안됨 |
| [0020](../adr/0020-hosting-github-pages-actions.md) | 사용자 앱은 같은 GitHub Pages 주소(Actions 배포), 관리자 콘솔은 헤더 가능한 별도 출처(Cloudflare) | 제안됨 |
| [0021](../adr/0021-data-access-views-rpc.md) | 테이블 비노출 스키마, 읽기는 공개 뷰, 쓰기는 정의자 RPC | 제안됨 |
| [0022](../adr/0022-security-baseline.md) | 보안 기준선 Y-S1~S12 | 제안됨 |

ADR-0009 의 상태 줄을 "ADR-0017으로 일부 대체됨" 으로 바꿨다(본문 그대로). ADR-0011(정적 데이터)·ADR-0013(빌드 없음)도 v2 에서 사실상 대체되지만 상태 줄은 책임자 확인 후 바꾼다(RFC-0003 OQ-15).

**보안 검토 반영 (2026-10-12):** 독립 보안 검토(기준 `da55060`, "보완 필요 — 구조는 견고")의 지적 #1~#14·낮음·nit 를 tech-stack-v2·RFC-0003·ERD v2·openapi-v2·ADR-0018~0022 에 반영했다(각 문서에 `[검토 #n]` 표시). 치명 두 건: 폴링이 기숙사 IP 쓰기 한도를 소진(→ 읽기 RPC 는 GET, 쓰기 RPC 만 계수), `PUBLIC` 의 기본 EXECUTE(→ 회수 + 카탈로그 전수 검사).

**구현 전에 책임자 결정이 필요한 것:** 프레임워크 승인(Svelte 또는 React — 유지보수자에 따라), 관리자 콘솔의 별도 호스트(Cloudflare 계정), 관리자 인원·TOTP, 운영 첫 배포 시점(Y-2 이후 제안), 반영 시간 "10초" 해석(RFC-0003 OQ-1), 기숙사 공인 IP/CIDR(OQ-E), 비공개 운영 저장소(OQ-F), 스크립트 대량 숨김의 수동 복원 비용 수용(OQ-17), `goo.gl/maps` 제외(OQ-16). 전체 목록은 RFC-0003 §24.

## MLP (현행)

| 문서 | 내용 | 기획 짝 |
|---|---|---|
| [rfc/0002-mlp-client-only.md](rfc/0002-mlp-client-only.md) | C4 컨텍스트·컨테이너, 스크립트 모듈 구조, 상태(`S`, `locState`), 내비게이션, 저장, 지도 수명 주기(시퀀스 3개), 캘린더·.ics, SW·오프라인, 데이터 형식, 테스트, 성능, 개인정보, 리스크, ML-\* 추적표 | PRD-MLP |
| [conventions.md](conventions.md) | 개발 컨벤션 — **일부 낡음**, 아래 "컨벤션 점검" | CLAUDE.md |

### ADR (새로 쓴 것은 모두 "제안됨")

| # | 결정 | 상태 |
|---|---|---|
| [0009](../adr/0009-client-only-mlp.md) | MLP 는 서버 없는 클라이언트 단독, 백엔드 계획 보류 | ADR-0017으로 일부 대체됨 (공유 데이터 부분) |
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
| 12 | ADR 상태값: "보류" 가 architect 규칙의 상태 목록에 없고, ADR-0003 의 "ADR-0013으로 대체됨" 은 0013 이 아직 제안됨이다 — 0001~0007 의 상태를 책임자가 확정할 것 | RFC-0002 OQ-20 |

코드 리뷰 수정(`dd094f4`, `04cb476`, `78e2b4e`, `68604ad`, 브랜치 머리 `7b6d631`)으로 해결된 항목은 RFC-0002·ADR 안에 **해결** 로 표시해 남겼다: 지도 재부착 동기화(핀 제목 포함), 모드별 줌 보존, 도도부현 선택의 history, 섬 있는 도도부현 맞춤, 타일 실패 안내, 44px, SW 의 `res.ok`·캐시 접두어, 회차 취소, 데이터 검사(일정·장소 id 중복 포함), 런타임 함수 존재 검사, 저장된 `cg` 모양 검사, 경계 데이터 재현 절차.
