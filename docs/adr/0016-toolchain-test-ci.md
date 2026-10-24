# ADR-0016 · 빌드·검사 도구와 CI — Vite 8, TS strict, ESLint+Prettier, Vitest 5, Playwright, pgTAP, GitHub Actions

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 D19, §7 "품질"·"테스트 데이터", 마일스톤 Y-1 완료 기준(옮긴 브라우저 검사 통과), Y-C2, Y-S2, Y-S4~S6, Y-S11 |
| 관련 | [tech-stack-v2 §3·§4·§5.6](../architecture/tech-stack-v2.md), [RFC-0003 §19](../architecture/rfc/0003-yunabi-v2.md#19-테스트-전략과-ci-제안--adr-0016), ADR-0013(빌드 없음 — 대체), [ADR-0023](0023-frontend-framework-react.md)(React), [conventions.md](../architecture/conventions.md) |
| 개정 | 2026-10-12 — 책임자 결정 D24(React, ADR-0023)에 맞춰 결정 1~3 의 Svelte 도구를 React 도구로 바꿨다(이 ADR 은 아직 "제안됨" 이라 본문을 고쳤다). 첫 판의 Svelte 도구는 각 항목에 "(이전 안: …)" 으로 남겼다 |
| 메모 | 2026-10-22 — 결정 5·6 의 `npm run test:security`, 별도 `security` 잡, `supabase start`(Docker)는 [ADR-0022](0022-security-baseline.md) 와 [y3s-automated-checks](../architecture/y3s-automated-checks.md) 가 대체한다: gitleaks(이력·`dist`·`dist-admin`)와 `npm audit` 는 `quality` 잡, HTTP 직접 요청 스위트는 `test:backend` 의 `tests/e2e-backend/security.spec.ts`, 로컬 스택은 Docker 없이 `scripts/local-stack`, ZAP 은 `zap.yml`. 본문은 고치지 않았다 |
| 개정 2 | 2026-10-12 — React 전환 문서 검토("보완 필요") 반영. 설치 버전 고정, ESLint 선택자 전문, `prerender` 렌더 검사. 고친 곳에 `[검토 R-n]`(검토 지적 번호). 근거·결정은 [ADR-0024](0024-react-switch-review-fixes.md) |

## 배경

v1.3 은 테스트 러너가 없었다: CLAUDE.md 의 `node -e` 헤드리스 검사(모든 뷰 × 3개 언어, 데이터 형식)와 저장소 밖 Playwright 50개 검사(RFC-0002 §11). PRD v2 는 "저장소 안 자동 테스트를 한 명령으로, 변경마다 CI" 와 "초기 데이터 0 → 테스트용 고정 데이터" 를 요구한다. D20 은 의존성·비밀 검사를 CI 에 요구한다.

## 결정

1. **빌드:** Vite 8 (2026-03-12 안정판) + `@vitejs/plugin-react`, TypeScript `strict` + `noUncheckedIndexedAccess`, 타입 검사 `tsc -b --noEmit` (이전 안: `svelte-check`). 사용자 앱(`vite.config.ts`)과 관리자 콘솔(`vite.admin.config.ts`) 두 빌드. meta CSP 는 운영 빌드에만 주입(ADR-0023 결정 8). **Y-1 설치 고정** `[검토 R-8]`: vite 8.3.4, `@vitejs/plugin-react` 6.1.2, **typescript 6.0.3**(typescript-eslint 8.71.1 의 peer 가 `typescript >=4.8.4 <6.1.0` 이라 TS 7 은 지원 밖 — 5.x 로 내리지 않고 6.0.3), vite-plugin-pwa 2.0.0(`injectManifest`) + workbox-\* 7.4.1.
2. **린트·포맷:** ESLint **9.39.5** flat config(**9 에 고정** — `eslint-plugin-react` 7.37.5 의 ESLint 10 비호환 보고, ADR-0023 RE-Q4) + typescript-eslint 8.71.1 + `eslint-plugin-react` 7.37.5 + `eslint-plugin-react-hooks` **7.1.1** + Prettier 3.9.10 `[검토 R-8]` (이전 안: eslint-plugin-svelte, prettier-plugin-svelte). 오류로 두는 규칙: **`react/no-danger`**(이전 안: `svelte/no-at-html-tags`), `innerHTML`·`outerHTML` 대입과 `insertAdjacentHTML`·`document.write` 금지(`no-restricted-syntax`), `src/map/**` 의 Leaflet HTML API 인자 규칙(DOM 팩토리 호출만), `react-hooks/rules-of-hooks`, `no-eval`, `no-implied-eval`, `features/`·`ui/` 폴더에서 `localStorage`·`navigator`·`fetch`·`leaflet` 직접 사용 금지(`no-restricted-globals`/`no-restricted-imports` — v1.3 "뷰는 바깥 세계를 건드리지 않는다" 의 구조화).
   - **flat config 의 덮어쓰기** `[검토 R-6]`: 한 파일에 설정 블록 여러 개가 걸리면, 같은 규칙의 심각도·옵션은 **뒤 블록이 통째로 바꾼다**(배열을 합치지 않는다). 그래서 `src/map/**` 블록의 `no-restricted-syntax` 가 `src/**` 의 HTML 선택자를 지운다. 이를 막으려고 `eslint.config.js` 에 선택자 배열을 상수로 두고 블록마다 펼친다: `src/**` → `HTML_SINKS`, `src/map/**`(`ignores: ['src/map/icons.ts']`) → `[...HTML_SINKS, ...LEAFLET_SINKS]`, `src/map/icons.ts` → `[...HTML_SINKS, ...LEAFLET_SINKS.slice(0, 2), ICON_HTML]`. 여러 블록에서 쓰는 다른 규칙(`no-restricted-imports` 등)도 같은 방식이다. 회귀 검사: 단위 테스트 하나가 `new ESLint().calculateConfigForFile('src/map/runtime.ts')` 결과에 H1 선택자가 있는지 확인한다.
   - **`react/no-danger` 가 못 보는 길** `[검토 R-6]`: 이 규칙은 JSX 속성만 본다. 그래서 객체 키로 넘기는 `createElement('div', {dangerouslySetInnerHTML})`, 펼침(`{...props}`), `el['innerHTML'] = …` 를 아래 H3·H4 로 막는다.
   - **선택자 전문** (`no-restricted-syntax`, 모두 `error`, 메시지는 ADR-0024 를 가리킴):

     | # | 범위 | 선택자 | 막는 것 |
     |---|---|---|---|
     | H1 | `src/**` | `AssignmentExpression[left.type='MemberExpression'][left.property.name=/^(innerHTML\|outerHTML)$/]` | `el.innerHTML = …`, `+=` 포함 |
     | H2 | `src/**` | `AssignmentExpression[left.type='MemberExpression'][left.computed=true][left.property.value=/^(innerHTML\|outerHTML)$/]` | `el['innerHTML'] = …` |
     | H3 | `src/**` | ``AssignmentExpression[left.type='MemberExpression'][left.computed=true][left.property.type='TemplateLiteral'][left.property.quasis.0.value.cooked=/^(innerHTML\|outerHTML)$/]`` | ``el[`innerHTML`] = …`` |
     | H4 | `src/**` | `Property[key.name=/^(innerHTML\|outerHTML\|dangerouslySetInnerHTML)$/]`, `Property[key.value=/^(innerHTML\|outerHTML\|dangerouslySetInnerHTML)$/]` | 객체 키로 넘기기 — `createElement(…, {dangerouslySetInnerHTML})`, `Object.assign(el, {innerHTML})`, 펼침용 객체 |
     | H5 | `src/**` | `JSXAttribute[name.name='dangerouslySetInnerHTML']` | 사용자 컴포넌트에 넘기는 경우까지(`react/no-danger` 는 DOM 요소 중심) |
     | H6 | `src/**` | `CallExpression[callee.property.name=/^(insertAdjacentHTML\|setHTMLUnsafe\|createContextualFragment)$/]` | 문자열을 HTML 로 해석하는 DOM API |
     | H7 | `src/**` | `CallExpression[callee.object.name='document'][callee.property.name=/^(write\|writeln)$/]` | `document.write` |
     | L1 | `src/map/**` | `CallExpression[callee.property.name=/^(bindTooltip\|bindPopup\|setContent\|setTooltipContent\|setPopupContent)$/]:not([arguments.0.type='CallExpression'][arguments.0.callee.name=/^(textNode\|pinNode\|clusterNode\|meNode)$/])` `[Y-1 구현]` | 첫 인자가 DOM 팩토리 호출이 아닌 **모든 경우** — `bindTooltip(p.name)`, 템플릿, 변수, 함수, 인자 없음 |
     | L2 | `src/map/**` | `CallExpression[callee.property.name=/^(popup\|tooltip)$/] > ObjectExpression > Property[key.name='content']:not([value.type='CallExpression'][value.callee.name=/^(textNode\|pinNode\|clusterNode\|meNode)$/])` `[Y-1 구현]` | `L.popup({content})`, `L.tooltip({content})` |
     | L3 | `src/map/**` (icons.ts 제외) | `CallExpression[callee.property.name='divIcon']`, `CallExpression[callee.name='divIcon']`, `NewExpression[callee.property.name='DivIcon']` | `divIcon` 은 `icons.ts` 에서만 |
     | ICON_HTML | `src/map/icons.ts` | `CallExpression[callee.property.name='divIcon'] > ObjectExpression > Property[key.name='html']:not([value.type='Literal']):not([value.type='CallExpression'][value.callee.name=/^(textNode\|pinNode\|clusterNode\|meNode)$/])` `[Y-1 구현]` | `html` 은 문자열 리터럴이거나 `map/layers.ts` 의 DOM 팩토리 호출만(템플릿·변수·그 밖의 호출 금지). 핀·클러스터 개수·"結" 홈 마커·"현재 위치" 제목이 글자를 담기 때문이다. 팩토리는 글자를 `textContent` 로 넣고, Leaflet 1.9 `DivIcon.createIcon` 은 Element 를 HTML 로 해석하지 않고 붙인다. `icons.ts` 는 `no-restricted-imports` 로 `./layers` 외 import 금지(`../state/*`·`../api/*`·`./runtime` 포함) — 사용자 데이터가 HTML 로 들어올 길이 없다 |

     (표 안의 `\|` 는 마크다운 표 때문에 쓴 것이고, 실제 정규식은 `|`.) `map/layers.ts` 에 DOM 노드 팩토리를 새로 두면 L1·L2·ICON_HTML 의 `^(textNode|pinNode|clusterNode|meNode)$` 에 그 이름을 더한다 `[Y-1 구현]`. 선택자마다 통과·실패 예를 `tests/unit/lint.test.ts` 가 확인한다 `[Y-1 구현]`. 린트가 못 잡는 것은 동적 키(`el[k] = …`)와 `Reflect.set` 이다 → 리뷰 규칙 + E2E XSS 페이로드로 막는다.
3. **테스트 층:** Vitest **5.0.3** `[검토 R-8]` — 단위(`domain/**`, `state/**`, `app/router.ts`, `map/runtime.ts` 의 attach/detach·StrictMode 순서·ensure 대기 중 detach), **렌더 검사**(모든 라우트 × en/ja/ko × 상태 조합을 HTML 로 그려 예외·`undefined`·`NaN`·`[object Object]`·라우트 누락 검사 = v1.3 헤드리스 검사 이전; 이전 안: `svelte/server`). 렌더는 **`react-dom/static` 의 `prerender`** 로 한다 `[검토 R-3]`. `renderToString` 은 `React.lazy` 라우트에서 Suspense fallback 만 내보내 검사가 아무것도 검사하지 않고 통과하기 때문이다. `prerender` 는 지연 청크가 준비될 때까지 기다린다. 실패 조건은 셋이다: `onError` 호출이 있을 때, 출력에 클라이언트 렌더 표시 `<!--$!-->` 가 있을 때, 로딩 fallback 표지 `data-route-loading` 이 있을 때(ADR-0024 결정 3). 그리고 컴포넌트(**React Testing Library**, 브라우저 모드 Playwright 프로바이더 기본, jsdom 허용). Playwright E2E(Chromium 375px) — `page.route` 로 `tests/fixtures` 고정 데이터. pgTAP(`supabase test db`) — 권한·검증·신고·감사(ERD v2 §9). 로컬 Supabase 통합 E2E.
4. **v1.3 50개 검사:** 원본 스크립트가 저장소에 없으므로 RFC-0002 §11.2 범주표를 펼쳐 `tests/e2e/v13-parity.spec.ts` 로 다시 쓰고 테스트 이름에 ML-\*/Y-\* ID 를 붙인다. Y-1 완료 = 이 파일 통과.
5. **명령:** `npm test` = 린트 + 타입 + 단위·렌더·컴포넌트 + E2E(고정 데이터). `npm run test:db`, `npm run test:backend`, `npm run test:security` 는 로컬 Supabase(Docker) 필요.
6. **CI (GitHub Actions):** PR·push 마다 `quality`(npm ci → 린트 → 타입 → 단위·렌더 → 번들 크기 한도), `e2e`, `security`(`npm audit --audit-level=high` 실패, gitleaks). `supabase/` 변경 또는 `main` 병합 시 `db`(setup-cli → `supabase start` → `db reset` → pgTAP → 통합 E2E → 직접 요청 보안 테스트). `main` 병합 시 빌드 → 산출물 비밀 검사 → 배포(ADR-0020). 예약: 백업·감시·ZAP(ADR-0022).
7. **CI 위생:** 잠금 파일 커밋 + `npm ci`, 서드파티 액션은 커밋 SHA 고정, 워크플로마다 `permissions:` 최소, `main` 보호(PR + 필수 검사), Dependabot(보안·버전).

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| Biome 2 (린트+포맷 단일 도구) | 첫 판의 기각 이유는 Svelte 지원이 부분적인 것(3자 자료, 2026). React 로 바뀐 뒤에는 Leaflet API 인자 금지 같은 AST 선택자 규칙을 Biome 로 쓸 수 있는지 확인하지 않아 확인된 ESLint 경로를 유지 |
| Jest | Vite 설정을 공유하지 못해 변환 설정이 중복. Vitest 가 같은 API |
| Cypress | Playwright 가 v1.3 검사 도구였고 멀티 컨텍스트(두 기기 반영 시험)·`request` API(직접 요청 보안 테스트)가 있다 |
| DB 테스트를 JS 통합 테스트로만 | 권한 매트릭스는 역할을 바꿔 가며 SQL 로 확인하는 편이 빠르고 정확하다. erd.md §8 의 방식 |
| 원격 스테이징 프로젝트에서 DB 테스트 | 무료 프로젝트 2개·일시정지(tech-stack-v2 §5.2). 로컬 스택이 매번 깨끗하다 |

## 결과

- 좋은 점: v1.3 의 "문법 검사만으로는 부족하다(함수가 사라져도 통과)" 문제를 타입·렌더 검사·E2E 가 구조적으로 막는다. 권한 규칙이 테스트로 문서화된다.
- 나쁜 점: 로컬 DB 테스트에 Docker 가 필요하다. CI 시간이 늘어난다(DB 작업은 조건부로 완화). 의존성이 생겨 Dependabot PR 관리가 필요하다.
- **ADR-0013 처리:** 이 ADR(빌드 도입)과 ADR-0015(Leaflet npm — ADR-0015 는 폐기됐고 이 부분은 ADR-0023 이 이어받음)로 ADR-0013 결정 1·5·6 은 사실상 대체된다. ADR-0013 은 아직 "제안됨" 이라 상태 줄은 바꾸지 않았다 — 승인 후 "ADR-0016으로 대체됨" 으로 바꿀 것을 제안(RFC-0003 OQ-15).
- CLAUDE.md 는 재작성 시점(Y-1)에 새 구조·명령·원칙(RFC-0003 §5.1)으로 다시 쓴다 — 이 ADR 은 코드·CLAUDE.md 를 고치지 않는다.

## 열린 질문

| # | 질문 |
|---|---|
| TC-Q1 | v1.3 Playwright 50개 검사 원본이 어디에 있는가 (tech-stack-v2 TS-Q4) |
| TC-Q2 | 번들 크기 한도를 CI 실패 조건으로 할지 — 홈 진입 gzip **100 KB**(JS+CSS) 제안. 근거는 실측(react + react-dom 19.3.0 = 67.2 KB, 홈 합계 약 95 KB). ADR-0023 결정 9 의 75 KB 를 [ADR-0024](0024-react-switch-review-fixes.md) 가 대체 제안. 지도 60·쓰기 50·레슨 30 KB 청크는 따로 잰다 `[검토 R-1]` |
| TC-Q3 | 브랜치 보호·PR 기반 작업을 1~2인 규모에서도 강제할지 (conventions CV-Q1) |
