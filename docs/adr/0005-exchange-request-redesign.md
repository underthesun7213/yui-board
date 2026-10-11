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

1. **결과 3종으로 균일화.** `request_exchange(p_post)` 는 `sent`, `daily_limit`, `unavailable` 중 하나만 돌려준다.
   - `unavailable`: 글이 없음·숨김·삭제·게시판이 `market/meet/lost` 아님. 모두 **글**에 대한 사실이라 작성자를 드러내지 않는다.
   - 본인 글, 이미 교환한 상대, 같은 상대에게 대기 중 요청이 있는 경우는 **`sent` 를 돌려주고** 행을 `status='suppressed'` 로 기록한다. 수신자에게 보이지 않는다.
2. **시도를 먼저 기록.** 함수 첫 단계에서 `exchange_attempts` 에 INSERT 하고, 이후 분기에서 예외를 던지지 않는다(롤백 없음). 하루 3건은 이 테이블로 센다(POL-4-4 "실패 포함").
3. **같은 쿼리 경로.** 모든 분기가 같은 조회(글·작성자·교환·대기)를 수행한 뒤 마지막에 status 만 다르게 쓴다. 타이밍 차이를 줄인다.
4. **uuid 비공개.** `exchange_requests`, `exchanges` 는 클라이언트 SELECT 권한이 없다. 뷰만 연다:
   - `my_sent_requests(post_id, created_at)` — 상태 없음. 거절을 알리지 않는다(POL-4-6 제안).
   - `my_incoming_requests(id, post_id, display_name, floor, created_at)` — 14일 지난 요청 제외(POL-4-8 제안).
   - `my_contacts(contact_id, display_name, instagram, floor, post_id, created_at)` — `contact_id` 는 `exchanges.id`.
   - 해제는 `unlink_exchange(p_contact_id)`.
5. **같은 글 중복**은 `(from_user, post_id)` 유일. 재요청은 `sent` (이미 보낸 글이라는 것은 요청자 자신이 아는 정보).
6. `respond_exchange` 에 거주 확인 추가(N-8).
7. 요청자 쪽 UI 의 "이미 요청함"은 `my_sent_requests` 로, "내 글에는 버튼 숨김"은 `my_post_ids` 로 판단한다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 오류는 유지하고 `to_user` 만 숨김 | 오류 차이로 여전히 동일 작성자 판별 |
| 이미 교환한 상대에게도 일반 `pending` 으로 전달 | 수신자 화면에 이미 교환한 사람이 다시 나타남. 혼란 |
| 요청을 서버(Edge Function)로 옮김 | 같은 보장을 DB 함수로 할 수 있다. 호출 수만 늘어남 |
| 하루 제한을 `exchange_requests` 로 계속 셈 | `suppressed` 도 세면 되지만, 예외로 끝나는 경로(`unavailable`)가 남는다. 시도 테이블이 단순하다 |

## 결과

- 좋은 점: TC-PR-09 와 ERD §8 E-4 를 만족. 하루 3건 제한이 실제로 탐색을 막는다.
- 나쁜 점: 요청자는 "본인 글", "이미 교환한 상대"에 대해 거짓 성공을 본다. 본인 글은 UI 에서 버튼을 숨겨 실제로는 드물다. 이미 교환한 상대는 교환 목록에서 확인할 수 있다.
- 남는 위험: 요청자는 수락 후 `my_contacts.post_id` 로 "이 사람이 이 글을 썼다"를 안다 — 이는 X-5 의 의도된 동작이다(수락 = 신원 공개 동의).
- 이 결정은 Q1(층 vs 방 번호)과 독립이다. 뷰는 층만 내보낸다.
