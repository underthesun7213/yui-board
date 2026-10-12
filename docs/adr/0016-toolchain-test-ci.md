# ADR-0016 · 빌드·검사 도구와 CI — Vite 8, TS strict, ESLint+Prettier, Vitest 4, Playwright, pgTAP, GitHub Actions

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 D19, §7 "품질"·"테스트 데이터", 마일스톤 Y-1 완료 기준(옮긴 브라우저 검사 통과), Y-C2, Y-S2, Y-S4~S6, Y-S11 |
| 관련 | [tech-stack-v2 §3·§4·§5.6](../architecture/tech-stack-v2.md), [RFC-0003 §19](../architecture/rfc/0003-yunabi-v2.md#19-테스트-전략과-ci-제안--adr-0016), ADR-0013(빌드 없음 — 대체), [conventions.md](../architecture/conventions.md) |

## 배경

v1.3 은 테스트 러너가 없었다: CLAUDE.md 의 `node -e` 헤드리스 검사(모든 뷰 × 3개 언어, 데이터 형식)와 저장소 밖 Playwright 50개 검사(RFC-0002 §11). PRD v2 는 "저장소 안 자동 테스트를 한 명령으로, 변경마다 CI" 와 "초기 데이터 0 → 테스트용 고정 데이터" 를 요구한다. D20 은 의존성·비밀 검사를 CI 에 요구한다.

## 결정

1. **빌드:** Vite 8 (2026-03-12 안정판), TypeScript `strict` + `noUncheckedIndexedAccess`, 타입 검사 `svelte-check`. 사용자 앱(`vite.config.ts`)과 관리자 콘솔(`vite.admin.config.ts`) 두 빌드.
2. **린트·포맷:** ESLint 9 flat config + typescript-eslint + eslint-plugin-svelte + Prettier(+ svelte 플러그인). 오류로 두는 규칙: `svelte/no-at-html-tags`, `no-eval`, `no-implied-eval`, `features/`·`ui/` 폴더에서 `localStorage`·`navigator`·`fetch`·`leaflet` 직접 사용 금지(`no-restricted-globals`/`no-restricted-imports` — v1.3 "뷰는 바깥 세계를 건드리지 않는다" 의 구조화).
3. **테스트 층:** Vitest 4 — 단위(`domain/**` 등), **렌더 검사**(`svelte/server` 로 모든 라우트 × en/ja/ko × 상태 조합을 HTML 로 그려 예외·`undefined`·`NaN`·`[object Object]`·라우트 누락 검사 = v1.3 헤드리스 검사 이전), 컴포넌트(브라우저 모드, Playwright 프로바이더). Playwright E2E(Chromium 375px) — `page.route` 로 `tests/fixtures` 고정 데이터. pgTAP(`supabase test db`) — 권한·검증·신고·감사(ERD v2 §9). 로컬 Supabase 통합 E2E.
4. **v1.3 50개 검사:** 원본 스크립트가 저장소에 없으므로 RFC-0002 §11.2 범주표를 펼쳐 `tests/e2e/v13-parity.spec.ts` 로 다시 쓰고 테스트 이름에 ML-\*/Y-\* ID 를 붙인다. Y-1 완료 = 이 파일 통과.
5. **명령:** `npm test` = 린트 + 타입 + 단위·렌더·컴포넌트 + E2E(고정 데이터). `npm run test:db`, `npm run test:backend`, `npm run test:security` 는 로컬 Supabase(Docker) 필요.
6. **CI (GitHub Actions):** PR·push 마다 `quality`(npm ci → 린트 → 타입 → 단위·렌더 → 번들 크기 한도), `e2e`, `security`(`npm audit --audit-level=high` 실패, gitleaks). `supabase/` 변경 또는 `main` 병합 시 `db`(setup-cli → `supabase start` → `db reset` → pgTAP → 통합 E2E → 직접 요청 보안 테스트). `main` 병합 시 빌드 → 산출물 비밀 검사 → 배포(ADR-0020). 예약: 백업·감시·ZAP(ADR-0022).
7. **CI 위생:** 잠금 파일 커밋 + `npm ci`, 서드파티 액션은 커밋 SHA 고정, 워크플로마다 `permissions:` 최소, `main` 보호(PR + 필수 검사), Dependabot(보안·버전).

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| Biome 2 (린트+포맷 단일 도구) | 빠르지만 Svelte 지원이 부분적(3자 자료, 2026) |
| Jest | Vite 설정을 공유하지 못해 변환 설정이 중복. Vitest 가 같은 API |
| Cypress | Playwright 가 v1.3 검사 도구였고 멀티 컨텍스트(두 기기 반영 시험)·`request` API(직접 요청 보안 테스트)가 있다 |
| DB 테스트를 JS 통합 테스트로만 | 권한 매트릭스는 역할을 바꿔 가며 SQL 로 확인하는 편이 빠르고 정확하다. erd.md §8 의 방식 |
| 원격 스테이징 프로젝트에서 DB 테스트 | 무료 프로젝트 2개·일시정지(tech-stack-v2 §5.2). 로컬 스택이 매번 깨끗하다 |

## 결과

- 좋은 점: v1.3 의 "문법 검사만으로는 부족하다(함수가 사라져도 통과)" 문제를 타입·렌더 검사·E2E 가 구조적으로 막는다. 권한 규칙이 테스트로 문서화된다.
- 나쁜 점: 로컬 DB 테스트에 Docker 가 필요하다. CI 시간이 늘어난다(DB 작업은 조건부로 완화). 의존성이 생겨 Dependabot PR 관리가 필요하다.
- **ADR-0013 처리:** 이 ADR(빌드 도입)과 ADR-0015(Leaflet npm)로 ADR-0013 결정 1·5·6 은 사실상 대체된다. ADR-0013 은 아직 "제안됨" 이라 상태 줄은 바꾸지 않았다 — 승인 후 "ADR-0016으로 대체됨" 으로 바꿀 것을 제안(RFC-0003 OQ-15).
- CLAUDE.md 는 재작성 시점(Y-1)에 새 구조·명령·원칙(RFC-0003 §5.1)으로 다시 쓴다 — 이 ADR 은 코드·CLAUDE.md 를 고치지 않는다.

## 열린 질문

| # | 질문 |
|---|---|
| TC-Q1 | v1.3 Playwright 50개 검사 원본이 어디에 있는가 (tech-stack-v2 TS-Q4) |
| TC-Q2 | 번들 크기 한도(홈 진입 gzip 60 KB)를 CI 실패 조건으로 할지 |
| TC-Q3 | 브랜치 보호·PR 기반 작업을 1~2인 규모에서도 강제할지 (conventions CV-Q1) |
