# ADR-0020 · 사용자 앱은 같은 GitHub Pages 주소에 Actions 로 배포하고, 관리자 콘솔은 헤더를 설정할 수 있는 별도 출처에 둔다

| | |
|---|---|
| 상태 | 승인됨 (2026-10-12, 책임자 — PRD D21) — **결정 1·2·4 는 [ADR-0025](0025-user-app-on-cloudflare-custom-domain.md)로 대체됨, 결정 6 은 ADR-0025 가 실행**(2026-10-24, D29 — 사용자 앱은 `https://yunabi.juha.dev/` 의 Cloudflare Workers). 결정 3·3a·5 는 유지 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 §7 "호스팅"(같은 주소 유지)·"호환"(`yui-v*` 캐시 정리), Y-B3, Y-S3, Y-S4, Y-S8, D19 |
| 관련 | [tech-stack-v2 §6](../architecture/tech-stack-v2.md#6-호스팅), [RFC-0003 §18.2·§20](../architecture/rfc/0003-yunabi-v2.md), [ADR-0008](0008-hosting.md)(부분 재사용), ADR-0022 |

## 배경

v1.3 은 GitHub Pages 가 저장소 루트를 그대로 서빙한다. v2 는 빌드 산출물을 배포해야 한다. PRD 는 같은 주소를 유지해 설치된 PWA·`yui.v1.*` 저장을 잇게 한다 — 둘 다 **출처**에 묶여 있어 호스트를 바꾸면 끊긴다. 한편 D20 은 CSP 를 요구하는데 GitHub Pages 는 응답 헤더를 설정할 수 없어 meta CSP 만 가능하고, meta 로는 `frame-ancestors`·`report-uri`·`sandbox` 를 쓸 수 없다(3자 보안 문서·Chromium, 2026-10-12 확인). 또 `<user>.github.io` 출처는 같은 GitHub 사용자의 다른 프로젝트 페이지와 공유된다(RFC-0002 R-6).

## 결정

1. **사용자 앱:** GitHub Pages 유지. Pages 소스를 "GitHub Actions" 로 바꾸고 `actions/deploy-pages` 로 `dist/` 를 배포한다. 주소·`manifest.id`(`./`)·SW 경로(`./sw.js`)·범위(`./`)는 그대로. Actions 사용자 워크플로 배포는 시간당 10회 빌드 소프트 한도의 예외(GitHub Docs).
2. **사용자 앱 보안:** meta CSP(RFC-0003 §17.3), "Enforce HTTPS", 클릭재킹 완화(`FrameGuard` — 최상위 창이 아니면 쓰기 비활성), CSP 위반은 E2E 에서 `securitypolicyviolation` 이벤트로 수집. **CSP 출처는 `'self'` 가 아니라 `https://<user>.github.io/yui-board/assets/` 처럼 경로를 한정**한다 — `'self'` 는 같은 사용자의 다른 Pages 프로젝트까지 믿는다 `[보안 검토 #13]`. 경로 한정은 리디렉션 뒤에는 적용되지 않으므로(CSP 사양) 완전한 격리는 사용자 도메인(결정 6)뿐이다.
3. **관리자 콘솔:** 같은 저장소의 별도 Vite 엔트리를 **Cloudflare Workers 정적 자산**(무료)에 `wrangler` 로 배포한다. `_headers` 로 CSP(`frame-ancestors 'none'` 포함), HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`. 관리자 세션은 이 출처의 `sessionStorage` 에만 있다. **콘솔 CSP 와 화면에는 Turnstile 을 허용·포함한다** — Supabase CAPTCHA 스위치는 비밀번호 로그인에도 적용되어, 빼 두면 공격 중 스위치를 켜는 순간 관리자가 잠긴다 `[보안 검토 #5]`. 사이트 키는 빌드에 미리 넣는다.
3a. **배포 비밀값:** `main` 전용 Environment(필수 검토자)에만. `CLOUDFLARE_API_TOKEN` 은 Workers 배포 권한만. `pull_request_target` 금지 `[보안 검토 #9]`.
4. **서비스워커 이전:** 새 SW 는 같은 `./sw.js`. 활성화 때 `yui-` 로 시작하는 옛 캐시(`yui-v1`~`yui-v6`)를 지운다. 탐색 network-first 에 3초 시간 제한. 새 버전은 사용자가 눌러야 적용.
5. **배포 순서:** DB 마이그레이션(수동 승인) → 사용자 앱·관리자 콘솔. 운영 첫 배포는 백엔드가 준비된 Y-2 이후(RFC-0003 OQ-D).
6. **이전 조건:** 사용자 도메인을 두게 되면 사용자 앱도 헤더를 쓸 수 있는 호스트로 옮긴다 — 출처가 바뀌므로 그 전에 컬렉션 내보내기·가져오기 같은 이전 수단을 만든다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 사용자 앱도 Cloudflare 로 이전 | 헤더는 좋지만 출처가 바뀌어 기존 설치·컬렉션이 끊긴다 — PRD §7 위반 (가중 비교 88 대 62) |
| 관리자 화면을 사용자 앱 안 지연 라우트로 | 관리자 토큰이 `github.io` 공유 출처·사용자 앱 XSS·meta CSP 한계에 노출(RFC-0003 T-15) |
| 관리자 콘솔을 GitHub Pages 의 다른 저장소로 | 같은 `<user>.github.io` 출처라 분리가 되지 않는다 |
| Netlify / Vercel 로 관리자 콘솔 | 헤더 가능, 동등한 대안. Cloudflare 는 Turnstile 과 같은 계정이고 정적 자산 무제한(3자) — 책임자 선호에 따라 교체 가능 |
| 관리자 콘솔 없이 Supabase 대시보드로 관리 | 대시보드는 모든 데이터(uuid·신고자)를 보여 줘 Y-R9·Y-P2 를 지킬 수 없고, 조치가 감사 기록에 남지 않는다 |

## 결과

- 좋은 점: 기존 사용자에게 끊김이 없다. 공격 가치가 가장 큰 관리자 세션이 헤더 보호와 별도 출처를 얻는다. 비용 0.
- 나쁜 점: 호스트가 둘(GitHub, Cloudflare)이 되고 배포 비밀값이 하나 늘어난다(`CLOUDFLARE_API_TOKEN`). 사용자 앱은 여전히 meta CSP 한계(클릭재킹은 완화만, 위반 보고 없음)와 출처 공유를 안고 간다.
- ADR-0008 결정 1·2·4 를 이어받고, 결정 3(cdnjs SRI)은 외부 스크립트가 없어 해당 없음, 결정 5(이전 조건)는 관리자 콘솔에 적용했다.

## 열린 질문

| # | 질문 |
|---|---|
| HO-Q1 | Cloudflare 계정 추가를 받아들일지 (tech-stack-v2 SB-Q1) |
| HO-Q2 | ~~사용자 도메인을 둘 계획이 있는지~~ — **답함(2026-10-24, D29): `yunabi.juha.dev` 로 옮긴다 → [ADR-0025](0025-user-app-on-cloudflare-custom-domain.md)** |
| HO-Q3 | ~~`github.io` HSTS preload 여부 확인 (SB-Q4)~~ — 해당 없음(ADR-0025: 사용자 앱이 `github.io` 를 떠남, HSTS 는 우리 헤더로) |
