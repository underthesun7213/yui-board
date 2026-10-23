# 출시 전 보안 점검 기록 (Y-3S, PRD Y-S1~S12)

**판정: 출시 불가 — 블로커 15개 (Y-3S 10 / Y-4 5).** 자동 검사(권한·XSS·입력·의존성·비밀·ZAP 로컬)는 모두 초록이다. 남은 것은 세 갈래 — 지금 할 시험·모의 실행(기숙사 부하 시험 B-2, R-7 ② B-7, 운영 콘솔 ZAP B-10, 런북 R-1·R-2 B-11), 책임자의 대시보드·저장소·계정 설정(B-1·B-3~B-6·B-8·B-9·B-12), 그리고 Y-4(배포·방침) 뒤에만 할 수 있는 시험(B-13~B-17).

| | |
|---|---|
| 점검 기간 | 2026-10-21 ~ 2026-10-23 |
| 대상 커밋 | `d1f0d38` (브랜치 `claude/sharp-einstein-3m78cy`, CI run 39894308046 — quality·e2e·db 모두 success) |
| 대상 프로젝트 | Supabase `tsbipaffirkswsgkydav` (도쿄), 관리자 콘솔 `https://yunabi-admin.juha.dev`, 사용자 앱(설계) `https://underthesun7213.github.io/yui-board/` — v2 앱은 아직 배포 전(D23) |
| 근거 | PRD §6.1 Y-S1~S12 · ADR-0022 S1~S12 · RFC-0003 §17.6(1~6)·§17.6a(PL-1~PL-6) · ERD v2 §9·§9.1·§10 · `docs/architecture/y3s-automated-checks.md` · `docs/architecture/runbook.md` · `docs/session-handoff.md` · `.github/workflows/ci.yml`·`zap.yml` · `.zap/rules.tsv` |
| 형식 | ADR-0022 SE-Q6 의 제안대로 `docs/08-qa/security-check.md`. 열린 항목의 세부(무엇이 빠졌는지, 어느 계정인지)는 **공개하지 않는다** — `yunabi-ops` 의 `records/security-check-open.md` 에 있다 |

## 0. 읽는 법

- **상태:** `통과` = 저장소·CI 에서 다시 확인할 수 있는 자동 검사 · `책임자 확인(날짜)` = 책임자가 대시보드·실제 주소에서 확인했고 기록이 있음 · `결정 기록` = 설계가 "결정을 기록하라" 고 한 항목의 결정이 있음 · `조건부` = 일부만 확인됨(남은 것은 블로커 열에) · `미완` = 아직 없음 · `수용 위험` = 고치지 않기로 함.
- **증거:** 시험 이름(`tests/e2e-backend/*.spec.ts`, `tests/e2e/*.spec.ts`, `supabase/tests/NN_*.test.sql`, ERD v2 §9.1 대응표의 G-ID), 커밋, CI 실행 번호(`gh run view <번호>`), 클라우드 실측은 날짜 + 방법.
- **블로커:** `Y-3S` = 지금 끝낼 것 · `Y-4` = 배포·방침 뒤에만 가능 · `—` = 블로커 아님. 블로커의 담당·종결 증거는 §6.
- 미완 항목은 여기에 중립 라벨·기대 증거만 적고 세부는 적지 않는다("세부: yunabi-ops records/security-check-open.md").

## 1. PRD §6.1 수락 기준 (Y-S1~S12)

| ID | 수락 기준 | 상태 | 증거 | 블로커 |
|---|---|---|---|---|
| Y-S1 권한은 서버에서만 | 직접 요청 권한 테스트 전부 거절 | 통과 | pgTAP `01_permissions`(G-01·02·03·12·20), `02_places`(G-10·21), `09_admin`(G-30 ①~⑦ × 모든 `admin_%`, G-31~36), `20261013000200_checks.sql` ③④⑩⑪⑬; HTTP `security.spec.ts` `G-01 …`, `G-02 …`, `G-03 the test covers every function …`, `G-03 / G-12 / G-30 ① …`, `G-30 ②③ / G-31 …`, `G-21 …`, `G-23 …`, `G-10 / G-15 …`(`b4450db`); 브라우저 `admin.spec.ts` `G-30 ⑥ / G-31 …`. CI run 39894308046 db job success. 돌연변이 확인: `mut/y3s-checks-1`·`-2` 의 CI 실패(run 39663952447, 39664230548, 39664924805, 39665575384, 39663986906 — y3s-automated-checks §11). 클라우드 2026-10-22: `checks` 전체가 클라우드의 `postgres` 로 통과(`2ff2ed3`, PL-6 ⑦), `supabase_admin` 기본 ACL 은 바꿀 수 없음 → §4 수용 위험 R-b + 출시 직전 재확인(§2 "OQ-E10 재확인" 행, B-9) | Y-3S · B-9 |
| Y-S2 비밀 키는 클라이언트·저장소에 없다 | CI 비밀 검사 통과, 빌드 결과물 검사 | 조건부 | `ci.yml` quality: gitleaks `git .`(fetch-depth 0) + `dir dist`·`dir dist-admin`(`5deb3da`), `scripts/check-dist-secrets.mjs`(`npm run build`), 첫 실행 이력·산출물 0건(y3s §11), CI run 39894308046 success; 돌연변이 D(가짜 키 커밋) 로 CI 실패 확인(y3s §11, `mut/y3s-checks-*`). GitHub secret scanning·push protection: 책임자 확인(2026-10-23). **남은 것:** 비밀값의 `main` 전용 Environment·필수 검토자(§2 6번) | Y-4 |
| Y-S3 관리자 계정 보호 | 2단계 인증 없이는 관리자 화면 진입 불가 | 통과 (12시간 만료는 로컬만) | pgTAP `09_admin` G-30 ①~⑦(anon·익명·aal1·세션 행 없음·13시간·허용 목록 밖·이메일 연결 익명) 모두 42501(파일 머리말 G-30~G-36), `06_hook_admin` G-37(연결 탈취 ①~⑤); HTTP `G-30 ②③ / G-31 …`; 브라우저 `admin.spec.ts` `first sign-in sets up two authenticators …`, `G-30 ⑤ a session older than 12 hours is refused …`, `G-30 ⑥ / G-31 …`. 클라우드 2026-10-22: 실제 콘솔 주소에서 aal2 로그인 확인(handoff §2 3), TOTP 2개 등록·R-7 ① 모의 성공(`1946aa8`, PL-3). **12시간 서버 세션 만료는 로컬 백엔드 시험 G-30 ⑤ 로만 확인했고 클라우드에서는 확인하지 않았다**(§3 메모) | — |
| Y-S4 XSS 방지 | 사용자 글의 스크립트가 실행되지 않음(E2E), CSP 위반 0 | 통과 | 픽스처 E2E `v2.spec.ts` `Y-S4 a place named with markup renders as text in the list, card and pin`(클러스터에서 핀이 나올 때까지 확대), `Y-S4 an event with markup renders as text on home and in its detail`(`436b0ae`); 백엔드 `posting.spec.ts` `Y-S4 a stored script stays text`, `admin.spec.ts` `Y-S4 user text in the console stays text …`(`6e06d99`); 렌더 검사 `tests/render/admin.test.tsx`; 모든 브라우저 시험이 운영 빌드의 CSP 아래서 `securitypolicyviolation`·콘솔 오류에 실패(`tests/e2e/fixtures.ts`). 링크 규칙 `src/domain/links.ts` + 단위 시험(`0f0a27a`). ESLint: `react/no-danger`, `innerHTML` 대입, `src/map` Leaflet HTML 경로 금지. 돌연변이 B1·B3 실패 확인(y3s §11). CI run 39894308046 e2e·db success | — |
| Y-S5 입력 검증·주입 방지 | 비정상 입력 세트 전부 거절 | 통과 | pgTAP `02_places` G-15(길이·제어 문자·서식 문자·좌표·링크·날짜 세트 → `{status:'invalid', field}` + `invalid_input`), G-16(SQL 메타문자는 그대로 문자열), `03_events`(일정 규칙 Y-K4~K9); HTTP `G-10 / G-15 …`; 백엔드 `posting.spec.ts` `Y-A5 the server refuses what the form would refuse`; `checks` ⑤(search_path)·⑥(동적 SQL 없음); `src/domain/validation.ts`·`links.ts` 의 단위 시험(`tests/unit/domain.test.ts`). CI run 39894308046 | — |
| Y-S6 의존성 보안 | 높음 이상 취약점이면 CI 실패 | 통과 | `package-lock.json` + `npm ci`, `npm audit --audit-level=high`(dev 포함, `5deb3da`) → CI run 39894308046 quality success(높음 0). `.github/dependabot.yml`(npm·actions 주간, `33dc63d`) — 기본 브랜치 병합 뒤에만 동작. 액션 SHA 고정(`ci.yml`·`zap.yml`). 저장소의 Dependabot alerts·security updates 켜짐(2026-10-23, API 확인) | — |
| Y-S7 자동화 공격 대비 | 빈도 초과 요청 거절, 스위치 동작 확인 | 조건부 | 한도: pgTAP `02` G-14, `04_accounts` G-14·G-38, `05_ip_limit` G-52~55(IP 쓰기 한도, /64, XFF 오른쪽 값), `06_hook_admin` G-51; HTTP `Y-S7 / G-52 writes are limited per IP, whatever the function name looks like`, `G-55 …`. 클라우드 2026-10-22(handoff §2 1, ERD OQ-E1·E5·E8): 61번째 쓰기 429 `PT429`, 가짜 XFF 무시(`xff_trusted_hops = 1`), 익명 가입에도 훅 호출·초대 없는 이메일 403, 익명 로그인 한도 150(책임자 확인). **스위치:** 런북 §3.1 C-1~C-5 와 ON 시험 ①② 는 미완 — "Y-S7 CAPTCHA 준비"(§2 6번, §6) | Y-3S·Y-4 |
| Y-S8 전송 보안 | 점검표 | 조건부 | 콘솔 헤더: `scripts/check-admin-headers.mjs` 가 `build:admin` 에서 CSP(`frame-ancestors 'none'`)·XFO·nosniff·HSTS(1년·includeSubDomains)·Referrer-Policy 를 검사(`beb23e9`, 돌연변이 C1 실패 확인); 실제 주소 실측 2026-10-22(handoff §2 3) + 2026-10-23 `curl -I`(HSTS·CSP·XFO DENY). 앱 CSP: `vite.config.ts` 가 https 출처면 `upgrade-insecure-requests`, 외부 요청은 `https:` 만. ZAP 로컬 baseline 높음 0(§2 4번). **남은 것:** "Y-S8 콘솔 전송 설정 확인"(B-6), Pages "Enforce HTTPS"(B-15) — 세부: yunabi-ops records/security-check-open.md | Y-3S·Y-4 |
| Y-S9 백업과 복구 | 복구 리허설 기록 | 책임자 확인(2026-10-23) | `yunabi-ops` `backup.yml` 주 1회(데이터만, `age` 암호화, 아티팩트 90일, 제외 표가 있으면 실패); 첫 백업 성공·복호화 확인(handoff §2 4). 복구 리허설 2026-10-23: 임시 무료 프로젝트에 마이그레이션 22개 → 복원(`restore: committed`) → `checks` ①~⑬ 통과 → Auth 설정 → 스모크 → 관리자 aal2, 약 49분(목표 RTO 4시간) — 런북 §9.2 `[해 봄]`(`d1f0d38`), 기록은 `yunabi-ops records/rehearsals/2026-10-23.md`. 설계와 다른 점(로컬 스택이 아님)은 §5 | — |
| Y-S10 감시 | 알림 시험 | 조건부 | `ops_health` 2판(`930b633`, pgTAP `10_ops_health`), service_role 의 pre-request 실행(마이그레이션 22 `4381fe9`), 백엔드 `security.spec.ts` `Y-S10 the monitor key reads ops_health over REST …`(`c49907c`). `yunabi-ops` `monitor.yml` 매시 실행(2026-10-23 가동), 알림 시험 2026-10-23: 경보 이슈 생성 → 두 번째 실행에서 중복 없음 → 메일 도착(기록 `records/alert-tests/2026-10-23.md`). 첫 감시가 실제 결함(service_role 403)을 찾아 마이그레이션 22 로 고침. **남은 것:** "OQ-E7 확인"(B-8) — 세부: yunabi-ops records/security-check-open.md | Y-3S |
| Y-S11 출시 전 보안 점검 | 점검 기록 | 조건부 | 이 문서. 자동 항목(§2 1·2·3·3a G-60·4 로컬·5)은 통과, 점검표(§2 6번)·PL(§3)의 미완이 §6 의 블로커 | Y-3S·Y-4 |
| Y-S12 데이터 최소화 | 스키마 검토 | 통과 | ERD v2 §4(열마다 "왜"), `checks` ⑧(공개 뷰 열 고정), pgTAP `01` G-20(소유자·토큰·숨김 열 없음), `09`(Y-R9 줄 — ERD G-22, 관리 큐에 uuid·신고자 없음; 시험 이름에 G-ID 없음), `07_purge` G-56(`security_events.ip_key` 48시간 뒤 null), G-50(보관 기간). 신고 사유 자유 서술 없음(ERD OQ-E3; `reports.spec.ts` `Y-R1 the sheet: five reasons …`). IP 는 일일 솔트 해시(`ip_hits` 1시간). Auth 로그의 IP 원문은 방침(Y-4)에 적는다 — §2 6번 "방침 게시" | — |

## 2. RFC-0003 §17.6 출시 전 점검 1~6

| # | 항목 | 상태 | 증거 | 블로커 |
|---|---|---|---|---|
| 1 | pgTAP 권한 스위트 전부 통과 (G-03 카탈로그 전수, G-30 `admin_%` × 실패 경우, G-52~55, G-23 공개 뷰 4개) | 통과 | `supabase/tests/01~10` (`npm run test:db`), 대응표 ERD v2 §9.1. CI run 39894308046 db job success (`d1f0d38`) | — |
| 2 | HTTP 직접 요청 스위트 통과 (`anon` 401, 비관리자 `admin_*` 403) | 통과 | `tests/e2e-backend/security.spec.ts` 머리말의 G-01·02·03·10·12·15·21·23·30 ①~③·31·52·55·T-19a·G-37 + `Y-S10 …`(`b4450db`, `c49907c`). CI run 39894308046 db job(`npm run test:backend`) | — |
| 3 | XSS 페이로드·비정상 입력 세트, Leaflet 경로(핀) 포함 | 통과 | §1 Y-S4·Y-S5 의 시험. 핀은 `v2.spec.ts` `Y-S4 … list, card and pin`(클러스터를 벗어날 때까지 확대) | — |
| 3a | 동시 신고 통합 시험 G-60 | 통과 | `tests/e2e-backend/reports.spec.ts` `G-60 reports sent at the same moment hide the item once`; pgTAP `04_accounts` G-38(계정 상한 경계). CI run 39894308046 db job | — |
| 3a | 기숙사 범위 부하 시험 (공인 IP 하나에서 지도 클라이언트 50개 + 첫 쓰기 몰림 → 정상 쓰기 429 없음) | 미완 | 기대 증거: PL-1 에 등록한 값(또는 대안 결정)으로 실측한 날짜·방법·결과 — 세부: yunabi-ops records/security-check-open.md | Y-3S |
| 4 | ZAP baseline — 스테이징(로컬 스택 + `vite preview`) 높음 0 | 통과 | `zap.yml`(`4215cec`): 앱·콘솔 2대상, FAIL 규칙 0·높음 0 이 아니면 실패. run 39662602728(첫 실행, ZAP 2.17.0), run 39721777558(`0944107`, 규칙 확정 뒤) success. 돌연변이 F: run 39663952413 failure → 되돌려 39664924799 success. 주 1회 예약(월 03:00 JST) + 수동 + `.zap/**` 변경 push | — |
| 4 | ZAP — 운영 URL 수동 스캔: 관리자 콘솔 | 미완 | 기대 증거: 스캔 날짜·ZAP 버전·높음 0·WARN 목록과 처리 — 세부: yunabi-ops records/security-check-open.md | Y-3S |
| 4 | ZAP — 운영 URL 수동 스캔: 사용자 앱 (Y-4 배포 뒤) | 미완 | 기대 증거: 위와 같음 | Y-4 |
| 5 | `npm audit` 높음 0 | 통과 | `ci.yml` quality `npm audit --audit-level=high`(dev 포함). CI run 39894308046 success | — |
| 5 | gitleaks 0 | 통과 | `ci.yml` quality: 이력 전체 + `dist`·`dist-admin`, 고정 바이너리 8.30.1(sha256 대조). 첫 실행 0건(y3s §11), CI run 39894308046 success. `--redact` 로 로그에 값 없음 | — |
| 6 | 대시보드 — 익명 로그인 ON | 책임자 확인(2026-10-22) | handoff §2 1, 런북 §13 | — |
| 6 | 대시보드 — 이메일 공개 가입 OFF | 미완 | 훅 경로는 클라우드 확인(2026-10-22, OQ-E5; HTTP `G-37 the signup hook …`). 토글: "대시보드 점검"(B-12) — 세부: yunabi-ops records/security-check-open.md | Y-3S |
| 6 | 대시보드 — CAPTCHA 스위치 위치 확인 | 미완 | 기대 증거: 런북 §3.2 의 위치에서 토글을 확인한 날짜 — "Y-S7 CAPTCHA 준비"(B-3) | Y-3S |
| 6 | 대시보드 — 스위치 ON 상태에서 ① 사용자 첫 쓰기 | 미완 | 기대 증거: 런북 §3.3 2 를 실제 주소에서 한 날짜·결과(위젯 표시 → 저장 → 확인 항목 삭제). 선행: 런북 §3.1 C-1~C-4 | Y-4 |
| 6 | 대시보드 — 스위치 ON 상태에서 ② 관리자 로그인 | 미완 | 기대 증거: 런북 §3.3 1 을 실제 주소에서 한 날짜·결과, 끈 뒤 로그인 재확인(§3.4). 선행: C-1·C-4 | Y-4 |
| 6 | 대시보드 — TOTP ON | 책임자 확인(2026-10-22) | handoff §2 1; 실제 주소 aal2 로그인(§1 Y-S3) | — |
| 6 | 대시보드 — 익명 로그인 IP 한도 150/시간 | 책임자 확인(2026-10-22) | handoff §2 1, 런북 §13 | — |
| 6 | 대시보드 — 레거시 키(`anon`/`service_role` JWT) 비활성 | 미완 | 기대 증거: 대시보드 API Keys 에서 확인한 날짜(런북 §10 "점검 항목") — §6 "대시보드 점검" | Y-3S |
| 6 | 대시보드 — Data API 노출 스키마 = `public` 만 | 책임자 확인(2026-10-22) | handoff §2 1; HTTP `G-01 the app schema and its tables are not reachable …`(로컬) | — |
| 6 | 대시보드 — 프로젝트 멤버 = 책임자 1명 (D25) | 미완 | 기대 증거: 대시보드 멤버 목록 확인 날짜 — §6 "대시보드 점검" | Y-3S |
| 6 | `ip_tiers` 에 기숙사 범위 등록 (PL-1) | 미완 | 기대 증거: 등록 날짜(값은 비공개) 또는 대안 결정 기록 — §3 PL-1(B-1) | Y-3S |
| 6 | `xff_trusted_hops` 실측값 | 책임자 확인(2026-10-22) | ERD OQ-E8: 가짜 XFF 61번 → 61번째 429, 값 1 유지(G-54 HTTP 재현). pgTAP `05` G-54 | — |
| 6 | OQ-E10 재확인 — `pg_default_acl`·함수 권한 (출시 직전) | 미완 | 기대 증거: `checks` 블록 재실행 + `pg_default_acl` 조회 날짜, `supabase_admin` 기본 권한에 새 행 없음 (B-9) | Y-3S |
| 6 | 저장소 — `main` 보호 규칙 | 미완 | 기대 증거: PR 필수 + `quality`·`e2e`·`db` 필수 검사(y3s §10 2번) 설정 날짜 | Y-3S |
| 6 | 저장소 — push protection | 책임자 확인(2026-10-23) | secret scanning + push protection 켜짐 | — |
| 6 | 저장소 — Dependabot (alerts·security updates) | 통과 | 두 설정 켜짐 — API 확인 2026-10-23(`vulnerability-alerts` 204, `automated-security-fixes` enabled). 버전 업데이트(`dependabot.yml`)는 `main` 병합 뒤 동작 | Y-3S |
| 6 | 저장소 — 비밀값은 `main` 전용 Environment + 필수 검토자 | 미완 | 기대 증거: `production` Environment(필수 검토자, `main` 만) 생성 날짜 + `deploy.yml`(Y-4) 의 사용 — §5 1번(운영 저장소는 Environment 불가) | Y-4 |
| 6 | 저장소 — `pull_request_target` 없음 | 통과 | `ci.yml` 단계 "No pull_request_target workflows"(`grep` 이 찾으면 실패); `zap.yml` 도 없음. CI run 39894308046 | — |
| 6 | 비공개 운영 저장소 접근자 = 책임자 | 책임자 확인(2026-10-23) | `yunabi-ops` 비공개, 협업자 없음 | — |
| 6 | Pages "Enforce HTTPS" | 미완 | 기대 증거: Pages 설정 확인 날짜(런북 §7.3) | Y-4 |
| 6 | 백업 리허설 기록 (제외 표가 덤프에 없음 확인) | 책임자 확인(2026-10-23) | §1 Y-S9. 제외 표 검사는 `backup.yml` 이 `pg_restore -l` 로 하고 실패시킴; 리허설에서 제외 표 문제 없음(런북 열린 질문 4) | — |
| 6 | 알림 시험 (기준을 넘는 가짜 이벤트 → 비공개 이슈 → 메일) | 책임자 확인(2026-10-23) | §1 Y-S10. 운영 DB 에 가짜 기록을 넣지 않고 기준값을 0 으로 낮추는 `test_kind` 방식 | — |
| 6 | 런북 R-1·R-2 모의 실행 | 미완 | 기대 증거: 로컬 스택(또는 리허설 프로젝트)에서 R-1 2~5, R-2 2~3 을 돌린 날짜·결과, 런북에 `[해 봄]` | Y-3S |
| 6 | 방침·약관 게시 (IP 가명 처리, 접속 로그의 IP 원문, Turnstile 문구 C-5) | 미완 | 기대 증거: 페이지 존재 + 첫 등록 화면 링크(Y-P4), 세 문구 포함 | Y-4 |

## 3. §17.6a 출시 전 확인 항목 PL-1~PL-6

| # | 항목 | 상태 | 증거 | 블로커 |
|---|---|---|---|---|
| PL-1 | 기숙사 공인 IP/CIDR → `ip_tiers` | 미완 | "PL-1 기숙사 범위 등록 또는 대안 결정"(B-1). **종결 조건:** 등록(날짜, 값은 비공개), 또는 RFC §17.6a 의 대안을 택했다는 결정 기록(`yunabi-ops records/decisions.md`) — 둘 중 하나. 부하 시험(§2 3a)은 그 값으로. 세부: yunabi-ops records/security-check-open.md | Y-3S |
| PL-2 | 관리자 메일용 SMTP | 결정 기록(2026-10-22) | 사용자 SMTP 를 두지 않는다, 막히면 R-6(`90ffb7e`, RFC §17.6a) | — |
| PL-3 | 관리자 TOTP 2개 + R-7 ①·② 모의 실행 | 조건부 | TOTP 2개 등록·R-7 ① 성공(2026-10-22, `1946aa8`). R-7 ② 는 리허설(2026-10-23)에서 비밀번호 교체·요소 0개 확인·재등록까지 해 봤고, **요소 삭제 단계(런북 §5.3 ② 3번)는 아직**(런북 열린 질문 5). 예비 TOTP 보관 방식은 비공개 기록 | Y-3S |
| PL-4 | Supabase·GitHub·Cloudflare(+Vercel, 런북 부록 A) 계정 2단계 인증 | 책임자 확인(2026-10-23) | "계정 2단계 인증 확인"(B-5). 기대 증거: 계정별 확인 날짜(비공개 기록) — 세부: yunabi-ops records/security-check-open.md | — |
| PL-5 | 부재 대비 | 결정 기록(2026-10-22) | OQ-21 수용, ME-02 문구·"보통 7일"(`90ffb7e`); 경보 메일 도착 확인(2026-10-23). 휴대폰 수신은 미확인 — 운영 항목(메일 앱 설정), 세부: yunabi-ops records/security-check-open.md | — |
| PL-6 | 로컬 스택과 다른 점 — 실제 프로젝트 확인 ①~⑦ | 책임자 확인(2026-10-22) | `bf9d2ba`, handoff §2 1: ① 429 ② XFF ③ GraphQL 꺼짐 ④ 훅 ⑤ `supabase_admin` notice(OQ-E10) ⑥ 쓰기 60~720 ms ⑦ `checks` 통과 | — |

**Y-S3 메모:** 서버 세션 12시간 만료는 `admin.spec.ts` `G-30 ⑤`(로컬 스택, 세션 행 시각을 13시간 전으로 옮김)로 확인했다. 클라우드 프로젝트에서 실제로 12시간을 기다려 확인한 기록은 없다 — 같은 함수(`app.require_admin`)가 같은 `auth.sessions` 열을 읽으므로 수용하되, 운영 첫 주에 한 번 관찰한다(§7).

## 4. 의도된 예외와 수용된 잔여 위험

### 4.1 의도된 예외 (고치지 않는다)

| 출처 | 지적 | 이유 |
|---|---|---|
| Supabase advisor | security definer 뷰 4개 | 공개 뷰(`places_public`·`events_public`·`event_occurrences_public`·`prefecture_counts`)는 클라이언트 표 권한 0 아래서 유일한 읽기 경로(ERD §5). **Resolve 를 누르지 않는다**(런북 §11) |
| Supabase advisor | RLS 켜졌으나 정책 없음 18개 | `app.*` 전부 — 설계상 클라이언트 역할은 표에 권한이 없다(`checks` ①②) |
| Supabase advisor | definer 함수 실행 가능 25개(`authenticated`) + 1개(`anon`, `data_version`) | 허용 목록 그대로(`checks` ③④⑩, pgTAP G-03) — 쓰기·관리는 모두 이 함수뿐 |
| ZAP `rules.tsv` IGNORE | 10020 클릭재킹 헤더, 10021 nosniff, 10038 CSP 헤더, 10063 Permissions-Policy, 90004 Spectre 격리, 10015 Cache-control | `vite preview` 는 운영 헤더를 못 보낸다. 콘솔 헤더는 `check-admin-headers.mjs`(C1), 앱은 meta CSP + FrameGuard 를 E2E 가 본다 |
| ZAP IGNORE | 10202 CSRF 토큰 없음 | 폼은 서버로 제출하지 않고(`form-action 'none'`), 토큰은 헤더의 bearer — 쿠키가 없어 CSRF 가 탈 것이 없다 |
| ZAP IGNORE | 10049 캐시 가능 콘텐츠 | 운영에서 콘솔은 `no-store`, 앱은 서비스워커가 캐시 정책을 가진다 |
| ZAP IGNORE | 10055 대체 없는 CSP 지시어 | 빠진 것은 `frame-ancestors` — meta CSP 가 가질 수 없고 콘솔은 헤더로 보낸다(Pages 는 불가, 수용) |
| ZAP IGNORE | 10109 현대 웹앱 | Ajax 스파이더를 쓰라는 안내 — 이미 `-j` 로 쓴다 |
| ZAP OUTOFSCOPE | `http://127.0.0.1:54321/`, `https://tile.openstreetmap.org/` | 로컬 게이트웨이(Supabase 대역)와 타일 서버 |
| ZAP FAIL | 10017 교차 도메인 스크립트 | 스크립트는 앱 자신에서만(Turnstile 은 스위치 ON 때만 로드) — 올린 규칙은 이것 하나 |

### 4.2 수용된 잔여 위험

| # | 위험 | 근거·대응 |
|---|---|---|
| R-a | IP 한도의 429 는 예외라 `security_events` 에 남지 않는다 | ERD OQ-E1. 감시는 `ip_hits` 의 한도 도달 창(`ops_health`)으로 센다 |
| R-b | `supabase_admin` 의 `public` 기본 ACL 을 바꿀 수 없다 — Supabase 가 만드는 객체가 다음 마이그레이션까지 클라이언트 역할에 열릴 수 있다 | ERD OQ-E10, `checks` ⑨ 수정(`2ff2ed3`). 우리 함수는 모두 `postgres` 가 만들고 ③④⑩ 이 전수 검사. **출시 직전·분기마다 `pg_default_acl`·함수 권한 재확인**(§6, 런북 §11) |
| R-c | 실패한 `admin_*` 직접 호출은 롤백되어 IP 한도에도 `security_events` 에도 남지 않는다(42501 은 Supabase API 로그에만) | handoff §5, ERD OQ-E7 (1). 무차별 대입은 Auth 로그인 한도·TOTP 가 막는다는 전제. **수용 여부 미정(B-8)** |
| R-d | PostgREST 가 인자를 변환하지 못하는 요청(잘못된 enum·uuid)은 함수 전에 실패해 IP 창에 세지지 않는다 | ERD G-55 메모, HTTP `G-55 …` 둘째 단언 |
| R-e | 읽기 요청은 IP 한도 대상이 아니다 | ADR-0022 "결과". 공개 뷰는 읽기 전용·`stable` |
| R-f | 사용자 앱의 meta CSP 한계: `frame-ancestors`·위반 보고 없음, `github.io` 출처 공유(리디렉션 뒤 경로 한정 무력) | ADR-0022 S4, RFC §17.3·R-3·R-4. FrameGuard + E2E 위반 수집, 관리자는 별도 출처 |
| R-g | 백업 RPO 7일, 복구 뒤 익명 사용자의 옛 항목 수정 권한 상실 | RFC OQ-13·OQ-18(받아들임), ERD OQ-E6 |
| R-h | 백업·복구 전용 DB 역할 없이 `postgres` 접속 문자열 사용(역할은 보류) | 비공개 기록의 결정. 비밀값 교체는 런북 §10 |
| R-i | 운영 저장소의 비밀값은 그 저장소의 모든 워크플로가 읽는다(Environment 없음) | §5 1번. 워크플로는 두 개(`monitor`·`backup`), 최상위 `permissions: {}`, PR 트리거 없음 |
| R-j | CAPTCHA 로그인 직후 새로 고침 전의 짧은 순간, Turnstile 스크립트와 관리자 세션이 같은 페이지에 있다 | handoff §5 (2). 콘솔 CSP 가 `challenges.cloudflare.com` 만 허용 |
| R-k | 첫 콘솔 배포가 CI 가 아닌 책임자 PC 에서 수동으로 됐다(ADR-0022 T-10 에서 1회 이탈) | handoff §2 3, 런북 §7.2. 이후는 Y-4 `deploy.yml` — §6 |
| R-l | 예비 TOTP 의 보관 방식은 책임자 결정 | 런북 §5.1 4. 결정과 장소는 비공개 기록에만 |
| R-m | Admin API 경로의 사용자 생성에는 가입 훅이 돌지 않는 것으로 보인다 | ERD OQ-E5, 런북 §5.1 2. 훅은 보조 장치 — 권한의 근거는 `admins` 행뿐(`bind_admin` G-37) |
| (조건부) | Auth 로그에 요청 IP 원문이 Supabase 보관 기간 동안 남는다 | 수용 위험이 아니라 **방침 게시(Y-4) 의 전제** — Y-P1 "접속 로그가 남을 수 있음" 문구로 공개해야 닫힌다(§2 6번 "방침 게시") |

## 5. 설계와 달라진 점

| # | 설계 | 실제 | 어디에 |
|---|---|---|---|
| 1 | 운영 저장소의 비밀값도 `main` 전용 Environment(RFC §17.5) | GitHub Free 의 비공개 저장소는 Environment 를 쓸 수 없어 저장소 비밀값 | handoff §2 4, R-i |
| 2 | 복구 리허설은 로컬 스택으로(ADR-0022 S9, RFC §17.5) | 임시 무료 클라우드 프로젝트(도쿄)에서 — 호스팅 `postgres` 의 복원 권한(`session_replication_role`, `auth.users` 쓰기)까지 확인됐으므로 로컬보다 강한 증거. 끝나고 삭제 | 런북 §9.2 |
| 3 | 프로젝트 us-east-1 | 도쿄 프로젝트로 교체(2026-10-18 설계), 옛 프로젝트 삭제(2026-10-22) | handoff §1 |
| 4 | `checks` ⑨: 기본 EXECUTE 가 남아 있으면 실패 | 바꿀 수 있는 역할만 실패, 나머지는 notice(`2ff2ed3`) | ERD OQ-E10, R-b |
| 5 | `ops_health` 1판 | 2판 — 런북 §6.1 의 신호(`930b633`), 마이그레이션 21 | ERD, 런북 §6.2 |
| 6 | service_role 은 pre-request 를 거치지 않음(가정) | service_role 도 `app.db_pre_request` 를 실행해야 REST 가 통함 → 마이그레이션 22(`4381fe9`) | handoff §2 4 |
| 7 | 감시 30분마다(RFC §17.4) | 주기는 비공개 기록의 결정 | handoff §2 4 |
| 8 | 콘솔은 Cloudflare 별도 출처(ADR-0020) | Workers 정적 자산 + 사용자 도메인 `yunabi-admin.juha.dev`, workers.dev·미리보기 주소 끔 | `e48ded6`, 런북 §7.2 |
| 9 | 배포는 CI 에서만(T-10) | 첫 콘솔 배포는 `wrangler@4.86.0` 수동 — 1회(R-k) | 런북 §7.2 |
| 10 | 런북 도우미는 `supabase-js` | Node 20 에서 실패해 fetch 만 쓰는 도우미로 교체 | 런북 §5.2·§12 |
| 11 | ADR-0022 S7 ① "익명 로그인 한도를 범위별로"(미확인) | 범위별 설정은 없고 전체 150/시간 | RFC R-12 |

**운영 항목(블로커 아님):** 책임자 PC 를 Node 22 로 올리고 `wrangler` 고정을 풀지(런북 열린 질문 8). 런북 열린 질문 6(경보 전 수동 주기)은 `monitor.yml` 이 매시 돌면서 **닫혔다**.

## 6. 출시 전 블로커

담당은 모두 책임자(D25). 종결 증거가 생기면 §1~§3 의 상태를 고치고 §8 에 서명한다. 세부(무엇이 빠졌는지): `yunabi-ops records/security-check-open.md`.

| # | 블로커 | 단계 | 담당 | 종결 증거 | 종결일 |
|---|---|---|---|---|---|
| B-1 | PL-1 기숙사 IP — `ip_tiers` 등록 또는 대안 결정 기록 | Y-3S | 책임자 | `ip_tiers` 행(값 비공개) 또는 `records/decisions.md` 의 결정 행 | |
| B-2 | §17.6 3a 기숙사 범위 부하 시험 | Y-3S | 책임자 | 등록 값(또는 대안)으로 한 실측 기록: 날짜·방법·429 0건 | |
| B-3 | Y-S7 CAPTCHA 준비 — 런북 §3.1 C-3(위젯 호스트)·C-4(비밀 키 등록, 스위치 OFF)·§3.2 스위치 위치 확인 | Y-3S | 책임자 | 세 항목의 확인 날짜, 런북 §3.1 표 갱신 | |
| B-4 | 저장소 설정 — Dependabot alerts·security updates, `main` 보호 규칙 | Y-3S | 책임자 | 설정 화면 확인 날짜, 보호 규칙의 필수 검사 3개 | Dependabot 부분 닫힘 2026-10-23 — `main` 보호는 병합 때 |
| B-5 | PL-4 계정 2단계 인증 확인 | Y-3S | 책임자 | 계정별 확인 날짜(비공개 기록), 복구 코드 보관 | 닫힘 2026-10-23 — 책임자 확인 |
| B-6 | Y-S8 콘솔 전송 설정 확인 | Y-3S | 책임자 | 확인 날짜 — 세부: yunabi-ops records/security-check-open.md | 닫힘 2026-10-23 — 실측 |
| B-7 | PL-3 R-7 ② 요소 삭제 단계 모의 실행 | Y-3S | 책임자 | 로컬 스택 또는 리허설 프로젝트에서 §5.3 ② 1~4 전부, 런북 열린 질문 5 닫힘 | |
| B-8 | OQ-E7 확인 (API 로그 접근) | Y-3S | 책임자 | 확인 결과(접근 방법·보관 기간) + 못 읽으면 수용 결정 기록 → R-c 를 "수용" 으로 | |
| B-9 | OQ-E10 출시 직전 재확인 — `pg_default_acl`·함수 권한(`checks` 재실행) | Y-3S | 책임자 | SQL Editor 실행 날짜, `supabase_admin` 기본 권한에 새 행 없음 | |
| B-10 | ZAP 운영 URL 수동 스캔 — 콘솔 | Y-3S | 책임자 | 날짜·버전·높음 0·WARN 처리 | |
| B-11 | 런북 R-1·R-2 모의 실행 | Y-3S | 책임자 | 날짜·결과, 런북 §4.1·§4.2 에 `[해 봄]` | |
| B-12 | 대시보드 점검 3건 — 이메일 공개 가입 토글 OFF, 레거시 키 비활성, 프로젝트 멤버 1명 | Y-3S | 책임자 | 확인 날짜(이 표 §2 6번 갱신) | |
| B-13 | `production` Environment(`main` 전용, 필수 검토자) + `deploy.yml` 자동 배포(T-10) | Y-4 | 책임자 | Environment 설정, `deploy.yml` 첫 성공 실행 번호 | |
| B-14 | CAPTCHA 스위치 ON 시험 ① 사용자 첫 쓰기 ② 관리자 로그인 (C-1·C-2 사이트 키 배포 뒤) | Y-4 | 책임자 | 런북 §3.3 실행 기록(날짜·결과), §3.4 로 끈 뒤 재확인 | |
| B-15 | Pages "Enforce HTTPS" | Y-4 | 책임자 | 설정 확인 날짜 | |
| B-16 | 방침·약관 게시 — IP 가명 처리, 접속 로그 IP 원문(Y-P1), Turnstile 문구(C-5) | Y-4 | 책임자·기획 | 페이지 주소, 첫 등록 화면 링크(Y-P4) | |
| B-17 | ZAP 운영 URL 수동 스캔 — 사용자 앱 | Y-4 | 책임자 | 날짜·버전·높음 0 | |

## 7. 다시 점검할 때

| 언제 | 무엇 | 근거 |
|---|---|---|
| 마이그레이션마다 | `checks` 블록을 운영 SQL Editor 에서 재실행(런북 §7.1), 새 함수는 허용 목록·`search_path`·`{status:'invalid'}` 규칙(CLAUDE.md) | ERD §8, R-b |
| 매주(월) | ZAP 주간 실행 높음 0, Dependabot PR 병합, `npm audit`(CI), 정리 작업 4개 `succeeded` | 런북 §11 |
| 분기마다 | `pg_default_acl`·함수 권한, 네 계정 2단계 인증·복구 코드, 프로젝트 멤버 1명, 예비 TOTP 로그인, ZAP 이미지·gitleaks 버전 갱신 | 런북 §11 |
| 학기 시작 전 | `ip_tiers`·기숙사 주소 확인(PL-1), CAPTCHA 사전 확인 §3.1 | 런북 §11 |
| 출시 직전 | §6 전부 닫힘, 이 문서의 §1~§3 상태 갱신, 운영 URL ZAP(콘솔·앱) | 이 문서 |
| 출시 첫 주 | Y-S3 12시간 만료를 클라우드에서 한 번 관찰(§3 메모), 경보 메일이 휴대폰에서 울리는지 | §3 |
| Y-4 배포 뒤 | B-13~B-17, 앱의 CSP 위반 0(실제 주소), `dist-e2e*` 가 배포되지 않았는지 | RFC §20 |

## 8. 서명

| | |
|---|---|
| 점검 기록 작성 | 2026-10-23, 대상 커밋 `d1f0d38` |
| 블로커 종결 확인 (책임자) | 날짜: ______ · 대상 커밋: ______ |
| 출시 승인 (책임자) | 날짜: ______ · 서명: ______ |
