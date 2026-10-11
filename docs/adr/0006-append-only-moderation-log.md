# ADR-0006 · 숨김은 `moderate()` 로만, 운영 기록은 추가 전용으로 한다 (S-3)

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-11 |
| 근거 | PRD S-3, M-4, M-5, M-6, PR-6, PR-11, POL-3-4, POL-3-5, POL-3-6, N-9, BUG-02, BL-03, BL-14, BL-15, TC-PR-05, TC-PR-10, TC-M-06, TC-M-08 |
| 관련 | [RFC-0001 §9.5](../architecture/rfc/0001-m1-backend-foundation.md#95-운영자-숨김-home-05), [ERD §3.1·§6.4](../architecture/erd.md) |

## 배경

"운영자는 익명이 아니다. 모든 조치는 서명되어 기록된다"(README, PR-6)가 운영의 신뢰 근거다. 현행 스키마는 이를 보장하지 않는다.

- `posts_moderate`, `comments_moderate` 정책으로 운영자가 `hidden_at` 을 직접 바꿀 수 있다 → 기록 없는 숨김.
- `mod_actions_admin` 이 `for all` → 운영자가 기록을 고치거나 지울 수 있다.
- `moderate()` 는 존재하지 않는 대상에도 성공하고, `p_type` 이 이상하면 `comments` 를 갱신한다(신규 D-4).

## 결정

1. `posts_moderate`, `comments_moderate` 정책을 **삭제**한다. `hidden_at` 은 `moderate()`(정의자 함수)만 바꾼다.
2. `mod_actions` 정책은 **운영자 SELECT 만**. INSERT 는 `moderate()` 안에서만 일어난다.
3. **BEFORE UPDATE OR DELETE 행 트리거**가 `mod_actions` 변경을 거부한다. 행 트리거는 `TRUNCATE` 에 발동하지 않으므로 **BEFORE TRUNCATE 문장 트리거**를 함께 두고, `TRUNCATE` 권한을 `public, anon, authenticated, service_role` 에서 회수한다. RLS 를 우회하는 `service_role` 에도 적용된다. 트리거 함수는 **security invoker** 로 만든다(ERD §6 보안 속성 규칙). 트리거를 끄려면 테이블 소유자 권한이 필요하므로, 변경은 마이그레이션 기록에 남는다.
4. `moderate(p_type, p_id, p_action, p_note)` 는 `p_type ∈ {post, comment}`, `p_action ∈ {hide, unhide, keep}` 을 먼저 검사하고, 대상이 없으면 `not_found` 로 실패한다. 성공 시 대상의 모든 미처리 신고를 해결하고 기록한다(N-9 의 "대상 단위 처리"와 일치).
5. 운영자 화면은 `report_queue`(대상 단위로 묶음)와 `hidden_items`(숨김 목록·복원, M-6)를 쓴다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 정책만 정리하고 트리거 없음 | `service_role`·대시보드 SQL 로는 여전히 수정 가능. 개발자도 기록을 못 고친다는 것이 신뢰 장치의 핵심 |
| `hidden_at` 변경 시 트리거가 자동으로 `mod_actions` 기록 | 직접 UPDATE 를 허용하는 셈. 서명자(`auth.uid()`)가 service 경로에서 null |
| 별도 감사 스키마·외부 로그 서비스 | 비용·운영 부담 |

## 결과

- 좋은 점: TC-PR-05·10 이 SQL 로 확인된다. 운영자 교대(RA)에도 기록이 남는다.
- 나쁜 점: 잘못된 조치는 지울 수 없고, 반대 조치(`unhide`)를 추가로 남겨야 한다 — 의도된 동작(POL-3-5).
- 후속: 자동 임시 숨김(POL-3-8)을 도입하면 운영자가 아닌 행위자가 생긴다. `actor_id` nullable + `actor_kind` 추가 여부(ERD E-Q6).

## 열린 질문

| # | 질문 |
|---|---|
| O-Q1 | 자동 임시 숨김(POL-3-8)의 시스템 행위자 표현 — `actor_id` nullable + `actor_kind` (ERD E-Q6) |
| O-Q2 | 운영자 계정 삭제를 막기 위해 `mod_actions.actor_id` 를 `ON DELETE RESTRICT` 로 둔다. RA 퇴거 시 계정은 비활성화만 하는 것으로 운영 절차(POL-9-4)를 확정할 것 |
| O-Q3 | 운영 기록을 운영자 전원이 볼지, 본인 조치만 볼지 (현재 설계: 운영자 전원 SELECT) |
| O-Q4 | 이의 제기(POL-3-9, M-8)를 넣으면 "다른 운영자가 검토"를 강제하기 위해 `moderate()` 가 이전 조치자와 같은 운영자를 거부해야 하는가 |
