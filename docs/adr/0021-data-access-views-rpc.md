# ADR-0021 · 테이블은 노출하지 않는 스키마에 두고, 읽기는 공개 뷰, 쓰기는 정의자 RPC 로만 한다

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-YUNABI v2.3 Y-A5, Y-M8, Y-M9, Y-K8, Y-R9, Y-C4, Y-P2, Y-S1, Y-S5, Y-S12 |
| 관련 | [ERD v2 §1·§5·§7](../architecture/erd-v2.md), [RFC-0003 §13](../architecture/rfc/0003-yunabi-v2.md), [ADR-0001](0001-structural-anonymity.md)(부분 재사용), [erd.md](../architecture/erd.md)(교훈), ADR-0018 |

## 배경

"화면을 거치지 않은 요청도 같은 규칙으로 거절"(Y-A5, Y-S1)하려면 규칙이 데이터 계층에 있어야 한다. 규칙에는 길이·형식뿐 아니라 계정 빈도 제한, 정지 여부, 멱등 토큰, 좌표 → 도도부현 판정, 신고 후 자동 숨김이 포함된다 — RLS 정책 식만으로는 표현하기 어렵다. 등록자·신고자는 다른 사용자에게 보이면 안 된다(Y-M9, Y-R9). Supabase 는 2026-05-30 이후 새 프로젝트에서 `public` 의 새 테이블을 자동 노출하지 않는다(공식 토론·체인지로그).

## 결정

1. 모든 테이블은 **`app` 스키마**에 두고 Data API 노출 스키마에 넣지 않는다. `anon`·`authenticated` 에 `app` 의 권한은 없다. RLS 는 모두 켜고 정책은 두지 않는다(권한이 실수로 생겨도 0행).
2. **읽기 = `public` 의 정의자 뷰**(`places_public`, `events_public`, `event_occurrences_public`, `prefecture_counts`). 공개 열만(소유자·토큰·숨김 열 없음), 공개 조건만, 날짜는 일 단위. 뷰는 사용자 정의 함수를 부르지 않는다.
3. **쓰기 = `public` 의 정의자 RPC.** 순서: 세션 → 정지 → 빈도(사용자 advisory 잠금) → 멱등 → 형식 → 소유 → 쓰기 → 신고면 재평가. 소유자는 `auth.uid()` 로만. `set search_path = ''`, 동적 SQL 금지.
4. **소유는 별도 테이블**(`place_owners`, `event_owners`) — ADR-0001 결정 1 재사용. 계정이 지워지면 소유 행만 사라지고 장소는 남는다(Y-P5).
5. **거절과 형식 오류는 모두 기록 + 상태 반환**(erd.md §6 의 "실패해도 남아야 하는 기록" 교훈). 형식 오류도 `{status:'invalid', field}` — 예외로 던지면 `db_pre_request` 의 IP 카운트까지 롤백되어 잘못된 입력 공격이 IP 한도를 피한다 `[보안 검토 #7]`. 예외는 예상 밖 오류와 **관리 권한 실패**(실패 안전 — ADR-0018)에만. 소유가 아닌 항목·없는 항목·삭제된 항목은 모두 `not_found`.
5a. **반복해 부르는 읽기 전용 RPC 는 GET:** `data_version`, `my_items` 는 `stable` 이고 GET 으로 부른다. `db_pre_request` 는 쓰기 RPC 경로만 센다 — 첫 판은 30초 폴링이 POST 라 기숙사 NAT 뒤 몇 명의 폴링이 IP 쓰기 한도를 다 써 600명 전원이 429 를 받는 결함이 있었다 `[보안 검토 #1, critical]`.
6. 마지막 마이그레이션이 권한을 전부 회수 후 다시 주고, `checks` 마이그레이션이 RLS·권한·EXECUTE 허용 목록·`search_path`·동적 SQL·뷰 열 목록을 검사해 어긋나면 실패한다(ADR-0001 결정 4 재사용). **회수 대상에 `PUBLIC` 을 포함한다**: Postgres 는 함수 EXECUTE 를 기본으로 `PUBLIC` 에 주고 Supabase 는 `postgres`·`supabase_admin` 의 기본 권한을 두므로, `anon`·`authenticated` 만 회수하면 `anon` 이 쓰기 RPC·`ops_health` 를 그대로 부를 수 있다. `revoke execute on all functions … from public` + `alter default privileges for role postgres … revoke execute on functions from public`, 검사는 `has_function_privilege` 로 `public`·`anon`·`authenticated` 모두 `[보안 검토 #2, critical]`.
7. 헬퍼(`require_writer`, `require_admin`, `pref_of` 등)에는 EXECUTE 를 주지 않는다(`PUBLIC` 포함) — RLS 정책이 없고 정의자 함수 안에서만 부르므로 필요 없다(erd.md 에서 헬퍼 EXECUTE 가 필요했던 이유가 사라짐).

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| `public` 테이블 + RLS 정책으로 직접 쓰기 | 빈도·정지·멱등·자동 숨김·도도부현 판정을 정책 식으로 쓰기 어렵다. 열 단위 쓰기 권한을 세밀하게 관리해야 하고, 숨김 열을 클라이언트가 바꾸지 못하게 막아야 한다 |
| 소유자 열을 항목 테이블에 + 열 GRANT 제외 (erd.md 의 `places.added_by` 방식) | `select=*` 가 권한 오류가 되는 함정, 실수로 뷰에 섞일 위험. 분리 테이블이 구조적으로 안전 |
| `security_invoker` 뷰 + 정책 | 기본 테이블에 SELECT 권한과 정책이 필요 → 결정 1 이 깨진다 |
| Edge Function 이 모든 쓰기를 대행 | 서버 코드·배포 경로가 늘고, 검사가 DB 밖에 있으면 다른 경로(SQL 편집기 등)에 규칙이 없다 |

## 결과

- 좋은 점: 공격 표면이 뷰 4개 + RPC 목록으로 한정되고, 그 목록이 마이그레이션 검사로 고정된다. 규칙이 한 곳(함수)에 있다.
- 나쁜 점: Supabase 보안 점검기가 정의자 뷰를 경고한다(의도 주석). 클라이언트는 PostgREST 의 자동 테이블 CRUD 를 쓸 수 없어 RPC 를 하나씩 정의해야 한다. 정의자 함수 작성 실수의 영향이 크다 → pgTAP 매트릭스(ERD v2 §9).

## 열린 질문

| # | 질문 |
|---|---|
| DA-Q1 | Supabase 대시보드의 Data API 노출 스키마 설정에서 `app` 이 제외됐는지 출시 전 점검표로 확인 |
| DA-Q2 | 장소가 2,000건을 넘으면 도도부현 단위 RPC 로 바꿀지 (RFC-0003 OQ-11) |
