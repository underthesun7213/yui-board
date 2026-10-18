# 세션 인계 (2026-10-18)

이전 작업 세션에서 다음 세션으로 넘기는 메모. 새 세션은 이 파일, `CLAUDE.md`, `README.md` 순서로 읽고 시작한다.
(`docs/07-handoff/handoff.md` 는 디자인→개발 인계 문서로, 이 파일과 다르다.)

## 1. 어디까지 왔나

| 단계 | 상태 | 마지막 커밋 |
|---|---|---|
| Y-1 React 재작성 | 완료, 검토 통과 | — |
| Y-2 백엔드(Supabase)·등록 | 완료, 재검토 통과 | `6ea14ca` |
| Y-3 신고·자동 숨김·관리자 콘솔·계정 정지 | 완료, 재검토 "pass with fixes" → 남은 지적까지 반영 | `a9742c0` |
| `.mcp.json` (Supabase MCP, 프로젝트 `lpgfovocymnlcqmpwjih`) | 커밋됨 — 모든 기능 그룹, 읽기 전용 아님 | `4dbd6a4` |
| **Y-3S 보안 점검** | **다음 할 일** | |
| Y-4 약관·방침·연락 창구, 배포, 실기기 확인 | 그 다음 | |

브랜치: `claude/sharp-einstein-3m78cy`. PR 은 책임자가 요청할 때만 만든다.

마지막 확인 때 모두 통과: lint, typecheck, `npm test` 236개, pgTAP 245개, 백엔드 브라우저 시험 22개, 픽스처 브라우저 시험 21개(마지막 커밋 직전 기준). 크기 예산: 첫 화면 94.4/100 KB, 지도 **59.8/60 KB(여유 거의 없음)**, 쓰기 32.9/50, 학습 13.5/30.

Y-3 에서 만든 것 (자세한 건 RFC-0003 §12.2 끝의 `[Y-3 구현]` 메모):
- DB: `submit_report`, `app.require_admin`(익명 아님 + 토큰·세션 행 모두 aal2 + 세션 행 존재·`not_after`·12시간 + 활성 관리자), `admin_*` 11개. 모든 `admin_*` 첫 문장이 `perform app.require_admin();` 인지 checks 마이그레이션 ⑪ 이 검사.
- 앱: 장소 카드·일정 상세의 [신고] 시트(내 것이 아닐 때만, 뒤로 가기로 닫힘).
- 관리자 콘솔: `src/admin/`, `admin/index.html`, `vite.admin.config.ts` → `dist-admin/`(Cloudflare 별도 출처, CSP 는 meta + `_headers`). 비밀번호 → TOTP 2개 등록(첫 로그인) / 요소 선택 로그인.

## 2. 다음 할 일

1. **실제 Supabase 프로젝트 확인 (RFC-0003 §17.6a PL-6).** 로컬 스택에서는 `postgres` 가 superuser 라 가려졌을 수 있는 것들:
   - `pgrst.db_pre_request` 가 켜졌는지 — 같은 IP 에서 61번째 쓰기가 429
   - `xff_trusted_hops` 실측(앞단 프록시 수), `/graphql/v1` 이 꺼졌는지
   - 가입 훅이 익명 가입에도 불리는지, `supabase_admin` default privileges notice
   - 정의자 함수 소유자가 `auth.sessions` 를 읽을 수 있는지 — **`require_admin` 이 이것에 의존**
   - 마이그레이션 전체(checks 포함)가 클라우드의 `postgres` 로 통과하는지
   - **마이그레이션 적용·설정 변경 등 프로젝트를 바꾸는 일은 반드시 책임자에게 먼저 묻는다.** 읽기만 하는 확인은 바로 해도 된다.
2. **Y-3S 보안 점검** (PRD Y-S1~S12). 외부 공격 방어가 책임자의 최우선(D20).
3. Y-4.

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
