# ADR-0015 · UI 는 Svelte 5 + Vite + TypeScript 의 정적 SPA 로 다시 쓴다 (SvelteKit 없음)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 D19 (프레임워크 종류는 설계 제안 후 책임자 승인), G5, Y-C1, Y-C2, Y-M2, Y-J1, §7 "기반"·"원칙" |
| 관련 | [tech-stack-v2 §2](../architecture/tech-stack-v2.md#2-ui-프레임워크), [RFC-0003 §5~§10](../architecture/rfc/0003-yunabi-v2.md), ADR-0013(빌드 없음 — 이 ADR 과 ADR-0016 이 사실상 대체), ADR-0014(지도 유지 — 원칙 유지), ADR-0003(대체됨) |

## 배경

D19 로 단일 파일·빌드 없음·프레임워크 금지 규칙이 없어졌다. PRD 는 Vite + TypeScript 를 정했고 프레임워크 종류는 설계에 맡겼다. 조건: 모바일 PWA 의 첫 화면이 가볍고(v1.3 gzip 40 KB), Leaflet 지도를 한 번만 만들어 유지하며(ADR-0014), 3개 언어 문자열을 타입으로 검사하고, 저장소 안에서 테스트할 수 있어야 한다. 유지보수 인력과 그들의 친숙도는 정해지지 않았다.

## 결정

1. **Svelte 5**(룬)로 쓴다. 가중 비교에서 Svelte 83, React 80, Vue 80, Preact 77, Solid 64 (tech-stack-v2 §2.3).
2. **SvelteKit 은 쓰지 않는다.** `@sveltejs/vite-plugin-svelte` 로 정적 SPA 하나를 빌드한다. 라우터는 v1.3 뒤로 가기 규칙을 옮긴 작은 자체 모듈(해시 라우트, RFC-0003 §6).
3. 프레임워크와 무관한 부분은 프레임워크 밖에 둔다: `src/domain/`(반복 일정·.ics·거리·도도부현·검증), `src/map/runtime.ts`(Leaflet 싱글턴), `src/app/router.ts`, `src/api/`, `src/platform/`. 화면 컴포넌트(`src/features/`, `src/ui/`)만 Svelte 다.
4. **전환 조건:** 책임자가 "유지보수자가 React 를 이미 안다" 고 답하면 React 19 로 바꾼다. 결정 3 덕분에 바뀌는 범위는 컴포넌트 파일과 상태 모듈(`.svelte.ts` → 훅)뿐이다.
5. Leaflet 은 1.9.4 를 **npm 의존성**으로 쓰고 `import()` 로 지연 로드한다(ADR-0013 결정 2 의 효과 유지, 결정 1 의 "vendor 수동 복사" 는 대체). Leaflet 2.0 은 2026-10-12 검색 기준 알파만 확인됨.
6. 사용자 글 출력은 Svelte 텍스트 보간만. `{@html}` 은 린트 오류(ADR-0016, Y-S4).

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| React 19 | 친숙도·생태계 최고. 런타임만 gzip 40 KB대라 첫 화면 목표(60 KB)의 대부분을 쓴다. v1.3 HTML 문자열 뷰를 JSX 로 다시 써야 한다. **친숙도 가중치를 30 으로 올리면 1위** — 결정 4 로 열어 둔다 |
| Vue 3.5 | React 와 동점. 템플릿이 v1.3 에 가깝지만 런타임이 Svelte 보다 크다 |
| Preact | 작고 React 지식이 통하지만 react-leaflet 등은 compat 경유, i18n·테스트 자료가 적다 |
| Solid | 작지만 인력·자료가 가장 적다 |
| SvelteKit (adapter-static) | 파일 기반 라우팅·SSR 기능이 필요 없고, v1.3 의 `prevView`/같은 탭 `replaceState`/도도부현 기록 항목 규칙을 맞추기가 자체 라우터보다 어렵다 |
| 프레임워크 없이 TS + 자체 렌더 | D19 위반, v1.3 의 `render()`·`updateMap()` 이중 경로 문제(ADR-0014) 그대로 |

## 결과

- 좋은 점: 첫 화면이 가볍다. v1.3 뷰 함수(템플릿 문자열)가 거의 1:1 로 Svelte 템플릿이 되고 자동 이스케이프로 `esc()` 규칙이 구조가 된다. `svelte/server` 의 `render()` 로 v1.3 헤드리스 검사를 그대로 옮길 수 있다(ADR-0016).
- 나쁜 점: React 보다 인력·라이브러리가 적다. Svelte 5 룬은 Svelte 4 자료와 문법이 달라 오래된 예제가 혼란을 준다.
- 재검토 조건: 결정 4의 답, 또는 Leaflet 2.0 안정판 + markercluster 호환판 출시.

## 열린 질문

| # | 질문 |
|---|---|
| F2-Q1 | 유지보수자는 누구이고 React 를 아는가 (승인 전 필수) |
| F2-Q2 | 승인 전에 홈 화면 하나로 Svelte·React 빌드 크기 스파이크를 할지 |
