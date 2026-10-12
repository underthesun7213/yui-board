# ADR-0024 · React 전환 보완 — 홈 예산 100 KB 재기준, 서버 스냅샷, `prerender` 렌더 검사, Leaflet 인자 린트, 지연 라우트 오류 경계, 버전 고정

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | React 전환 문서 검토(ADR-0023·ADR-0016·tech-stack-v2·RFC-0003, 판정 "보완 필요") 지적 1~11, Y-1 착수 실측·설치 버전(`package.json` `2.0.0-y1`), PRD-YUNABI v2.5 D24, Y-C1, Y-C2, Y-M2, Y-S3, Y-S4, §7 "품질" |
| 대체 | [ADR-0023](0023-frontend-framework-react.md) **결정 9 의 홈 예산 수치(75 KB)** 를 대체한다. 결정 1(버전)·2(경합 가드)·4(`useStore`)·5(history state)·7(린트 규칙)·10(렌더 검사)은 **세부를 보완**한다 — 방향은 그대로다 |
| 관련 | [ADR-0016](0016-toolchain-test-ci.md)(린트 선택자·버전 — 같은 날 개정), [tech-stack-v2 §2.5·§3.2·부록](../architecture/tech-stack-v2.md), [RFC-0003 §3·§5.1·§6·§7·§9·§12.2·§17.7·§19](../architecture/rfc/0003-yunabi-v2.md) |

> **왜 ADR-0023 을 고치지 않고 새 ADR 인가.** ADR-0023 은 승인됐다(D24). 승인된 ADR 의 본문은 고치지 않는다는 규칙에 따라 ADR-0023 은 상태 줄에 이 ADR 을 가리키는 메모만 달았다. 이 ADR 이 승인되면 ADR-0023 의 상태 줄을 "결정 9 는 ADR-0024로 대체됨" 으로 바꾼다. 다른 문서(tech-stack-v2, RFC-0003, ADR-0016)는 아직 제안 단계라 본문을 고치고 `[검토 R-n]` 을 달았다(R-n = 이 검토의 지적 번호. RFC-0003 의 런북 R-n·리스크 R-n 과는 무관).

## 배경

ADR-0023 이 승인된 뒤 Y-1 이 시작되어 의존성이 설치되었고, React 전환 문서를 따로 검토한 결과 "보완 필요" 가 나왔다. 오류 4건, 공백 6건, 사소한 것 1건이다.

- **오류:** (1) react-dom 19.3 은 홈 예산 75 KB 를 넘는다(실측). (2) 서버 렌더에서 `useSyncExternalStore` 에 `getServerSnapshot` 이 없으면 예외가 난다. (3) `React.lazy` 라우트를 `renderToString` 으로 그리면 Suspense fallback 만 나와서, 렌더 검사가 아무것도 검사하지 않고 통과한다. (4) Leaflet XSS 린트가 리터럴·템플릿 인자만 막아서 `bindTooltip(p.name)` 이 통과한다.
- **공백:** (5) 지도 경합 가드에서 `detach` 가 세대를 올리지 않는다. (6) flat config 에서 블록 사이 옵션이 덮어쓰여 규칙이 빠진다. `react/no-danger` 로 막히지 않는 우회 경로도 있다. (7) 지연 청크 로드 실패를 처리하지 않고, 이동할 때 fallback 이 깜박인다. (8) 버전 표가 낡았다. (9) TOTP 복구 런북의 구멍. (10) 책임자 부재 때 사용자에게 보이는 문구가 없다.
- **사소한 것:** (11) history state 의 모양이 문서끼리 어긋나고, 버전 표기가 낡았다.

## 확인한 사실

| 항목 | 내용 | 신뢰도 | 출처 |
|---|---|---|---|
| react + react-dom 크기 | **19.3.0, `createRoot` 만, 운영 빌드, 압축 후 gzip 67.2 KB** | **실측** (Y-1 착수, 검토가 측정) | Y-1 실측 — ADR-0023 의 "42~45 KB" 는 React 18 때 3자 수치였다 |
| 홈 진입 합계 | 런타임 67.2 + 앱 셸·홈·라우터·저장소·i18n 약 20 + CSS 약 8 → **약 95 KB** | 실측 + *추정* (앱 부분) | 같음 |
| 설치 버전 (Y-1) | react·react-dom 19.3.0, vite 8.3.4, @vitejs/plugin-react 6.1.2, typescript 6.0.3, vitest 5.0.3, @playwright/test 1.64.0, eslint 9.39.5, eslint-plugin-react 7.37.5, eslint-plugin-react-hooks 7.1.1, typescript-eslint 8.71.1, prettier 3.9.10, leaflet 1.9.4, leaflet.markercluster 1.5.3, vite-plugin-pwa 2.0.0(injectManifest), workbox-\* 7.4.1 | 저장소 `package.json` (2026-10-12 확인) | `/package.json` |
| TypeScript 상한 | typescript-eslint 8.71.1 의 peer 가 `typescript >=4.8.4 <6.1.0` → **TS 7 은 지원 밖** | npm peer 범위 (검토 확인) | typescript-eslint 8.71.1 `package.json` |
| `useSyncExternalStore` 서버 렌더 | 세 번째 인자 `getServerSnapshot` 은 서버 렌더와 하이드레이션 때 쓰인다. 없으면 서버 렌더가 "Missing getServerSnapshot" 오류를 던진다. `subscribe` 가 렌더마다 다른 함수이면 다시 구독한다. 저장소 변경이 non-blocking Transition 안에서 일어나면 React 가 blocking 갱신으로 되돌린다 | 공식 문서 | [react.dev useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) |
| `renderToString` × Suspense | 멈춘(suspend) 경계는 fallback HTML 로 내보내고 기다리지 않는다. `react-dom/static` 의 `prerender` 는 모든 데이터·지연 컴포넌트가 준비될 때까지 기다린다. 경계 안에서 오류가 나면 `onError` 로 알리고 그 경계를 클라이언트 렌더 표시(`<!--$!-->`)로 내보낸다 | 공식 문서 + 검토 확인 | [react.dev renderToString](https://react.dev/reference/react-dom/server/renderToString), [react.dev prerender](https://react.dev/reference/react-dom/static/prerender) |

## 결정

1. **홈 예산을 100 KB(gzip, JS+CSS)로 다시 정한다** `[검토 R-1]` (ADR-0023 결정 9 의 75 KB 를 대체)
   - 근거는 실측이다. react + react-dom 19.3.0 이 67.2 KB 이고 앱 부분을 더하면 약 95 KB 다. 여유는 약 5 KB.
   - ADR-0023 RE-Q2("Y-1 첫 주 실측으로 확정")는 **이 실측으로 닫는다.**
   - 청크 예산은 그대로이고 각각 따로 잰다: 지도 60, 쓰기 50, 레슨·게임 30 KB. 관리자 콘솔은 예산 없이 크기만 보고한다.
   - CI 실패 조건이다(`scripts/check-bundle-size`). 넘으면 ADR-0023 결정 9 의 순서대로 줄인다: 현재 언어가 아닌 문자열을 지연 청크로 → 레슨 콘텐츠 분리 → 그래도 넘으면 책임자에게 보고.
   - 대가: v1.3 첫 화면(40 KB)의 2.5배이고 Svelte 안(60 KB)보다 40 KB 크다. 서비스워커 사전 캐시가 두 번째 방문부터 이를 완화한다.

2. **`useStore` 는 서버 스냅샷을 같은 함수로 넘기고, `subscribe` 는 안정된 함수다** `[검토 R-2]` (ADR-0023 결정 4 보완)
   ```ts
   // state/store.ts — subscribe 는 생성 때 한 번 만든 화살표 함수(this 를 쓰지 않음) → 참조가 안정
   export function createStore<T>(initial: T) {
     let snap = initial;
     const subs = new Set<() => void>();
     const get = () => snap;
     const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };
     const set = (patch: Partial<T> | ((s: T) => T)) => { /* 새 객체로 교체, 같으면 참조 유지 → subs 호출 */ };
     return { get, set, subscribe } as const;
   }
   // state/useStore.ts
   export function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
     const read = () => selector(store.get());
     return useSyncExternalStore(store.subscribe, read, read); // 3번째 = getServerSnapshot (렌더 검사·하이드레이션)
   }
   ```
   - 금지: `useSyncExternalStore(s.subscribe.bind(s), …)`, `(fn) => s.subscribe(fn)` 처럼 렌더마다 새로 만드는 구독 함수. 렌더할 때마다 다시 구독하게 된다.
   - 단위 테스트 두 가지: 렌더 검사 환경에서 `useStore` 가 예외 없이 그려지는가, 두 번 렌더해도 `subscribe` 호출이 한 번인가.

3. **렌더 검사는 `react-dom/static` 의 `prerender` 를 쓰고, fallback 이 남으면 실패로 본다** `[검토 R-3]` (ADR-0023 결정 10 보완)
   - `renderToString` 은 `React.lazy` 라우트에서 Suspense fallback 만 내보낸다. 그러면 지도·폼·레슨 화면의 검사가 아무것도 검사하지 않고 통과한다.
   - `prerender` 는 지연 컴포넌트가 준비될 때까지 기다린다:
     ```ts
     const errors: unknown[] = [];
     const { prelude } = await prerender(<App />, { onError: (e) => { errors.push(e); } });
     const html = await new Response(prelude).text();
     // 실패 조건: errors.length > 0, html 에 '<!--$!-->'(클라이언트 렌더로 넘어간 경계),
     //            로딩 fallback 표지(data-route-loading), undefined·NaN·[object Object]
     ```
   - 로딩 fallback 컴포넌트에는 `data-route-loading` 속성을 단다. 검사는 이 표지가 출력에 **없는지** 본다.
   - "지연 청크는 검사에서 직접 import" 하던 우회는 필요 없어져 없앤다.

4. **Leaflet HTML API 의 인자는 DOM 노드를 만드는 함수 호출만 허용한다** `[검토 R-4]` (ADR-0023 결정 7 보완)
   - `src/map/**` 에서 `bindTooltip`·`bindPopup`·`setContent`·`setTooltipContent`·`setPopupContent` 의 첫 인자는 반드시 `textNode(...)` 호출이어야 한다. `map/layers.ts` 에 다른 DOM 노드 팩토리를 추가하면 그 이름도 허용 목록에 넣는다. 그 밖의 식은 **모두 오류**다: 식별자, 멤버 접근, 템플릿, 화살표 함수 등.
   - `L.popup({content})`·`L.tooltip({content})` 의 `content` 도 같은 규칙을 따른다.
   - `divIcon`·`new L.DivIcon` 은 `map/icons.ts` 에서만 부른다. 그 안의 `html` 은 **문자열 리터럴 상수**만 허용하고, `icons.ts` 는 상태·데이터 모듈을 import 하지 않는다.
   - 선택자 전문은 [ADR-0016 결정 2](0016-toolchain-test-ci.md)에 있다.
   - 린트가 따라가지 못하는 별칭(`const f = textNode`)은 오류로 떨어진다. 일부러 엄격하게 둔 쪽이다.

5. **경합 가드: `detach` 도 세대를 올린다** `[검토 R-5]` (ADR-0023 결정 2 보완)
   ```ts
   async function attach(slot: HTMLElement) {
     currentSlot = slot; const g = ++gen;
     await ensure();                                  // 메모이즈 — L.map 은 여기서 1회
     if (gen !== g || currentSlot !== slot) return;   // 그 사이 detach 또는 다른 attach
     /* 컨테이너 붙임 → invalidateSize → label → sync(stale) → 구독 */
   }
   function detach(slot: HTMLElement) {
     if (currentSlot !== slot) return;                // 새 슬롯이 먼저 붙은 경우 건드리지 않음
     currentSlot = null; ++gen;                       // ensure() 대기 중인 attach 를 무효화
     /* 구독 해제, 컨테이너 떼기 — remove() 없음 */
   }
   ```
   - StrictMode 는 attach(g=1) → detach(gen=2, slot=null) → attach(g=3) 순서로 돈다. `ensure()` 가 끝나면 첫 호출은 g≠gen 이라 돌아가고, 셋째 호출만 붙인다. `L.map` 은 한 번만 만든다.
   - `ensure()` 를 기다리는 동안 attach → detach 만 일어나면(화면을 바로 떠남) 나중에도 붙이지 않는다.
   - 단위 테스트 케이스: 이 두 순서와 "옛 슬롯 detach 가 새 슬롯을 떼지 않음".

6. **지연 라우트: 오류 경계와 전환** `[검토 R-7]` (ADR-0023 결정 5 보완)
   - **오류 경계.** `App` 의 화면 자리는 `<RouteErrorBoundary key={route.name}><Suspense fallback={<RouteLoading/>}>…` 로 감싼다. 클래스 컴포넌트이고, 라우트가 바뀌면 `key` 로 초기화된다.
     - 청크 로드 실패(오프라인에서 사전 캐시에 없는 청크, 또는 배포 뒤 옛 해시 파일이 사라짐)를 잡아서 문구와 [다시 불러오기] 를 보여 준다. 다시 불러오기는 `actions/app.reload()` 가 맡는다(화면 컴포넌트는 `location` 을 직접 쓰지 않는다).
     - Vite 의 `vite:preloadError` 창 이벤트는 `main.tsx` 가 받아 같은 상태로 보낸다.
     - 문구(3개 언어, `err.chunk`·`err.reload`): en "Couldn't load this screen. Check your connection and reload." / [Reload] · ja 「画面を読み込めませんでした。接続を確認して、再読み込みしてください。」 / [再読み込み] · ko "화면을 불러오지 못했어요. 연결을 확인하고 다시 불러와 주세요." / [다시 불러오기]
   - **전환.** 이동할 때 이미 보이던 화면이 fallback 으로 깜박이지 않게 한다. 다만 `useSyncExternalStore` 로 읽는 값은 Transition 으로 그릴 수 없다(확인표 — React 가 blocking 으로 되돌린다). 그래서 다음 구조를 쓴다.
     - `App` 은 화면 자리에 그릴 라우트를 **React 상태로 한 겹 둔다**: `const [shown, setShown] = useState(routeStore.get())`.
     - effect 에서 `routeStore.subscribe(() => startTransition(() => setShown(routeStore.get())))` 로 맞춘다.
     - 새 청크를 받는 동안은 옛 화면이 그대로 보인다. 헤더·탭 강조는 즉시 반영되도록 `useStore(routeStore)` 를 쓴다.
     - 처음 진입할 때(옛 화면이 없을 때)만 fallback 이 보인다.
   - 렌더 검사는 `shown` 의 첫 값을 저장소에서 읽으므로 그대로 동작한다.

7. **history state 의 모양** `[검토 R-11]` (ADR-0023 결정 5 보완)
   - 모양은 `{ prev: RouteName | null, map?: { mode, pref } }`. 지도 라우트일 때만 `map` 을 쓰고, `cat`·`pl`·`fitSeq` 등은 메모리에만 둔다.
   - 손으로 고친 해시, 외부 링크, 새로고침 뒤의 기록처럼 `history.state === null` 인 경우:
     - `prev` 가 없으므로 ‹ 는 `history.back()` 대신 `PARENT` 라우트로 `navigate(parent, {replace: true})` 한다(v1.3 `go(parent, true)` 와 같음).
     - 지도 상태가 없으면 D14 기본값(near)을 쓴다.

8. **버전 고정** `[검토 R-8]` (ADR-0023 결정 1 보완)
   - React 는 **19.3.0** 이다(ADR-0023 의 "19.2" 는 작성 당시 정보).
   - TypeScript 는 **6.0.3** 에 고정한다. typescript-eslint 8.71.1 이 TS 7 을 지원하지 않기 때문이다(5.x 로 내리지 않는다).
   - ESLint 9.39.5, eslint-plugin-react-hooks 7.1.1, Vitest 5.0.3. 전체 목록은 확인표와 tech-stack-v2 부록.
   - TS 7 로 갈 때는 typescript-eslint 의 peer 범위가 넓어지는 것을 먼저 확인한다.

## 고려한 대안

| 대안 | 판단 |
|---|---|
| 75 KB 유지 + Preact(compat) | 런타임이 크게 줄지만 D24 는 React 다. ADR-0023 결정 9 대로 범위 밖이고, 책임자에게 다시 물을 선택지로만 남긴다 |
| 75 KB 유지 + 홈을 React 없이(정적 HTML 셸) | 홈과 나머지 화면이 다른 렌더 경로를 갖게 되어 렌더 검사·i18n 이 둘로 나뉜다. 약 20 KB 를 줄이려고 구조를 복잡하게 하지 않는다 |
| 렌더 검사는 `renderToString` 유지 + 지연 청크를 테스트에서 미리 import | 미리 import 하는 목록이 라우트 표와 어긋나도 테스트가 모른다. fallback 표지 검사로 바꿔도 결국 `prerender` 가 필요하다 |
| Leaflet 인자 린트를 "리터럴만 금지" 로 유지 + 리뷰 | 검토가 지적한 그대로 `bindTooltip(p.name)` 이 통과한다. 허용 목록(DOM 팩토리 호출만)이 더 단순하고 안전하다 |
| `startTransition(() => routeStore.set(…))` | `useSyncExternalStore` 갱신은 Transition 이 될 수 없어 fallback 이 그대로 깜박인다(확인표) |
| `useDeferredValue(route)` | 같은 효과를 낼 수 있다(멈춘 백그라운드 렌더 동안 옛 값 유지). 결정 6 의 상태 미러와 동등한 대안 — 구현 때 더 짧은 쪽을 고른다 |
| TypeScript 7 | typescript-eslint peer 범위 밖 |

## 결과

- **좋은 점:**
  - 예산이 실측과 맞아 CI 실패 조건으로 바로 쓸 수 있다.
  - 렌더 검사가 지연 화면까지 실제로 그린다.
  - Leaflet 경로의 XSS 규칙에 빈틈이 없다.
  - StrictMode·빠른 이동에서도 지도가 엉뚱한 슬롯에 붙지 않는다.
  - 배포 직후 옛 탭이 깨진 화면 대신 다시 불러오기 안내를 보여 준다.
- **나쁜 점:**
  - 첫 화면이 ADR-0023 의 가정보다 25 KB 크다.
  - 렌더 검사가 비동기(`await prerender`)가 되어 조금 느려진다(*추정*: 케이스 수백 개에 수 초).
  - `textNode` 이외의 DOM 팩토리를 늘릴 때마다 린트 허용 목록을 고쳐야 한다.
- **바뀌는 문서:**
  - ADR-0016 결정 2·3 과 TC-Q2
  - tech-stack-v2 §1·§2.2·§2.5·§3.2·§4·부록·TS-Q1·TS-Q3
  - RFC-0003 §3·§5.1·§5.3·§6.2·§7·§9·§12.2·§17.6a·§17.7·§19·§22·§24
  - 설계 README
  - references-yunabi 관련 줄

## 열린 질문

| # | 질문 | 제안 |
|---|---|---|
| RF-Q1 | 홈 100 KB 예산을 받아들이는가 (ADR-0023 결정 9 대체). 여유가 약 5 KB 라 Y-1 중에 넘을 수 있다 | 받아들임. 넘으면 ADR-0023 결정 9 의 줄이는 순서대로 |
| RF-Q2 | 승인되면 ADR-0023 상태 줄을 "결정 9 는 ADR-0024로 대체됨" 으로 바꿀지 | 바꿈 |
