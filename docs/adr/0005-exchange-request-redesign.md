# ADR-0005 · 교환 요청은 결과를 균일화하고, 시도를 먼저 기록하며, uuid 를 내보내지 않는다 (S-2)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-11 |
| 근거 | PRD S-2, Q7, X-1~X-7, PR-8, PR-10, N-6, N-8, POL-4-1~4-8, FN-HOME-07-2, FN-HOME-02-7, BL-02, BL-47, BL-48, TC-PR-09, TC-X-08 |
| 관련 | [RFC-0001 §9.4](../architecture/rfc/0001-m1-backend-foundation.md#94-교환-요청-home-07-s-2-수정-후), [ERD §4.3·§5.3](../architecture/erd.md#43-교환-adr-0005), ADR-0001 |

## 배경

현행 `request_exchange` 와 정책으로는 작성자를 추적할 수 있다(PRD S-2).

1. 요청자가 `exreq_mine` 으로 자기 요청의 `to_user`(작성자 uuid)를 읽는다.
2. 같은 작성자의 다른 글에 요청하면 `exchange_one_pending` unique 위반(23505) 또는 `already exchanged` 가 나서 "두 글의 작성자가 같다"를 알 수 있다. `bad target` 은 "내 글"을 알려 준다.
3. 실패한 호출은 롤백되어 하루 3건 제한(`exchange_requests` 행 수로 셈)에 걸리지 않는다 → 무제한 탐색.
4. 게시판 제한(X-1)을 함수가 검사하지 않는다(Q7).
5. `my_contacts.id`(상대 uuid)를 `places.added_by`, `events.created_by` 와 대조할 수 있다(N-6).

## 결정

1. **결과를 반환값으로 균일화.** `request_exchange(p_post)` 는 **예외를 던지지 않고** 텍스트 반환값 `sent`, `daily_limit`, `unavailable`, `not_resident` 중 하나를 돌려준다. 예외는 트랜잭션을 롤백해 시도 기록을 지우므로 쓰지 않는다. 작성자에 관한 결과는 모두 `sent` 하나로 모인다.
   - `unavailable`: 글이 없음·숨김·삭제·게시판이 `market/meet/lost` 아님. 모두 **글**에 대한 사실이라 작성자를 드러내지 않는다.
   - 본인 글, 이미 교환한 상대, 같은 상대에게 대기 중 요청이 있는 경우는 **`sent` 를 돌려주고** 행을 `status='suppressed'` 로 기록한다. 수신자에게 보이지 않는다.
2. **잠금 → 한도 확인 → 시도 기록 → 판정 순서.** 
   1. `pg_advisory_xact_lock` 으로 **요청자 단위** 잠금. 같은 사용자의 동시 호출이 직렬화되어 하루 3건을 넘지 않고, 같은 상대에게 `pending` 이 두 건 생기지 않는다(POL-4-5). 다른 사용자끼리는 막지 않는다.
   2. 거주 확인(`not_resident`), 최근 24시간 `exchange_attempts` 가 3건 이상이면 `daily_limit`(이 경우는 기록하지 않음 — 한도 밖 시도로 행이 무한히 늘지 않게).
   3. `exchange_attempts` INSERT. 이후 결과가 `unavailable` 이든 `sent` 든 커밋되므로 실패 시도도 센다(POL-4-4 "실패 포함").
   4. **지연 만료:** 요청자 자신의 `pending` 중 14일(`exchange_ttl()`, POL-4-8) 지난 것을 `expired` 로 바꾼다.
   5. 글·작성자·교환·대기(14일 이내 `pending` 만) 판정 후 `exchange_requests` 기록.
   
   구현 요지는 [ERD §6.4](../architecture/erd.md#64-핵심-조각-설계-설명용).
3. **같은 쿼리 경로.** 모든 분기가 같은 조회(글·작성자·교환·대기)를 수행한 뒤 마지막에 status 만 다르게 쓴다. 타이밍 차이를 줄인다.
4. **uuid 비공개.** `exchange_requests`, `exchanges` 는 클라이언트 SELECT 권한이 없다. 뷰만 연다:
   - `my_sent_requests(post_id, created_at)` — 상태 없음. 거절을 알리지 않는다(POL-4-6 제안).
   - `my_incoming_requests(id, post_id, display_name, floor, created_at)` — 14일 지난 요청 제외(POL-4-8 제안).
   - `my_contacts(contact_id, display_name, instagram, floor, post_id, created_at)` — `contact_id` 는 `exchanges.id`.
   - 해제는 `unlink_exchange(p_contact_id)`.
5. **같은 글 중복**은 `(from_user, post_id)` 유일. 재요청은 `sent` (이미 보낸 글이라는 것은 요청자 자신이 아는 정보).
6. `respond_exchange` 에 거주 확인 추가(N-8). 14일 지난 요청은 `expired` 로 바꾸고 `not_found` 를 반환한다(만료 표시가 남도록 예외 대신 반환값).
7. **만료는 주기 작업이 아니라 지연 만료로 한다** (POL-4-8). 만료 조건을 "대기 중" 판정에 두지 않으면 응답 없는 요청 하나가 그 상대에 대한 이후 모든 요청을 영구히 `suppressed` 로 만들고, 부분 유일 인덱스 `exchange_one_pending` 도 막힌다. `pg_cron` 주기 작업은 (1) 작업 사이에 같은 문제가 남고 (2) 무료 플랜 사용 가능 여부를 확인하지 못했다(확인 필요). 지연 만료는 같은 트랜잭션에서 INSERT 보다 먼저 실행되므로 그런 틈이 없다. 기간은 `exchange_ttl()` 한 곳에 둔다. 세부는 [ERD §4.3](../architecture/erd.md#43-교환-adr-0005).
9. 요청자 쪽 UI 의 "이미 요청함"은 `my_sent_requests` 로, "내 글에는 버튼 숨김"은 `my_post_ids` 로 판단한다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 오류는 유지하고 `to_user` 만 숨김 | 오류 차이로 여전히 동일 작성자 판별 |
| 이미 교환한 상대에게도 일반 `pending` 으로 전달 | 수신자 화면에 이미 교환한 사람이 다시 나타남. 혼란 |
| 요청을 서버(Edge Function)로 옮김 | 같은 보장을 DB 함수로 할 수 있다. 호출 수만 늘어남 |
| 하루 제한을 `exchange_requests` 로 계속 셈 | `suppressed` 도 세면 되지만, 글이 없는 경로(`unavailable`)는 요청 행을 만들 수 없다. 시도 테이블이 단순하다 |
| 예외로 실패를 알리고 시도 기록은 별도 트랜잭션(`dblink` 등 자율 트랜잭션)으로 | Supabase 에서 확장·연결 설정이 필요하고, 결과 코드 반환으로 같은 효과를 얻는다 |
| 행 잠금(`select … for update`)으로 동시성 처리 | 잠글 "요청자 행"이 공유 테이블(`profiles`)이라 다른 갱신과 엉킨다. advisory 잠금이 범위가 정확하다 |

## 결과

- 좋은 점: TC-PR-09 와 ERD §8 E-4 를 만족. 하루 3건 제한이 실제로 탐색을 막는다.
- 나쁜 점: 요청자는 "본인 글", "이미 교환한 상대"에 대해 거짓 성공을 본다. 본인 글은 UI 에서 버튼을 숨겨 실제로는 드물다. 이미 교환한 상대는 교환 목록에서 확인할 수 있다.
- 남는 위험: 요청자는 수락 후 `my_contacts.post_id` 로 "이 사람이 이 글을 썼다"를 안다 — 이는 X-5 의 의도된 동작이다(수락 = 신원 공개 동의).
- 이 결정은 Q1(층 vs 방 번호)과 독립이다. 뷰는 층만 내보낸다.
- 클라이언트는 HTTP 200 과 반환 문자열로 결과를 판단한다(핸드오프 §5.4 의 오류 → `T` 매핑을 반환값 매핑으로 바꾼다: `daily_limit`→`exLimit`, `sent`→`exSent`, `unavailable`·`not_resident` 는 새 문자열 필요, BL-53).

## 열린 질문

| # | 질문 |
|---|---|
| X-Q1 | 거절 비통지(POL-4-6), 14일 만료(POL-4-8)는 정책서에서 "제안" 상태다. 이 ADR 은 두 제안을 전제로 했다 — 정책 확정 필요(BL-67). 만료 기간이 바뀌면 `exchange_ttl()` 하나만 고친다. POL-4-8 을 채택하지 않으면 만료가 없어져 "응답 없는 요청이 같은 상대에게의 재요청을 영구히 막는" 동작이 정책이 된다 — 그 경우에도 기간을 두는 것을 권한다 |
| X-Q2 | 본인 글에 `sent` 를 돌려주는 거짓 성공을 받아들일지, `my_post_ids` 로 UI 에서만 막고 서버는 `unavailable` 로 둘지(본인 글 여부는 본인만 아는 정보라 노출 위험은 없다) |
| X-Q3 | 한도 초과(`daily_limit`) 시도는 기록하지 않는다. "실패 시도도 센다"(POL-4-4)의 범위를 "한도 안의 실패"로 해석해도 되는가 |
