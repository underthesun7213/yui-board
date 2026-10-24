# ADR-0025 · 사용자 앱은 `yunabi.juha.dev` 의 Cloudflare Workers 정적 자산에 두고 응답 헤더로 보호한다

| | |
|---|---|
| 상태 | 승인됨 (2026-10-24, 책임자 — HO-Q2) |
| 날짜 | 2026-10-24 |
| 근거 | PRD-YUNABI D29, ADR-0020 HO-Q2·결정 6, Y-S3, Y-S4, Y-S8, 점검 기록 R-f |
| 대체 | [ADR-0020](0020-hosting-github-pages-actions.md) **결정 1(Pages 유지)·2(meta CSP 만, 경로 한정)·4(같은 `./sw.js` 로 옛 캐시 정리)** 를 대체하고, **결정 6(사용자 도메인이면 헤더 호스트로)** 을 실행한다. 결정 3(관리자 콘솔)·3a(배포 비밀값)·5(배포 순서)는 유지 |
| 관련 | [RFC-0003 §17.3·§18.2·§20·T-15·T-25·R-3](../architecture/rfc/0003-yunabi-v2.md), [ADR-0022](0022-security-baseline.md) S4, [런북 §7.3·§8·§12](../architecture/runbook.md), [점검 기록](../08-qa/security-check.md) B-15·R-f |

## 배경

ADR-0020 은 설치된 PWA·`yui.v1.*` 저장을 잇기 위해 사용자 앱을 같은 GitHub Pages 주소(`underthesun7213.github.io/yui-board/`)에 두고, 대가로 meta CSP 한계(`frame-ancestors`·위반 보고·HSTS 없음)와 `github.io` 출처 공유를 받아들였다. 결정 6 은 사용자 도메인을 두게 되면 헤더를 쓸 수 있는 호스트로 옮기라고 했고, HO-Q2 는 "지금 두는 편이 나중보다 이전 비용이 작다"고 물었다.

2026-10-24 확인한 사실:
- v1.3 은 **배포된 적이 없다**(책임자 확인). 그 주소와 같은 출처의 `/kgu-project/` 에 떠 있던 것은 "YUI Board" 시제품이고, 둘 다 기기에 **아무것도 저장하지 않으며** 누구에게도 알린 적이 없다.
- 그러므로 이 출처에는 v2 가 이어받을 설치·저장이 없다. 같은 주소를 지킬 이유가 사라졌다.
- 관리자 콘솔이 이미 `yunabi-admin.juha.dev` 의 Cloudflare Workers 정적 자산에서 `_headers` 로 헤더를 받고 있다(2026-10-22 실측) — 같은 방식을 그대로 쓸 수 있다.

## 결정

1. **사용자 앱 주소는 `https://yunabi.juha.dev/`.** Cloudflare Workers 정적 자산(Worker 이름 `yunabi`, 설정 `wrangler.app.jsonc` — 콘솔의 `wrangler.jsonc` 와 별개 파일, custom domain, `workers_dev`·미리보기 주소 끔)에 `dist/` 를 올린다.
2. **보안은 응답 헤더로.** 빌드가 `dist/_headers` 를 만든다. 헤더 CSP 는 meta CSP 와 **같은 함수**에서 나오고 `frame-ancestors 'none'` 을 더한다(두 CSP 가 어긋날 수 없다). 그 밖에 `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS 1년 + `includeSubDomains`(preload 없음), `Referrer-Policy: strict-origin-when-cross-origin`(OSM 타일 정책이 Referer 를 요구 — 콘솔의 `no-referrer` 가 아님), `Permissions-Policy: geolocation=(self), …`(지도 "내 주위"), `Cross-Origin-Opener-Policy: same-origin`. 캐시는 `/`·`/index.html`·`/sw.js`·`/manifest.webmanifest` 에 `no-cache`, 해시 이름인 `/assets/*` 에 immutable. meta CSP 와 `FrameGuard`(최상위 창이 아니면 쓰기 비활성)는 이중 장치로 남긴다. CSP 출처의 경로 한정(`https://yunabi.juha.dev/assets/`)도 그대로 둔다 — 이제 출처가 우리 것이라 필수는 아니지만 해가 없다.
3. **배포 산출물 검사.** `scripts/check-app-headers.mjs` 가 `npm run build` 마다 `_headers`·meta CSP 일치·`.assetsignore`(`.vite` 숨김)를 확인하고, 운영 배포용 `npm run build:deploy` 는 `--deploy` 로 더 확인한다: 출처가 `https://yunabi.juha.dev/`, 진짜 `supabase.co` ref(fixture 판·`build:local` 판 차단), publishable 키·Turnstile 사이트 키가 번들에 있음, e2e 손잡이(`__yunabi`)가 없음. **운영 배포는 `build:deploy` 산출물만** 올린다(런북 §7.3).
4. **첫 배포는 수동**, 콘솔처럼 책임자 PC 에서 `npx wrangler@4.86.0 deploy -c wrangler.app.jsonc`, 단 **main 에 병합된 커밋에서**. 자동 배포(`deploy.yml`, 점검 기록 B-13)는 범위 밖이며 ADR-0020 결정 3a 의 비밀값 규칙을 따른다.
5. **내보내기·가져오기 수단은 만들지 않는다.** ADR-0020 결정 6 의 조건("그 전에 이전 수단을 만든다")은 이을 데이터가 있을 때의 것이다 — v1.3 은 배포되지 않았고 옛 두 주소는 저장이 없는 시제품이다. `yui.v1.*` 키 이름 규칙(Y-B3)은 코드 호환으로 그대로 둔다.
6. **옛 주소:** `underthesun7213.github.io/yui-board/`·`/kgu-project/` 는 책임자가 2026-10-24 Pages 를 내려 404 다. 안내 페이지·자기 해제 SW 는 두지 않는다(알린 적 없는 시제품).
7. **서비스워커:** 새 출처라 옛 캐시가 없다 — ADR-0020 결정 4 의 "같은 `./sw.js` 로 이어받기"는 해당 없음. SW 의 `yui-` 캐시 정리 코드는 무해해 그대로 둔다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 같은 GitHub Pages 주소 유지 (ADR-0020 그대로) | 지킬 설치·저장이 없다. meta CSP 한계(`frame-ancestors`·HSTS·`nosniff` 없음)와 `github.io` 출처 공유(T-15·T-25·R-3)만 남는다 |
| GitHub Pages + 사용자 도메인(`yunabi.juha.dev` CNAME) | 출처 공유는 풀리지만 Pages 는 여전히 응답 헤더를 못 쓴다 — **meta CSP 한계 그대로**. "사용자 도메인이면 헤더를 쓸 수 있는 호스트로"라는 ADR-0020 결정 6 과 **충돌**. 호스트도 GitHub·Cloudflare 둘로 남는다 |
| Cloudflare Pages | 헤더 가능, 동등. 콘솔이 이미 Workers 정적 자산이라 같은 도구(`wrangler`)·같은 확인 방식을 쓰는 편이 단순 |
| Netlify / Vercel | 헤더 가능. 계정·호스트가 하나 더 늘어난다 |
| 옛 주소에 안내 페이지 + 자기 해제 SW | 공개한 적 없는 시제품이라 안내할 사용자가 없다. 저장소 규칙 아래 별도 브랜치·워크플로 손이 든다 |

## 결과

- 좋은 점: 헤더 CSP 에 `frame-ancestors 'none'`, HSTS, `nosniff` — RFC-0003 R-3·T-15·T-25 와 점검 기록 R-f 가 설계상 해소된다(실제 주소에서 확인하는 것은 첫 배포 뒤). 출처가 우리 것이라 경로 한정의 리디렉션 문제도 사라진다. 호스트가 Cloudflare 하나. 비용 0.
- 나쁜 점: Cloudflare 계정이 사용자 앱까지 쥔다(런북 부록 A) — 계정을 잃으면 앱과 콘솔이 함께 멈춘다. ADR-0020 결정 3a 의 `CLOUDFLARE_API_TOKEN` 이 자동 배포가 생기면 사용자 앱도 배포하게 된다. wrangler 설정이 둘이라 `-c` 를 빼면 다른 것을 올릴 수 있다(런북 §12). e2e·ZAP 는 `vite preview` 위에서 돌아 `_headers` 를 보지 못한다 — 헤더와 헤더 CSP 위반은 **실제 주소에서만** 확인된다(런북 §7.3 배포 뒤 확인). 앱 CSP 는 `script-src` 를 `/assets/` 로 한정해 콘솔(`'self'`)보다 엄격하므로, Cloudflare 영역 기능이 HTML 에 끼워 넣는 스크립트(Bot Fight Mode·JavaScript detections, Rocket Loader, Web Analytics 자동 삽입, Email Obfuscation)가 위반이 된다 — 배포 전에 꺼져 있는지 확인한다.
- ADR-0020 의 상태 줄에 이 ADR 을 가리키는 메모를 달고 HO-Q2 를 닫았다(승인된 ADR 의 본문은 고치지 않는다). HO-Q3(`github.io` HSTS preload)은 사용자 앱이 `github.io` 를 떠나 해당 없다.

## 열린 질문

| # | 질문 |
|---|---|
| CF-Q1 | `juha.dev` 영역에서 스크립트를 끼워 넣는 기능이 꺼져 있는지, 켜져 있으면 `yunabi.juha.dev` 만 제외하는 Configuration Rule 로 충분한지 — **닫힘 2026-10-25:** Bot Fight Mode·Rocket Loader 는 꺼져 있었고, Email Obfuscation·Web Analytics 자동 삽입은 켜져 있어 껐다(영역 전체). 끄기 직전에 받은 첫 응답에는 Web Analytics 비컨이 들어 있어 CSP 위반 2건(차단됨) — 새로 받은 응답에는 없음 |
| CF-Q2 | Workers 의 `/index.html` → `/` 리디렉션과 Workbox 사전 캐시가 맞물리는지(오프라인 새로 고침) — **2026-10-25 확인:** 사전 캐시 61개, `index.html` 은 리디렉션 표시 없이 200 전체 페이지로 저장. 네트워크를 끈 실제 새로 고침은 기기에서 확인할 일로 남음 |
