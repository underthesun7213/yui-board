# ADR-0022 · 보안 기준선 — 외부 공격 대비 (Y-S1~S12)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 **D20**, §6.1 Y-S1~S12, Y-A4, Y-P1, Y-P5, 마일스톤 Y-3S |
| 관련 | [RFC-0003 §17 위협 모델](../architecture/rfc/0003-yunabi-v2.md#17-보안--위협-모델과-대응-d20-y-s1s12-adr-0022), [tech-stack-v2 §5.5·§5.6·§6.3](../architecture/tech-stack-v2.md), [ERD v2 §5·§9](../architecture/erd-v2.md), ADR-0016, ADR-0018, ADR-0020, ADR-0021 |

## 배경

공개 웹 앱이고 익명 쓰기가 열려 있다. 책임자는 사용자 악용 대응은 단순하게 두고 **외부 공격(해킹)에 대한 보안**에 중점을 두기로 했다(D20). 무료 플랜 제약이 있다: Supabase 무료 플랜은 백업이 없고(공식 가격 페이지 발췌, 2026-10-12), GitHub Pages 는 응답 헤더를 설정할 수 없어 CSP 가 meta 로만 가능하다. 위협 목록은 RFC-0003 §17.2 (STRIDE T-01~T-25).

## 결정

| Y-S | 결정 | 수락 확인 |
|---|---|---|
| **S1** 서버 권한 | 테이블 비노출 + 정의자 RPC 만(ADR-0021). 소유는 `auth.uid()`, 관리자는 `require_admin()`. 화면의 버튼 숨김은 편의일 뿐 | pgTAP 권한 매트릭스(ERD v2 §9) + `tests/security/` HTTP 직접 요청 — 전부 거절 |
| **S2** 비밀 키 | 클라이언트 변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 둘만(빌드 설정이 다른 `VITE_` 변수를 거부). secret 키·DB 비밀번호·Cloudflare 토큰·백업 키는 Actions 비밀값에만. GitHub 비밀 검사 + push protection(공개 저장소 무료), CI gitleaks(저장소·`dist`·`dist-admin`), 산출물 패턴 검사(`sb_secret_`, `service_role`, `eyJ…` JWT 형태). 레거시 키 비활성화 | CI 실패 조건 |
| **S3** 관리자 | 별도 출처 콘솔(ADR-0020), 이메일+비밀번호+**TOTP 필수(aal2)**, 허용 목록 + 가입 훅, 서버 세션 만료 12시간 + 콘솔 `sessionStorage` + 대시보드 비활동 제한, 모든 조치 추가 전용 기록(ADR-0019). 관리자 거절은 `security_events` | pgTAP G-30~G-34, 점검표 |
| **S4** XSS | 텍스트 보간만(`{@html}` 린트 오류), 링크는 서버 허용 목록 + 클라이언트 URL 파서 재확인 + `rel="noopener noreferrer"` `target="_blank"`. 사용자 앱 meta CSP(`script-src 'self'`, 외부는 Turnstile 만), 관리자 콘솔 헤더 CSP + `frame-ancestors 'none'`. meta CSP 의 한계(클릭재킹·보고 불가)는 `FrameGuard` 와 E2E 위반 수집으로 보완 | E2E: XSS 페이로드 세트 등록 → `dialog`·위반 이벤트 0 |
| **S5** 입력·주입 | 서버 검증(RFC-0003 §13.2) + DB CHECK(마지막 방어선). 정적 SQL 만, `execute` 금지(마이그레이션 검사), `ilike` 패턴 이스케이프 | 비정상 입력 세트(ERD v2 G-15, G-16) 전부 거절 |
| **S6** 의존성 | `package-lock.json`, `npm ci`, `npm audit --audit-level=high` 실패, Dependabot 보안·버전 PR, 액션 SHA 고정, 런타임 의존성 최소 | CI |
| **S7** 자동화 공격 | ① Supabase 익명 로그인 IP 한도(시간당 30, 기숙사 NAT 확인 후 조정) ② 가입 훅의 전역 익명 생성 한도(시간당 200) ③ `db_pre_request` 의 IP 당 쓰기 한도(5분 60, IP 는 일일 솔트 해시로 1시간) ④ 계정 한도(Y-A3) ⑤ **CAPTCHA 스위치**: Supabase Bot and Abuse Protection 에서 Turnstile 을 켜면 익명 로그인에 토큰 필요 — 클라이언트는 그 오류를 받으면 위젯을 띄운다(재배포 없음, CSP 는 미리 허용) | 통합 테스트: 각 한도 +1 거절, 스위치 ON/OFF 시험 |
| **S8** 전송 | HTTPS 만(Pages "Enforce HTTPS", Supabase·Cloudflare HTTPS), CSP `upgrade-insecure-requests`, 외부 요청 전부 `https:`, 관리자 콘솔 HSTS | ZAP, 점검표 |
| **S9** 백업·복구 | 무료 플랜 백업 없음 → `backup.yml` 주 1회 `supabase db dump` → `age` 암호화 → Actions 아티팩트(90일), 개인 키는 책임자만. 복구 절차 문서화, **출시 전 로컬 스택으로 복구 리허설** | 리허설 기록 |
| **S10** 감시 | `security_events`(권한 거절·빈도 초과·정지 쓰기·관리 거절·가입 제한) + `mod_actions`. `monitor.yml` 30분마다 `ops_health()`(service_role) → 기준 초과 시 GitHub 이슈(메일 알림). 기준은 RFC-0003 §17.4 | 가짜 이벤트로 알림 시험 |
| **S11** 출시 전 점검 | 마일스톤 Y-3S: pgTAP·HTTP 권한 스위트, XSS·입력 세트, OWASP ZAP baseline(로컬 스택 + 운영 URL 수동 스캔), audit·gitleaks 0, 점검표(대시보드·저장소·Pages 설정, 백업 리허설, 알림 시험, 방침 게시) | 점검 기록 (`docs/08-qa/` 에) |
| **S12** 최소화 | Y-P1 목록 밖 정보 없음: 신고 자유 서술 없음, IP 원문 없음, 공개 시각은 일 단위, 기록에 본문 사본 없음, 지표 수집 없음(ADR-0007 미사용), 보관 기간 정리 작업(ERD v2 §6). ERD v2 §4 의 열마다 "왜" | 스키마 검토 |

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| Supabase Pro($25/월)로 백업·PITR | 비용 0 목표. 주간 덤프로 RPO 7일을 받아들이고, 일시정지·백업이 문제가 되면 전환(tech-stack-v2 TS-Q7) |
| CAPTCHA 상시 사용 | D20 — 기본 OFF, 공격 시 스위치. 상시 사용은 Cloudflare 로 기기 신호가 가는 개인정보 비용 |
| 외부 WAF / API 게이트웨이 | Supabase API 앞에 둘 수 없음(클라이언트가 Supabase 를 직접 부름), 비용 |
| 외부 모니터링 서비스 | 비용·계정 추가. GitHub 이슈 알림으로 충분 |
| 사용자 앱을 헤더 가능한 호스트로 | 같은 주소 유지(PRD §7)와 충돌 — 관리자만 분리(ADR-0020) |

## 결과

- 좋은 점: 각 Y-S 가 자동 검사나 점검 기록으로 확인된다. 공격 가치가 큰 것(관리자, 비밀값, 권한)에 방어가 집중된다. 추가 비용 0.
- 나쁜 점: 사용자 앱의 meta CSP 한계와 `github.io` 출처 공유는 남는다(완화만). 읽기 요청은 IP 제한 대상이 아니다(Supabase 패턴의 한계 — egress 감시로 대응). 백업은 최대 7일 손실. 무료 플랜 SLA 없음.
- 운영 문서(런북: 배포·롤백·복구·키 교체·CAPTCHA 켜기·관리자 추가)는 Y-3S 에서 `docs/architecture/runbook.md` 로 쓴다.

## 열린 질문

| # | 질문 |
|---|---|
| SE-Q1 | 백업 주기·보관 장소 (RFC-0003 OQ-13, tech-stack-v2 SB-Q2) |
| SE-Q2 | `x-forwarded-for` 의 어느 값을 믿을지 — Y-2 에서 실측 (tech-stack-v2 §5.5) |
| SE-Q3 | `pgrst.db_pre_request` 를 Supabase 클라우드에서 설정할 수 있는지 (ERD v2 OQ-E1). 안 되면 IP 한도는 쓰기 RPC 안에서 `request.headers` 를 읽어 같은 방식으로 |
| SE-Q4 | 감시 예약 실행이 무료 프로젝트 일시정지를 막는 부수 효과 (RFC-0003 OQ-12) |
| SE-Q5 | CAPTCHA 를 켤 때 필요한 방침 문구를 출시 방침에 미리 넣을지 (tech-stack-v2 TS-Q6) |
| SE-Q6 | 출시 전 점검 기록의 위치와 형식 (`docs/08-qa/security-check.md` 제안) |
