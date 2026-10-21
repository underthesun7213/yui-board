# ADR-0022 · 보안 기준선 — 외부 공격 대비 (Y-S1~S12)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 (같은 날 보안 검토 반영 개정) |
| 근거 | PRD-YUNABI v2.3 **D20**, §6.1 Y-S1~S12, Y-A4, Y-P1, Y-P5, 마일스톤 Y-3S |
| 관련 | [RFC-0003 §14·§17 위협 모델·런북](../architecture/rfc/0003-yunabi-v2.md#17-보안--위협-모델과-대응-d20-y-s1s12-adr-0022), [tech-stack-v2 §5.5·§5.6·§6.3](../architecture/tech-stack-v2.md), [ERD v2 §5·§7·§9](../architecture/erd-v2.md), ADR-0016, ADR-0018, ADR-0019, ADR-0020, ADR-0021 |
| 개정 | 독립 보안 검토(기준 `da55060`, 판정 "보완 필요 — 구조는 견고")의 지적 #1~#14·낮음·nit 를 반영했다. 바뀐 칸에 `[검토 #n]`. 이어서 재검토(조건부 승인)의 조건 #1~#5 를 `[재검토 #n]` 으로 반영 |

## 배경

공개 웹 앱이고 익명 쓰기가 열려 있다. 책임자는 사용자 악용 대응은 단순하게 두고 **외부 공격(해킹)에 대한 보안**에 중점을 두기로 했다(D20). 무료 플랜 제약: Supabase 무료 플랜은 백업이 없고(공식 가격 페이지 발췌, 2026-10-12), 세션 최대 수명·비활동 제한은 Pro 기능으로 보이며(검토의 확인), GitHub Pages 는 응답 헤더를 설정할 수 없어 CSP 가 meta 로만 가능하다. 위협 목록은 RFC-0003 §17.2 (STRIDE T-01~T-27).

첫 판에서 검토가 찾은 치명 결함 두 가지: (1) 30초 폴링이 POST 라 기숙사 NAT 뒤 몇 명이 IP 쓰기 한도를 다 써 전원이 429 를 받는다, (2) `PUBLIC` 의 기본 EXECUTE 를 회수하지 않아 `anon` 이 쓰기 RPC·`ops_health` 를 부를 수 있다. 둘 다 아래 S1·S7 에서 고쳤다.

## 결정

| Y-S | 결정 | 수락 확인 |
|---|---|---|
| **S1** 서버 권한 | 테이블 비노출 + 정의자 RPC 만(ADR-0021). 소유는 `auth.uid()`, 관리자는 `require_admin()`(**실패 안전 — 모든 단계 "없거나 아니면 거절" + 예외**, 모든 `admin_*` 첫 문장 `[검토 #3]`). **함수 EXECUTE 는 `PUBLIC` 에서도 회수**하고 `postgres`·`supabase_admin` 기본 권한도 고친다 `[검토 #2]`. 화면의 버튼 숨김은 편의일 뿐. **확장은 `extensions` 스키마에**(`create extension postgis with schema extensions`) — `public` 에 두면 `ST_*` 함수가 RPC 로 노출되어 허용 목록 검사가 깨진다 `[재검토 #3]` | pgTAP: 카탈로그 전수 `has_function_privilege`(PUBLIC 포함, G-03), `admin_%` 전체 × 실패 경우 7가지(G-30), 공개 뷰 4개 누출(G-23) + `tests/e2e-backend/security.spec.ts` HTTP 직접 요청 — 전부 거절 |
| **S2** 비밀 키 | 클라이언트 변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`(모두 공개값) 셋만(빌드 설정이 다른 `VITE_` 변수를 거부). 비밀값은 **`main` 전용 Environment(필수 검토자)**에만, PR 워크플로는 비밀값 없이, **`pull_request_target` 금지**, 마이그레이션은 계정 전체 권한 PAT(`SUPABASE_ACCESS_TOKEN`) 대신 **`--db-url`** `[검토 #9]`. 백업·감시 비밀값은 비공개 운영 저장소에. GitHub 비밀 검사 + push protection, CI gitleaks(저장소·`dist`·`dist-admin`), 산출물 패턴 검사(`sb_secret_`, `service_role`, JWT 형태). 레거시 키 비활성화 | CI 실패 조건, 저장소 설정 점검표 |
| **S3** 관리자 | 별도 출처 콘솔(ADR-0020), 이메일+비밀번호+**TOTP 필수(aal2)**. **생성: 공개 가입 OFF → `admin_invites` → Admin API 생성 → 반환된 id 로 `bind_admin`**(비익명·이메일 확인·초대 뒤 생성·중복 이메일 없음 검사 — 익명 사용자의 초대 이메일 선점에 의한 연결 탈취 방지) `[검토 #4]` `[재검토 #2]`, 기본 SMTP 소모로 재설정 메일이 막히면 대시보드 직접 재설정(관리자 2명 이상이면 사용자 SMTP) `[재검토 #4]`, **TOTP 는 책임자가 생성 때 등록** `[검토 낮음]`. **D25(관리자 = 책임자 1명):** TOTP 요소 2개(주 + 예비 — Supabase 는 백업 코드 없음), 분실 복구·부재 런북(RFC-0003 R-7·R-8), Supabase·GitHub·Cloudflare 계정 2단계 인증 점검. **D26:** 사용자 SMTP 는 출시 전 항목(RFC-0003 §17.6a PL-2). 권한의 근거는 `admins` 행뿐(익명 → 이메일 전환은 훅을 거치지 않으므로). 서버 세션 만료 12시간(무료 플랜에서 **유일한** 서버 측 만료 — timebox 는 Pro 로 보임) + 콘솔 `sessionStorage`. **콘솔에 Turnstile 위젯·CSP 허용**(CAPTCHA 는 비밀번호 로그인에도 적용) `[검토 #5]`. 모든 조치 추가 전용 기록(ADR-0019), 거절은 `admin_whoami` 가 기록 | pgTAP G-30~G-37, 점검표 "스위치 ON 에서 관리자 로그인" |
| **S4** XSS | 텍스트 보간만 — **D24 로 React: JSX 텍스트, `react/no-danger`·`innerHTML` 대입 린트 오류**(ADR-0023 결정 7; 이전 안: Svelte `{@html}` 린트 오류). **Leaflet 의 HTML 경로**(`bindTooltip`·`bindPopup`·`setContent`·`divIcon({html})`)에 문자열 금지 — `src/map` 의 `no-restricted-syntax`, 사용자 글은 `textContent` 노드로만 `[검토 #12]`. 링크는 서버 허용 목록(`goo.gl/maps` 제외 `[검토 nit]`) + 클라이언트 URL 파서 재확인 + `rel="noopener noreferrer"`. 사용자 앱 meta CSP 는 **`'self'` 대신 `https://<user>.github.io/yui-board/assets/` 경로 한정** `[검토 #13]`, `default-src 'none'`. 관리자 콘솔 헤더 CSP + `frame-ancestors 'none'`. meta CSP 한계(클릭재킹·보고 불가)는 `FrameGuard` 와 E2E 위반 수집으로 보완 | 린트, E2E: XSS 페이로드 세트(장소 이름 → 카드·목록·**핀 툴팁·클러스터**) → `dialog`·위반 이벤트 0 |
| **S5** 입력·주입 | 서버 검증(RFC-0003 §13.2) + DB CHECK(마지막 방어선). 형식 오류는 `{status:'invalid', field}` + 기록 `[검토 #7]`. 정적 SQL 만, `execute` 금지(마이그레이션 검사), `ilike` 패턴 이스케이프 | 비정상 입력 세트(ERD v2 G-15, G-16) 전부 거절 |
| **S6** 의존성 | `package-lock.json`, `npm ci`, `npm audit --audit-level=high` 실패, Dependabot 보안·버전 PR, 액션 SHA 고정, 런타임 의존성 최소 | CI |
| **S7** 자동화 공격 | ① Supabase 익명 로그인 IP 한도 — **전체 150/시간**(범위별 설정 미확인, 기숙사 NAT 대비 `[검토 #6]`) ② 가입 훅의 전역 익명 생성 한도 200/시간(훅이 익명에 도는지 미확인) ②′ **훅과 무관한 보장: `require_writer` 의 앱 계정 생성 상한 200/시간** — 계정은 첫 쓰기 때만 생기므로 대량 생성된 Auth 사용자도 쓰기·신고를 못 한다 `[재검토 #1]`(G-38) ③ `db_pre_request` 의 IP 당 쓰기 한도 — **쓰기 RPC 경로만** 센다 `[검토 #1]`, 기본 5분 60 / **`ip_tiers` 기숙사 범위 5분 600** `[검토 #6]`, IP 는 **신뢰 프록시가 붙인 `x-forwarded-for` 값**(맨 왼쪽은 위조 가능), IPv6 는 **/64** 키 `[검토 #6·#7]` ④ 계정 한도(Y-A3) — 기숙사 범위 안의 주 방어 ⑤ **CAPTCHA 스위치**: Turnstile ON → 익명 로그인·관리자 로그인에 토큰. 사이트 키가 빌드에 있어야 재배포 없이 켜진다 ⑥ **런북**(RFC-0003 §17.7): 대량 숨김 R-1(CAPTCHA ON → `admin_restore_bulk`) `[검토 #10]`, 가입 한도 소진 R-2(CAPTCHA ON) `[검토 #11]` | 통합 테스트: 각 한도 +1 거절, G-52~G-55, 기숙사 부하 시험, 스위치 ON/OFF 시험, 런북 모의 실행 |
| **S8** 전송 | HTTPS 만(Pages "Enforce HTTPS", Supabase·Cloudflare HTTPS), CSP `upgrade-insecure-requests`, 외부 요청 전부 `https:`, 관리자 콘솔 HSTS | ZAP, 점검표 |
| **S9** 백업·복구 | 무료 플랜 백업 없음 → **비공개 운영 저장소**의 `backup.yml` 주 1회 덤프 → `age` 암호화 → 그 저장소의 아티팩트(90일). 공개 저장소의 아티팩트는 누구나 받을 수 있어 쓰지 않는다 `[검토 #9]`. **덤프 제외:** `auth.refresh_tokens`, `auth.sessions`, `auth.mfa_factors`, `auth.mfa_challenges`, `auth.one_time_tokens`, `auth.flow_state`, `auth.audit_log_entries`, `app.salts`, `app.ip_hits`, `app.write_log` `[검토 #8·#9]`. 복구 후 관리자 TOTP 재등록, 익명 사용자는 새 계정(옛 항목 수정 불가 — RFC-0003 OQ-18). **출시 전 로컬 스택으로 복구 리허설** | 리허설 기록, 덤프 목록 검사 |
| **S10** 감시 | `security_events`(권한 거절·빈도 초과·형식 오류·정지 쓰기·관리 거절·가입 제한) + `mod_actions`. **비공개 운영 저장소**의 `monitor.yml` 30분마다 `ops_health()`(service_role, 숫자만) → 기준 초과 시 **그 비공개 저장소의 이슈**(메일 알림) — 공개 저장소 이슈·로그는 방어 상태를 드러낸다 `[검토 낮음]`. 콘솔을 거치지 않은 `admin_*` 직접 호출 거절은 예외 롤백으로 DB 에 안 남는다 — Supabase API 로그 연계는 SE-Q7 | 가짜 이벤트로 알림 시험 |
| **S11** 출시 전 점검 | 마일스톤 Y-3S: pgTAP·HTTP 권한 스위트(위 S1), XSS·입력 세트, 동시 신고(G-60), 기숙사 부하 시험, OWASP ZAP baseline(로컬 스택 + 운영 URL 수동 스캔), audit·gitleaks 0, 점검표(대시보드·저장소·Pages·Environment 설정, `ip_tiers`·`xff_trusted_hops`, 스위치 ON 상태의 사용자 첫 쓰기·관리자 로그인, 백업 리허설, 알림 시험, 런북 모의 실행, 방침 게시) | 점검 기록 (`docs/08-qa/` 에) |
| **S12** 최소화 | Y-P1 목록 밖 정보 없음: 신고 자유 서술 없음, IP 원문 없음, 공개 시각은 일 단위, 기록에 본문 사본 없음, 지표 수집 없음(ADR-0007 미사용). **IP 는 가명 처리**(일일 솔트 해시 — 솔트가 같은 DB 에 있고 IPv4 공간이 작아 익명화가 아님): `ip_hits` 1시간, `security_events` 의 IP 키는 **48시간 뒤 null**, 솔트 이틀 뒤 삭제·백업 제외, 방침에 "가명 처리" 로 명시 `[검토 #8]`. 기숙사 IP 범위는 건물 주소라 평문. 보관 기간 정리 작업(ERD v2 §6), ERD v2 §4 의 열마다 "왜" | 스키마 검토, G-56 |

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| Supabase Pro($25/월)로 백업·PITR·세션 timebox | 비용 0 목표. 주간 덤프로 RPO 7일을 받아들이고, 세션 만료는 DB 검사로. 일시정지·백업이 문제가 되면 전환(tech-stack-v2 TS-Q7) |
| CAPTCHA 상시 사용 | D20 — 기본 OFF, 공격 시 스위치. 상시 사용은 Cloudflare 로 기기 신호가 가는 개인정보 비용 |
| 대량 숨김 자동 차단기 | D20 이 제외. 경보 + 런북 + 일괄 복원으로 대신(수용 여부는 ADR-0019 MO-Q4) |
| 관리 RPC 가 거절을 기록하고 상태를 반환 | 첫 판의 방식. 반환값 확인을 잊은 함수가 열리는 실패 개방 위험(검토 #3) — 실패 안전을 기록보다 우선 |
| 외부 WAF / API 게이트웨이 | Supabase API 앞에 둘 수 없음(클라이언트가 Supabase 를 직접 부름), 비용 |
| 외부 모니터링 서비스 | 비용·계정 추가. 비공개 저장소 이슈 알림으로 충분 |
| 사용자 앱을 헤더 가능한 호스트로 | 같은 주소 유지(PRD §7)와 충돌 — 관리자만 분리(ADR-0020) |

## 결과

- 좋은 점: 각 Y-S 가 자동 검사나 점검 기록으로 확인된다. 권한 검사가 카탈로그 전수로 바뀌어 새 함수가 생겨도 빠지지 않는다. 기숙사 공유 IP 가 정상 사용을 막지 않는다. 추가 비용 0(비공개 저장소는 무료).
- 나쁜 점: 사용자 앱의 meta CSP 한계와 `github.io` 출처 공유는 남는다(완화만 — 경로 한정은 리디렉션 뒤 무력). 읽기 요청은 IP 제한 대상이 아니다. 백업은 최대 7일 손실이고 복구하면 익명 사용자의 수정 권한이 끊긴다. 관리 RPC 직접 호출 거절은 DB 에 기록되지 않는다. 대량 숨김 공격은 관리자 손이 필요하다. 저장소가 둘(공개 앱, 비공개 운영)이 된다.
- 운영 문서(런북: 배포·롤백·복구·키 교체·CAPTCHA 켜기·관리자 추가·대량 숨김 복원)는 Y-3S 에서 `docs/architecture/runbook.md` 로 쓴다.

## 열린 질문

| # | 질문 |
|---|---|
| SE-Q1 | 백업 주기·보관 장소 (RFC-0003 OQ-13, tech-stack-v2 SB-Q2) |
| SE-Q2 | `x-forwarded-for` 에서 신뢰할 위치(`xff_trusted_hops`) — Y-2 실측 |
| SE-Q3 | `[검토 미확인]` `pgrst.db_pre_request` 를 Supabase 클라우드에서 설정할 수 있는지 (ERD v2 OQ-E1). 안 되면 IP 한도는 쓰기 RPC 안에서 `request.headers` 를 읽어 같은 방식으로 |
| SE-Q4 | `[검토 미확인]` 무료 프로젝트 일시정지 조건, 감시 예약 실행이 그것을 막는 부수 효과 (RFC-0003 OQ-12) |
| SE-Q5 | CAPTCHA 를 켤 때 필요한 방침 문구를 출시 방침에 미리 넣을지 (tech-stack-v2 TS-Q6) |
| SE-Q6 | 출시 전 점검 기록의 위치와 형식 (`docs/08-qa/security-check.md` 제안) |
| SE-Q7 | `[재검토 #5]` 남는 공백: 관리 RPC 직접 호출은 IP 한도에 세지 않고(쓰기 목록 밖, 실패 시 예외가 카운트를 롤백), 그 거절(42501)은 Supabase API 로그에만 남는다. Y-2 에서 감시가 그 로그를 읽을 수 있는지(접근 방법·무료 플랜 보관 기간) 확인, 못 읽으면 수용된 잔여 위험으로 기록 (ERD v2 OQ-E7) |
| SE-Q10 | 사용자 SMTP 도입 시점 (RFC-0003 OQ-G) `[재검토 #4]` — **D26: 출시 전 항목**(RFC-0003 §17.6a PL-2) |
| SE-Q8 | 기숙사 공인 IP/CIDR (RFC-0003 OQ-E) — **D26: 출시 전 항목**(PL-1) |
| SE-Q11 | 관리자 1명(D25)의 승계 — 장기 연락 두절 시 계정·백업 키 접근 (RFC-0003 OQ-20) |
| SE-Q9 | `[검토 미확인]` `before-user-created` 훅이 익명 가입에도 도는지 (ERD v2 OQ-E5), 익명 로그인 IP 한도를 범위별로 줄 수 있는지 (tech-stack-v2 TS-Q12) |
