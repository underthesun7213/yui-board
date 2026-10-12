# ADR-0023 · UI 는 React 19 + Vite 8 + TypeScript 의 정적 SPA 로 다시 쓴다 — 지도·라우터·상태는 프레임워크 밖에 둔다

| | |
|---|---|
| 상태 | 승인됨 (2026-10-12, 책임자 — PRD-YUNABI v2.5 **D24**) |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.5 D24(프레임워크 = React, Vite + TypeScript), D19(프레임워크 종류는 설계 제안 후 책임자 승인), G5, Y-C1, Y-C2, Y-M1, Y-M2, Y-J1, Y-S4, Y-S6, §7 "기반"·"품질"·"원칙" |
| 대체 | [ADR-0015](0015-frontend-framework-svelte.md) (Svelte 5 제안) — 상태 줄을 "폐기됨 — ADR-0023으로 대체됨" 으로 바꿨다 |
| 관련 | [tech-stack-v2 §2](../architecture/tech-stack-v2.md#2-ui-프레임워크), [RFC-0003 §5~§9·§17.3·§19](../architecture/rfc/0003-yunabi-v2.md), [ADR-0014](0014-map-container-survives-render.md)(지도 유지 원칙 — 유지), [ADR-0016](0016-toolchain-test-ci.md)(도구 — 이 ADR 에 맞춰 개정), [ADR-0020](0020-hosting-github-pages-actions.md)(호스팅·CSP), [ADR-0022](0022-security-baseline.md)(S4 XSS) |

> **승인 범위.** 책임자가 승인한 것은 결정 1(React + Vite + TypeScript)이다(D24). 결정 2~10 은 그 결과로 설계가 정한 구현 방침이며, ADR-0015 의 "프레임워크와 무관한 부분은 프레임워크 밖" 구조(결정 3)를 그대로 이어받는다. 책임자가 2~10 중 하나를 다르게 원하면 새 ADR 로 바꾼다(열린 질문 RE-Q1).

## 배경

설계는 Svelte 5 를 제안했다(ADR-0015, 가중 비교 Svelte 83 대 React 80). 차이가 3점이고 "친숙도" 가중치에 따라 순위가 바뀌어서, "유지보수자가 React 를 안다면 React" 라는 전환 조건을 열어 두었다(ADR-0015 결정 4, tech-stack-v2 §2.4). 책임자는 React 를 택했다(D24).

지켜야 하는 조건은 그대로다: 모바일 PWA 의 가벼운 첫 화면(Y-C1), Leaflet 지도를 **한 번만 만들어 탭을 오가도 유지**(Y-M2, ADR-0014), 지도 진입 = 내 주위(Y-M1), 3개 언어 문자열의 누락 검사(Y-C2), 사용자 글은 텍스트로만(Y-S4), 저장소 안 자동 테스트(§7). React 에서 새로 생기는 문제는 셋이다.

1. **개발 모드 StrictMode 는 effect 를 "설치 → 정리 → 다시 설치" 로 두 번 돌린다.** 컴포넌트가 effect 에서 `L.map()` 을 만들면 두 번째 실행이 "Map container is already initialized" 를 내거나 인스턴스가 두 개 생긴다(3자 자료, 아래 확인표).
2. **런타임이 크다.** react + react-dom 은 gzip 약 42~45 KB(3자 자료, tech-stack-v2 §2.2) — RFC-0003 §3 의 첫 화면 목표 60 KB 의 대부분이다.
3. **XSS 탈출구가 다르다.** Svelte 의 `{@html}` 대신 React 의 `dangerouslySetInnerHTML`, 그리고 `ref` 로 DOM 의 `innerHTML` 에 직접 쓰는 길이 있다.

## 확인한 사실 (2026-10-12 웹 검색)

이 환경에서 `reactrouter.com` 등 일부 공식 페이지는 WebFetch 가 DNS 오류로 열리지 않아(tech-stack-v2 머리말과 같은 한계) **검색 결과가 인용한 공식 페이지 발췌와 3자 자료**로 확인했다. 정확한 패치 번호는 Y-1 착수 때 `npm view <패키지> version` 으로 다시 확인하고 `package.json` 에 고정한다.

| 항목 | 내용 | 신뢰도 | 출처 |
|---|---|---|---|
| React | 현재 줄은 **19.2.x**. 찾은 최신 패치는 19.2.8(2026-07-21). React 20 은 없음. 18.3.1 은 보안 백포트만 | 3자 수명 주기 페이지 (최신 패치 미확정) | [endoflife.ai](https://endoflife.ai/article-react-eol.html), [codercops](https://blog.codercops.com/blog/react-19-2-vs-react-20-explained), [versionlog](https://versionlog.com/react/) |
| React Router | **v8.0.0 = 2026-06-17** 출시, 연 1회 메이저 주기의 첫 판. 최소 **React 19.2.7**, Node 22.22.0, Vite 7. ESM 전용, `react-router-dom` 패키지 제거. 2026-07 기준 8.2.0(3자), 공식 변경 기록 목차에 8.3.0. v7 마지막은 7.18.1(2026-06-29). v9 는 Node 24 이상 예정 | 공식 변경 기록·블로그(검색 발췌) + InfoQ | [Remix 블로그 v8](https://remix.run/blog/react-router-v8), [InfoQ 2026-08](https://infoq.com/news/2026/08/react-route-v8), [변경 기록 8.0.0](https://reactrouter.com/8.0.0/changelog.md), [7.18.x 변경 기록](https://reactrouter.com/7.18.3/changelog.md), [Scrimba 2026](https://scrimba.com/articles/react-router-complete-guide-2026/) |
| Vite | 8.0 안정판 2026-03-12(Rolldown 단일 번들러). 패치 8.0.8(2026-04-09) 확인, 8.0.16(2026-06, 3자 주장). Node 20.19 이상(3자) | 공식 블로그 + 3자 | [Vite 8 공지](https://vite.dev/blog/announcing-vite8), [releasebot](https://releasebot.io/updates/vite/vite) |
| `@vitejs/plugin-react` | v6 에서 Babel 대신 oxc. Babel 플러그인은 `@rolldown/plugin-babel` 로 분리. Vite 8 과 v5 조합도 문서화됨 | 3자 블로그 (npm 미확인) | [recca0120 2026-04-14](https://recca0120.github.io/en/2026/04/14/react-compiler-vite-v6/), [SitePoint](https://www.sitepoint.com/vite-8-migration-esbuild-oxc-production-react/) |
| Vitest | 4.1.0 은 Vite 8 을 바로 지원. 추적 사이트 기준 최신 안정 4.1.10, 5.0 은 베타 | 릴리스 기록 + 3자 | [newreleases 4.1.0](https://newreleases.io/project/npm/vitest/release/4.1.0), [releasealert](https://releasealert.dev/github/vitest-dev/vitest) |
| React Testing Library | `@testing-library/react` v16 줄에서 React 19 지원 추가(2024-12-05 커밋). 최신 패치 미확인 | GitHub 비교 + 3자 | [RTL 커밋 비교](https://redirect.github.com/testing-library/react-testing-library/compare/v16.0.1...85ac2534a59abd38880011e77da4bb8c716eba84), [pkgpulse 2026](https://www.pkgpulse.com/guides/testing-library-vs-enzyme-2026) |
| `eslint-plugin-react-hooks` | 7.0.x: 설정은 `recommended`·`recommended-latest` 둘, flat config `configs.flat.recommended`, 컴파일러 규칙 기본 포함. 최신 7.0.1 | 공식 README·변경 기록(검색 발췌) | [README](https://github.com/react/react/blob/main/packages/eslint-plugin-react-hooks/README.md), [PR #34757](https://github.com/facebook/react/pull/34757/files) |
| `eslint-plugin-react` | flat config 지원. **7.37.5 는 ESLint 10 과 호환되지 않는다**(제거된 `context.getFilename()` 사용) — 대안 `@eslint-react/eslint-plugin`. `react/no-danger` 는 `recommended` 에 없어 직접 켜야 한다 | 3자 변경 기록 | [Fluid eslint-config 변경 기록](https://unpkg.com/@fluidframework/eslint-config-fluid@13.0.0/CHANGELOG.md), [tessl](https://tessl.io/registry/tessl/npm-eslint-plugin-react) |
| react-leaflet | **5.0.0 (2024-12-14)**: peer `react ^19`, `react-dom ^19`, `leaflet ^1.9.0`. `react-leaflet-cluster` 4.0.0 이 react-leaflet 5·React 19 지원 | 패키지 페이지 + 릴리스 | [yarn](https://classic.yarnpkg.com/en/package/react-leaflet), [tessl](https://tessl.io/registry/tessl/npm-react-leaflet), [react-leaflet-cluster 4.0.0](https://newreleases.io/project/npm/react-leaflet-cluster/release/4.0.0) |
| StrictMode × Leaflet | 개발 모드에서 effect 가 두 번 돌아 같은 컨테이너에 지도를 다시 만들면 오류. 표준 처방은 ref 에 인스턴스를 두고 정리 함수에서 `remove()` | 3자 블로그·포럼 (공식 문서 없음) | [plainenglish](https://javascript.plainenglish.io/exploring-leaflet-for-interactive-map-in-react-apps-2eaa3264ff0f), [fixdevs](https://fixdevs.com/blog/react-useeffect-runs-twice/) |
| `useSyncExternalStore` | React 바깥 저장소를 구독하는 공식 훅. `subscribe` 는 해제 함수를 돌려주고 `getSnapshot` 은 안정된 스냅샷을 돌려줘야 한다. 동시 렌더링 중 찢어짐(tearing) 방지 | 공식 문서 | [react.dev](https://react.dev/reference/react/useSyncExternalStore.md) |
| Zustand | v5 가 React 18 미만 지원을 끊고 내장 `useSyncExternalStore` 사용. 코어 gzip 약 1.2 KB(3자, 측정 방법 불명) | 공식 블로그 + 3자 | [Zustand v5 공지](https://pmnd.rs/blog/announcing-zustand-v5), [pkgpulse](https://www.pkgpulse.com/guides/zustand-vs-redux-toolkit-2026) |
| i18n 라이브러리 크기 | react-i18next 약 9.7 KB 또는 약 15 KB, react-intl 약 17~45 KB(gzip) — **자료끼리 상충**, 순위도 엇갈림 | 3자 | [pkgpulse 2026](https://www.pkgpulse.com/guides/best-i18n-libraries-react-2026), [i18nexus](https://i18nexus.com/posts/comparing-react-i18next-and-react-intl), [locize](https://locize.com/blog/react-intl-vs-react-i18next) |
| CSP `unsafe-eval` | React **운영 빌드**는 `'unsafe-eval'` 이 필요 없다는 것이 여러 자료의 일치된 내용. 필요해지는 것은 개발 도구(React Refresh) 또는 `eval`·`new Function` 을 쓰는 의존성. 공식 React 문서의 명시 문구는 찾지 못함 | 3자 다수 | [StackHawk](https://www.stackhawk.com/blog/react-content-security-policy-guide-what-it-is-and-how-to-enable-it/), [DEV](https://dev.to/jenchen/security-solving-the-content-security-policy-csp-header-not-set-in-nextjs-script-src-and-37ie), [abrarqasim](https://abrarqasim.com/blog/?p=715) |

## 결정

1. **React 19.2 + Vite 8 + TypeScript(strict)** 로 사용자 앱과 관리자 콘솔을 쓴다(D24). `@vitejs/plugin-react`. 메타 프레임워크(Next.js, React Router 의 framework 모드)는 쓰지 않는다 — 정적 SPA 하나, 서버 렌더 없음(RFC-0003 §21). 개발 모드는 `<StrictMode>` 를 켠다(아래 결정 2 가 StrictMode 에서도 안전하도록 설계한 이유). React Compiler 는 Y-1 에서 켜지 않는다(빌드 단계가 하나 늘고, 성능 문제가 측정되기 전에는 이득이 없다 — Y-1 끝에 다시 본다).

2. **지도: Leaflet 런타임은 React 밖의 모듈 싱글턴이고, 컴포넌트는 "슬롯" 만 빌려준다.** (ADR-0014 의 `LBOX` 원칙, RFC-0003 §9)
   - `src/map/runtime.ts` 가 컨테이너 `div` 하나와 `L.map` 하나를 **모듈 수준에서** 가진다. `ensure()` 는 `import('leaflet')` 와 markercluster 를 **한 번만** 부르는 메모이즈된 Promise 이고 `L.map(container)` 도 그 안에서 한 번만 만든다. **어떤 경로에서도 `map.remove()` 를 부르지 않는다.**
   - `MapSlot` 컴포넌트는 `useRef<HTMLDivElement>` 로 빈 슬롯을 그리고, effect 에서 `runtime.attach(slot)` 을, 정리 함수에서 `runtime.detach(slot)` 을 부른다. 정리 함수는 지도를 **떼기만** 한다.
   - **StrictMode 에서 안전한 이유:** 개발 모드의 "attach → detach → attach" 는 같은 컨테이너를 붙였다 뗐다 다시 붙일 뿐이고, `ensure()` 가 메모이즈되어 있어 `L.map` 은 한 번만 만들어진다. 컴포넌트 안에 인스턴스를 두는 "ref + 정리에서 `remove()`" 처방(3자 자료의 표준 처방)은 StrictMode 는 통과하지만 **탭을 떠날 때마다 지도를 부수므로** Y-M2(ML-M11)·ADR-0014 를 어긴다 — 그래서 쓰지 않는다.
   - **경합 방지 가드:** `attach` 는 비동기(첫 호출 때 Leaflet 지연 로드)다. 런타임은 `currentSlot` 과 세대 번호를 두고, `ensure()` 가 끝났을 때 `currentSlot !== slot` 이면(그 사이 detach 됨) 붙이지 않는다. `detach(slot)` 은 `currentSlot === slot` 일 때만 떼어 낸다 — 다른 화면의 새 슬롯이 먼저 붙은 경우(폼 라우트 MAP-04 → 지도) 옛 슬롯의 정리가 새 슬롯을 떼지 않게.
   - **상태 → 지도:** 런타임은 attach 되어 있는 동안 **프레임워크 없는 저장소**(결정 4 의 `mapUi`, `data`, `location`, `prefs`)를 직접 구독하고 `sync()` 한다. React effect 의 의존성 배열로 지도를 움직이지 않는다 — StrictMode 의 이중 실행이 `fitBounds` 를 두 번 부르는 일이 없고, 화면을 떠나 있는 동안의 변경은 v1.3 처럼 `stale` 로 표시했다가 다음 attach 에서 맞춘다. 맞춤(fit) 요청은 `mapUi.fitSeq` 같은 증가 번호로 전달한다.
   - 코드 형태(설계 예시, 구현 아님):
     ```ts
     // src/map/MapSlot.tsx
     export function MapSlot() {
       const ref = useRef<HTMLDivElement>(null);
       useEffect(() => {
         const slot = ref.current!;
         void runtime.attach(slot);          // 멱등, StrictMode 재실행에 안전
         return () => runtime.detach(slot);  // 떼기만 — map.remove() 금지
       }, []);
       return <div ref={ref} className="map-slot" />;
     }
     ```

3. **react-leaflet 은 쓰지 않는다.** react-leaflet 5 는 React 19·Leaflet 1.9 와 맞지만(확인표), `MapContainer` 는 **컴포넌트 수명 = 지도 수명** 모델이라 탭을 떠나면 지도가 사라진다. 이를 피하려면 지도 화면을 숨긴 채 계속 마운트해 두는 우회가 필요하고, 그러면 라우트 구조가 지도에 끌려간다. 또 v1.3 의 지도 로직(모드별 화면 보존, 일본 전체 경계 레이어, 위치 상태 기계, 타일 실패 집계)은 이미 명령형이라 옮기는 비용이 가장 작은 길은 런타임 모듈을 그대로 TS 로 옮기는 것이다. 클러스터는 커뮤니티 래퍼(`react-leaflet-cluster`)에 한 겹 더 의존하게 된다. Leaflet 2.0(ESM, 전역 `L` 제거 — tech-stack-v2 §2.2)으로 갈 때도 래퍼의 지원을 기다릴 필요가 없다. 대가: React 개발자에게 익숙한 선언형 API 를 잃고, 런타임 모듈의 단위 테스트를 직접 써야 한다.

4. **상태: 프레임워크 없는 작은 저장소 + `useSyncExternalStore`. Zustand 등 라이브러리 없음.**
   - `src/state/store.ts` 에 30줄 정도의 `createStore<T>(initial)` — `get()`, `set(patch)`, `subscribe(fn) → unsubscribe`. 스냅샷은 불변 객체로 교체(같은 값이면 같은 참조 — `getSnapshot` 규칙).
   - React 쪽은 `useStore(store, selector)` 훅 하나가 `useSyncExternalStore(store.subscribe, () => selector(store.get()))` 를 감싼다(선택 결과가 원시값이거나 저장소가 미리 만든 객체여야 함 — 매번 새 객체를 돌려주는 selector 는 린트로 막을 수 없으므로 리뷰 규칙 + 단위 테스트).
   - 모듈 구분은 RFC-0003 §7 그대로(`prefs`, `collection`, `location`, `mapUi`, `vn`, `calendarUi`, `data`, `session`, `net`), 파일명만 `*.svelte.ts` → `*.ts`.
   - **이유:** 지도 런타임·라우터·동작 함수(`actions/`)가 React 없이 같은 저장소를 구독해야 한다(결정 2). React Context 는 React 트리 밖에서 읽을 수 없다. Zustand v5 의 vanilla 저장소도 같은 일을 하고 1 KB 남짓이지만(확인표), 필요한 기능이 `get/set/subscribe` 뿐이라 의존성 하나(T-09 공급망)를 늘릴 이유가 약하다. **Zustand 는 동등한 대안** — 저장소가 늘어 미들웨어(영속·devtools)가 필요해지면 바꾼다. Redux Toolkit·Jotai 는 이 규모에 과하다.

5. **라우팅: React Router 대신 v1.3 뒤로 가기 규칙을 옮긴 작은 자체 라우터.** (RFC-0003 §6 그대로)
   - `src/app/router.ts`(프레임워크 없음): 해시 라우트 파싱, `navigate(route, {replace})`, `back()`(‹ — `PARENT[route] === history.state.prev` 이면 `history.back()`, 아니면 부모로 `go`), `popstate` 처리, 같은 탭 재탭 = `replaceState`, 도도부현 선택 = 같은 `#/map` 위의 기록 항목, 옛 쿼리(`?v=`, `?tab=1`, `?compose=1`) → 해시 변환. 현재 라우트는 결정 4 의 저장소(`route`)에 있고 `App` 은 `useStore(route)` 로 화면 컴포넌트를 고른다(`React.lazy` 로 지도·폼·법적 페이지 분할).
   - **React Router v8 을 쓰지 않는 이유:** (1) v1.3 규칙(`prev` 기반 ‹, 같은 탭 `replaceState`, D14 의 "다른 화면에서 지도로 올 때만 near" 와 "OS 뒤로 가기로 올 때는 이전 상태" 의 구분)은 라우터 바깥의 이동 출처 정보가 필요해 어차피 `nav.ts` 를 따로 써야 한다. (2) 라우터가 React 훅(`useNavigate`)에 묶이면 지도 런타임·동작 함수·렌더 검사(node)에서 같은 이동 로직을 부르기 어렵다. (3) **연 1회 메이저 주기**(v7 → v8 이 1년 안, v9 는 Node 24 예정 — 확인표)는 소수 인원이 유지보수하는 앱에 업그레이드 부담이다. (4) 데이터 API·middleware·loader 를 쓰지 않는다. 크기 차이(*추정*: 수 KB~십수 KB gzip)는 부차적 이유다.
   - 대가: React 개발자가 익숙한 `<Link>`·`useParams` 대신 자체 `<NavLink to>`·`useRoute()` 를 배운다(라우트 표 하나, 200줄 안팎 *추정*). 경로 라우트·라우트 20개 이상·중첩 레이아웃이 필요해지면 다시 본다(RE-Q3).

6. **i18n: 라이브러리 없이 타입 있는 문자열 객체 + `t()` + `useT()` 훅.** (RFC-0003 §8 그대로)
   - `src/i18n/en.ts` 가 원본(`as const`), `ja.ts`·`ko.ts` 는 `satisfies Messages` → 키 누락은 컴파일 오류. `t(key, params)` 는 순수 함수, `useT()` 는 `prefs.lang` 을 구독해 현재 언어의 `t` 를 돌려준다. 수·날짜 서식은 내장 `Intl`(`DateTimeFormat`, 필요하면 `PluralRules`).
   - **i18next / react-intl 을 쓰지 않는 이유:** 3개 언어·고정 문자열·서버 번역 파일 없음(번역은 하지 않음, Q-Y4)이라 그들의 핵심 기능(네임스페이스 지연 로드, 언어 감지, ICU 메시지·복수형 규칙 엔진)이 필요 없다. 일본어·한국어는 복수형 구분이 없고 영어 몇 곳은 `Intl.PluralRules` 로 충분하다. 크기 자료는 상충하지만(약 10~45 KB gzip — 확인표) 어느 값이든 첫 화면 예산(결정 9)의 큰 몫이다. v1.3 `T` 의 배열·중첩 구조를 기계적으로 옮길 수 있다.
   - 대가: 메시지 추출·번역 관리 도구 연계가 없다. 언어가 5개 이상이 되거나 외부 번역자가 붙으면 다시 본다.

7. **XSS (Y-S4, ADR-0022 S4):**
   - 사용자 글은 **JSX 텍스트 보간만**(React 가 이스케이프). `dangerouslySetInnerHTML` 은 **`react/no-danger: error`**(`eslint-plugin-react`, recommended 에 없어 명시적으로 켬). `src/**` 전체에 `no-restricted-syntax` 로 `innerHTML`·`outerHTML` 대입과 `insertAdjacentHTML`·`document.write` 호출도 금지 — `ref.current.innerHTML = …` 로 우회하는 길을 막는다.
   - **Leaflet HTML API 금지 유지** `[검토 #12]`: `src/map/**` 에서 `bindTooltip`·`bindPopup`·`setContent`·`L.divIcon({html})` 에 문자열·템플릿 리터럴 인자 금지. 사용자 글은 `createElement` + **`textContent`** 로 만든 노드로만 넘기고, `divIcon` 의 `html` 은 사용자 글 없는 고정 마크업만. 핀 제목은 마커 `title` 옵션(속성).
   - 링크는 서버 허용 목록 + 클라이언트 URL 파서 재확인(`https:` 만) + `rel="noopener noreferrer"`. React 가 `javascript:` URL 을 막는 동작에 기대지 않는다.
   - `eslint-plugin-react` 7.37.5 는 ESLint 10 과 맞지 않는다(확인표) → **ESLint 9 에 고정**(ADR-0016). ESLint 10 으로 갈 때는 `@eslint-react/eslint-plugin` 의 같은 규칙으로 바꾼다(RE-Q4).

8. **CSP:** React 운영 빌드는 `'unsafe-eval'` 이 필요 없다(확인표 — 공식 명시는 없으므로 **E2E 의 `securitypolicyviolation` 수집이 확인 수단**). `@vitejs/plugin-react` 의 개발 서버는 Fast Refresh 용 인라인 스크립트를 넣는다(*일반 지식*) → **meta CSP 는 운영 빌드에만 주입**한다(`transformIndexHtml`, `apply: 'build'`). 운영 정책은 RFC-0003 §17.3 그대로이고 `'unsafe-eval'`·스크립트 `'unsafe-inline'` 없음. React 의 `style={…}` 는 CSSOM 으로 설정되어 `style-src` 의 인라인 제한을 받지 않는다(*일반 지식*) — `style-src 'unsafe-inline'` 이 남는 이유는 Leaflet 이고, Y-1 에서 제거 가능성을 확인한다.

9. **번들 예산 (사용자 앱, CI 실패 조건):**

   | 대상 | 예산 (gzip) | 근거 |
   |---|---|---|
   | 홈 진입 JS + CSS 합계 | **75 KB 이하** (Svelte 안의 60 KB 에서 올림) | react + react-dom 약 42~45 KB(3자) + 앱 셸·홈·라우터·저장소·i18n 3개 언어 약 20 KB(*추정* — v1.3 `index.html` 전체가 40 KB 이고 그중 문자열·콘텐츠가 절반 이상) + CSS 약 8 KB(*추정*) |
   | 레슨·게임 청크 | 30 KB 이하 | 콘텐츠 데이터(`src/content/`)가 대부분 |
   | 지도 청크(Leaflet + markercluster + 런타임) | 60 KB 이하 | 지도 탭 첫 진입 때만 |
   | 쓰기 청크(폼 + `@supabase/auth-js` + `postgrest-js`) | 50 KB 이하 | 첫 쓰기 때만(tech-stack-v2 TS-Q2) |
   | 관리자 콘솔 | 예산 없음 (크기 보고만) | 사용자 1명(D25), 데스크톱 |

   예산은 Y-1 초에 홈 화면 하나로 `vite build` 해 실측한 뒤 확정한다(RE-Q2). 넘으면 순서대로: 현재 언어 외 문자열을 지연 청크로, 레슨 콘텐츠 분리, 그래도 넘으면 책임자에게 보고. **Preact(compat) 로 바꾸는 것은 이 ADR 의 범위 밖**(D24 는 React).

10. **테스트 (ADR-0016 개정):**
    - **단위:** Vitest 4.1 (node) — `domain/**`, `state/**`, `app/router.ts`, `map/runtime.ts`(Leaflet 을 가짜로 바꿔 attach/detach 순서·StrictMode 재실행·경합 가드 검사).
    - **렌더 검사 (v1.3 헤드리스 검사의 이전):** Vitest node 환경에서 `react-dom/server` 의 `renderToString` 으로 **모든 라우트 × en/ja/ko × 상태 조합**(위치 7상태, 일본 전체·도도부현, 회차, 컬렉션 빈/가득, 분기 게임 모든 장면 × 선택 전후)을 그려 예외·`undefined`·`NaN`·`[object Object]`·라우트 표 누락을 찾는다. 화면 컴포넌트가 바깥 세계를 건드리지 않는다는 규칙(RFC-0003 §5.1)과 저장소가 React 밖에 있다는 점(결정 4) 덕분에 저장소에 상태를 넣고 `<App/>` 을 그리기만 하면 된다. `MapSlot` 은 빈 `div` 만 그리므로 node 에서 안전하다(effect 는 서버 렌더에서 돌지 않는다).
    - **컴포넌트:** Vitest + **React Testing Library**(`@testing-library/react` v16) — 폼 검증 표시, 신고 시트, `MapSlot` 재부착(StrictMode 로 감싸서), `FrameGuard`. 환경은 Vitest 브라우저 모드(Playwright 프로바이더)를 기본으로, 빠른 것은 jsdom 도 허용.
    - **E2E:** Playwright (Chromium 375px, 3개 언어) — 변경 없음. 지도 인스턴스가 하나인지(`document.querySelectorAll('.leaflet-container').length === 1`, 탭 왕복·언어 변경 후 같은 객체) 검사 추가.
    - **DB:** pgTAP (`supabase test db`) — 변경 없음.
    - 타입 검사는 `svelte-check` 대신 `tsc -b --noEmit`.

## 고려한 대안

| 대안 | 판단 |
|---|---|
| Svelte 5 (ADR-0015) | 설계 제안이었으나 책임자 결정(D24)으로 대체. 번들은 더 작고 v1.3 템플릿을 옮기기 쉬웠다 — 그 이점을 포기하고 인력·자료 친숙도를 택한 것 |
| react-leaflet 5 | 결정 3 — 컴포넌트 수명 = 지도 수명 모델이 ADR-0014 와 충돌 |
| 지도 인스턴스를 컴포넌트 ref 에 두고 정리에서 `remove()` | StrictMode 는 통과하지만 탭 이동마다 지도를 다시 만든다(Y-M2 위반, 타일·경계 레이어 재로딩) |
| React Router v8 (`createHashRouter` / 선언형 `HashRouter`) | 결정 5 — v1.3 이동 규칙은 어차피 자체 모듈, React 밖에서 이동을 부를 수 없음, 연 1회 메이저 |
| Zustand v5 | 결정 4 — 동등한 대안. 기능이 `get/set/subscribe` 뿐이라 의존성을 늘리지 않음 |
| React Context + `useReducer` | 지도 런타임·라우터가 React 밖에서 상태를 읽을 수 없고, Context 값 변경이 하위 전체를 다시 그린다 |
| i18next + react-i18next, react-intl | 결정 6 — 필요 없는 기능에 첫 화면 예산을 쓴다 |
| Next.js / React Router framework 모드 | 서버 렌더·파일 라우팅 불필요, GitHub Pages 정적 배포(ADR-0020) |
| Preact + compat | React API 와 생태계를 거의 그대로 쓰면서 런타임이 작다(tech-stack-v2 §2.2). D24 가 React 라서 채택하지 않음 — 예산을 크게 넘을 때 책임자에게 다시 물을 선택지로만 남긴다 |

## 결과

- **좋은 점:** 유지보수 인력·자료·채용이 가장 넓다(tech-stack-v2 §2.3 친숙도 5점). Testing Library·Playwright 자료가 풍부하다. 지도·라우터·상태·도메인이 React 밖에 있어서 React 메이저 업그레이드나 프레임워크 교체의 영향이 `features/`·`ui/` 의 `.tsx` 에 머문다(ADR-0015 결정 3 이 의도한 성질이 그대로 유지됨). StrictMode 를 켠 채 개발해도 지도는 하나다.
- **나쁜 점:** 첫 화면 예산이 60 → 75 KB 로 커진다(저사양 기기·느린 회선에서 첫 진입이 느려짐 — 서비스워커 사전 캐시가 두 번째 방문부터 완화). v1.3 의 HTML 문자열 뷰를 JSX 로 다시 써야 한다(`class` → `className`, 위임 클릭 → 이벤트 핸들러). 자체 라우터·저장소·i18n 은 React 개발자에게 익숙하지 않은 코드다(각각 작고 테스트로 문서화되는 것이 대가).
- **바뀌는 문서:** tech-stack-v2 §1·§2·§3·§4·§5.6, RFC-0003 §4.2·§5·§7·§8·§9·§17·§19, ADR-0016 결정 1~3. ERD v2·openapi-v2 는 프레임워크와 무관해 바뀌지 않는다.
- **재검토 조건:** 홈 예산 실측이 75 KB 를 크게 넘을 때(RE-Q2), Leaflet 2.0 안정판 + markercluster 호환판 출시, 라우트가 20개를 넘거나 경로 라우트가 필요할 때(사용자 도메인 도입 — ADR-0020 결정 6).

## 열린 질문

| # | 질문 | 제안 |
|---|---|---|
| RE-Q1 | 승인 범위: D24 는 결정 1(React) 이다. 결정 2~10(react-leaflet 미사용, 자체 라우터, 자체 저장소, i18n 라이브러리 미사용, 예산 75 KB)도 이 ADR 로 확정해도 되는가 | 확정. 다르게 원하면 새 ADR |
| RE-Q2 | 홈 진입 75 KB 예산을 Y-1 첫 주에 실측으로 확정할지(홈 화면 하나 빌드) | 실측 후 확정, CI 실패 조건으로 |
| RE-Q3 | 자체 라우터 대신 React Router 를 원하는가 — 유지보수자가 React Router 에 익숙하다면 v1.3 규칙을 `nav.ts` 에 두고 라우트 매칭만 React Router 에 맡기는 절충도 가능 | 자체 라우터 |
| RE-Q4 | ESLint 9 고정 기간 — `eslint-plugin-react` 가 ESLint 10 을 지원하지 않는 동안. 10 으로 갈 때 `@eslint-react/eslint-plugin` 으로 바꾼다 | Y-1 은 ESLint 9 |
| RE-Q5 | `@vitejs/plugin-react` v6(oxc) 과 v5(Babel) 중 무엇을 쓸지 — React Compiler 를 쓰지 않으므로 v6 이 단순. npm 에서 Vite 8 호환 버전 확인 | v6, Y-1 착수 때 확인 |
