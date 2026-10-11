# ADR-0008 · 정적 호스팅은 GitHub Pages 를 유지하고 보안 헤더는 `<meta>` CSP 와 SRI 로 대신한다

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-11 |
| 근거 | README "Deploying", PRD §8 배포·비용, G6, A-1, A-2, 핸드오프 §8, TC-A-01, TC-A-07, TC-PR-03, TC-SEC-01·02 |
| 관련 | [tech-stack §6·§7](../architecture/tech-stack.md#6-정적-호스팅), [infra.md](../architecture/infra.md), [RFC-0001 §4.3](../architecture/rfc/0001-m1-backend-foundation.md#43-신뢰-경계) |

## 배경

현재 GitHub Pages 가 저장소 루트를 서빙하고, manifest·`sw.js` 는 상대 경로라 `/<repo>/` 하위 경로에서 동작한다. M2 부터는 같은 페이지의 `localStorage` 에 로그인 토큰이 저장되므로, 스크립트 출처 통제(CSP)와 외부 스크립트 무결성(SRI)이 중요해진다. GitHub Pages 는 응답 헤더를 설정할 수 없다(*일반 지식, 이번 검색으로 공식 확인 못 함*).

확인한 한도(2026-10-11, [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)): 사이트 1 GB, 월 100 GB 소프트 대역폭, 시간당 10회 빌드(Actions 배포 예외). 예상 사용량은 월 10 GB 미만(*추정*, tech-stack §6).

## 결정

1. **GitHub Pages 를 유지한다** (M1~M3).
2. `index.html` 에 `<meta http-equiv="Content-Security-Policy">` 를 둔다. 초안:
   `default-src 'self'; script-src 'self' 'sha256-<인라인 스크립트 해시>' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self' https://<project>.supabase.co; frame-src 'none'; base-uri 'self'; form-action 'none'`
   — 인라인 스크립트 해시는 파일이 바뀔 때마다 바뀌므로 배포 체크리스트에 넣는다. 해시 관리가 부담이면 `'unsafe-inline'` 으로 시작하고 `connect-src`·`img-src` 제한만 먼저 적용한다(열린 질문).
3. cdnjs `<script>`·`<link>` 에 `integrity` + `crossorigin="anonymous"` 를 단다.
4. 비밀값은 저장소에 두지 않는다(.gitignore 현행). 공개값(Supabase URL, publishable 키)만 `index.html` 의 `CFG` 에 둔다.
5. **이전 조건:** `frame-ancestors`·HSTS 같은 헤더 전용 지시어가 필요해지거나, 대역폭 한도에 근접하거나, 저장소를 비공개로 바꿔야 할 때 Cloudflare Pages(`_headers` 지원 — 미확인)로 옮기고 새 ADR 을 쓴다.

## 고려한 대안

| 대안 | 장점 | 단점 |
|---|---|---|
| Cloudflare Pages | 응답 헤더, 넉넉한 대역폭 | 계정·배포 경로 추가. 지금 필요한 보호는 meta CSP 로 대부분 가능 |
| Supabase Storage 로 정적 서빙 | 한 플랫폼 | HTML 서빙·서비스 워커 범위·캐시 헤더 제약(*미확인*), egress 5 GB 를 앱 데이터와 나눠 씀 |
| Netlify / Vercel | 헤더, 프리뷰 배포 | 같은 이유로 지금은 이점이 작다 |

## 결과

- 좋은 점: 배포 방식·비용 변화 없음. README·CLAUDE.md 의 배포 규칙 유지.
- 나쁜 점: meta CSP 는 `frame-ancestors`, `report-uri` 를 지원하지 않는다 → 클릭재킹 방어 불가(앱 성격상 영향 작음). 인라인 스크립트 해시 갱신이 배포 절차에 추가된다.
- 확인 필요: GitHub 무료 플랜에서 Pages 는 공개 저장소에서만 쓸 수 있다는 점(일반 지식, 미확인). 공개 저장소면 `schema.sql`·RLS 설계가 공개된다 — 보안을 비공개에 기대지 않으므로 수용 가능.

## 열린 질문

| # | 질문 |
|---|---|
| H-Q1 | CSP 의 인라인 스크립트를 해시로 묶을지(배포마다 해시 갱신), 처음에는 `'unsafe-inline'` 으로 두고 `connect-src`·`img-src` 제한만 적용할지 (결정 2) |
| H-Q2 | GitHub 무료 플랜에서 Pages 가 공개 저장소에서만 가능한지 공식 확인, 저장소 공개를 받아들일지 |
| H-Q3 | GitHub Pages 가 응답 헤더를 설정할 수 없음을 공식 문서로 확인 (이번 검색에서 확인 못 함) |
| H-Q4 | 이전 조건(결정 5)에 해당하는 상황이 M3 전에 생기는가 — 특히 `frame-ancestors` 가 필요한 위협이 있는가 |
