# 세션 인계 (2026-10-18)

이전 작업 세션에서 다음 세션으로 넘기는 메모. 새 세션은 이 파일, `CLAUDE.md`, `README.md` 순서로 읽고 시작한다.
(`docs/07-handoff/handoff.md` 는 디자인→개발 인계 문서로, 이 파일과 다르다.)

## 1. 어디까지 왔나

| 단계 | 상태 | 마지막 커밋 |
|---|---|---|
| Y-1 React 재작성 | 완료, 검토 통과 | — |
| Y-2 백엔드(Supabase)·등록 | 완료, 재검토 통과 | `6ea14ca` |
| Y-3 신고·자동 숨김·관리자 콘솔·계정 정지 | 완료, 재검토 "pass with fixes" → 남은 지적까지 반영 | `a9742c0` |
| `.mcp.json` (Supabase MCP, 프로젝트 `tsbipaffirkswsgkydav` "yunabi", 도쿄 `ap-northeast-1`) | 커밋됨 — 모든 기능 그룹, 읽기 전용 아님. 2026-10-18 설계(infra.md §3 1번)대로 도쿄에 새로 만들어 ref 를 바꿈. 이전 프로젝트 `lpgfovocymnlcqmpwjih`(us-east-1, 비어 있었음)는 2026-10-22 책임자가 삭제 | `4dbd6a4` |
| **Y-3S 보안 점검** | **다음 할 일** | |
| Y-4 약관·방침·연락 창구, 배포, 실기기 확인 | 그 다음 | |

브랜치: `claude/sharp-einstein-3m78cy`. PR 은 책임자가 요청할 때만 만든다.

마지막 확인 때 모두 통과: lint, typecheck, `npm test` 236개, pgTAP 245개, 백엔드 브라우저 시험 22개, 픽스처 브라우저 시험 21개(마지막 커밋 직전 기준). 크기 예산: 첫 화면 94.4/100 KB, 지도 **59.8/60 KB(여유 거의 없음)**, 쓰기 32.9/50, 학습 13.5/30.

Y-3 에서 만든 것 (자세한 건 RFC-0003 §12.2 끝의 `[Y-3 구현]` 메모):
- DB: `submit_report`, `app.require_admin`(익명 아님 + 토큰·세션 행 모두 aal2 + 세션 행 존재·`not_after`·12시간 + 활성 관리자), `admin_*` 11개. 모든 `admin_*` 첫 문장이 `perform app.require_admin();` 인지 checks 마이그레이션 ⑪ 이 검사.
- 앱: 장소 카드·일정 상세의 [신고] 시트(내 것이 아닐 때만, 뒤로 가기로 닫힘).
- 관리자 콘솔: `src/admin/`, `admin/index.html`, `vite.admin.config.ts` → `dist-admin/`(Cloudflare 별도 출처, CSP 는 meta + `_headers`). 비밀번호 → TOTP 2개 등록(첫 로그인) / 요소 선택 로그인.

## 2. 다음 할 일

1. ~~실제 Supabase 프로젝트 확인 (RFC-0003 §17.6a PL-6)~~ — **2026-10-22 끝남** (도쿄 프로젝트 `tsbipaffirkswsgkydav`).
   - 마이그레이션 20개 적용(책임자가 `supabase db push --db-url`, Session pooler). `200_checks` 가 처음에 ⑨ 에서 실패 → ⑨ 수정(`2ff2ed3`, OQ-E10 수용 위험).
   - 대시보드 Auth: 익명 로그인 ON, 익명 로그인 한도 150, 가입 훅 `app.hook_before_user_created`, TOTP, Data API 노출 = `public` 만.
   - ① 61번째 쓰기 429 ② 가짜 XFF 무시(`xff_trusted_hops = 1`) ③ GraphQL 꺼짐 ④ 익명 가입에도 훅 호출, 초대 없는 이메일 403 ⑤ `supabase_admin` 기본 권한은 바꿀 수 없음 ⑥ 쓰기 60~720ms ⑦ `auth.sessions` 읽기 가능 — 자세한 건 ERD v2 OQ-E1·E5·E8·E10.
   - 알게 된 것: 429 는 `security_events` 에 남지 않음(감시는 `ip_hits`), Auth 로그에 IP 원문이 남음(방침), advisor 지적(RLS 정책 없음 18, security definer 뷰 4, definer 함수 실행 25)은 설계대로 — 점검 기록에 "의도된 예외".
   - 쓰기 시험 데이터는 지웠다(사용자·데이터 0, 솔트 1행만).
   - **프로젝트를 바꾸는 일은 반드시 책임자에게 먼저 묻는다.** 읽기만 하는 확인은 바로 해도 된다.
2. **관리자 계정(R-5, PL-3) — 2026-10-22 끝남.** 초대 → 대시보드 "Add user"(Auto Confirm) → `bind_admin`(UID 로) → 관리자 콘솔(운영 빌드, 도쿄 프로젝트)에서 TOTP 2개(주 = 휴대폰 앱, 예비 = 종이에 적은 비밀 키 + 같은 앱의 두 번째 항목) 등록 → **R-7 ① 모의 실행: 예비 요소로 로그인 성공**(`auth.mfa_challenges` 로 확인). 대시보드 생성 때 Auth 로그에 가입 훅 실행 기록이 없었다 — Admin API 경로에서는 훅이 불리지 않는 것으로 보임(OQ-E5, 훅은 보조 장치라 영향 없음). R-7 ②(break-glass)는 로컬 스택 모의 실행으로 남김.
3. **관리자 콘솔 첫 배포 — 2026-10-22.** `https://yunabi-admin.juha.dev` (Cloudflare Workers 정적 자산, `wrangler.jsonc`, workers.dev·미리보기 주소 끔). 책임자 PC 에서 `npm run build:admin`(도쿄 프로젝트) → `npx wrangler@4.86.0 deploy` 로 **수동** 배포했다(로컬 Node 20 이라 4.86.0 고정) — ADR-0022 T-10 의 "배포는 CI 에서만" 에서 한 번 벗어남, 이후는 Y-4 의 `deploy.yml` 이 맡는다. 실측 헤더: CSP(`frame-ancestors 'none'`, connect-src = 도쿄 프로젝트·Turnstile), HSTS, XFO DENY, nosniff, no-referrer, Permissions-Policy, COOP, 페이지 no-store. 실제 주소에서 관리자 로그인(aal2) 확인. **남은 것:** `juha.dev` 의 "Always Use HTTPS" 가 꺼져 있어 `http://` 가 리디렉션 없이 응답(.dev 는 HSTS preload 라 브라우저는 영향 없음) — 켜기 권장. 배포 전 `wrangler deploy` 를 설정 파일 없이 실행하면 자동 설정 마법사가 package.json·vite.config 를 바꾸니 주의.
4. **비공개 운영 저장소 `yunabi-ops` — 2026-10-23 가동.** 주 1회 암호화 백업(첫 수동 백업 성공, 필수·제외 표 검사 통과)과 60분 감시(`ops_health` 2판, 사이트 가동, 백업 지연). 알림 시험: 경보 이슈 생성과 중복 방지(두 번째 실행에서 새 이슈 없음)는 확인, **휴대폰 메일 수신은 미확인 — 알림 설정 확인 뒤 재시험**. 첫 감시가 실제 결함을 찾음 — service_role 이 `app.db_pre_request` 를 실행할 수 없어 감시 키의 REST 호출이 403 → 마이그레이션 22 로 고쳐 적용. 공개 저장소 문서에는 저장소 존재와 절차만 쓰고, 기준값·워크플로 본문·기록은 그 저장소에만. **남은 것:** 백업 복호화 확인, 복구 리허설(임시 무료 프로젝트 안), GitHub Free 의 비공개 저장소는 Environment 를 쓸 수 없어 비밀값은 저장소 비밀값(RFC §17.5 와 다름 — 13번 점검 기록에 적기).
5. **Y-3S 보안 점검** (PRD Y-S1~S12). 외부 공격 방어가 책임자의 최우선(D20).
6. Y-4.

## 3. 책임자에게서 아직 답을 못 받은 것

- 진행 중인 주간 일정의 시리즈를 고치면 지난 회차도 바뀌는 현재 동작을 유지할지 (지금은 유지, 검토자도 유지 권장).
- `.mcp.json` 을 `read_only=true` 로 바꿀지 (Y-4 배포 전까지는 읽기 전용을 권했음).

## 4. 지켜야 할 것 (대화에서 정해진 것)

- **기숙사 IP 는 공개 저장소에 절대 쓰지 않는다** (D28). 값은 배포 때 `app.ip_tiers` 와 비공개 운영 기록에만.
- 비밀값(서비스 키 등)을 커밋하지 않는다. `npm run build` 와 `build:admin` 이 산출물을 검사한다.
- 진행 방식: 계획 → 검사 → 설계(architect 에이전트) → 검사 → 구현 → 독립 검토 → 수정 → 재검토. 책임자에게는 한국어로 보고.
- 관리자는 책임자 1명(D25), 백엔드는 Supabase 만(서버 프레임워크 없음), 콘솔은 별도 출처(D21), 디자인 방향 A(D22).
- 커밋 메시지에 모델 이름을 넣지 않는다.

## 5. 검토에서 받아들인 위험 (고치지 않기로 함)

- 거절된 `admin_*` 호출은 예외로 트랜잭션이 되돌려져 IP 한도에도 `security_events` 에도 남지 않는다. 탐지는 Supabase API 로그와 `admin_whoami` 의 `admin_denied` 기록.
- CAPTCHA 로그인 직후 새로 고침 전의 짧은 순간, Turnstile 스크립트와 관리자 세션이 같은 페이지에 있다.

## 6. 환경 메모

- 클라우드 세션에서 로컬 스택: `npm run db:start` (Docker 없이 Postgres 16 + Auth + PostgREST). 테스트 명령은 `CLAUDE.md` 의 Testing.
- Supabase MCP 는 클라우드 세션에서는 claude.ai 커넥터로 붙여야 하고(https://claude.ai/customize/connectors), 자기 컴퓨터에서는 `claude /mcp` 로 인증한다.
- 도구로 파일을 쓸 때 역슬래시가 깨진 적이 있다 — 역슬래시가 든 줄은 다시 읽어 확인.
