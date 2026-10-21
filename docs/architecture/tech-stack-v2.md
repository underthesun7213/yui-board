# 기술 검토서 · 기술 스택 선정서 — YUNABI v2

| | |
|---|---|
| 상태 | 제안 (v2.0-draft) — 프레임워크는 **D24 로 React 확정**(ADR-0023 승인), 호스팅은 D21(ADR-0020 승인) |
| 작성일 | 2026-10-12 |
| 대상 | [PRD-YUNABI v2.5](../02-requirements/PRD-YUNABI.md) (D12~D26, Y-\*, §6.1 Y-S1~S12) — 마일스톤 Y-0 |
| 현행 코드 | `index.html` @`8ce701a` (v1.3 MLP + 브랜드 + D14 + D15, 백엔드 없음), `sw.js` (`CACHE = "yui-v6"`), `manifest.webmanifest`, `vendor/` (Leaflet 1.9.4, markercluster 1.5.3), `data/japan-prefectures.geojson`, `assets/brand/yunabi-mark.svg` |
| 짝 문서 | [RFC-0003](rfc/0003-yunabi-v2.md), [ERD v2](erd-v2.md), [openapi-v2.yaml](openapi-v2.yaml), ADR [0015](../adr/0015-frontend-framework-svelte.md)(폐기됨)~[0023](../adr/0023-frontend-framework-react.md) |
| 이어받는 문서 | [tech-stack.md](tech-stack.md) (보류, 2026-10-11) — Supabase 키 체계·GRANT·RLS 조사를 재사용하고, 바뀌었을 수 있는 사실은 다시 확인했다 |

> **개정 (2026-10-12, 보안 검토 반영).** 독립 보안 검토(기준 `da55060`, "보완 필요")가 Supabase 관련 사실을 따로 확인했다. 그 결과로 아래 표의 "신뢰도" 를 고쳤다(`[검토 확인]` = 검토도 확인, `[검토 미확인]` = 검토도 확인 못 함 — 열린 질문으로 유지). 설계 변경은 `[검토 #n]` 표시.

> **개정 (2026-10-12, 책임자 결정 D24~D26 반영).** 설계는 Svelte 5 를 제안했으나(ADR-0015, 아래 §2.1~§2.4 는 그 비교 기록으로 남긴다) 책임자가 **React** 를 택했다(D24 → [ADR-0023](../adr/0023-frontend-framework-react.md), 승인됨). React 에 맞춘 선정은 §2.5, 도구·테스트·린트는 §3·§4·§5.6 에서 고쳤다. 관리자는 책임자 1명(D25 — §6.3), 기숙사 IP 확인·SMTP 설정은 출시 전 항목으로 미룸(D26 — §9 TS-Q5, TS-Q13). `[D24]`·`[D25]`·`[D26]` 표시.

> **개정 (2026-10-12, React 전환 문서 검토 반영).** 검토("보완 필요")의 지적 1~11 을 반영했다. 고친 곳에 `[검토 R-n]` 을 달았다(R-n = 검토 지적 번호). 바뀐 것은 다음과 같다.
> - 홈 예산을 실측으로 100 KB 로 다시 정했다(R-1).
> - 렌더 검사를 `prerender` 로 바꿨다(R-3).
> - ESLint 선택자 전문(R-4, R-6)과 지도 경합 가드(R-5)를 보완했다.
> - Y-1 설치 버전을 고정했다(R-8, 부록).
>
> 승인된 ADR-0023 은 본문을 고치지 않았다. 보완 결정은 [ADR-0024](../adr/0024-react-switch-review-fixes.md)(제안됨)에 있다.

> **사실 확인 방법과 한계.** 2026-10-12 에 웹 검색으로 확인했다. 이 환경에서 WebFetch 는 DNS 오류(`ENOTFOUND supabase.com`)로 실패해 공식 페이지를 직접 열지 못했다(2026-10-11 과 같음). 그래서 수치는 **검색 결과가 인용한 공식 문서 발췌**나 **3자 자료**에서 가져왔고, 표마다 "신뢰도" 를 적었다. 가격·한도·버전은 **구현 착수(Y-1) 때 공식 페이지에서 다시 확인**한다. *추정* 은 추정이라고 표시했다.

---

## 1. 결론 요약

| 영역 | 선정 | 핵심 이유 | 근거 ID | ADR |
|---|---|---|---|---|
| UI 프레임워크 `[D24]` | **React 19.3.0** `[검토 R-8]` (메타 프레임워크 없이 Vite SPA). 지도 런타임·라우터·상태 저장소·i18n 은 React 밖의 TS 모듈, react-leaflet·React Router·Zustand·i18next 없음 | **책임자 결정 D24.** 설계 제안은 Svelte 5 였다(83 대 80, §2.3 — 기록으로 남김). React 로 바뀌는 것과 그 대가는 §2.5 | D24, D19, Y-C1, G5 | [0023](../adr/0023-frontend-framework-react.md) (승인됨) — [0015](../adr/0015-frontend-framework-svelte.md) 폐기됨 |
| 빌드·언어 | **Vite 8 + `@vitejs/plugin-react` + TypeScript (strict)** | PRD §7 이 Vite·TS 를 지정. Vite 8 은 2026-03-12 안정판 | D19, D24 | [0016](../adr/0016-toolchain-test-ci.md) |
| 테스트 | **Vitest 5.0.3** `[검토 R-8]` (단위 + `react-dom/static` `prerender` 렌더 검사) + **React Testing Library** (컴포넌트) + **Playwright 1.64.0** (E2E) + **pgTAP** (`supabase test db`) | v1.3 헤드리스 검사를 렌더 검사로 옮긴다(§4). 지연 라우트까지 그리려고 `renderToString` 대신 `prerender` 를 쓴다 `[검토 R-3]` | §7 품질 | 0016, 0023, 0024 |
| 린트·포맷 | **ESLint 9.39.5 (flat, 고정) + typescript-eslint 8.71.1 + eslint-plugin-react 7.37.5(`react/no-danger`) + eslint-plugin-react-hooks 7.1.1 + Prettier 3.9.10**, 타입 검사 `tsc -b`(**TypeScript 6.0.3**) `[검토 R-8]` | `eslint-plugin-react` 7.37.5 는 ESLint 10 과 호환되지 않는다는 자료 → 9 에 고정(ADR-0023 RE-Q4). typescript-eslint 8.71.1 의 peer 가 `typescript <6.1.0` → TS 7 을 쓰지 않는다 | §7 품질, Y-S4 | 0016, 0023, 0024 |
| CI | **GitHub Actions** | 저장소가 GitHub 에 있고, Pages 배포도 같은 경로 | §7 품질 | 0016 |
| 백엔드 | **Supabase** (Postgres + Auth 익명 로그인 + PostgREST, 도쿄 리전) | 익명 로그인 기본 제공, RLS·정의자 함수로 서버 검증·빈도 제한·자동 숨김을 DB 안에서 강제, 이전 조사·설계 재사용 | D16~D18, Y-A\*, Y-R\* | [0018](../adr/0018-backend-supabase-anonymous.md) |
| 공유 데이터 | 장소·일정은 서버에서 읽고 쓴다 (ADR-0009 일부 대체) | D16 | Y-M4, Y-K2 | [0017](../adr/0017-shared-data-server.md) |
| 데이터 접근 | 기본 테이블은 노출 안 하는 스키마에, 읽기는 공개 뷰, 쓰기는 RPC 만 | 등록자 비공개(Y-M9)와 서버 검증(Y-A5)을 한 곳에서 | Y-A5, Y-P2 | [0021](../adr/0021-data-access-views-rpc.md) |
| 신고·자동 숨김 | **서로 다른 계정 3개** → 자동 숨김. 자격 조건·CAPTCHA 기본 사용 없음(D20). 관리자 복원 항목은 등록자가 수정할 때까지 자동 숨김 제외 | D18, D20 | Y-R3, Y-R6, Y-A4 | [0019](../adr/0019-moderation-autohide.md) |
| 호스팅 | **사용자 앱: GitHub Pages 유지**(Actions 산출물 배포, meta CSP). **관리자 콘솔: 헤더를 설정할 수 있는 별도 출처**(Cloudflare Workers 정적 자산) | 같은 주소를 유지해야 설치·`yui.v1.*` 저장이 이어진다(PRD §7). 관리자 세션은 `github.io` 공유 출처·meta CSP 한계 밖에 둔다(Y-S3, Y-S4) | §7 호스팅, Y-S3, Y-S4, Y-S8 | [0020](../adr/0020-hosting-github-pages-actions.md) |
| 보안 기준선 | 권한은 DB 에서만, 비밀 검사·의존성 검사 CI, 관리자 2단계 인증, CSP, IP·계정 빈도 제한 + CAPTCHA 스위치, 백업·복구 리허설, 감시·알림, 출시 전 점검(pgTAP 권한 테스트 + ZAP baseline) | D20 | Y-S1~S12 | [0022](../adr/0022-security-baseline.md) |
| 지도 | Leaflet **1.9.4** 유지(npm 패키지로), markercluster 1.5.3. React 밖 모듈 싱글턴 런타임 + `MapSlot` 컴포넌트(react-leaflet 없음) | Leaflet 2.0 은 아직 알파만 확인됨. 컴포넌트 수명과 지도 수명을 분리(ADR-0014) | Y-M2 | 0023 (Leaflet npm 부분은 0015 결정 5 를 이어받음) |

**비용:** 0엔 목표 유지(§6). 유료가 되는 조건: Supabase 무료 프로젝트 일시정지가 운영에 지장을 줄 때(Pro $25/월, 3자 자료).

---

## 2. UI 프레임워크

> **기록 (D24).** §2.1~§2.4 는 설계가 Svelte 5 를 제안할 때의 비교이고 그대로 남긴다. 책임자는 React 를 택했다(D24, 2026-10-12) — 이 표에서 React 가 1위가 되는 조건이 "친숙도 가중치를 올릴 때" 였던 것과 같은 판단이다(§2.4). 현행 선정은 **§2.5**.

### 2.1 요구 조건 (기획 → 기술)

| 조건 | 근거 | 무엇을 뜻하나 |
|---|---|---|
| 모바일 PWA, 첫 화면이 가벼울 것 | Y-C1, v1.3 첫 화면 gzip 40 KB (RFC-0002 §12) | 런타임 크기, 지도·관리자 화면 지연 로드 |
| 지도는 한 번 만들고 유지 | Y-M2 (ML-M11), ADR-0014 | 명령형 Leaflet 인스턴스를 컴포넌트 수명과 분리할 수 있어야 함 |
| 3개 언어, 한국어 기준 폭 | Y-C1, Y-C2 | 타입 있는 문자열 표, 누락 검사 |
| 자동 테스트, CI | §7 품질 | 컴포넌트·렌더 검사가 쉬울 것 |
| 팀 친숙도 **미정** | PRD 에 개발 인력 정보 없음 | 인지도·자료·채용 가능성을 가중치로 반영 |
| 사용자 입력 출력 | Y-M6, Y-K4 (사용자가 쓴 글이 화면에 나옴) | 기본으로 이스케이프하는 템플릿 |

### 2.2 확인한 사실 (2026-10-12)

| 항목 | 내용 | 신뢰도 | 출처 |
|---|---|---|---|
| React 런타임 크기 | 첫 판 값: react + react-dom gzip 약 42~45 KB(3자 다수 — React 18 시기 수치). **실측 `[검토 R-1]`: react + react-dom 19.3.0, `createRoot` 만, 운영 빌드, 압축 후 gzip 67.2 KB**(라우터·상태 관리 제외) | 첫 판 3자 → **Y-1 실측으로 대체** | [resumelens](https://www.resumelens.org/blog/react/react-vs-vue-vs-svelte-2026), [tech-insider](https://tech-insider.org/solidjs-vs-react-vs-svelte-2026/), Y-1 실측(ADR-0024) |
| Vue 런타임 크기 | 전체 VDOM 런타임 gzip 약 46 KB, Vapor 런타임 약 34 KB (자료 간 편차 큼) | 3자 | [arc.dev](https://arc.dev/employer-blog/svelte-vs-vue-vs-solidjs/) |
| Svelte 5 | 작업 대부분이 컴파일 시점. 최소 앱 gzip 2~5 KB | 3자 | [pkgpulse](https://www.pkgpulse.com/guides/solidjs-vs-svelte-5-vs-react-reactivity-2026), [arc.dev](https://arc.dev/employer-blog/svelte-vs-vue-vs-solidjs/) |
| Solid | 코어 gzip 약 6~8 KB | 3자 | [tech-insider](https://tech-insider.org/solidjs-vs-react-vs-svelte-2026/) |
| Preact | 약 4 KB (단일 3자 자료, 신뢰도 낮음) | 3자 1건 | [jsgurujobs](https://jsgurujobs.com/blog/svelte-5-vs-react-19-vs-vue-4-the-2025-framework-war-nobody-expected-performance-benchmarks) |
| 사용 현황 | State of JS 2025: React 사용 83.6%, 프론트엔드 지형은 "매우 안정적", 개발자 1인이 평생 쓴 프레임워크 평균 2.6개 | 2차 보도 | [InfoQ 2026-03](https://www.infoq.com/news/2026/03/state-of-js-survey-2025) |
| React + Leaflet | `react-leaflet-cluster` v4 가 React 19·react-leaflet 5 지원, peer `leaflet ^1.9.0` | GitHub 릴리스 | [react-leaflet-cluster releases](https://github.com/akursat/react-leaflet-cluster/releases) |
| Leaflet 2.0 | 2.0.0-alpha (2025-05-18), alpha.1 (2025-08-16). 안정판 목표는 2025-11 이었으나 **안정판 출시는 확인 못 함**. ESM, 전역 `L` 은 코어에서 빠짐 | 공식 블로그·홈 (검색 요약) | [Leaflet 2.0 알파 공지](https://leafletjs.com/2025/05/18/leaflet-2.0.0-alpha.html), [leafletjs.com](https://leafletjs.com/) |
| i18n 라이브러리 | Paraglide JS 2.x: 메시지마다 함수로 컴파일되어 트리 셰이킹, 타입 검사. React·Svelte·Vite 모두 지원 | 프로젝트 README | [paraglide-js](https://github.com/opral/paraglide-js) |

**런타임 크기 수치는 방법이 서로 다른 블로그 값이라 순위만 믿는다.** 실제 크기는 Y-1 착수 때 같은 화면(홈) 하나를 후보 두 개로 만들어 `vite build` 결과를 재는 스파이크로 확정하는 것을 제안한다(열린 질문 TS-Q1).

### 2.3 비교표

가중치는 이 프로젝트의 조건(§2.1)에서 정했다. 점수 1~5. 가중 합 = Σ(가중치 × 점수) ÷ 5 (100점 환산).

| 기준 (가중치) | React 19 | **Svelte 5** | Vue 3.5 | Preact 10 | Solid 1.x |
|---|---|---|---|---|---|
| 번들 크기·모바일 성능 (20) | 2 — 런타임만 40 KB대 | **5** — 컴파일, 런타임 작음 | 3 — 30~46 KB | 5 — 약 4 KB | 5 |
| v1.3 에서 옮기는 비용 (15) — 문자열 템플릿 뷰, 위임 클릭, 명령형 지도 | 3 — JSX 로 다시 씀 | **5** — HTML 템플릿·`{#each}`·`{#if}` 가 v1.3 뷰와 거의 1:1, 자동 이스케이프 | 4 — SFC 템플릿 | 3 — JSX | 3 — JSX + 반응성 규칙 |
| 친숙도·인력·자료 — 팀 미정 (20) | **5** | 3 | 4 | 4 — React 지식 이전 | 2 |
| Leaflet 통합 (10) | 4 — react-leaflet 성숙, 또는 `useRef` 직접 | 4 — 액션/`$effect` 로 직접(래퍼 불필요) | 4 — vue-leaflet 또는 직접 | 3 — compat 경유 | 3 — 직접 |
| i18n (10) | 5 | 4 | 5 — vue-i18n | 3 | 3 |
| 테스트 도구 (15) | 5 — Testing Library, Vitest | 4 — Vitest + `svelte/server` 렌더 + Testing Library | 4 | 4 | 3 |
| 장기 유지·안정성 (10) | 5 | 4 | 5 | 4 | 3 |
| **가중 합** | **80** | **83** | **80** | **77** | **64** |

계산: React (40+45+100+40+50+75+50)/5 = 80. Svelte (100+75+60+40+40+60+40)/5 = 83. Vue (60+60+80+40+50+60+50)/5 = 80. Preact (100+45+80+30+30+60+40)/5 = 77. Solid (100+45+40+30+30+45+30)/5 = 64.

### 2.4 민감도와 판정 (설계 제안 — D24 로 대체됨, 기록)

- **차이가 3점이다.** "친숙도" 가중치를 20 → 30 으로 올리고 "번들" 을 20 → 10 으로 내리면 React (20+45+150+…)= 86, Svelte = 81 로 **순위가 바뀐다.** 즉 이 결정은 "누가 유지보수하나" 에 달려 있다.
- **판정: Svelte 5 를 제안한다.** 조건: 책임자가 "유지보수자가 React 를 이미 안다" 고 답하면 React 19 로 바꾼다(ADR-0015 결정 4). 그 경우에도 RFC-0003 의 구조(도메인 로직은 프레임워크 없는 TS, 지도 런타임은 모듈 싱글턴, 라우터는 자체 모듈)는 그대로이고 바뀌는 것은 `src/features/**`·`src/ui/**` 의 컴포넌트 파일뿐이다.
- **SvelteKit 은 쓰지 않는다.** 정적 SPA 하나, 화면 10여 개, 서버 렌더 없음. v1.3 의 뒤로 가기 규칙(`PARENT`, `prevView`, 같은 탭 재탭은 `replaceState`, 도도부현 선택은 기록 항목)은 파일 기반 라우터보다 작은 자체 라우터가 맞다(RFC-0003 §6).
- **Leaflet 은 1.9.4 를 npm 패키지로 쓴다.** `vendor/` 수동 복사(ADR-0013)는 빌드 도구가 생겨 이유가 사라졌다. 동적 `import()` 로 별도 청크가 되므로 "지도 탭 첫 진입 때 로드"(ADR-0013 결정 2)는 유지된다. Leaflet 2.0 안정판과 markercluster 호환판이 나오면 다시 본다.

### 2.5 책임자 결정 D24 — React 로 정하고 설계가 정한 것 `[D24]`

결정과 근거 전문은 [ADR-0023](../adr/0023-frontend-framework-react.md)(승인됨). ADR-0015 결정 3 의 구조 — 도메인·지도 런타임·라우터·API·플랫폼은 프레임워크 없는 TS — 는 그대로이고, 바뀌는 것은 화면 컴포넌트(`.svelte` → `.tsx`)와 상태 모듈(룬 → 외부 저장소 + `useSyncExternalStore`)이다.

**확인한 버전 (2026-10-12 웹 검색 — 정확한 패치는 Y-1 착수 때 `npm view` 로 확정해 고정):** — `[검토 R-8]` 아래 표는 작성 당시 기록이다. **Y-1 에 실제로 설치한 버전은 부록**(react 19.3.0, vitest 5.0.3, typescript 6.0.3, eslint 9.39.5, eslint-plugin-react-hooks 7.1.1 등)이 기준이다.

| 패키지 | 확인한 것 | 출처 |
|---|---|---|
| react, react-dom | 19.2.x (찾은 최신 19.2.8, 2026-07-21). React 20 없음 | [endoflife.ai](https://endoflife.ai/article-react-eol.html), [codercops](https://blog.codercops.com/blog/react-19-2-vs-react-20-explained) |
| vite | 8.0.x (8.0 = 2026-03-12) | [Vite 8 공지](https://vite.dev/blog/announcing-vite8) |
| @vitejs/plugin-react | v6(oxc, Babel 분리) — 3자 블로그, npm 미확인 | [recca0120](https://recca0120.github.io/en/2026/04/14/react-compiler-vite-v6/) |
| vitest | 4.1.x (4.1.0 이 Vite 8 지원, 추적 사이트 최신 4.1.10) | [newreleases](https://newreleases.io/project/npm/vitest/release/4.1.0), [releasealert](https://releasealert.dev/github/vitest-dev/vitest) |
| @testing-library/react | v16 줄 (React 19 지원) | [RTL 커밋](https://redirect.github.com/testing-library/react-testing-library/compare/v16.0.1...85ac2534a59abd38880011e77da4bb8c716eba84) |
| eslint-plugin-react-hooks | 7.0.1, flat `recommended` | [README](https://github.com/react/react/blob/main/packages/eslint-plugin-react-hooks/README.md) |
| eslint-plugin-react | 7.37.5 — ESLint 10 비호환 보고 | [Fluid 변경 기록](https://unpkg.com/@fluidframework/eslint-config-fluid@13.0.0/CHANGELOG.md) |
| (쓰지 않음) react-router | v8.0.0 = 2026-06-17, 최소 React 19.2.7·Node 22.22, ESM 전용, 연 1회 메이저 | [Remix 블로그](https://remix.run/blog/react-router-v8), [InfoQ](https://infoq.com/news/2026/08/react-route-v8) |
| (쓰지 않음) react-leaflet | 5.0.0 (2024-12-14), peer React 19·Leaflet 1.9 | [yarn](https://classic.yarnpkg.com/en/package/react-leaflet) |
| (쓰지 않음) zustand | v5, 내장 `useSyncExternalStore`, 약 1.2 KB gzip(3자) | [Zustand v5](https://pmnd.rs/blog/announcing-zustand-v5) |

**선정 요약:**

| 영역 | 선정 | 기각한 것 | 이유 (ADR-0023 결정 번호) |
|---|---|---|---|
| 지도 | `src/map/runtime.ts` 모듈 싱글턴(`ensure()` 메모이즈, `remove()` 없음) + `MapSlot.tsx`(effect 에서 `attach`, 정리에서 `detach` — 떼기만). 런타임이 저장소를 직접 구독 | react-leaflet 5; 컴포넌트 ref + 정리에서 `remove()` | StrictMode 의 effect 이중 실행에도 `L.map` 1회, 탭 이동에도 유지(ADR-0014, Y-M2) (2, 3) |
| 라우터 | 자체 `app/router.ts` + `nav.ts`(v1.3 `PARENT`·`prev`·같은 탭 `replaceState`·도도부현 기록 항목) | React Router v8 | 이동 규칙은 어차피 자체 모듈, React 밖(지도·동작 함수·렌더 검사)에서 이동 호출, 연 1회 메이저 (5) |
| 상태 | `createStore`(get/set/subscribe) + `useStore` = `useSyncExternalStore` | Zustand(동등 대안), Context+reducer | 지도 런타임·라우터가 React 밖에서 같은 상태를 구독, 의존성 최소(T-09) (4) |
| i18n | 타입 있는 `en/ja/ko.ts` + `t()` + `useT()`, 서식은 `Intl` | i18next, react-intl | 3개 언어·고정 문자열에 필요 없는 기능, 첫 화면 예산 (6) |
| XSS | JSX 텍스트만, `react/no-danger: error`, `innerHTML`·`insertAdjacentHTML` 금지, Leaflet HTML API 문자열 금지 유지 | — | Y-S4, `[검토 #12]` (7) |
| CSP | 운영 빌드에 `'unsafe-eval'` 불필요(3자 다수, E2E 위반 수집으로 확인). meta CSP 는 빌드에만 주입(개발 서버의 Fast Refresh 인라인 스크립트) | — | Y-S4 (8) |
| 번들 `[검토 R-1]` | 홈 진입 JS+CSS gzip **100 KB** 이하(Svelte 안 60 KB → ADR-0023 의 75 KB → **실측으로 100 KB**, ADR-0024 결정 1). 지도 60·쓰기 50·레슨 30 KB 는 따로 재는 청크 | 75 KB 유지(실측상 도달 불가) | react+react-dom 19.3.0 **실측 67.2 KB** + 앱 약 20 + CSS 약 8 → 홈 약 95 KB. ADR-0023 RE-Q2 는 이 실측으로 닫음 (9) |
| 테스트 `[검토 R-3]` | Vitest 5.0.3 + `react-dom/static` `prerender` 렌더 검사(지연 라우트까지 기다림, `<!--$!-->`·로딩 fallback 이 있으면 실패), RTL, Playwright, pgTAP | `svelte/server`, `renderToString`(지연 라우트에서 fallback 만 그림) | (10) |
| 지연 라우트 `[검토 R-7]` | `RouteErrorBoundary`(청크 로드 실패 → 3개 언어 문구 + [다시 불러오기]) + `Suspense`. 이동은 `startTransition` 으로 그려 옛 화면을 유지(외부 저장소 값은 Transition 이 될 수 없으므로 `App` 이 표시할 라우트를 React 상태로 한 겹 둠) | 경계 없음(배포 뒤 옛 탭이 빈 화면) | ADR-0024 결정 6 |

**대가 (D24 로 받아들인 것):** 첫 화면이 Svelte 안보다 약 40 KB(gzip, 예산 기준 60 → 100 KB) 크다 `[검토 R-1]`. v1.3 HTML 문자열 뷰를 JSX 로 다시 쓴다. 대신 인력·자료·테스트 생태계가 가장 넓다(§2.3 친숙도 5점).

---

## 3. 빌드·언어·도구

### 3.1 확인한 사실 (2026-10-12)

| 항목 | 내용 | 신뢰도 | 출처 |
|---|---|---|---|
| Vite 8 | 2026-03-12 안정판. Rolldown 이 esbuild·Rollup 을 대체. 검색으로 찾은 최신 패치는 8.0.10 (2026-04-23) — 그 뒤 버전은 미확인 | 공식 블로그 + 보도 | [Vite 8.0 공지](https://vite.dev/blog/announcing-vite8), [The Register](https://www.theregister.com/2026/03/16/vite_8_rolldown/) |
| Vitest 4 | 2025-10-22 출시, 브라우저 모드 안정판, 프로바이더 분리 패키지(`@vitest/browser-playwright`), 시각 회귀 `toMatchScreenshot` | 공식 공지 | [Vitest 4 공지](https://voidzero.dev/posts/announcing-vitest-4) |
| ESLint vs Biome | ESLint 9 는 flat config 가 표준. Biome 2 는 린트+포맷 단일 도구로 빠르지만 Vue/Svelte 지원은 "부분적" (React 로 바뀐 뒤에도 ESLint 를 유지하는 이유는 §3.2 `[D24]`) | 3자 | [dev.to 2026 비교](https://dev.to/royce_fabbd83cb268312e928/biome-vs-eslint-vs-oxlint-js-linters-2026-408h), [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/) |
| vite-plugin-pwa | `injectManifest` 전략으로 직접 쓴 SW 에 사전 캐시 목록을 주입 | 문서 발췌 | [vite-plugin-pwa (docsearch)](https://docsearch.algolia.com/mcp/docs/repo/vite-pwa/vite-plugin-pwa) — **Vite 8 호환 버전은 확인 못 함** (TS-Q3) |

### 3.2 선정

| 영역 | 선정 | 대안과 기각 이유 |
|---|---|---|
| 번들러 | Vite 8 | PRD 지정. 대안 없음 |
| 언어 | TypeScript `strict`, `noUncheckedIndexedAccess` | v1.3 의 대표적 오류(`T` 키 누락 → `undefined`, `host` 오타 → 화면 예외, RFC-0002 §10.3)를 컴파일 시점에 잡는다 |
| 타입 검사 `[D24]` | `tsc -b --noEmit` (`.ts` + `.tsx`) | (이전 안: `svelte-check` — Svelte 폐기로 불필요) |
| 린트 `[D24]` | ESLint 9.39.5 flat(**9 에 고정**) + typescript-eslint 8.71.1 + `eslint-plugin-react` 7.37.5(flat `recommended` + `jsx-runtime`) + `eslint-plugin-react-hooks` 7.1.1(`recommended`) `[검토 R-8]`. **오류 규칙:** `react/no-danger`(recommended 에 없어 명시), `no-restricted-syntax`(`src/**`: `innerHTML`·`outerHTML` 대입(계산된 키 `el['innerHTML']` 포함), `dangerouslySetInnerHTML`·`innerHTML` 을 **객체 키**로 쓰기, `insertAdjacentHTML`, `document.write`. `src/map/**`: Leaflet HTML API 의 인자는 `textNode(…)` 호출만, `divIcon` 은 `icons.ts` 에서 문자열 리터럴 `html` 로만 `[검토 R-4]`), `no-restricted-globals`·`no-restricted-imports`(`features/`·`ui/` 에서 `localStorage`·`navigator`·`fetch`·`leaflet`), `react-hooks/rules-of-hooks`·`exhaustive-deps`. **flat config 주의** `[검토 R-6]`: `src/map/**` 블록의 `no-restricted-syntax` 는 `src/**` 의 옵션을 합치지 않고 **바꾼다**. 그래서 HTML 선택자를 상수 배열로 두고 `src/map/**` 블록에 다시 펼친다. `react/no-danger` 는 JSX 속성만 보므로 객체 키·계산된 멤버 대입은 선택자로 막는다. 선택자 전문은 ADR-0016 결정 2 | Biome 2: React 규칙 범위와, `no-restricted-syntax` 같은 AST 선택자 규칙으로 Leaflet API 인자를 막는 방식을 쓸 수 있는지 이번에 확인하지 않음 — 확인된 ESLint 경로를 유지. ESLint 10 으로 가려면 `eslint-plugin-react` → `@eslint-react/eslint-plugin` 교체 필요(ADR-0023 RE-Q4) |
| 포맷 `[D24]` | Prettier (플러그인 없음 — JSX 기본 지원) | Biome 포맷터 단독: 린트를 ESLint 로 두는 한 도구가 둘이 되는 것은 같음 |
| PWA | vite-plugin-pwa **2.0.0** `injectManifest` (SW 를 직접 씀) + workbox-\* 7.4.1 `[검토 R-8]` | `generateSW`: v1.3 의 `yui-v*` 캐시 정리·같은 파일명 `sw.js` 유지 같은 맞춤 처리가 어렵다(RFC-0003 §15) |
| 백엔드 SDK | `@supabase/postgrest-js` + `@supabase/auth-js` (전체 `supabase-js` 대신), **쓰기 경로에서만 동적 로드** | 읽기는 PostgREST GET 이라 SDK 없이도 된다. Realtime·Storage 를 쓰지 않으므로 전체 SDK 는 과하다(크기 *추정*, TS-Q2). ADR-0003 의 "SDK 없음" 은 단일 파일 전제였다 |
| 패키지 매니저 | npm (`package-lock.json`) | pnpm 도 무방. 기여자 장벽이 가장 낮은 쪽 |
| Node | 22 LTS 이상 (CI 와 같은 버전 고정, `.nvmrc`) | — |

---

## 4. 테스트 도구와 기존 검사 이전

PRD §7: "저장소 안 자동 테스트를 한 명령으로", "초기 데이터 0 → 테스트용 고정 데이터".

| 층 | 도구 | 무엇을 | v1.3 에서 온 것 |
|---|---|---|---|
| 단위 | Vitest (node) | `src/domain/**`: 반복 일정 전개(`occOn`·`upcoming`), .ics 생성(VTIMEZONE·접기·CRLF), 거리·도보, 도도부현 판정, 입력 검증, 오류 코드 매핑, `store`(저장소 차단·깨진 JSON) | v1.3 헤드리스 검사의 "데이터 검사" 와 .ics 확인 |
| 렌더 검사 `[D24]` `[검토 R-3]` | Vitest (node) + `react-dom/static` 의 **`prerender`** (첫 판: `renderToString` — `React.lazy` 라우트에서 Suspense fallback 만 그려 검사가 아무것도 검사하지 않고 통과하므로 바꿈) | **모든 라우트 × 3개 언어 × 상태 조합**을 HTML 로 렌더해 예외와 `undefined`·`NaN`·`[object Object]` 를 찾는다. `prerender` 는 지연 청크가 준비될 때까지 기다린다. 다음 중 하나라도 있으면 실패다: `onError` 호출, 출력의 `<!--$!-->`(클라이언트 렌더로 넘어간 경계), 로딩 fallback 표지 `data-route-loading`. 라우트 표의 모든 항목에 케이스가 있는지도 검사. 상태 저장소가 React 밖에 있어(ADR-0023 결정 4) 저장소에 상태를 넣고 `<App/>` 을 그리면 된다. 이때 `useStore` 가 `getServerSnapshot` 을 넘겨야 한다 `[검토 R-2]`. effect 는 서버 렌더에서 돌지 않으므로 `MapSlot` 은 빈 `div` 만 남는다 | CLAUDE.md 헤드리스 검사를 거의 그대로 옮김 (RFC-0002 §11.1). (이전 안: `svelte/server`) |
| i18n | Vitest + 타입 | `ja`·`ko` 가 `en` 의 모든 키를 갖는지(타입 + 실행), 빈 문자열 없음 | v1.3 "모든 문자열 3개 언어" |
| 지도 런타임 `[D24]` | Vitest (node, Leaflet 가짜) | `attach → detach → attach`(StrictMode 순서)에서 `L.map` 1회, 비동기 `ensure()` 중 attach → detach 만 일어나면 나중에도 붙이지 않음(`detach` 가 `currentSlot = null`, `++gen` — `[검토 R-5]`), 옛 슬롯의 detach 가 새 슬롯을 떼지 않음 | ADR-0014 의 단위 테스트판 |
| 컴포넌트 `[D24]` | Vitest + **React Testing Library**(`@testing-library/react` v16), 브라우저 모드(Playwright 프로바이더) 기본, 빠른 것은 jsdom | 폼 검증 메시지, 신고 시트, `<StrictMode>` 로 감싼 `MapSlot` 재부착, `FrameGuard` | — |
| E2E (고정 데이터) | Playwright, Chromium 375px | v1.3 의 50개 검사 범주(RFC-0002 §11.2) — 내비게이션·저장·지도·위치·일본 전체·.ics·375px·오프라인. 백엔드는 `page.route()` 로 고정 데이터 응답 | **50개 검사의 이전 대상.** 단 스크립트가 저장소에 없어 범주로만 남아 있다 → TS-Q4 |
| E2E (로컬 백엔드) | Playwright + `supabase start` | 익명 계정 생성(첫 쓰기), 등록·수정·삭제, 빈도 제한, 신고 → 자동 숨김, 관리자 로그인·복원·정지 | 신규 (Y-A\*, Y-R\*) |
| DB | pgTAP (`supabase test db`) | 권한(GRANT·RLS), 모든 RPC 의 검증·거절, 신고 자격, 자동 숨김, 감사 기록 추가 전용, 보관 기간 정리 | erd.md §8 익명성 케이스의 v2 판 |

Supabase 공식 가이드는 GitHub Actions 에서 `supabase/setup-cli` → 로컬 스택 시작 → `supabase test db` 순서를 예시로 들고, 테스트 데이터는 `begin … rollback` 으로 격리하라고 권한다([Supabase Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview), 2026-10-12 검색 확인). 로컬 스택은 Docker 가 필요하다(일반 지식, infra.md I-1 과 같음).

`npm test` = 린트 + 타입 + 단위 + 렌더 + E2E(고정 데이터). DB·로컬 백엔드 E2E 는 `npm run test:db` 로 나누고 CI 에서는 `supabase/` 변경이 있거나 `main` 에 병합될 때 돈다(RFC-0003 §16).

---

## 5. 백엔드

### 5.1 요구 조건

| 조건 | 근거 |
|---|---|
| 익명 계정 (첫 쓰기 때 생성, 입력 없음) | D17, Y-A1 |
| 내 항목만 수정·삭제 (API 로도) | Y-M8, Y-K8 |
| 서버 측 검증: 길이·카테고리·좌표(일본)·날짜·링크 도메인·빈도·정지 여부 | Y-A5 |
| 좌표에서 도도부현 판정 | Y-M6 |
| 신고 집계 → 자동 숨김, 신고 자격 | Y-R3, Y-A4 |
| 관리자 **별도 로그인** + 허용 목록 + 감사 기록 | Y-R5 |
| 계정 정지 | Y-R7 |
| 보관 기간 정리 (30일, 1년) | Y-E2, Y-P5 |
| 무료 또는 저비용, 일본 지연 | §7 백엔드 |
| 로컬·CI 에서 같은 백엔드로 테스트 | §7 품질 |

### 5.2 확인한 사실 (2026-10-12)

| 항목 | 값 | 신뢰도 | 출처 |
|---|---|---|---|
| Supabase 익명 로그인 | `signInAnonymously()`. 익명 사용자도 **`authenticated` 역할**을 받고, 영구 사용자와 구분하려면 JWT 의 `is_anonymous` 를 검사한다 | 공식 문서 (검색 발췌) | [Supabase: Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous) |
| 익명 로그인 빈도 제한 | **IP 당 시간당 30회**(버스트 30), 대시보드에서 변경 가능. 범위(CIDR)별 설정 기능은 찾지 못함 — 프로젝트 전체에 한 값으로 본다 | 공식 문서 2곳 `[검토 확인]` (범위별 설정 여부는 미확인) | [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) |
| CAPTCHA | 익명 로그인 남용 방지로 invisible CAPTCHA 또는 **Cloudflare Turnstile** 을 "강하게 권장", `captchaToken` 옵션 | 공식 문서 `[검토 확인]` | 위 두 문서, [signInAnonymously](https://supabase.com/docs/reference/javascript/auth-signinanonymously) |
| 익명 사용자 자동 정리 | **아직 없음.** `auth.users` 에서 `is_anonymous` 이고 오래된 행을 SQL 로 지우라고 안내. 익명 사용자 남용으로 DB 가 커질 수 있다고 경고 | 공식 문서 | [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous) |
| 익명 사용자와 MAU | MAU = 결제 주기 안에 로그인하거나 토큰을 갱신한 서로 다른 사용자. 익명 사용자가 MAU 에 들어가는지 명시한 공식 문구는 찾지 못함 — 익명 사용자도 `auth.users` 행과 세션이 있으므로 **들어간다고 가정**한다(*추정*) | 공식 문서 + 추론 | [Manage MAU usage](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users) |
| 무료 플랜 | DB 500 MB, MAU 50,000, 활성 프로젝트 2개, **1주 비활동 시 일시정지**. egress 는 자료마다 다름(5 GB+5 GB 캐시 / 2 GB) | 3자 다수. **일시정지 조건(무엇을 "활동" 으로 보나)은 `[검토 미확인]`** — TS-Q7 | [uibakery](https://uibakery.io/blog/supabase-pricing), [makerkit](https://makerkit.dev/blog/saas/supabase-pricing), [jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) |
| Pro | 조직당 월 $25 | 3자 | [nocode.mba](https://www.nocode.mba/articles/supabase-pricing) |
| API 키 | 레거시 `anon`/`service_role` 키는 **2026년 말까지 폐기 예정**(정확한 날짜 없음). 대체는 `sb_publishable_…`(브라우저) / `sb_secret_…`(서버). 병행 가능 | 공식 문서(검색 발췌). **폐기 일정은 `[검토 미확인]`** — 설계는 일정과 무관하게 처음부터 새 키만 쓰므로 영향 없음 | [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys) — 2026-10-11 조사와 같음 |
| Data API 노출 기본값 | **2026-05-30 부터 새 프로젝트**는 `public` 의 새 테이블을 Data API 에 자동 노출하지 않는다. 역할별 GRANT 가 필요. **기존 프로젝트는 2026-10-30** 부터(3자 자료, 날짜 해석이 자료마다 다름) | 공식 토론·체인지로그 | [Breaking Change Discussion #45329](https://github.com/orgs/supabase/discussions/45329), [Developer Update May 2026](https://supabase.com/changelog/45702-developer-update-may-2026) — 2026-10-11 에 "공식 공지 미확인" 이던 것이 확인됨 |
| pg_cron | Supabase Cron 모듈. 동시 작업 8개 이하, 작업당 10분 이하 권장. 무료 플랜에서 쓸 수 있다는 3자 자료(공식 문구는 플랜 언급 없음) | 공식 문서 + 3자 | [Supabase Cron](https://supabase.com/docs/guides/cron), [crontap 가이드](https://crontap.com/guides/supabase-cron-jobs) |
| Firebase 익명 인증 | Spark 에서 사용 가능. IP 당 시간당 계정 생성 100개, 익명 계정 총 1억 개 한도. Identity Platform 으로 올리면 Spark 는 일 활성 3,000명 제한. 익명 계정은 과금·사용량 할당에서 제외 | 공식 문서 발췌 + 3자 | [Firebase Auth limits](https://firebase.google.com/docs/auth/limits), [Firebase Auth](https://firebase.google.com/docs/auth), [Logto 2026](https://blog.logto.io/firebase-authentication-pricing) |
| Firestore 무료 | 1 GiB, 읽기 5만/일, 쓰기 2만/일. Spark 는 한도에 닿으면 멈춤(과금 없음). Cloud Functions 의 Spark 사용 범위는 자료가 상충 | 3자 + 공식 | [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [supertokens](https://supertokens.com/blog/firebase-pricing) |
| Cloudflare D1 무료 | 읽기 500만 행/일, 쓰기 10만 행/일, 저장 5 GB(계정 전체), 00:00 UTC 초기화 | 공식 문서 | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| Cloudflare Workers 무료 | 요청 10만/일, HTTP 요청당 CPU 10 ms (네트워크 대기는 제외) | 공식 문서 | [Workers limits](https://developers.cloudflare.com/workers/platform/limits) |
| PocketBase | Go 단일 바이너리 백엔드, 아직 0.x (2026 CVE 공지 기준 0.37.x). **익명 로그인 기본 기능은 공식 자료에서 찾지 못함** | CVE 공지 | [CVE-2026-44166](https://cve.cert.hr/cve/CVE-2026-44166) |

### 5.3 비교표

| 기준 (가중치) | **Supabase** | Firebase (Auth + Firestore) | Cloudflare (D1 + Workers) | PocketBase 자체 호스팅 |
|---|---|---|---|---|
| 익명 계정 기본 제공 (20) | **5** | 5 | 1 — 토큰 발급·검증을 직접 | 2 — 기본 기능 확인 못 함, 직접 구현 |
| 서버 검증·소유권·빈도 제한을 데이터 계층에서 강제 (20) | **5** — RLS, 정의자 함수, CHECK, 잠금 | 3 — 보안 규칙으로 필드 검증 가능, 빈도 제한·집계는 Functions 필요 | 3 — 모두 Worker 코드 | 3 — API 규칙 + 훅 |
| 비용 (15) | 4 — 무료 한도 안. 일시정지가 대가 | 3 — Functions 범위 상충 | 5 | 2 — 상시 서버 |
| 운영 부담 (15) | 4 | 4 | 3 | 1 — 서버·백업·TLS |
| 이전 조사·설계 재사용 (10) | **5** — tech-stack.md, erd.md 의 GRANT·정의자 함수·감사 기록 규칙 | 1 | 1 | 1 |
| 로컬·CI 테스트 (10) | 4 — CLI 로컬 스택(Docker), pgTAP | 4 — Emulator Suite | 4 — wrangler 로컬 | 4 |
| 일본 지연 (5) | 5 — 도쿄 리전 (*선택 가능 여부는 T-1, 미확인*) | 4 | 5 | 3 (*가정*) |
| 관리자 별도 로그인 (5) | 5 — 이메일·비밀번호 + TOTP MFA, `is_anonymous` 로 구분 | 5 | 2 | 5 — 관리자 대시보드 기본 |
| **가중 합** | **92** | **72** | **57** | **47** |

계산: Supabase (100+100+60+60+50+40+25+25)/5 = 92. Firebase (100+60+45+60+10+40+20+25)/5 = 72. Cloudflare (20+60+75+45+10+40+25+10)/5 = 57. PocketBase (40+60+30+15+10+40+15+25)/5 = 47.

**선정: Supabase.** 자동 숨김(Y-R3)·빈도 제한(Y-A3)·검증(Y-A5)을 "화면을 거치지 않은 요청도 같은 규칙으로" 지키려면 그 규칙이 데이터를 쓰는 바로 그 트랜잭션 안에 있어야 한다. 정의자 함수 + 잠금으로 이것을 할 수 있는 후보는 Postgres 뿐이다. 2위 Firebase 와 20점 차이라 가중치를 바꿔도 순위는 그대로다.

### 5.4 이 선택의 주의점 (설계에 반영)

| # | 주의점 | 설계 반영 |
|---|---|---|
| B-1 | 익명 로그인 IP 당 시간당 30회. **기숙사 Wi-Fi 가 공인 IP 하나(NAT)로 나간다면** 학기 초 오리엔테이션처럼 첫 쓰기가 몰릴 때 정상 사용자가 막힌다(*추정* — 기숙사 네트워크 구성 미확인) | `[검토 #6]` 기숙사 공인 IP/CIDR 를 확인해(TS-Q5) `app.ip_tiers` 에 평문으로 두고, 쓰기 IP 한도는 그 범위에 5분 600(기본 60). Auth 의 익명 로그인 한도는 범위별 설정이 확인되지 않아 **전체를 시간당 150 으로** 올리고, 계정 한도(Y-A3)와 전역 가입 한도(시간당 200)를 주 방어로 둔다(RFC-0003 §14) |
| B-2 | CAPTCHA(Turnstile)는 자동화 공격을 줄이지만 기기 신호가 Cloudflare 로 간다 — Y-P1·Y-S12 에 영향 | **기본은 끈다(D20).** Supabase "Bot and Abuse Protection" 에서 Turnstile 을 켜면 서버가 토큰을 요구하고, 클라이언트는 그 오류를 받으면 위젯을 띄워 다시 시도한다 — **Turnstile 사이트 키가 빌드에 미리 들어 있을 때만** 재배포 없이 켜는 **스위치**다(`[검토 확인]`). 켜면 **관리자 비밀번호 로그인에도 적용**되므로 콘솔에도 위젯·CSP 허용을 둔다 `[검토 #5]` (Y-S7, ADR-0022) |
| B-8 | 무료 플랜에 **자동 백업이 없다**(§5.5) | **비공개 운영 저장소**의 GitHub Actions 주간 덤프(토큰·세션·MFA 표와 솔트 제외) → `age` 암호화 보관, 출시 전 복구 리허설(Y-S9, ADR-0022). 공개 저장소의 아티팩트는 누구나 받을 수 있어 쓰지 않는다 `[검토 #9]` |
| B-9 | PostgREST 에는 IP 단위 빈도 제한이 기본으로 없다 | Supabase 공식 패턴: `db_pre_request` 함수가 쓰기 요청의 IP 를 세어 거절(§5.5, Y-S7). `[검토 #1·#7]` **쓰기 RPC 경로만** 세고(읽기 전용 RPC 는 GET), IP 는 공식 예시의 첫 `x-forwarded-for` 값(위조 가능) 대신 **신뢰 프록시가 덧붙인 값**, IPv6 는 /64 단위. 가명 처리한 키로 1시간 보관(Y-S12). 클라우드에서 이 설정이 가능한지는 `[검토 미확인]` (TS-Q10) |
| B-3 | 익명 사용자 자동 정리 없음 | Y-P5 "1년 활동 없는 익명 계정 삭제" 를 pg_cron 작업으로(ERD v2 §6) |
| B-4 | 무료 프로젝트 1주 비활동 일시정지 → pg_cron 도 멈춤 | 방학 중 정지 위험. 운영 문서에 재개 절차. 정지가 반복되면 Pro (TS-Q7) |
| B-5 | 레거시 키 폐기 (2026년 말) | 처음부터 publishable/secret 키만 쓴다. 클라이언트에는 publishable 만(Y-S2) |
| B-6 | 새 테이블 자동 노출 안 됨 (2026-05-30 이후 새 프로젝트) | 이전 설계의 "모든 GRANT 를 마이그레이션이 명시" 원칙과 같은 방향. 기본 테이블은 아예 노출 안 하는 스키마(`app`)에 둔다(ADR-0021) |
| B-7 | 익명 사용자도 `authenticated` 역할 | 관리자 판정은 역할이 아니라 `admins` 허용 목록 + `is_anonymous = false` + MFA(`aal2`) 로 한다(ADR-0018) |

### 5.5 보안 관련 사실 (D20, Y-S\*) — 2026-10-12 확인

| 항목 | 값 | 신뢰도 | 출처 | 관련 |
|---|---|---|---|---|
| 무료 플랜 백업 | **플랫폼 백업 없음, PITR 없음.** Pro 는 일일 백업 7일 보관, PITR 은 월 $100 부터. 자체 `pg_dump` 를 권함 (무료 백업이 있다는 소수 자료는 공식 가격 페이지와 어긋나 배제) | 공식 가격 페이지 발췌 + 3자 다수 | [Supabase Pricing](https://supabase.com/pricing), [axonbuild](https://axonbuild.com/blog/supabase-backup/), [backupdrill](https://backupdrill.com/guides/supabase-backup) | Y-S9 |
| MFA (TOTP) | RLS 에서 JWT 의 `aal` 클레임이 `aal2` 인지 검사하는 공식 패턴. `aal1` = 일반 로그인, `aal2` = 2단계까지 확인. TOTP 는 모든 플랜에서 쓸 수 있다는 3자 언급(전화 MFA 는 유료 추가 기능) | 공식 문서 + 3자 | [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa), [MFA via RLS](https://supabase.com/blog/mfa-auth-via-rls) | Y-S3 |
| MFA 복구 `[D25]` | **백업(복구) 코드 기능이 없다.** 공식 MFA 레퍼런스는 대신 **두 번째 TOTP 요소를 등록**하라고 안내하고, 사용자당 TOTP 요소는 **최대 10개**. 관리 API `auth.admin.mfa.deleteFactor({id, userId})` 로 요소를 지울 수 있고(**secret 키 필요**, 브라우저 금지), 검증된 요소를 지우면 그 사용자의 **모든 세션이 로그아웃**된다. 비밀번호는 같은 관리 API `auth.admin.updateUserById(userId, {password})` 로 바꾼다. **대시보드에서 비밀번호를 직접 지정하는 기능은 확인하지 못했다** `[검토 R-9]` | 공식 문서 (검색 발췌, 2026-10-12) | [Auth MFA API](https://supabase.com/docs/reference/javascript/auth-mfa-api), [admin deleteFactor](https://supabase.com/docs/reference/javascript/auth-admin-mfa-deletefactor) | Y-S3, RFC-0003 §17.7 R-7 |
| 세션 만료 | Auth 설정의 비활동 시간 제한·최대 수명(timebox). 다음 토큰 갱신 때 검사되므로 실제 수명은 설정값 + JWT 만료 시간. **Pro 기능으로 보인다**(검토의 확인 — 무료 플랜에는 없다고 본다) | 공식 문서 + 검토 | [User sessions](https://supabase.com/docs/guides/auth/sessions) | Y-S3 — **무료 플랜에서는 DB 함수의 12시간 세션 검사가 유일한 서버 측 만료**(ERD v2 §7.3) |
| CAPTCHA | 대시보드 Authentication › Bot and Abuse Protection 에서 hCaptcha 또는 Turnstile. 로그인·가입·비밀번호 재설정에 적용 — **즉 관리자 비밀번호 로그인에도 적용**, 클라이언트는 토큰을 같이 보냄. 익명 로그인 문서는 `captchaToken` 옵션을 안내 | 공식 문서 `[검토 확인]` | [Enable CAPTCHA Protection](https://supabase.com/docs/guides/auth/auth-captcha), [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous) | Y-S7, Y-S3 `[검토 #5]` |
| IP 빈도 제한 | 공식 가이드: `request.headers` 의 `x-forwarded-for` 로 IP 를 읽고, 쓰기 요청을 기록해 5분 100회 초과 시 거절하는 `db_pre_request` 예시. **GET·HEAD 는 읽기 복제본으로 갈 수 있어 제한 대상이 아님.** 공식 예시는 **첫 값**을 쓰는데 첫 값은 클라이언트가 위조할 수 있다 → 신뢰 프록시가 붙인 값을 Y-2 에서 실측 | 공식 문서 + 3자. 패턴(쓰기만 센다, 첫 XFF 값 사용)은 `[검토 확인]`, **클라우드에서 `pgrst.db_pre_request` 설정 가능 여부는 `[검토 미확인]`** | [Securing your API](https://supabase.com/docs/guides/api/securing-your-api), [pg_headerkit (dev.to)](https://dev.to/supabase/rate-limiting-supabase-requests-with-postgresql-and-pgheaderkit-409j) | Y-S7 |
| meta CSP 의 한계 | `frame-ancestors`, `sandbox`, `report-uri` 는 meta 로 지정할 수 없고(무시됨), Report-Only 도 meta 불가. meta 는 `<head>` 안에 있어야 하고 그 뒤 내용에만 적용 | 3자 보안 도구 문서 + Chromium 리뷰 | [Invicti](https://www.invicti.com/invalid-content-security-policy-csp-directive-identified-in-meta-elements), [Chromium review](https://codereview.chromium.org/1835463002), [content-security-policy.com](https://content-security-policy.com/examples/meta) | Y-S4 |
| GitHub 비밀 검사 | 공개 저장소에서 비밀 검사 알림과 **push protection 무료** | GitHub 공식 블로그 | [Push protection GA](https://github.blog/news-insights/product-news/push-protection-is-generally-available-and-free-for-all-public-repositories/) | Y-S2 |
| ZAP baseline | `zaproxy/action-baseline` 은 대상 URL 에 수동(passive) 스캔. PR 마다 돌려도 안전하다는 설명. 버전·옵션은 저장소에서 확인할 것 | 3자 | [zap-baseline (tessl)](https://tessl.io/registry/testland/zap-baseline), [qaskills 2026](https://qaskills.sh/blog/owasp-zap-api-security-testing-guide-2026) | Y-S11 |

### 5.6 보안 도구 선정 (Y-S\*)

| 영역 | 선정 | 이유 / 대안 | 관련 |
|---|---|---|---|
| 비밀 검사 | GitHub 비밀 검사 + push protection(저장소 설정) + CI 의 **gitleaks**(저장소·`dist/` 모두) + 빌드 산출물 패턴 검사(`sb_secret_`, `eyJ` 로 시작하는 JWT, `service_role`) | GitHub 기능은 무료지만 저장소 설정이라 꺼질 수 있다 → CI 에도 둔다. gitleaks 는 액션 대신 **CLI 바이너리 v8.30.1**(릴리스 체크섬으로 확인, 항상 `--redact`)을 `quality` 잡에서 실행한다 — SB-Q3 해결(y3s-automated-checks §1.1, 2026-10-22) | Y-S2 |
| 의존성 | `package-lock.json` 커밋, `npm ci`, CI 의 `npm audit --audit-level=high`(높음 이상이면 실패), Dependabot 보안·버전 업데이트 PR | `npm audit` 동작은 일반 지식(이번 검색으로 확인 못 함). Dependabot 설정도 Y-1 에서 확인 | Y-S6 |
| DB 권한 테스트 | pgTAP — 역할(`anon`, 익명 `authenticated`, 다른 사용자, 관리자 aal1/aal2)마다 직접 요청 거절 확인 | §4 | Y-S1, Y-S5 |
| HTTP 권한 테스트 | Playwright `request` 컨텍스트로 로컬 Supabase REST 를 직접 호출(화면 거치지 않음) | §4 | Y-S1 |
| 동적 스캔 | OWASP ZAP baseline (스테이징 빌드 대상, 출시 전·주간) | 수동 스캔이라 운영 DB 를 건드리지 않는다. 능동 스캔(full)은 로컬 스택 대상으로만 | Y-S11 |
| CI 비밀값 격리 `[검토 #9]` | 비밀값은 `main` 전용 Environment(필수 검토자)에만, `pull_request_target` 금지, 마이그레이션은 PAT 대신 `--db-url`, 백업·감시는 비공개 저장소 | 공개 저장소의 PR·아티팩트·로그 경로로 비밀값·덤프가 새지 않게 | Y-S2, Y-S9 |
| 정적 분석 | ESLint 보안 관련 규칙(`no-eval`, `no-implied-eval`, **`react/no-danger`** `[D24]`(이전 안: `svelte/no-at-html-tags`), `innerHTML`·`insertAdjacentHTML` 금지, `src/map` 의 Leaflet HTML API 문자열 금지 `[검토 #12]`), TS strict. CodeQL(공개 저장소 무료 — *일반 지식*)은 선택 | | Y-S4, Y-S5 |

---

## 6. 호스팅

### 6.1 확인한 사실 (2026-10-12)

| 항목 | GitHub Pages | Cloudflare Pages / Workers 정적 자산 |
|---|---|---|
| 대역폭 | 월 100 GB **소프트** 한도 | 정적 자산 요청 무제한·대역폭 요금 없음 (3자) |
| 사이트 크기 | 1 GB | 배포당 파일 20,000개, 파일당 25 MiB (3자) |
| 빌드·배포 | 브랜치 빌드는 시간당 10회 소프트 한도, **Actions 사용자 워크플로 배포는 예외**, 배포 시간 제한 10분 | Pages 무료 월 500 빌드 (3자) |
| 응답 헤더 (CSP·HSTS) | 설정 불가 → `<meta>` CSP (3자, 공식 확인 못 함 — ADR-0008 H-Q3 그대로) | `_headers` 파일로 지정 가능 (Workers 정적 자산 공식 문서) |
| 방향 | — | Cloudflare 는 새 프로젝트에 Workers(정적 자산)를 Pages 의 후속으로 권한다는 3자 자료 |
| 출처 | [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | [Workers static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/), [mecanik 2026](https://mecanik.dev/en/posts/cloudflare-pages-vs-workers-which-to-use-in-2026/), [temps.sh 2026](https://temps.sh/blog/cloudflare-pages-free-tier-limits-2026) |

### 6.2 비교

| 기준 (가중치) | **GitHub Pages (Actions 배포)** | Cloudflare (Workers 정적 자산 / Pages) |
|---|---|---|
| **같은 주소 유지** — 설치된 PWA·`yui.v1.*` 저장·서비스워커 등록이 출처에 묶임 (35) | **5** | 1 — 출처가 바뀌면 기존 설치·컬렉션이 이어지지 않는다. 사용자 도메인을 두 곳에 같이 걸면 가능하지만 지금 사용자 도메인이 없다 |
| 빌드·CI 와의 연결 (20) | 5 — 같은 저장소 Actions, `actions/deploy-pages` | 4 — Git 연동 또는 wrangler |
| 보안 헤더 (15) | 2 — meta CSP 만, `frame-ancestors`·HSTS 불가 | 5 |
| 대역폭·한도 (15) | 4 — 100 GB 소프트, 추정 사용 < 10 GB (tech-stack.md §6) | 5 |
| 계정·운영 (15) | 5 — 추가 없음 | 3 — 계정·배포 경로 추가 |
| **가중 합** | **(175+100+30+60+75)/5 = 88** | **(35+80+75+75+45)/5 = 62** |

**선정 (사용자 앱): GitHub Pages 유지, 배포 방식만 "브랜치 루트" → "Actions 가 빌드 산출물(`dist/`) 배포" 로.** 주소·`manifest.id`(`./`)·SW 경로(`./sw.js`)가 그대로라 기존 설치가 새 빌드로 갱신된다(RFC-0003 §15). 이전 조건: 사용자 도메인을 두게 될 때 Cloudflare 로 옮긴다 — 그때는 출처가 바뀌므로 컬렉션 내보내기·가져오기 같은 이전 수단이 먼저 있어야 한다(ADR-0020).

### 6.3 GitHub Pages 의 보안 한계와 대응 (Y-S3, Y-S4, Y-S8)

| 한계 | 영향 | 대응 |
|---|---|---|
| 응답 헤더 불가 → CSP 는 meta 만. `frame-ancestors`·`report-uri` 불가(§5.5) | 사용자 앱이 다른 사이트의 iframe 안에 들어갈 수 있다(클릭재킹). CSP 위반을 서버로 보고받을 수 없다 | meta CSP 로 `script-src` 등은 강제한다 — 단 `'self'` 는 `<user>.github.io` 의 **다른 Pages 프로젝트까지** 믿으므로 `https://<user>.github.io/yui-board/assets/` 처럼 **경로를 한정**한다 `[검토 #13]`(RFC-0003 §17.3). 클릭재킹: 앱이 `window.top !== window.self` 이면 쓰기 버튼을 비활성화하고 "새 창에서 열기" 만 보인다(약한 방어지만 쓰기 경로를 막음). CSP 위반: E2E 가 `securitypolicyviolation` 이벤트를 수집해 0 인지 확인(Y-S4 수락 기준) |
| `<user>.github.io` **출처를 같은 GitHub 사용자의 다른 프로젝트 페이지와 공유** (RFC-0002 R-6) | 그 사용자의 다른 페이지에 XSS 가 있으면 `localStorage` 의 세션 토큰을 읽을 수 있다 | 익명 사용자 토큰은 피해가 작다(그 계정의 항목 수정 정도). **관리자 세션은 이 출처에 두지 않는다** → 관리자 콘솔은 별도 출처 |
| HSTS 를 우리가 설정할 수 없음 | — | `github.io` 는 HTTPS 강제(저장소 설정 "Enforce HTTPS"). HSTS preload 목록 포함 여부는 *일반 지식, 미확인* (SB-Q4) |

**선정 (관리자 콘솔): Cloudflare Workers 정적 자산(무료)에 별도 빌드로 둔다.** `_headers` 로 `Content-Security-Policy`(헤더, `frame-ancestors 'none'`), `Strict-Transport-Security`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` 를 건다. 관리자는 **책임자 1명**(D25)이라 "같은 주소 유지" 조건이 없다. 콘솔도 같은 React + Vite 스택의 별도 엔트리다 `[D24]`. 대안 — 관리자 화면을 사용자 앱 안의 지연 로드 라우트로 두는 것 — 은 출처 공유·헤더 불가 때문에 기각(ADR-0020). 이로써 Y-S4 의 "meta CSP 한계" 는 **공격 가치가 큰 쪽(관리자)을 헤더를 쓸 수 있는 호스트로 옮겨** 해결하고, 사용자 앱은 meta CSP + 클릭재킹 완화로 받아들인다.

---

## 7. 지도·데이터 (유지 확인)

| 항목 | 판정 | 근거 |
|---|---|---|
| Leaflet 1.9.4 + markercluster 1.5.3 | 유지, npm 의존성으로 | §2.4, ADR-0013 결정 1 의 "vendor 수동" 은 대체 |
| OSM 표준 타일 | 유지 | tech-stack.md §5 (2026-10-11) 판정 그대로. 일본 전체가 대상(Q-Y6)이 되어도 사용자 수 규모는 같다(*추정*). URL 은 설정 상수로 |
| 도도부현 경계 `data/japan-prefectures.geojson` | 유지. **같은 파일을 DB 에도 넣어** 서버가 좌표 → 도도부현을 판정 (PostGIS) | Y-M6 "좌표로 자동 판정", Y-A5 "좌표(일본 안)" — 서버가 판정해야 화면을 거치지 않은 요청에도 같은 규칙이 선다(ERD v2 §4.6) |
| PostGIS | Supabase 확장으로 사용 (*일반 지식 — Supabase 확장 목록에서 Y-2 착수 때 확인*). **`create extension postgis with schema extensions`** — `public` 에 깔면 `ST_*` 함수가 Data API RPC 로 노출된다 `[재검토 #3]` | 위 |

---

## 8. 비용 추정 (월, *추정*)

| 항목 | 무료 한도 | 예상 | 비용 |
|---|---|---|---|
| Supabase DB | 500 MB | 장소·일정 수천 건 + 신고·기록 + 경계 폴리곤(약 0.1 MB) → 수십 MB 이하 | 0 |
| Supabase MAU | 50,000 | 쓰기를 한 사람만 계정이 생김(Y-A1). 수백~수천 | 0 |
| Supabase egress | 5 GB (상충) | 장소 1,000건 목록 gzip 약 80 KB × 주간 활성 300명 × 주 10회 ≈ 월 1 GB + 갱신 확인 폴링(작은 응답) | 0 |
| GitHub Pages | 100 GB | 빌드 산출물 + 그림(최대 수 MB) < 10 GB | 0 |
| Turnstile | (출시 때 사용 안 함) | — | 0 |
| **합계** | | | **0엔** |

---

## 9. 열린 질문

| # | 질문 | 영향 |
|---|---|---|
| ~~TS-Q1~~ | ~~유지보수자는 누구이고 무엇을 아는가~~ — **해결: React (D24, ADR-0023 승인).** 홈 화면 예산 실측(ADR-0023 RE-Q2)도 **닫힘** `[검토 R-1]`: react + react-dom 19.3.0 = gzip 67.2 KB, 홈 약 95 KB → 예산 100 KB(ADR-0024 RF-Q1 에서 책임자 확인) | ADR-0023, ADR-0024 |
| TS-Q2 | `@supabase/auth-js` + `@supabase/postgrest-js` 분리 사용의 실제 크기와 유지 상태 확인 (전체 `supabase-js` 대비) | 첫 쓰기 지연 |
| ~~TS-Q3~~ | **해결 `[검토 R-8]`: vite-plugin-pwa 2.0.0(`injectManifest`) + workbox-\* 7.4.1 을 Y-1 에 설치(Vite 8.3.4).** (원래 질문: vite-plugin-pwa 의 Vite 8 호환 버전 확인. 호환이 없으면 SW 를 Vite 의 별도 엔트리로 빌드하고 사전 캐시 목록은 빌드 매니페스트에서 만든다) | RFC-0003 §15 |
| TS-Q4 | v1.3 의 Playwright 50개 검사 스크립트가 어디에도 없는가 (RFC-0002 §11.2 "저장소에 없음"). 있으면 그대로 옮기고, 없으면 범주에서 다시 쓴다 | Y-1 완료 기준 |
| TS-Q5 | **기숙사 Wi-Fi 의 공인 IP/CIDR** — `ip_tiers` 에 넣을 값. 기숙사 관리 측에 확인 `[검토 #6]`. **D26: 뒤로 미룸 — 출시 전 점검 항목**(RFC-0003 §17.6a). 확인 전까지 `ip_tiers` 는 비어 있고 모든 IP 가 기본 한도(5분 60)를 받는다 | B-1 |
| TS-Q13 | **관리자 메일용 SMTP** (사용자 SMTP 제공자·발신 주소) — **D26: 뒤로 미룸 — 출시 전 점검 항목.** 관리자 1명(D25)이라 그 전까지는 관리 API 로 비밀번호를 직접 재설정하는 런북(RFC-0003 R-6 — `auth.admin.updateUserById`, `[검토 R-9]`)으로 충분. 무료 SMTP 제공자의 한도는 이번에 확인하지 않음(tech-stack.md T-2 와 같음) | ADR-0018, RFC-0003 OQ-G |
| TS-Q10 | `[검토 미확인]` Supabase 클라우드에서 `pgrst.db_pre_request` 를 설정할 수 있는지. 안 되면 IP 한도는 쓰기 RPC 첫 단계에서 `request.headers` 를 읽어 같은 방식으로(트랜잭션 롤백 주의 — 상태 반환 규칙 유지) | B-9 |
| TS-Q11 | `[검토 미확인]` `before-user-created` 훅이 익명 가입에도 호출되는지 (ERD v2 OQ-E5) | 전역 가입 한도 |
| TS-Q12 | 익명 로그인 IP 한도를 범위별로 줄 수 있는지 — 없으면 전체 150 | B-1 |
| TS-Q6 | CAPTCHA 스위치를 켤 때 방침에 "Cloudflare(Turnstile)로 기기 신호가 전송됨" 을 미리 적어 둘지 — 켜는 순간 문구가 필요하므로 출시 방침에 조건부로 넣는 것을 제안 | ADR-0022, Y-P1, Y-P4, Y-S7 |
| ~~SB-Q1~~ | ~~관리자 콘솔을 Cloudflare 에 두는 것~~ — **해결: 둔다 (D21, ADR-0020 승인)** | ADR-0020 |
| SB-Q2 | 백업 덤프 보관 장소: 비공개 운영 저장소의 Actions 아티팩트(암호화, 보관 90일 이하)만으로 충분한지, 책임자 개인 저장소로 월 1회 옮길지 | Y-S9 |
| ~~SB-Q3~~ | ~~gitleaks 액션의 현재 버전·라이선스 조건 확인~~ — **해결: CLI 바이너리 v8.30.1** (액션은 쓰지 않음, y3s-automated-checks §1.1, 2026-10-22) | Y-S2 |
| SB-Q4 | `github.io` 가 HSTS preload 목록에 있는지 확인 | Y-S8 |
| TS-Q7 | 무료 플랜 1주 비활동 일시정지를 방학에 받아들일지, Pro($25/월)로 갈지 (tech-stack.md T-5 와 같음) | 가용성, pg_cron 정리 작업 |
| TS-Q8 | 도쿄 리전이 무료 프로젝트에서 선택 가능한지 (tech-stack.md T-1, 아직 미확인) | 지연 |
| TS-Q9 | 익명 사용자가 MAU 에 들어가는지 대시보드로 확인 | 비용(한도 안이라 영향 작음) |


## 부록. 버전 확인 (2026-10-12, `npm view` 로 레지스트리에서 직접 확인)

설계 작성 중에는 웹 검색으로만 버전을 확인했으므로, Y-1 착수 전에 npm 레지스트리에서 다시 확인한 값이다. 실제 고정은 `package-lock.json` 이 한다. `[검토 R-8]` "설치(Y-1)" 열은 저장소 `package.json`(`2.0.0-y1`)에 정확한 버전으로 고정된 값이다(2026-10-12 확인). 본문의 버전 표기는 이 열을 따른다.

| 패키지 | 최신 | 설치 (Y-1) | 결정 |
|---|---|---|---|
| react, react-dom | 19.3.0 | 19.3.0 | 사용 |
| vite | 8.3.4 | 8.3.4 | 사용 |
| @vitejs/plugin-react | 6.1.2 (peer: vite ^8) | 6.1.2 | 사용 — RE-Q5 해결 |
| typescript | 7.0.2 | **6.0.3** | **6.0.3 에 고정** `[검토 R-8]`: typescript-eslint 8.71.1 의 peer 가 `typescript >=4.8.4 <6.1.0` 이라 TS 7 은 지원 밖이다. 5.x 로 내리지 않는다. TS 7 은 typescript-eslint 의 peer 범위가 넓어진 뒤에 |
| vitest | 5.0.3 | 5.0.3 | 사용 (설계 본문의 "4.1" 은 작성 시점 정보 — 본문도 5.0.3 으로 고침) |
| @testing-library/react | 16.3.3 | (아직 없음) | 컴포넌트 테스트를 쓸 때 추가 |
| @playwright/test | 1.64.0 | 1.64.0 | 사용 |
| eslint | 10.12.0 | **9.39.5** | **9.x 로 고정** — eslint-plugin-react 7.37.5 의 peer 가 `^9.7` 까지 (RE-Q4 그대로). `@eslint/js` 도 9.39.5 |
| eslint-plugin-react | 7.37.5 | 7.37.5 | 사용 |
| eslint-plugin-react-hooks | 7.1.1 | 7.1.1 | 사용 |
| typescript-eslint | 8.71.1 | 8.71.1 | 사용 |
| prettier | 3.9.10 | 3.9.10 | 사용 |
| leaflet | 1.9.4 | 1.9.4 | 사용 (현재 저장소 vendor 와 같음) |
| leaflet.markercluster | — | 1.5.3 | 사용 (vendor 와 같음) |
| vite-plugin-pwa | — | 2.0.0 | 사용 — `injectManifest`, TS-Q3 해결 |
| workbox-core·precaching·routing·strategies·window | — | 7.4.1 | 사용 (SW 소스 `src/sw.ts`) |
| @supabase/supabase-js | 2.117.3 | (아직 없음) | Y-2 에서 사용 |
