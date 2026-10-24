# 운영 런북 · YUNABI (배포·롤백·사고 대응·복구·키 교체)

| | |
|---|---|
| 상태 | 1판 (2026-10-22), 2026-10-23 복구 리허설·2026-10-24 모의 실행(R-1·R-2·R-7 ②, 임시 프로젝트) 반영 — 절차 중 실제로 해 본 것은 `[해 봄]`, 아직 없는 장치에 기대는 것은 `[Y-4 이후]`·`[운영 저장소 이후]`, 확인 못 한 것은 `[미확인]` |
| 근거 | [RFC-0003](rfc/0003-yunabi-v2.md) §14·§15·§17.4~§17.7·§20 · [ADR-0022](../adr/0022-security-baseline.md) S3·S7·S9·S10·"결과" · [ADR-0020](../adr/0020-hosting-github-pages-actions.md) · [ADR-0025](../adr/0025-user-app-on-cloudflare-custom-domain.md) · [ERD v2](erd-v2.md) OQ-E1·E5·E6·E7·E8·E10 · [y3s-automated-checks](y3s-automated-checks.md) · `docs/session-handoff.md` (2026-10-22 실제 작업) |
| 형식 | 운영 런북 하나. 새 설계 결정 없음 — RFC-0003 §17.7 R-1~R-8 의 전문과 ADR-0022 "결과" 의 런북 범위(배포·롤백·복구·키 교체·CAPTCHA 켜기·관리자 추가·대량 숨김 복원)를 실행 절차로 옮긴다 |
| 실행자 | 책임자 1명(D25). 대리인 없음 |

**공개 저장소다.** 이 문서에는 관리자 이메일·UID, 예비 TOTP 비밀의 보관 장소, Cloudflare 계정·영역 ID, 기숙사 IP, 원 IP, 비밀값, 감시 기준의 실제 설정을 쓰지 않는다. 그런 값은 `<ADMIN_UID>` 같은 자리표시자(부록 B)로만 두고, 실제 값은 **비공개 운영 기록**(비공개 저장소 `yunabi-ops` 의 문서·이슈)에 둔다. 공개된 값은 프로젝트 ref `tsbipaffirkswsgkydav`, 콘솔 주소 `yunabi-admin.juha.dev`, 앱 주소 `yunabi.juha.dev`(ADR-0025, 아직 배포 전) 뿐이다.

`되돌릴 수 없음` 이 붙은 줄은 실행 전에 한 번 더 읽는다.

---

## 1. 증상 → 절차 색인

| 증상 | 먼저 볼 것 | 절차 |
|---|---|---|
| "신고로 숨김" 항목이 한꺼번에 늘었다 | §6.2 S-5 | **R-1** (§4.1) |
| 사용자가 첫 쓰기에서 "잠시 후 다시" 를 받는다, `signup_throttled` 증가 | §6.2 S-4 | **R-2** (§4.2) |
| `rate_limited_*` 증가, 429 신고 | §6.2 S-3 | **R-3** (§4.3) |
| `admin_denied` 증가, 내가 하지 않은 관리 조치가 기록에 있다 | §6.2 S-1·S-7 | **R-4** (§4.4) |
| `invalid_input`·`forbidden`·`not_owner` 급증 | §6.2 S-2 | §6.1 표 |
| 관리자 비밀번호를 모르겠다 / 재설정 메일이 안 온다 | — | **R-6** (§5.2) |
| 휴대폰(주 TOTP)을 잃었다 | — | **R-7** (§5.3) |
| CAPTCHA 를 켠 뒤 콘솔에 로그인이 안 된다 | — | §3.4 **즉시 끄기** |
| 앱·콘솔이 안 열린다, Supabase 가 응답하지 않는다 | §6.2 S-8 | §6.3 (일시정지면 재개) |
| 배포 직후 이상 | — | §8 롤백 |
| 데이터가 지워졌다·망가졌다, 프로젝트를 잃었다 | — | §9 복구 |
| 비밀값이 새었을 수 있다, gitleaks 가 진짜 값을 찾았다 | — | §10 키 교체 (**교체가 먼저**) |
| 2주 이상 자리를 비운다 | — | **R-8** (§5.4) |
| 정리 작업 실패 (보관 기간이 지켜지지 않음) | §6.2 S-9 | §6.2 S-9 아래 "기대값", 일시정지였다면 §6.1 사이트 가동 |

## 2. 처음 5분

1. **숨 고르기 — 자동 장치는 계속 돈다.** 신고 3건 자동 숨김, IP·계정·전역 한도, 정리 작업은 사람 없이 동작한다. 서두르다 되돌릴 수 없는 단계를 밟는 것이 더 위험하다.
2. **비공개 운영 저장소에 이슈를 하나 연다**(제목 = 시각 + 증상). 이후 모든 관찰·조치·원 IP 는 거기에만 적는다. 공개 저장소의 이슈·커밋에는 쓰지 않는다.
3. **콘솔에 로그인할 수 있는지 확인**(`https://yunabi-admin.juha.dev`). 안 되면 R-6/R-7 이 먼저다 — 관리 기능 없이는 R-1 을 할 수 없다.
4. **§6.3 의 "5분 점검"(§6.2 의 S-1·S-2·S-4·S-5·S-7 SQL)을 한 번 돌린다**(Supabase 대시보드 → SQL Editor, 읽기만). 어느 신호가 튀었는지 보고 §1 색인으로 간다.
5. **CAPTCHA 스위치를 켤지 정한다.** 켜기 전에 반드시 §3.1 사전 확인. 2026-10-22 현재 **배포된 콘솔에는 사이트 키가 없어 켜면 관리자가 잠긴다** — 이 상태에서는 켜지 않는다.

---

## 3. CAPTCHA 스위치 (Turnstile) — R-1·R-2·R-3·R-8 이 부르는 절차

근거: RFC-0003 §14 "스위치", ADR-0020 결정 3, ADR-0022 S7⑤. 기본 OFF(D20). 켜면 Supabase Auth 가 **익명 로그인과 관리자 비밀번호 로그인 모두**에 Turnstile 토큰을 요구한다.

### 3.1 사전 확인 — 하나라도 아니면 켜지 않는다

| # | 확인 | 방법 | 2026-10-22 상태 |
|---|---|---|---|
| C-1 | **배포된 콘솔에 사이트 키가 들어 있다** | 콘솔 로그인 화면에 Turnstile 확인 상자가 보인다. `src/admin/Login.tsx` 는 `VITE_TURNSTILE_SITE_KEY` 가 빌드에 있을 때만 위젯을 그린다. `npm run build:admin` 은 이 값을 요구하지 않으므로(`vite.admin.config.ts` 는 `VITE_SUPABASE_URL` 만 검사) **빠진 채로도 빌드·배포가 성공한다** | **없음.** 이 상태에서 켜면 관리자 로그인이 토큰 없이 거절되어 **관리자가 잠긴다**. Y-4 에서 키를 넣어 재배포할 때까지 켜지 않는다 |
| C-2 | 배포된 사용자 앱에 사이트 키가 들어 있다 | 앱은 서버가 CAPTCHA 를 요구할 때만 위젯을 띄운다(`src/actions/captcha.ts`, `src/ui/Captcha.tsx`). 사이트 키는 §7.3 에서 `VITE_TURNSTILE_SITE_KEY` 로 넣고, **`npm run build:deploy` 가 그 값이 `dist/assets/*.js` 에 있는지 확인해 없으면 실패한다**(`scripts/check-app-headers.mjs --deploy`) — 콘솔(C-1)과 달리 빠진 채로 배포되지 않는다 | v2 앱은 아직 배포 전(D23). 첫 배포(§7.3)부터 키가 들어간다 |
| C-3 | Turnstile 위젯의 허용 호스트 = 앱 호스트 `yunabi.juha.dev` 와 콘솔 `yunabi-admin.juha.dev` | Cloudflare 대시보드 → Turnstile → 위젯 → Hostname Management | **2026-10-24 위젯 생성** — 허용 호스트 3개(앱 옛 주소 `underthesun7213.github.io`·`yunabi.juha.dev`·콘솔). 앱이 `yunabi.juha.dev` 로 옮겨(ADR-0025) 옛 주소는 Pages 를 내려 404 다 — **책임자가 Turnstile 에서 `underthesun7213.github.io` 를 지워도 된다**(쓰는 페이지가 없다 — 허용 호스트는 필요한 것만 두는 편이 낫다). 사이트 키는 비공개 기록 |
| C-4 | Turnstile **비밀 키**가 Supabase 에 등록되어 있다(스위치는 끈 채로) | Supabase 대시보드 → Authentication 설정 → Attack Protection → 제공자 Turnstile, 비밀 키 입력 | 미등록 — Supabase 화면은 토글을 켜야 공급자·비밀 키 칸이 나타난다(2026-10-24 확인). 사이트 키 배포(C-1·C-2)와 함께 Y-4 에서 등록 |
| C-5 | 방침에 Turnstile 문구가 있다(TS-Q6 — 켜는 순간 Cloudflare 로 기기 신호가 간다) | 게시된 방침 확인 | Y-4 |

C-1~C-4 는 출시 전 점검(RFC §17.6 6번 "스위치 ON 상태에서 ① 사용자 첫 쓰기 ② 관리자 로그인")에서 한 번 켜고 끄며 확인해 둔다.

### 3.2 켜기

1. 콘솔에 **미리 로그인해 둔 탭을 하나 남긴다**(이미 있는 세션은 스위치의 영향을 받지 않는 것으로 *추정* — 잠겨도 끌 시간을 번다).
2. Supabase 대시보드 → Attack Protection → **Enable CAPTCHA protection ON** → 저장.
3. 비공개 이슈에 켠 시각을 적는다.

### 3.3 켠 뒤 확인 (5분 안에)

1. 새 시크릿 창에서 콘솔 로그인 → 확인 상자 통과 → TOTP → 대기열이 보인다.
2. 새 시크릿 창에서 앱 첫 쓰기(장소 등록) → 위젯이 뜨고 → 통과 뒤 저장된다. 확인용 항목은 바로 지운다.
3. 하나라도 실패하면 §3.4 로 즉시 끈다.

**켜도 끝나지 않는 것:** 이미 만들어진 익명 세션은 계속 쓴다. 스위치는 **새 익명 계정**만 막는다 — 공격 계정은 `admin_suspend`(콘솔 "Accounts" 탭, `supabase/migrations/20261013000150_rpc_admin.sql`)로 따로 멈춘다(R-1·R-3).

### 3.4 끄기 (되돌리기)

대시보드에서 같은 토글 OFF → 저장 → 시크릿 창에서 콘솔 로그인 확인 → 이슈에 시각 기록. 공격이 끝나고 **하루 동안 경보 신호가 잠잠하면** 끈다(R-1 ④).

---

## 4. 사고 대응 R-1 ~ R-4

공통: 콘솔 시각 입력은 **일본 시간(JST)**, SQL 의 `timestamptz` 리터럴에는 `+09` 를 붙인다. SQL 은 Supabase SQL Editor(역할 `postgres`)에서 실행한다.

### 4.1 R-1 대량 숨김 (대량 신고 공격) `[해 봄 2026-10-24 — 임시 프로젝트, "CAPTCHA 없이" 경로 2~5]`

**신호:** 자동 숨김이 1시간에 여럿(RFC §17.4 제안 기준 5건 초과), 신고 계정들이 같은 시간대에 생겼다.

1. CAPTCHA 켜기 — §3 (사전 확인 통과 시에만). **켤 수 없으면**(2026-10-22 현재 그렇다 — 콘솔에 사이트 키 없음) 아래 "CAPTCHA 없이" 경로로 2~5 를 한다.
2. 공격 계정 찾기 — 콘솔은 신고자를 보여 주지 않는다(Y-R9). 사고 조사에 한해 SQL 로 보고, 결과는 비공개 이슈에만 둔다.
   ```sql
   -- 읽기만. <공격 시작> 예: '2026-11-02 21:00+09'
   select a.ref, a.created_at, count(*) as reports
   from app.reports r join app.accounts a on a.user_id = r.reporter_id
   where r.created_at >= '<공격 시작>'::timestamptz
   group by a.ref, a.created_at
   order by reports desc;
   ```
3. 공격 계정 정지 — 콘솔 **Accounts** 탭에 `a-…` 를 넣고 "Suspend this account"(= `admin_suspend`). 정지된 계정의 미처리 신고는 더 이상 세지 않는다(M-2a — 모의 실행에서 미처리 신고 3건 중 1건이 정지 계정 것인 항목이 숨겨지지 않음을 확인). 계정마다 메모 "R-1 <이슈 번호>" — 모의 실행에서 비워 두었더니 나중에 왜 정지했는지 콘솔에 남지 않았다. 되돌리기: 같은 화면의 "Unsuspend"(`admin_unsuspend`). 정지·기각은 브라우저 확인 상자를 거친다 — 앱 안의 미리보기 창처럼 확인 상자를 막는 곳에서는 **눌러도 아무 일도 없다**(§12). 일반 브라우저에서 한다.
4. 일괄 복원 — 콘솔 **Queue** 탭 아래 "Restore after a wave of reports" 상자(`admin_restore_bulk`). From = 공격 시작, To = 지금 → **Preview** → 목록 확인 → "Restore these N". SQL 로 하지 않는다(미리보기 토큰·항목별 기록이 콘솔 경로에 있다). "The list changed since the preview" 가 나오면 다시 미리 보고 실행. 정지된 계정의 숨김 항목은 빠진다(정지 해제 뒤 하나씩 복원) — 모의 실행: 숨김 4건 중 3건 복원, 공격 계정 소유 1건은 숨김 유지. 확인: `select action, count(*) from app.mod_actions where created_at >= '<공격 시작>'::timestamptz group by 1;` 의 자동 숨김·정지·복원·기각 수가 한 일과 맞는지(모의: 4·3·3·1).
5. 남은 신고 — 보이는 항목에 쌓인 신고는 항목 상세에서 "Dismiss reports"(`admin_dismiss`).
6. 하루 뒤 S-5 가 잠잠하면 §3.4 로 스위치 OFF. 이슈 닫기.

**CAPTCHA 없이 (스위치를 켤 수 없을 때 — R-1·R-2 공통):** 새 계정 생성은 막을 수 없으므로 한도로 버티고 사람이 따라간다.
- 한도(`app.settings`)를 **올리지 않는다** — 올리면 공격 계정이 더 생긴다.
- 공격 계정 정지(R-1 2~3), 쓰기 0 계정 정리(R-2 ③), 콘솔 일괄 복원(R-1 4~5)을 공격이 이어지는 동안 되풀이한다.
- 매 회차의 시각·정지 수·복원 수·정리 수를 비공개 이슈에 남긴다.
- **"공격이 멈췄다" 판단:** §6.3 의 수동 점검을 **연속 3회(최소 반나절 간격)** 돌려 S-4·S-5(필요하면 S-2·S-3)가 공격 전 수준으로 돌아와 있으면 멈춘 것으로 본다. 그 뒤 하루는 하루 2회 점검을 유지한다. (횟수는 이 문서의 제안 — 경보가 생기면 다시 정한다.)

### 4.2 R-2 가입 한도 소진 `[해 봄 2026-10-24 — 임시 프로젝트: 한도 낮춤 → 한도+1 번째 가입 429 → ③ 정리 → 원복]`

**신호:** 최근 1시간 익명 생성이 전역 한도(`anon_signups_per_hour`)의 절반 이상, `security_events` 의 `signup_throttled`(훅이 가입을 거절해도 이 기록은 남는다 — 모의 실행 확인), 사용자의 "잠시 후 다시".

1. CAPTCHA 켜기 — §3. 자동화는 막히고 사람은 위젯을 통과한다. **켤 수 없으면** 2 를 건너뛰고(한도를 올리지 않는다) §4.1 끝의 "CAPTCHA 없이" 경로로 3 을 되풀이한다.
2. **CAPTCHA 로 공격이 막힌 뒤에만** 전역 한도를 잠시 올린다. 먼저 지금 값을 읽어 이슈에 적는다.
   ```sql
   select key, int_value from app.settings where key in ('accounts_per_hour', 'anon_signups_per_hour');
   -- 올리기 (예: 둘 다 400)
   update app.settings set int_value = 400 where key in ('accounts_per_hour', 'anon_signups_per_hour');
   ```
   `anon_signups_per_hour` 는 가입 훅(`app.hook_before_user_created`), `accounts_per_hour` 는 첫 쓰기의 앱 계정 생성 상한(`require_writer`)이다. **되돌리기:** 처음 읽은 값으로 키마다 `update app.settings set int_value = <원래 값> where key = '<키>';` (기본값은 둘 다 200 — `20261013000030_settings_version.sql`).
3. 쓰기 0 인 익명 계정 정리(선택) — 정리 함수는 없다. 앱 계정 행은 첫 쓰기·신고 때만 생기므로 "앱 계정 없음 = 쓰기 0" 이다.
   ```sql
   -- 먼저 세기 (읽기만)
   select count(*) from auth.users u
   where u.is_anonymous
     and u.created_at between '<시작>'::timestamptz and '<끝>'::timestamptz
     and not exists (select 1 from app.accounts a where a.user_id = u.id)
     and not exists (select 1 from app.admins d where d.user_id = u.id);
   ```
   **되돌릴 수 없음** — SQL Editor 는 칸의 문장을 한 번에 실행해 중간에 멈출 수 없다. 그래서 같은 삭제를 **먼저 `rollback` 으로 미리 보고**, 숫자가 맞을 때만 `commit` 으로 다시 실행한다 `[해 봄 2026-10-24 — SQL Editor 에서 begin/rollback 이 적용됨, 결과 창에는 마지막 select 가 보임]`:
   ```sql
   -- (가) 미리 보기: 결과 창의 left_after_delete 가 0 이어야 한다
   begin;
   delete from auth.users u
   where u.is_anonymous
     and u.created_at between '<시작>'::timestamptz and '<끝>'::timestamptz
     and not exists (select 1 from app.accounts a where a.user_id = u.id)
     and not exists (select 1 from app.admins d where d.user_id = u.id);
   select count(*) as left_after_delete from auth.users u
   where u.is_anonymous
     and u.created_at between '<시작>'::timestamptz and '<끝>'::timestamptz
     and not exists (select 1 from app.accounts a where a.user_id = u.id)
     and not exists (select 1 from app.admins d where d.user_id = u.id);
   rollback;
   ```
   (나) 위의 "먼저 세기" 를 다시 돌려 **처음 센 수 그대로**인지 본다(되돌려졌다는 확인). (다) (가)의 `rollback;` 을 `commit;` 으로 바꿔 실행하고 "먼저 세기" 가 0, `select count(*) from app.accounts;` 가 줄지 않았는지 본다. `<끝>` 은 (가)~(다)에서 **같은 고정 시각**으로 쓴다(`now()` 를 쓰면 그사이 생긴 계정까지 지운다 — 모의 실행은 `now()` 로 했고, 고정 시각은 해 보지 않은 권고다). 지워진 기기는 다음 쓰기 때 새 익명 계정을 받는다(가진 항목이 없으므로 잃는 것 없음).
4. 스위치 OFF(§3.4)와 한도 원복을 같은 날 하지 않는다 — 한도를 먼저 되돌리고 하루 본 뒤 스위치를 끈다.

### 4.3 R-3 쓰기 폭주

**신호:** `rate_limited_account` 급증, 또는 `ip_hits` 에서 한 키가 연속 창에서 한도에 닿음(S-3). IP 한도의 429 는 예외로 되돌려져 **`security_events` 에 남지 않는다**(ERD v2 OQ-E1) — IP 쪽은 `ip_hits` 로만 본다.

1. 어느 계정·키인지 본다(§6.2 S-3 SQL). 계정이 보이면 `ref` 를 얻는다.
   ```sql
   select a.ref, e.kind, count(*) from app.security_events e join app.accounts a on a.user_id = e.user_id
   where e.at > now() - interval '1 hour' and e.kind in ('rate_limited_account', 'suspended_write')
   group by 1, 2 order by 3 desc;
   ```
2. 원 IP 가 필요하면 Supabase 대시보드 → Logs(API/Edge). `ip_hits` 는 솔트 해시뿐이다. **원 IP 는 비공개 이슈에만** 붙인다.
3. IP 를 막는 장치는 없다(WAF 없음 — ADR-0022 대안 표). 쓸 수 있는 것: 계정 정지(`admin_suspend`, 콘솔 Accounts), 새 계정 생성을 막는 CAPTCHA(§3).
4. 기숙사 범위가 한도에 걸린 것이면 공격이 아니다 — `ip_tiers` 등록 여부를 본다(`select range, tier from app.ip_tiers;` — 결과를 공개 저장소에 붙이지 않는다).

### 4.4 R-4 관리자 의심 로그인

**신호:** `admin_denied` 급증(콘솔 진입 때의 `admin_whoami` 거절만 기록됨), 또는 하루 요약에 내가 하지 않은 조치. 콘솔을 거치지 않은 `admin_*` 직접 호출 거절은 DB 에 남지 않고 API 로그에만 있다(ERD v2 OQ-E7).

1. 무엇이 일어났나 — 콘솔 **Log** 탭(`admin_audit_log`), 또는:
   ```sql
   select detail, count(*) from app.security_events where kind = 'admin_denied' and at > now() - interval '24 hours' group by 1;
   select created_at, action, target_kind, target_id, account_ref, note from app.mod_actions
   where actor_kind = 'admin' and created_at > now() - interval '7 days' order by id desc;
   ```
   Supabase 대시보드 → Logs(Auth) 에서 관리자 로그인 시각·IP 를 본다(원 IP 는 비공개 이슈에만).
2. **관리자 비밀번호 교체** — §5.2 의 스크립트(`updateUserById`). 콘솔에는 비밀번호 변경 화면이 없다.
3. **모르는 요소 지우기** — 세션을 끊기 전에 `node admin.mjs factors`(§5.2)로 요소 목록을 본다. 내가 등록한 2개(이름·추가 날짜) 말고 다른 요소가 있으면 공격자가 추가한 것이다 → `node admin.mjs delete <그 id>` — **되돌릴 수 없음**(그 요소는 다시 살릴 수 없고, 모든 세션이 로그아웃된다).
4. **세션 끊기** — 첫째 방법 ⓑ, 안 되면 ⓐ.
   - ⓑ (먼저) SQL: `delete from auth.sessions where user_id = '<ADMIN_UID>';` — 요소는 그대로 둔다. `app.admin_refusal` 이 세션 행의 존재를 검사하므로 남은 액세스 토큰으로도 `admin_*` 가 즉시 거절된다. 클라우드 프로젝트에서 `postgres` 의 `auth.sessions`·`auth.mfa_factors`·`auth.users` DELETE 권한 확인됨(2026-10-22). 끝나면 새 비밀번호 + TOTP 로 다시 로그인.
   - ⓐ (다음) 검증된 TOTP 요소 하나를 지우면 그 사용자의 **모든 세션이 로그아웃**된다(Supabase 공식 문서, RFC §17.7 R-7). §5.2 스크립트의 `delete` — **되돌릴 수 없음**(요소를 다시 등록해야 한다). 곧바로 남은 요소로 로그인해 재등록.
5. **TOTP 재등록** — 콘솔 **Security** 탭에서 새 요소 추가 → 옛 요소 "Remove". 다시 2개(주 + 예비).
6. 비밀값이 새었다고 의심되면 §10 의 secret 키 교체도.
7. 낯선 조치가 있었다면 그 항목을 되돌린다(복원 `admin_restore`, 정지 해제 `admin_unsuspend`). `mod_actions` 는 추가 전용이라 기록은 남는다.

---

## 5. 관리자 계정 R-5 ~ R-8

### 5.1 R-5 관리자 계정 만들기 `[해 봄 2026-10-22]`

D25 로 두 번째 관리자는 없다. 이 절차는 계정을 다시 만들 때(R-7 ③, 복구 뒤 새 프로젝트)와 대리인을 둘 때(OQ-19)만 쓴다.

1. 초대 행 (SQL Editor):
   ```sql
   insert into app.admin_invites (email) values ('<ADMIN_EMAIL>');
   ```
2. 대시보드 → Authentication → Users → **Add user** → 이메일·비밀번호, **Auto Confirm User** 체크. 2026-10-22 에는 이 경로에서 Auth 로그에 가입 훅 기록이 없었다(Admin API 경로는 훅을 부르지 않는 것으로 보임 — OQ-E5. 훅은 보조 장치라 영향 없음).
3. 만들어진 사용자의 **UID 를 Users 목록에서 복사**해 연결한다. 이메일로 찾아 연결하지 않는다:
   ```sql
   select app.bind_admin('<ADMIN_UID>', '<ADMIN_EMAIL>');
   ```
   예외별: `admin_bind_no_invite`(1번 누락) · `admin_bind_invite_used` · `admin_bind_no_user` · `admin_bind_rejected`(익명·미확인·이메일 불일치·초대 전에 만든 계정) · `admin_bind_conflict`(같은 이메일의 다른 사용자 — 익명 전환 흔적을 조사·삭제 후 재시도).
4. **그 자리에서** 콘솔에 로그인해 TOTP 2개 등록(첫 로그인 화면 "Set up two authenticators"): 주 = 휴대폰 앱, 예비 = 화면의 키(비밀)를 휴대폰 밖에, 비밀번호 금고와도 다른 곳에 보관. 보관 수단과 장소는 비공개 기록에만 적는다.
   - **권장:** 등록과 확인이 끝나면 예비 항목을 휴대폰 앱에서 지운다. 휴대폰에 주·예비가 함께 있으면 휴대폰을 도난당했을 때 두 요소가 한꺼번에 넘어간다.
   - 휴대폰에 남겨 두기로 하면 그것은 책임자의 결정이다 — 그 위험을 받아들였다는 것을 비공개 기록에 남긴다.
5. R-7 ① 모의 실행: 로그아웃 → 로그인 화면 "Which authenticator will you use?" 에서 예비를 골라 로그인. 확인: `select factor_id, created_at, verified_at from auth.mfa_challenges order by created_at desc limit 3;`

### 5.2 R-6 비밀번호 직접 교체 (재설정 메일이 안 옴)

책임자 결정(2026-10-22, RFC §17.6a PL-2): **사용자 SMTP 를 두지 않는다.** 기본 SMTP 의 발신 한도가 익명 이메일 연결 요청에 소모될 수 있으므로 재설정 메일 대신 secret 키로 바꾼다. 대시보드에서 비밀번호를 직접 지정하는 기능은 확인하지 못했다.

**어디서:** 책임자가 신뢰하는 PC 의 터미널 **한 곳**, 저장소 밖의 빈 임시 폴더. secret 키를 브라우저·파일·셸 기록에 남기지 않는다. 가능하면 이 작업용 secret 키를 대시보드(API Keys)에서 새로 만들고 끝나면 지운다.

**도우미는 의존성이 없다** (Node 18+ 내장 `fetch` 만, `npm install` 없음) `[해 봄 2026-10-23 — 리허설 프로젝트에서]`. 이유:

- `@supabase/supabase-js@2.117.3` 은 **Node 20 에서 요청을 보내기도 전에 실패**한다 — realtime 모듈이 네이티브 `WebSocket`(Node 22)을 요구한다. 2026-10-23 리허설에서 이 때문에 막혔다.
- 새 형식 secret 키(`sb_secret_…`)는 **`apikey` 헤더에만** 넣는다. `Authorization: Bearer` 에도 넣으면 Auth 가 `401 Invalid API key` 를 돌려준다. Bearer 는 JWT 형식 레거시 키(`eyJ…`)일 때만.
- `EXPECT_REF` 에 **어느 프로젝트인지** 직접 적게 하고, `SB_URL` 에 그 ref 가 없으면 멈춘다 — 다른 프로젝트(리허설·옛 프로젝트)에 잘못 쏘지 않게.

```powershell
mkdir $env:TEMP\yunabi-break-glass; cd $env:TEMP\yunabi-break-glass
# Windows PowerShell 5.1 (이 PC): -AsSecureString 으로 받아 평문으로 바꾼다 (-MaskInput 은 PowerShell 7 전용)
$env:EXPECT_REF = 'tsbipaffirkswsgkydav'   # 복구 뒤라면 새 프로젝트의 ref
$env:SB_URL = 'https://tsbipaffirkswsgkydav.supabase.co'
$s = Read-Host 'secret key' -AsSecureString
$env:SB_SECRET = [Net.NetworkCredential]::new('', $s).Password
$env:ADMIN_UID = Read-Host 'admin UID'
node admin.mjs key   # 길이와 앞 10자만 — 붙여 넣기가 잘렸는지 확인
```

`admin.mjs` (같은 폴더):

```js
// Dependency-free (Node 18+ fetch). supabase-js 2.117 fails on Node 20 before
// sending anything (realtime needs a native WebSocket).
const need = (k) => {
  if (!process.env[k]) {
    console.error(`${k} is empty — stopping`);
    process.exit(1);
  }
  return process.env[k];
};
const url = need('SB_URL').replace(/\/$/, '');
const ref = need('EXPECT_REF');
if (!url.includes(ref)) {
  console.error(`SB_URL does not contain ${ref} — stopping`);
  process.exit(2);
}
const secret = need('SB_SECRET');
const uid = need('ADMIN_UID');
// sb_secret_… keys go only in apikey; Bearer only for legacy JWT keys (eyJ…).
const headers = {
  apikey: secret,
  ...(secret.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
  'Content-Type': 'application/json',
};
const call = async (method, path, body) => {
  const r = await fetch(`${url}/auth/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: r.status, json };
};
const why = (r) => `HTTP ${r.status} ${r.json?.msg ?? r.json?.message ?? ''}`;
const [step, arg] = process.argv.slice(2);
if (step === 'key') {
  console.log('key length', secret.length, 'starts with', secret.slice(0, 10));
} else if (step === 'password') {
  const r = await call('PUT', `/admin/users/${uid}`, { password: need('NEW_PW') });
  if (r.status !== 200 || r.json?.id !== uid) {
    console.error('NOT changed:', why(r));
    process.exit(1);
  }
  console.log('password changed for', r.json.id);
} else if (step === 'factors') {
  const r = await call('GET', `/admin/users/${uid}/factors`);
  if (r.status !== 200) {
    console.error(why(r));
    process.exit(1);
  }
  console.log((r.json ?? []).map((f) => [f.id, f.friendly_name, f.status, f.created_at]));
} else if (step === 'delete' && arg) {
  const r = await call('DELETE', `/admin/users/${uid}/factors/${arg}`);
  if (r.status !== 200) {
    console.error(why(r));
    process.exit(1);
  }
  console.log('factor deleted — all sessions signed out');
} else {
  console.error('usage: node admin.mjs key | password | factors | delete <factor id>');
  process.exit(1);
}
```

```powershell
$p = Read-Host 'new password' -AsSecureString
$env:NEW_PW = [Net.NetworkCredential]::new('', $p).Password
node admin.mjs password
Remove-Item Env:SB_SECRET, Env:NEW_PW, Env:ADMIN_UID, Env:EXPECT_REF; Remove-Variable s, p
```

확인: 콘솔에 새 비밀번호 + TOTP 로 로그인. 끝나면 임시 폴더를 지우고, 임시 secret 키를 만들었다면 대시보드에서 지운다.

### 5.3 R-7 TOTP 기기 분실

- **① 예비가 있다** `[해 봄 2026-10-22 — 모의 실행 성공]`: 콘솔 로그인 → "Which authenticator will you use?" 에서 예비 선택 → **Security** 탭 → 새 기기에 "Add an authenticator" → 잃은 요소 "Remove". 다시 2개.
- **② 예비도 없다 (break-glass)** `[해 봄 2026-10-24 — 임시 프로젝트에서 1~4 전부: 비밀번호 교체 → 요소 2개 → 삭제 ×2 → 0개 → 열려 있던 콘솔 탭은 목록을 다시 불러오자 곧바로 로그인 화면으로 → 새 비밀번호 로그인 → TOTP 2개 재등록 → aal2]` (2026-10-23 리허설은 요소가 0개인 복원 사용자라 3번 없이). §5.2 와 같은 터미널에서(변수 설정까지 하고, `Remove-Item` 정리는 맨 끝에) 이 순서로, 몇 분 안에 끝낸다(요소가 0개인 동안은 비밀번호를 아는 사람이 먼저 등록할 수 있다 — T-03a):
  1. `node admin.mjs password` — **비밀번호부터** 바꾼다.
  2. `node admin.mjs factors` — 요소 id 확인.
  3. `node admin.mjs delete <factor id>` — 요소마다. **되돌릴 수 없음**(지운 요소는 살릴 수 없다). 모든 세션이 로그아웃된다.
  4. 곧바로 콘솔에 새 비밀번호로 로그인 → TOTP 2개 재등록. **3번 전에 콘솔 로그인 화면을 새 탭에 열어 둔다.** 모의 실행: 삭제 → 첫 재등록(요소 0개인 위험 창, T-03a) 약 11분 55초, 삭제 → 두 번째 등록까지 12분 43초. 대부분 로컬 콘솔을 다시 켜는 시간이었고, 등록 두 개 사이는 25초. 확인: `node admin.mjs factors` 에 verified 2개(새 id).
  5. 기록: 메모만 남기는 관리 함수는 없다. 비공개 이슈에 "MFA 재설정" 을 적고, 다음 관리 조치의 메모에도 남긴다.
- **③ Supabase 계정 접근까지 잃었다:** Supabase 지원 절차. 그동안 관리 기능은 없지만 자동 숨김·한도·정리는 계속 돈다. 이 계정의 2단계 인증과 복구 코드가 마지막 근거다(부록 A).

### 5.4 R-8 책임자 부재 (휴가·병가)

부재 전: ① 경보 메일이 휴대폰으로 오는지(`[운영 저장소 이후]` — 그 전에는 경보가 없다, §6) ② 2주 이상이고 학기 초가 아니면 CAPTCHA 를 미리 켤지 — §3.1 사전 확인을 통과할 때만 ③ 문의 페이지의 응답 기간 문구("보통 7일", `legal.replyTime`)가 부재 기간과 맞는지.
돌아와서: Queue 탭 "Hidden"·"Reported" 처리, §6.2 의 S-5(자동 숨김)를 부재 기간 전체로 보고 R-1 흔적 확인, Dependabot·ZAP 결과 확인.

---

## 6. 감시

### 6.1 경보 → 절차 대응표

**현행: 경보는 없다.** 설계(RFC §17.4)의 비공개 운영 저장소 `yunabi-ops` 의 `monitor.yml`(30분마다 `public.ops_health()` → 기준 초과 시 그 저장소에 이슈 → 메일)이 아직 없다 `[운영 저장소 이후]`. 그때까지는 §6.3 주기로 손으로 본다. 기준값은 RFC §17.4 의 **제안값**이고, 실제 설정은 운영 저장소에 둔다. 감시가 읽는 것은 `ops_health()` 2판의 숫자다(§6.2 표).

| RFC §17.4 신호 | 제안 기준 (RFC §17.4) | 점검 SQL (§6.2) | 넘으면 |
|---|---|---|---|
| 관리자 조치 — 일일 요약 | 모든 조치 | S-7 | 모르는 조치가 있으면 **R-4** |
| 권한 거절(`forbidden`, `not_owner`, 관리 거절 `admin_denied`) | 1시간 50건 초과 | S-2, S-1 | `admin_denied` → **R-4**. `forbidden`·`not_owner` 급증 → 같은 계정이면 정지(`admin_suspend`), 넓게 퍼졌으면 **R-3** 처럼 계정·키를 본다 |
| 형식 오류 `invalid_input` 급증 (퍼징 징후) | 1시간 100건 초과 | S-2 | 서버가 거절만 하므로 즉시 위험은 없다. 계정이 보이면 정지, 쓰기 폭주와 겹치면 **R-3** |
| 빈도 초과 (`rate_limited_account`, `ip_hits` 한도 창) | 1시간 100건 초과, 또는 한 IP 키가 3개 창 연속 한도 | S-3 | **R-3** |
| 익명 계정 생성 · 가입 한도 접근 | 전역 한도의 50% | S-4 | **R-2** |
| 자동 숨김 | 1시간 5건 초과 | S-5 | **R-1** |
| 사용량 (DB 크기·egress) | 무료 한도 70% (주간 수동) | S-6 + 대시보드 Usage | 원인 확인 → 계속 오르면 Pro 전환 결정(tech-stack-v2 **TS-Q7**) |
| 사이트 가동 (앱·콘솔·Supabase) | 실패 시 | S-8 | Supabase 가 **일시정지**면 대시보드에서 Restore → 재개 뒤 S-9 로 정리 작업 확인. 앱·콘솔이면 §8 |

### 6.2 신호별 SQL (모두 읽기만)

**`ops_health()` 2판** (`supabase/migrations/20261013000210_ops_health_signals.sql`, 결과에 `"version": 2`)이 §6.1 의 신호를 숫자로 한 번에 준다. 1판(`20261013000160_ops.sql`)의 불일치 — 자동 숨김이 24시간 창뿐, `accounts_1h` 가 익명 `auth.users` 가 아님, `ip_windows_at_limit_1h` 에 시간 조건이 없고 기숙사 창도 기본 한도로 셈, 0 인 종류는 키가 빠짐 — 는 2판에서 고쳤다. **운영 DB 에 210 이 적용되기 전에는 1판이므로** `select public.ops_health() -> 'version';` 이 `2` 가 아니면 아래 SQL 로 본다. 2판에서도 아래 SQL 은 원인 조사용으로 그대로 쓴다(어느 키·계정인지는 `ops_health` 가 주지 않는다).

| 신호 | `ops_health` 2판의 키 | SQL |
|---|---|---|
| 권한 거절·형식 오류·가입 제한 | `security_1h.<종류>`, `security_24h.<종류>` (8종, 0 채움) | S-1 S-2 |
| 빈도 초과 | `security_1h.rate_limited_account`, `ip_1h.default_windows_at_limit`·`dorm_windows_at_limit`, `ip_1h.default_keys_3_windows`·`dorm_keys_3_windows` (지난 1시간, 등급별 한도) | S-3 |
| 익명 계정 생성 | `anon_users_1h` / `limits.anon_signups_per_hour`, `accounts_1h` / `limits.accounts_per_hour` | S-4 |
| 자동 숨김 | `auto_hides_1h`, `auto_hides_24h` | S-5 |
| DB 크기 | `db_bytes` | S-6 |
| 관리자 조치 | `admin_actions_by_kind_24h.<종류>`, `reports_open_over_24h` | S-7 |
| 정리 작업 | `cron.jobs`·`succeeded_24h`·`failed_24h`; `cron.unreadable = 1` 이면 권한 때문에 못 읽은 것 → S-9 를 SQL Editor 에서 | S-9 |

`ip_1h.dorm_ranges_not_rebuilt` 가 0 이 아니면 `ip_tiers` 에 너무 넓은 기숙사 범위(IPv4 `/22`·IPv6 `/64` 보다 넓음)가 있어 그 창이 기본 한도로 판정되고 있다 — 범위를 좁힌다. `ops_health` 는 `stable` 이라 감시 작업은 **GET** 으로 불러야 한다(POST 면 PostgREST 가 읽기 전용으로 돌려 `db_pre_request` 의 기록이 실패).

```sql
-- S-1 S-2  보안 이벤트 종류별, 1시간 / 24시간
select kind, count(*) filter (where at > now() - interval '1 hour') as h1, count(*) as h24
from app.security_events where at > now() - interval '24 hours' group by kind order by h1 desc;

-- S-3  IP 창: 지난 1시간 기본 한도에 닿은 창, 같은 키가 3개 창 이상 (기숙사 키도 기본 한도로 센다 — 등급별은 ops_health 의 ip_1h)
select encode(ip_key, 'hex') as key, count(*) as windows, max(n) as max_n
from app.ip_hits where n >= app.setting('ip_writes_per_5min') and window_start > now() - interval '1 hour' group by ip_key
having count(*) >= 3 order by windows desc;   -- having 을 빼면 한 번이라도 닿은 키 전부

-- S-4  익명 Auth 사용자 생성 (훅 한도와 같은 기준) vs 앱 계정 생성
select (select count(*) from auth.users where is_anonymous and created_at > now() - interval '1 hour') as anon_users_1h,
       (select count(*) from app.accounts where created_at > now() - interval '1 hour') as app_accounts_1h,
       app.setting('anon_signups_per_hour') as anon_limit, app.setting('accounts_per_hour') as account_limit;

-- S-5  자동 숨김, 1시간 / 24시간
select count(*) filter (where created_at > now() - interval '1 hour') as h1, count(*) as h24
from app.mod_actions where action = 'auto_hide' and created_at > now() - interval '24 hours';

-- S-6  DB 크기 (무료 한도 500 MB 의 70% ≈ 350 MB — tech-stack-v2 §5.5)
select pg_size_pretty(pg_database_size(current_database()));

-- S-7  관리자 조치 일일 요약 — 내가 한 것과 맞는지
select action, target_kind, count(*), min(created_at), max(created_at)
from app.mod_actions where actor_kind = 'admin' and created_at > now() - interval '24 hours' group by 1, 2;

-- S-9  정리 작업 (보관 기간 — 개인정보, 20261013000180_jobs.sql)
select j.jobname, d.status, max(d.start_time) as last_run
from cron.job j left join cron.job_run_details d on d.jobid = j.jobid and d.start_time > now() - interval '3 days'
where j.jobname like 'yunabi-%' group by 1, 2 order by 1, 2;
```

**S-8 가동:** 앱 주소, `https://yunabi-admin.juha.dev`, Supabase 대시보드의 프로젝트 상태(Paused 여부), status.supabase.com. 무료 프로젝트는 1주 비활동이면 일시정지되고 그동안 pg_cron 도 멈춘다(tech-stack-v2 B-4). 정리 조건은 모두 시각 기준이라 재개 뒤 첫 실행이 따라잡는다.

**S-9 기대값:** 작업 4개(`yunabi-purge-deleted`·`-past-events`·`-records`·`-inactive`) 모두 `succeeded`, `yunabi-purge-records` 는 매시. `failed` 가 있으면 `select start_time, return_message from cron.job_run_details where status <> 'succeeded' order by start_time desc limit 20;`

### 6.3 수동 점검 주기 (`monitor.yml` 이 생길 때까지)

| 언제 | 무엇 |
|---|---|
| 매일 1회 | S-1·S-2·S-4·S-5·S-7 (5분 점검) |
| 학기 초·공지 직후 1주 | 하루 2회 + S-3 |
| 매주 월요일 | S-6 + 대시보드 Usage, S-9, §11 의 주간 작업 |
| 경보가 생긴 뒤 | 경보 시험(가짜 이벤트로 비공개 이슈 생성 — RFC §17.6 6번)을 하고 이 표를 "경보 확인" 으로 줄인다 |

---

## 7. 배포

순서는 **DB 마이그레이션 → 사용자 앱·관리자 콘솔**(ADR-0020 결정 5). 배포할 커밋은 `main` 에서 CI(`ci.yml`)가 초록인 것만. 배포 산출물은 `dist/`(`npm run build:deploy` 로 만든 것)·`dist-admin/` 뿐이다 — `dist-e2e*` 에는 테스트 핸들이 있어 절대 올리지 않는다. wrangler 설정이 둘이다: 콘솔 `wrangler.jsonc`(`dist-admin/`), 사용자 앱 `wrangler.app.jsonc`(`dist/`) — 앱은 **항상 `-c wrangler.app.jsonc`**(§12).

### 7.1 DB 마이그레이션 `[해 봄 2026-10-22 — 수동]`

`[Y-4 이후]` 에는 `main` 전용 Environment(필수 검토자)의 승인 단계가 같은 명령을 돌린다. 그 전까지는 책임자 PC 에서:

1. 연결 주소: 대시보드 → Connect → **Session pooler** 의 URI(비밀번호 포함). 직접 연결 주소는 IPv6 전용이라 IPv4 회선에서는 Session pooler 를 쓴다(*일반 지식*). Supabase CLI 는 `package.json` 에 없으니 따로 설치한 것을 쓴다.
2. 주소는 화면에 남기지 않고 받는다:
   ```powershell
   $s = Read-Host 'Session pooler URI' -AsSecureString   # Windows PowerShell 5.1
   $env:DB_URL = [Net.NetworkCredential]::new('', $s).Password; Remove-Variable s
   supabase db push --db-url $env:DB_URL --dry-run   # 적용될 파일 목록만
   supabase db push --db-url $env:DB_URL
   ```
3. 출력 확인: `20261013000200_checks.sql` 에서 `check 9: default EXECUTE this role cannot change, accepted (OQ-E10)` **notice 는 정상**이다(이미 적용된 DB 에서는 200 이 다시 돌지 않는다). `20261013000210_ops_health_signals.sql` 은 끝에서 자기 효과를 검사해 어긋나면 `ops_health v2: …` 예외로 실패한다. `check N … failed` 예외가 나면 그 마이그레이션은 실패한 것이다 — 고쳐서 다시 push 하고, 운영에서 SQL 로 우회하지 않는다.
4. 적용 확인:
   ```sql
   select version, name from supabase_migrations.schema_migrations order by version desc limit 5;
   ```
5. `Remove-Item Env:DB_URL`.

**새 마이그레이션의 규칙 (출시 후):** 파일 이름은 마지막 것보다 뒤의 타임스탬프. 새 함수면 `set search_path = ''`, 스키마를 붙인 이름, 잘못된 입력은 `{status:'invalid', field}` 반환, POST 로 부르면 `stable` 금지, `admin_*` 는 첫 문장 `perform app.require_admin();`, 권한 부여, `…_checks.sql` 허용 목록 갱신(CLAUDE.md). **운영에서는 이미 적용된 `200_checks` 가 다시 돌지 않는다** — push 뒤 갱신된 `20261013000200_checks.sql` 의 내용을 SQL Editor 에서 한 번 실행해(읽기만 하는 `do` 블록) 통과를 확인한다. 이 방식을 규칙으로 굳힐지는 열린 질문 1.

### 7.2 관리자 콘솔 `[해 봄 2026-10-22 — 수동]`

`[Y-4 이후]` 에는 `deploy.yml` 이 `CLOUDFLARE_API_TOKEN`(`production` Environment)으로 배포한다(ADR-0022 T-10 "배포는 CI 에서만"). 2026-10-22 의 첫 배포는 수동이었다. 그 전까지:

```powershell
cd <저장소 루트>          # wrangler.jsonc 가 있는 곳 — 아래 함정 참고
git status                # 깨끗해야 한다 (배포물 = 커밋)
npm ci
$env:VITE_SUPABASE_URL = 'https://tsbipaffirkswsgkydav.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = Read-Host 'publishable key'
$env:VITE_TURNSTILE_SITE_KEY = Read-Host 'Turnstile site key'   # Y-4 부터. 비우면 CAPTCHA 를 켤 수 없다 (§3.1 C-1)
npm run build:admin       # 비밀값·헤더 검사 포함
npx wrangler@4.86.0 deploy
Remove-Item Env:VITE_SUPABASE_URL, Env:VITE_SUPABASE_PUBLISHABLE_KEY, Env:VITE_TURNSTILE_SITE_KEY
```

- **경고:** CAPTCHA 스위치가 **켜져 있는 동안** 사이트 키를 비운 채 콘솔을 배포하면, 새 콘솔에는 위젯이 없어 **관리자가 잠긴다.** 배포 전에 스위치 상태를 보고, 켜져 있으면 키를 반드시 넣는다(또는 먼저 §3.4 로 끈다).

- **`wrangler@4.86.0` 고정 이유:** 책임자 PC 의 Node 가 20 이라 그 위에서 돈 버전으로 고정했다(2026-10-22). 저장소는 Node 22 이상(`package.json` `engines`) — **Node 22 로 올리는 것을 권한다.** 올리면 고정을 풀지 다시 본다.
- **함정:** `wrangler.jsonc` 가 없는 폴더에서 `wrangler deploy` 를 돌리면 자동 설정 마법사가 `package.json`·`vite.config` 를 고친다. 그랬다면 배포하지 말고 `git status` → `git checkout -- package.json vite.config.ts` 로 되돌린다.
- **확인:** `curl -sI https://yunabi-admin.juha.dev/` 에 `Content-Security-Policy`(`frame-ancestors 'none'`, `connect-src` = 이 프로젝트 + `https://challenges.cloudflare.com`), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Cache-Control: no-store` → 실제 로그인(aal2) → Queue 가 열린다.

### 7.3 사용자 앱 `[Y-4 — 아직 안 해 봄]`

주소 `https://yunabi.juha.dev/`, Cloudflare Workers 정적 자산 `yunabi`(ADR-0025, 설정 `wrangler.app.jsonc`). v2 앱은 아직 운영 배포 전이다(D23). 첫 배포는 콘솔(§7.2)처럼 **책임자 PC 에서 수동**, 단 **main 에 병합된 커밋에서**. `[Y-4 이후]` 의 `deploy.yml`(B-13)은 같은 명령을 `production` Environment 에서 돌린다. 빌드 변수는 `YUNABI_ORIGIN` 과 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY` 뿐(ADR-0022 S2) — 셋 다 공개값이지만 화면·기록에 남기지 않고 받는다.

**배포 전 (처음 한 번, 그 뒤로는 영역 설정을 바꿨을 때):**

- **0a. `juha.dev` 영역에서 HTML 에 스크립트를 끼워 넣는 기능이 꺼져 있다.** Cloudflare 대시보드에서 Bot Fight Mode / JavaScript detections(`/cdn-cgi/challenge-platform/…`), Rocket Loader, Web Analytics 자동 삽입, Email Obfuscation 을 본다. 콘솔은 `script-src 'self'` 라 이런 스크립트가 통과했지만, 앱은 `https://yunabi.juha.dev/assets/` 로 한정해 **CSP 위반**이 된다(§12). 켜져 있으면 `yunabi.juha.dev` 만 제외하는 Configuration Rule 을 만든다.
- **0b. `yunabi.juha.dev` 에 DNS 레코드가 없다.** 있으면 custom domain 생성이 실패한다. 첫 배포 때 Cloudflare 가 레코드와 인증서를 만든다(발급까지 몇 분). 2026-10-24 NXDOMAIN.

**배포:**

```powershell
# 저장소 폴더
git switch main; git pull --ff-only
git status --short          # 비어 있어야 한다 (배포물 = 커밋)
npm ci
$env:YUNABI_ORIGIN = 'https://yunabi.juha.dev/'
$env:VITE_SUPABASE_URL = 'https://tsbipaffirkswsgkydav.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = Read-Host 'publishable key'
$env:VITE_TURNSTILE_SITE_KEY = Read-Host 'Turnstile site key'
npm run build:deploy        # 빌드 + 헤더 검사 + 배포 판 검사 — 실패하면 배포하지 않는다
npx wrangler@4.86.0 deploy -c wrangler.app.jsonc
Remove-Item Env:YUNABI_ORIGIN, Env:VITE_SUPABASE_URL, Env:VITE_SUPABASE_PUBLISHABLE_KEY, Env:VITE_TURNSTILE_SITE_KEY
```

- `build:deploy` = `npm run build`(번들 예산·비밀값·헤더 검사) + `node scripts/check-app-headers.mjs dist --deploy`. 배포 판 검사는 CSP 출처가 `https://yunabi.juha.dev/`, `connect-src` 에 진짜 `https://<ref>.supabase.co`(`example` 아님 — fixture 판·`build:local` 판 차단), publishable 키(`sb_publishable_`)와 Turnstile 사이트 키가 `dist/assets/*.js` 에 있음, e2e 청크·손잡이 `__yunabi` 없음을 확인한다(`.assetsignore` 의 `.vite` 는 항상 판 검사). 키가 빠지면 앱은 빌드되지만 읽기가 전부 401 이므로 이 검사가 막는다.
- PowerShell 의 `$env:` 는 `build:deploy` 안의 `npm run build` 에 이어진다(`build:local` 의 `VAR=1 cmd` 형식이 아니라 Windows 에서도 동작).
- **`-c wrangler.app.jsonc` 를 빼지 않는다** — 빼면 `wrangler.jsonc`(콘솔)가 쓰인다(§12).
- 사이트 키를 넣어도 Turnstile 위젯은 서버가 요구할 때만 뜬다(스위치 OFF 동안 영향 없음, §3.1 C-2).

**배포 뒤 확인** (e2e·ZAP 는 `vite preview` 위라 `_headers` 를 보지 못한다 — 아래가 유일한 확인이다):

1. `curl -sI https://yunabi.juha.dev/` 에 `Content-Security-Policy`(`frame-ancestors 'none'`, `script-src https://yunabi.juha.dev/assets/ …`, `connect-src` = `https://yunabi.juha.dev/` + 이 프로젝트 + `https://challenges.cloudflare.com`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`(`geolocation=(self)`), `Cross-Origin-Opener-Policy: same-origin`, `Cache-Control: no-cache`. `curl -sI https://yunabi.juha.dev/sw.js` 도 `no-cache`. `curl -sI https://yunabi.juha.dev/.vite/manifest.json` 은 **404**.
2. 일반 브라우저 창에서 열고: 콘솔 오류·CSP 위반 **0**(개발자 도구 콘솔), 지도 타일이 보임, "내 주위"(위치 허용), 지도·달력 데이터(읽기), **오프라인 새로 고침**(개발자 도구 Network → Offline → 새로 고침 — Workers 의 `/index.html` → `/` 리디렉션과 Workbox 사전 캐시가 맞물리는지는 이것으로만 확인된다). 쓰기 스모크를 하면(시크릿 창 첫 쓰기) 바로 지운다.
3. `curl -sI http://yunabi.juha.dev/` 가 https 로 리디렉션된다(Cloudflare "Always Use HTTPS" — 영역 전체 설정).
4. 결과를 점검 기록에 남긴다: §7 "실제 주소 CSP 위반 0", B-15(Always Use HTTPS + HSTS 실측), R-f. 기록은 **새 브랜치 + PR** 로(main 은 PR 필수).

하나라도 어긋나면 §8 롤백.

---

## 8. 롤백

| 대상 | 방법 | 주의 |
|---|---|---|
| 관리자 콘솔 | `npx wrangler@4.86.0 deployments list` → `npx wrangler@4.86.0 rollback`(직전 버전) — 이 프로젝트에서 실행해 본 적 없음 `[미확인]`. 대안: 이전 커밋을 체크아웃해 §7.2 를 다시 | 콘솔 세션은 `sessionStorage` 라 다시 로그인 |
| 사용자 앱 `[Y-4 — 아직 안 해 봄]` | `npx wrangler@4.86.0 deployments list -c wrangler.app.jsonc` → `npx wrangler@4.86.0 rollback -c wrangler.app.jsonc`(직전 버전) `[미확인]`. 대안: 이전 main 커밋을 체크아웃해 §7.3 을 다시. **`-c` 를 빼면 콘솔을 되돌린다** | 새 서비스워커가 다시 설치된다. 사용자는 "업데이트" 를 눌러야 적용. 되돌린 뒤 §7.3 확인 1~3 |
| DB | **앞으로만.** 되돌리는 **새 마이그레이션**을 쓴다(§7.1 규칙 그대로 — 권한 부여·checks 허용 목록 포함). 되돌리는 스크립트("teardown")는 없다 | 열·표를 지우는 SQL 은 마이그레이션 안에 그대로 쓰고 그 줄에 `-- 되돌릴 수 없음` 을 단다. 데이터가 망가졌으면 §9 |

---

## 9. 백업·복구 (RFC §17.5, ADR-0022 S9)

**현행:** 무료 플랜이라 플랫폼 백업은 없다. 대신 비공개 저장소 `yunabi-ops` 의 `backup.yml` 이 **주 1회** 자동으로 덤프한다(2026-10-23 가동): §9.1 과 같은 범위의 데이터 전용 덤프 두 개(`app.dump`·`auth.dump`, Postgres **custom 형식** `-Fc`)를 tar 하나로 묶어 `age` 로 암호화하고, 그 저장소의 아티팩트로 **90일** 보관한다. 제외해야 할 표가 들어 있으면 작업이 실패한다. 일정·키·실행 기록은 그 저장소에만 있다. 위험한 마이그레이션 전에는 그 작업을 수동으로 한 번 돌리거나 §9.1 을 한다. 복구 순서(§9.2)는 **2026-10-23 임시 무료 프로젝트에 리허설했다** — 백업 아티팩트에서 관리자 aal2 로그인까지 **약 49분**(목표 RTO 4시간). 기록은 비공개 저장소에.

### 9.1 덤프 (수동, 자동 백업과 같은 범위·형식)

```bash
# DB_URL: Session pooler URI. pg_dump 버전은 서버 이상이어야 한다(서버 17 → pg_dump 17).
# -n 과 -t 는 함께 쓰면 -n 이 무시되므로 덤프 두 개.
pg_dump "$DB_URL" -Fc --data-only --schema=app \
  --exclude-table-data=app.salts --exclude-table-data=app.ip_hits --exclude-table-data=app.write_log \
  --exclude-table-data=app.prefectures --exclude-table-data=app.data_version -f app.dump
pg_dump "$DB_URL" -Fc --data-only -t auth.users -t auth.identities -f auth.dump
# 확인: 제외한 표의 데이터가 목록에 없어야 한다 (둘 다 0)
{ pg_restore -l app.dump; pg_restore -l auth.dump; } | grep -c "TABLE DATA auth sessions\|TABLE DATA app salts"
tar cf - app.dump auth.dump | age -r <AGE_PUBLIC_KEY> -o yunabi-<YYYYMMDD>.tar.age
rm app.dump auth.dump
```

제외: `app.salts`·`app.ip_hits`·`app.write_log`(가명 처리·최소화 — 솔트가 없으면 남은 해시를 못 되돌린다), `app.prefectures`·`app.data_version`(마이그레이션이 채움 — 리허설에서 확인), `auth` 의 세션·토큰·`mfa_factors`·`mfa_challenges`·`one_time_tokens`·`flow_state`·`audit_log_entries`(덤프하지 않는다). 확인 `grep` 이 0 이 아니면 암호화하지 말고 덤프 명령을 고친다.

### 9.2 복구 순서 `[해 봄 2026-10-23 — 리허설 프로젝트에서, 약 49분]`

1. **새 프로젝트**를 같은 조직에 도쿄 리전으로 만든다 `[해 봄 2026-10-23]`. 옛 프로젝트는 확인이 끝날 때까지 지우지 않는다(지우면 **되돌릴 수 없음**, 그리고 Vercel 연동 리소스도 같이 지워진다 — 부록 A). API·MCP 로 만들면 DB 비밀번호를 아무도 모른다 → 대시보드에서 **영문·숫자만**으로 재설정하고 1~3분 기다린다(§12).
2. **마이그레이션 적용** `[해 봄 2026-10-23 — 22개 한 번에 통과]` — §7.1 을 새 프로젝트의 Session pooler 로, **저장소 폴더에서**. check ⑨ notice 는 정상.
3. **pg_cron 작업 확인** `[해 봄 2026-10-23 — 4개]` — `select jobname, schedule, active from cron.job where jobname like 'yunabi-%';` 4개. 없으면 `pg_cron` 이 없던 것이다(`20261013000180_jobs.sql` 은 있을 때만 예약) → 확장을 켜고 그 파일 끝의 `do $$ … end $$;` 블록을 **통째로** 실행(네 `cron.schedule` 이 그 안에 있다 — `perform` 줄만 떼어 내면 실행되지 않는다).
4. **복원** `[해 봄 2026-10-23 — restore: committed]` — `yunabi-ops` 의 아티팩트(암호화 파일)를 내려받아 빈 폴더에 둔다. 복호화부터 복원까지 **Docker 컨테이너 안에서** 한다: 평문은 컨테이너의 `tmpfs`(메모리)에만 생기고 호스트 디스크에는 남지 않는다. Windows PowerShell 5.1 의 파이프는 바이너리를 깨뜨리므로(`age | tar` 를 호스트에서 하지 않는다) 이 방식이 필요하다. 트리거를 끈 채 한 트랜잭션으로 넣는다(Supabase 의 복원 안내와 같은 방식) — 오류가 나면 아무것도 남지 않는다.

   `restore.sh` (같은 폴더, 컨테이너 안에서 실행):

   ```sh
   #!/bin/sh
   # Runs INSIDE postgres:17.11. Mounted read-only: /in/backup.tar.age, /in/key.
   # Decrypted bytes go only to /w (tmpfs). ONE transaction: on error nothing stays.
   set -eu
   : "${EXPECT_REF:?EXPECT_REF is empty}"
   case "${NEW_DB_URL:-}" in
     *"$EXPECT_REF"*) ;;
     *) echo "NEW_DB_URL does not contain $EXPECT_REF; stopping." >&2; exit 2 ;;
   esac
   apt-get -qq update >/dev/null && apt-get -qq install -y age >/dev/null
   age --version
   age -d -i /in/key /in/backup.tar.age | tar -x -C /w
   ls -l /w
   { pg_restore -f - /w/auth.dump; pg_restore -f - /w/app.dump; } |
     psql "$NEW_DB_URL" --single-transaction -v ON_ERROR_STOP=1 \
       -c 'delete from app.settings' \
       -c 'set session_replication_role = replica' \
       -f -
   echo "restore: committed"
   ```

   ```powershell
   # PowerShell 에서 (Git Bash 는 볼륨 경로를 바꾼다 — 쓰려면 MSYS_NO_PATHCONV=1)
   $env:EXPECT_REF = '<새 프로젝트 ref>'
   $u = Read-Host 'NEW_DB_URL (Session pooler)' -AsSecureString
   $env:NEW_DB_URL = [Net.NetworkCredential]::new('', $u).Password
   docker run --rm --tmpfs /w -e NEW_DB_URL -e EXPECT_REF `
     -v "$PWD\yunabi-<YYYYMMDD-HHMM>.tar.age:/in/backup.tar.age:ro" `
     -v "<AGE_PRIVATE_KEY_FILE>:/in/key:ro" `
     -v "$PWD\restore.sh:/in/restore.sh:ro" `
     postgres:17.11@sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe `
     sh /in/restore.sh
   Remove-Item Env:NEW_DB_URL; Remove-Variable u
   ```

   `-e NEW_DB_URL` 처럼 **이름만** 넘긴다(값이 명령줄·셸 기록에 남지 않는다). 이미지는 다이제스트로 고정한다. `app.settings` 는 마이그레이션의 기본값을 지우고 덤프의 값(조정한 한도 포함)으로 채운다.

   리허설에서 확인한 것: 호스팅 Supabase 의 `postgres` 에게 `set session_replication_role = replica` 와 `auth.users`·`auth.identities` 쓰기가 **허용된다**. 열 불일치 없음, 행 수가 운영과 같고 고아 행 0, **시퀀스도 운영 값으로 복원**된다(새 행이 다음 id 를 받는다).
5. **checks 다시 실행** `[해 봄 2026-10-23 — 통과]` — `20261013000200_checks.sql` 내용을 SQL Editor 에서 실행, 통과.
6. **대시보드 Auth 설정을 다시 한다**(프로젝트 설정은 덤프에 없다) `[해 봄 2026-10-23]`. 바꾼 뒤 **저장**을 눌렀는지 다시 연다 — 리허설에서 익명 로그인 토글을 저장하지 않아 한 번 더 켰다:
   - 익명 로그인 ON
   - 이메일 공개 가입 OFF (RFC §17.6 6번 — 익명 로그인이 계속 되는지 함께 확인)
   - 가입 훅 Before User Created = Postgres 함수 `app.hook_before_user_created`
   - MFA TOTP **Enabled**
   - 익명 로그인 한도 **150/시간**
   - Data API 노출 스키마 = **`public` 만**
   - CAPTCHA: Turnstile 비밀 키 등록, 스위치는 옛 프로젝트와 같은 상태(보통 OFF)
   - 레거시 키 비활성, 프로젝트 멤버 = 책임자 1명
7. **`ip_tiers`** — 덤프에 들어 있으면 `select count(*) from app.ip_tiers;` 로 확인만. 없으면 비공개 기록의 값으로: `insert into app.ip_tiers (range, tier, note) values ('<DORM_CIDR>', 'dorm', '<메모>');`
8. **`xff_trusted_hops` 다시 재기** — 2026-10-22 과 같은 방법(요청마다 다른 가짜 `X-Forwarded-For` 를 붙인 쓰기 61번 → 61번째 429 면 1 유지, ERD v2 OQ-E8). 시험으로 만든 사용자·데이터는 지운다.
9. **주소·키 교체** `[해 봄 2026-10-23 — 리허설에서는 배포하지 않고 로컬 미리보기(별도 출력 폴더)로 스모크: 공개 뷰 4개 200, 초대 없는 이메일 403, 익명 가입 → 장소 등록 → my_items]` — 새 URL·publishable 키로 사용자 앱과 **콘솔을 다시 빌드·배포**(콘솔 CSP `connect-src` 에 프로젝트 URL 이 빌드 때 박힌다 — §7.2). `yunabi-ops` 의 secret 키·DB 주소 비밀값도 새 프로젝트 것으로.
10. **관리자 TOTP 재등록** `[해 봄 2026-10-23 — 요소 0개 → 비밀번호 먼저 → TOTP 2개 → aal2]` — `mfa_factors` 는 덤프에 없어 요소가 0개다. 비밀번호를 아는 사람이 먼저 등록할 수 있으므로 §5.2 로 **비밀번호를 먼저 바꾸고** 곧바로 콘솔에서 2개 등록. `app.admins` 는 같은 UID 로 복원되어 `bind_admin` 은 다시 할 필요가 없다.
11. **사용자 영향:** 세션이 모두 끊겨 익명 사용자는 새 계정을 받고 **옛 항목을 고칠 수 없게 된다**(OQ-E6, RFC OQ-18). 손실은 마지막 덤프 이후(최대 7일 — OQ-13). 공지가 필요하면 문의 페이지·앱 공지로.
12. 비공개 이슈에 시각·덤프 날짜·확인 결과를 남긴다. 옛 프로젝트 삭제는 1주 뒤 따로 정한다(**되돌릴 수 없음**).

---

## 10. 키 교체

**gitleaks 가 진짜 비밀을 찾았거나 유출이 의심되면: 교체가 먼저, 정리는 그 뒤.** 이력 재작성·허용 목록으로 덮는 것은 교체 없이는 의미가 없다(y3s-automated-checks §1.4). CI 로그는 `--redact` 라 값이 찍히지 않는다.

| 키 | 바꾸는 곳 | 그다음 갱신할 곳 | 영향·순서 |
|---|---|---|---|
| Supabase **secret 키** (`sb_secret_…`) — 운영 저장소 감시·백업이 쓰는 키 포함 | 대시보드 API Keys → 새 secret 키 만들기 | `yunabi-ops` 의 비밀값 → 작업 한 번 실행해 확인 → **옛 키 삭제**(되돌릴 수 없음) | 새 키를 넣기 전에 옛 키를 지우면 감시·백업이 멈춘다 |
| Supabase **publishable 키** | 대시보드 API Keys → 새 publishable 키 | 앱·콘솔 다시 빌드·배포(§7) → 설치된 앱이 갱신될 시간을 두고 옛 키 삭제(**되돌릴 수 없음**) | 옛 키를 먼저 지우면 갱신 안 된 설치본이 끊긴다 |
| 레거시 `anon`/`service_role` JWT 키 | 대시보드 → 비활성 확인 | — | 점검 항목: 비활성이어야 한다 |
| **DB 비밀번호** | 대시보드 Database 설정 → 비밀번호 재설정 | GitHub `production` Environment 의 DB 주소 `[Y-4 이후]`, `yunabi-ops` 백업 비밀값 | 바꾸는 동안 진행 중인 `db push`·덤프는 실패 |
| **Turnstile 비밀 키** | Cloudflare → Turnstile → 위젯 → 비밀 키 교체 | Supabase Attack Protection 의 비밀 키 | 스위치가 켜져 있으면 갱신 전까지 로그인·첫 쓰기가 실패 — 끈 상태에서 |
| **Turnstile 사이트 키** | 새 위젯(허용 호스트 §3.1 C-3) | `VITE_TURNSTILE_SITE_KEY` 로 앱·콘솔 다시 빌드·배포, Supabase 비밀 키도 새 위젯 것으로 | 공개값이라 유출 대응은 필요 없다. 위젯을 바꿀 때만 |
| **관리자 비밀번호** | §5.2 (`node admin.mjs password`) | 비밀번호 금고 | — |
| **관리자 TOTP** | 콘솔 Security (추가 → 제거) | 예비 비밀의 보관 장소 | 늘 2개 유지 |
| **Cloudflare API 토큰** (Workers 배포 권한만) | Cloudflare → My Profile → API Tokens → 교체 | GitHub `production` Environment 의 `CLOUDFLARE_API_TOKEN` `[Y-4 이후]`. 로컬은 `npx wrangler@4.86.0 logout` → `login` | — |
| **GitHub Environment 비밀값** | 저장소 Settings → Environments → `production` | — | 필수 검토자 설정이 그대로인지 함께 본다 |
| **`age` 키** | `age-keygen -o <새 개인 키 파일>` | `yunabi-ops` 의 공개 키 | 옛 개인 키는 옛 아티팩트가 만료(90일)될 때까지 보관, 그 뒤 폐기(**되돌릴 수 없음**) |
| 계정 비밀번호·2단계 인증 (Supabase·GitHub·Cloudflare·Vercel) | 각 서비스 | 복구 코드 보관 | 부록 A |

---

## 11. 정기 작업

| 주기 | 작업 | 확인 |
|---|---|---|
| 매일 | §6.3 5분 점검, Queue 의 "Hidden"·"Reported" | — |
| 주 1회 (월) | 무료 플랜 사용량(DB 크기·egress·MAU) 70% 미만 | 대시보드 Usage, S-6 |
| 주 1회 (월) | ZAP 주간 실행(`zap.yml`, 월 03:00 JST) 결과 — 높음 0 | Actions 요약 |
| 주 1회 (월) | Dependabot PR(월 06:00 JST, npm·actions 묶음) — CI 초록이면 병합 | `ci.yml` |
| 주 1회 (월) | 정리 작업 실행 기록 S-9 (보관 기간은 개인정보 약속이다) | 4개 `succeeded` |
| 분기 1회 | ZAP 이미지 다이제스트 갱신 — Dependabot 이 안 한다. 레지스트리에서 `ghcr.io/zaproxy/zaproxy:stable` 의 다이제스트를 읽어 `zap.yml` 의 `ZAP_IMAGE` 와 주석의 날짜를 바꾼다 | 수동 실행 초록 |
| 분기 1회 | gitleaks 버전 확인 — 새 릴리스면 `ci.yml` 의 `GITLEAKS_VERSION` 과, 같은 릴리스의 checksums 파일에서 읽은 `GITLEAKS_SHA256` 을 함께 바꾼다 | CI 초록 |
| 분기 1회 | `20261013000200_checks.sql` 운영 재실행, `pg_default_acl` 에 새 `supabase_admin` 기본 권한 없는지(OQ-E10) | 통과 |
| 분기 1회 | 네 계정의 2단계 인증·복구 코드, 프로젝트 멤버 = 1명, 콘솔 로그인으로 예비 TOTP 확인 | 부록 A |
| 학기 시작 전 | `ip_tiers` 등록·주소 확인(PL-1), CAPTCHA 사전 확인 §3.1 | — |

**advisor 의 의도된 예외 — 고치지 않는다:** "RLS 켜졌으나 정책 없음"(app 표 전부 — 설계상 클라이언트 표 권한 0), "security definer 뷰"(공개 뷰 4개), "definer 함수 실행 가능"(공개 RPC). 특히 security definer 뷰의 **Resolve 를 누르지 않는다** — 공개 뷰가 막힌다.

---

## 12. 알려진 함정

| 함정 | 어떻게 |
|---|---|
| CAPTCHA 를 켰더니 관리자가 잠김 | 콘솔 빌드에 사이트 키가 없으면 그렇게 된다. §3.1 C-1 |
| `wrangler deploy` 가 `package.json`·`vite.config` 를 고침 | 설정 파일 없는 곳에서 돌린 것. 저장소 루트에서만, §7.2 |
| **wrangler 설정이 둘** — `wrangler.jsonc`(콘솔 `yunabi-admin`, `dist-admin/`)와 `wrangler.app.jsonc`(사용자 앱 `yunabi`, `dist/`) | `-c` 없는 `wrangler deploy`·`rollback`·`deployments list` 는 **콘솔**에 걸린다. 사용자 앱은 **항상 `-c wrangler.app.jsonc`**, 산출물은 `npm run build:deploy` 의 것만(§7.3) |
| Cloudflare 영역 기능이 앱 HTML 에 스크립트를 끼워 넣어 CSP 위반 (앱이 안 뜨거나 콘솔 오류) | Bot Fight Mode / JavaScript detections, Rocket Loader, Web Analytics 자동 삽입, Email Obfuscation. 앱 CSP 는 `script-src` 를 `https://yunabi.juha.dev/assets/` 로 한정해 콘솔(`'self'`)보다 엄격하다 — 콘솔에서 문제없던 설정도 앱을 깬다. `yunabi.juha.dev` 만 제외하는 Configuration Rule(§7.3 0a) |
| 최신 wrangler 가 Node 20 에서 안 돎 | `wrangler@4.86.0` 고정. Node 22 권장 |
| `db push` 의 check ⑨ notice | 정상(OQ-E10 수용 위험). 예외만 실패 |
| 감시 작업이 `ops_health` 를 POST 로 부름 | `stable` 함수라 실패. GET 으로 |
| 콘솔 시각과 SQL 시각이 다름 | 콘솔은 JST. SQL 리터럴에 `+09` |
| `juha.dev` 의 HTTP 응답 | 점검 항목: Cloudflare 의 "Always Use HTTPS" 가 켜져 있는가(`http://yunabi-admin.juha.dev`·`http://yunabi.juha.dev` 가 HTTPS 로 리디렉션되는가). `.dev` 는 HSTS preload 라 브라우저는 영향이 작다 |
| `npm audit` 가 dev 의존성 때문에 실패 | 의도된 것(`--omit=dev` 없음, ADR-0022 S6). 업데이트로 해결 |
| 옛 Supabase 프로젝트를 지움 | Vercel 리소스도 함께 지워진다. 되돌릴 수 없음 |
| DB 비밀번호에 특수문자 → `db push`·`psql` 인증 실패 | 연결 URI 가 깨진다. **영문·숫자만**(길게)으로 재설정 (2026-10-23) |
| 비밀번호 재설정 직후에도 옛 비밀번호처럼 실패 | pooler 반영에 **1~3분** 걸린다. 기다렸다가 다시 |
| `supabase db push` 가 마이그레이션을 못 찾음 | **저장소 폴더에서** 실행한다(`supabase/migrations` 기준) |
| API·MCP 로 새로 만든 프로젝트의 DB 비밀번호 | 아무도 모른다. 대시보드에서 **먼저 재설정** |
| Auth 설정을 바꿨는데 그대로임 (예: 익명 로그인) | 토글 뒤 **저장**을 누르지 않은 것. 다시 열어 확인 |
| break-glass 도우미가 Node 20 에서 요청 전에 멈춤 / `401 Invalid API key` | supabase-js 대신 §5.2 의 fetch 도우미. `sb_secret_…` 키는 `apikey` 헤더에만 |
| 콘솔의 정지·기각을 눌러도 아무 일이 없음 | 브라우저 확인 상자(`confirm`)가 막힌 창(앱 안 미리보기 등). 일반 브라우저에서 (2026-10-24) |
| SQL Editor 에 여러 문장을 넣었는데 결과가 하나만 보임 | 마지막 `select` 의 결과만 보인다. 확인용 `select` 를 맨 끝에 둔다(§4.2 ③) |

---

## 13. 2026-10-22 에 실제로 한 것 (`docs/session-handoff.md`)

- 마이그레이션 20개를 책임자가 `supabase db push --db-url`(Session pooler, 주소는 `Read-Host` 로 받고 **dry-run 먼저**)로 적용. 첫 push 가 `200_checks` ⑨ 에서 실패 → ⑨ 를 "바꿀 수 있는 역할만 실패, 나머지는 notice" 로 고친 뒤 통과(`2ff2ed3`).
- 대시보드 Auth: 익명 로그인 ON, 익명 로그인 한도 150, 가입 훅 `app.hook_before_user_created`, TOTP, Data API 노출 = `public` 만.
- 클라우드 확인: 61번째 쓰기 429, 가짜 XFF 무시(`xff_trusted_hops = 1`), GraphQL 꺼짐, 익명 가입에도 훅 호출·초대 없는 이메일 403, `postgres` 가 `auth.sessions` 를 읽고, `auth.sessions`·`auth.mfa_factors`·`auth.users` 를 지울 수 있음. 시험 데이터는 지웠다.
- 관리자: 초대 → "Add user"(Auto Confirm) → `bind_admin`(**UID 로**) → 콘솔에서 TOTP 2개(주 = 휴대폰 앱, 예비 = 휴대폰 밖에 보관한 비밀 — 보관 방식은 비공개 기록) → **R-7 ① 모의 실행 성공**. R-7 ② 는 운영에서는 하지 않았다(임시 프로젝트 모의 실행 2026-10-24, §5.3).
- 콘솔: `npm run build:admin` → `npx wrangler@4.86.0 deploy` **수동** 배포, 헤더 실측, 실제 주소에서 aal2 로그인. 사이트 키 없이 빌드됨(§3.1 C-1).

---

## 부록 A. 계정 지도 (값 없음)

| 계정 | 쥐고 있는 것 | 잃으면 |
|---|---|---|
| **Supabase** (조직 → 프로젝트 `tsbipaffirkswsgkydav` "yunabi", 도쿄) | DB·Auth·API 키·대시보드 설정·로그. R-6·R-7 ② 의 secret 키를 꺼내는 곳 | 관리 기능 복구 수단 전부. R-7 ③ |
| **Vercel** | Supabase 조직이 Vercel 과 연동되어 있다 — 프로젝트를 지우면 Vercel 쪽 리소스도 지워진다. **Vercel 계정도 Supabase 로 가는 열쇠 중 하나**다 | Supabase 접근이 흔들릴 수 있다. 2단계 인증 필수 |
| **GitHub** (`underthesun7213`) | 공개 저장소·CI·`production` Environment 비밀값, 비공개 `yunabi-ops`(감시·백업·운영 기록) `[운영 저장소 이후]`. 앱은 더 이상 GitHub Pages 에 두지 않는다(ADR-0025 — 옛 Pages 2곳은 2026-10-24 내림) | 코드·CI·감시·백업 |
| **Cloudflare** | 도메인 `juha.dev`(등록 + DNS), Workers `yunabi`(사용자 앱 `yunabi.juha.dev`)·`yunabi-admin`(콘솔), Turnstile 위젯, API 토큰 | **사용자 앱**·콘솔 주소와 CAPTCHA — 잃으면 앱과 콘솔이 함께 멈춘다 |
| 관리자 Auth 사용자 (Supabase 프로젝트 안) | 콘솔 권한(`app.admins`) — 비밀번호 + TOTP 2개 | R-6·R-7 |
| 메일함 | 경보 이슈 알림 `[운영 저장소 이후]`, 각 계정 복구 | 경보를 못 받는다 |

원칙: 네 서비스 계정 모두 2단계 인증 + 복구 코드(PL-4 는 세 계정을 적었으나 Vercel 도 같은 급이다). 복구 코드·예비 TOTP 비밀·비밀번호는 서로 다른 곳에, 그 위치는 비공개 기록에만. 장기 부재·연락 두절 때 누가 이어받는지는 정해지지 않았다(OQ-20).

## 부록 B. 자리표시자

| 표시 | 뜻 | 실제 값이 있는 곳 |
|---|---|---|
| `<ADMIN_EMAIL>`, `<ADMIN_UID>` | 관리자 이메일·Auth 사용자 id | 비공개 기록, 대시보드 Users |
| `<DORM_CIDR>` | 기숙사 공인 IP/CIDR (D28) | 비공개 기록, `app.ip_tiers` |
| `<AGE_PUBLIC_KEY>`, `<AGE_PRIVATE_KEY_FILE>` | 백업 암호화 키 | `yunabi-ops`, 책임자만 |
| `<공격 시작>`, `<시작>`, `<끝>` | JST 시각, `'YYYY-MM-DD HH:MM+09'` | 비공개 이슈 |
| `DB_URL`, `NEW_DB_URL` | Session pooler URI(비밀번호 포함) | 대시보드 Connect, 셸 변수로만 |

---

## 열린 질문

| # | 질문 | 관련 |
|---|---|---|
| 1 | 출시 후 새 마이그레이션의 checks 재실행 방식 — 지금은 "200 파일을 고치고 운영에서 수동 재실행"(§7.1). 새 마이그레이션 끝에 checks 블록을 복사해 두는 규칙으로 바꿀지 | CLAUDE.md, ERD v2 §8 |
| 2 | 대시보드에서 한 사용자의 세션을 끊는 경로(무료 플랜) — R-4 는 SQL(ⓑ, 권한 확인됨 2026-10-22)과 요소 삭제(ⓐ)로 충분하므로 낮은 우선순위 | R-4 |
| 3 | `wrangler rollback` 을 이 프로젝트에서 한 번 시험할지 | §8 |
| 4 | ~~복구 순서(§9.2) 리허설~~ — 2026-10-23 끝남: `auth.users` 복원 권한·`session_replication_role` 허용, 제외 표 문제 없음(§9.2 4번) | RFC §17.6 6번, OQ-E6 |
| 5 | ~~R-7 ② break-glass 요소 삭제~~ — 2026-10-24 임시 프로젝트에서 1~4 전부 끝남(§5.3 ②) | PL-3 |
| 6 | 경보가 생기기 전까지의 수동 주기(§6.3)를 받아들일지, 출시를 `monitor.yml` 뒤로 둘지 | RFC §17.4, PL-5 |
| 7 | 메모만 남기는 관리 기록 수단이 필요한지(R-7 ② 의 "MFA 재설정" 기록) — 지금은 비공개 이슈로 대신 | RFC §17.7 R-7 |
| 8 | 책임자 PC 를 Node 22 로 올리고 wrangler 고정을 풀지 | §7.2 |
