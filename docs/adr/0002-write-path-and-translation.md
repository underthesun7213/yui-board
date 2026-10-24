# ADR-0002 · 본문 쓰기는 Edge Function 이 번역 후 `p_author` 를 명시해 service RPC 로 한다

| | |
|---|---|
| 상태 | 보류 (ADR-0009) |
| 날짜 | 2026-10-11 |
| 근거 | PRD Q4, S-5, S-6, L-2, M-7, M-9, §9, POL-6-1~6-4, FN-HOME-03-5, FN-HOME-02-5, 핸드오프 §5.3, BL-04, BL-12, BL-27, TC-S-05, TC-L-05, TC-M-11 |
| 관련 | [RFC-0001 §5](../architecture/rfc/0001-m1-backend-foundation.md#5-쓰기-경로--작성-시-번역), [tech-stack §2.3·§3](../architecture/tech-stack.md), [ERD §6.1](../architecture/erd.md#61-service_role-전용-edge-function-이-호출) |

## 배경

- 글·댓글은 **작성 시점에** 세 언어로 번역해 저장한다(L-2, POL-6-1). 번역 키는 클라이언트에 둘 수 없다.
- 현행 `create_post`/`add_comment` 는 `authenticated` 가 직접 부를 수 있어, 언어 칸마다 다른 내용과 `translated` 값을 넣을 수 있다(S-5).
- 함수는 작성자를 `auth.uid()` 로 정하므로, 서버가 `service_role` 로 부르면 작성자가 null 이 된다. 서버가 사용자 JWT 를 그대로 넘기면 DB 가 서버와 클라이언트를 구별하지 못한다(Q4).

## 결정

1. **본문을 만드는 쓰기(글 작성·수정, 댓글 작성)만** Supabase Edge Function(`write-post`, `write-comment`, `edit-post`)을 거친다. 나머지 쓰기는 PostgREST·클라이언트 RPC 로 한다.
2. Edge Function 은 사용자 액세스 토큰을 `auth.getUser()` 로 검증해 `user_id` 를 얻고, 입력 검증 → 번역 → **secret 키(역할 `service_role`)로 `create_post(p_author := user_id, …)` 호출** 순으로 처리한다. PRD Q4 의 제안을 그대로 채택한다.
3. service 함수의 EXECUTE 는 `public, anon, authenticated` 에서 회수하고 `service_role` 에만 준다(N-1).
4. 거주 확인·길이·빈도 제한·멱등성(`client_token`)·숨김 글 검사(S-6)는 **DB 함수 안에서** 한다. Edge Function 의 검증은 빠른 실패용이고, 보장은 DB 가 한다.
5. 번역은 어댑터 `translate(texts, from, to[])` 하나로 감싼다. 기본 구현은 Azure Translator v3, 타임아웃 5초. 어떤 실패든 원문을 세 칸에 복사하고 `translated=false` 로 저장하며 작성은 성공시킨다(POL-6-3, 6-4). 실패에는 월 한도 소진(오류 **429001**)과 시간당 문자 수 제한에 따른 429 가 포함된다([Translator service limits](https://learn.microsoft.com/azure/ai-services/translator/service-limits)). **번역본이 DB 칸 상한(제목 200, 본문 `3 × B`)을 넘는 경우도 같은 경로**로 처리해, DB CHECK 위반으로 작성이 실패하지 않게 한다.
6. Edge Function 은 `user_id` 와 생성된 글 `id` 를 로그에 남기지 않는다.

## 고려한 대안

| 대안 | 기각 이유 |
|---|---|
| 클라이언트 직접 RPC + 읽을 때 번역 | S-5 미해결, POL-6-1 위반, 읽기마다 번역 비용 |
| 서버가 사용자 JWT 로 RPC 호출 | DB 가 호출자를 구별 못 함 → S-5 그대로 |
| DB 함수가 "service 호출일 때만" `p_author` 사용, 아니면 `auth.uid()` | 한 함수에 두 권한 모델. 실수로 `authenticated` EXECUTE 를 남기면 위조 가능 |
| `pg_net` 비동기 번역 | 번역 전 본문이 먼저 공개, 키가 DB 에 저장 |
| Cloudflare Workers 에 서버 코드 | 비밀값·계정이 두 곳으로. 기능상 이점 없음 |
| 모든 쓰기를 Edge Function 으로 | 좋아요·RSVP 마다 함수 호출 — 지연·호출 수만 늘어난다 |

## 결과

- 좋은 점: S-5 해결. 번역 실패가 작성을 막지 않는다. 번역 제공자 교체가 한 파일.
- 나쁜 점: 글 작성 지연에 번역 왕복이 더해진다(목표 p95 3초, 최악 7초). Edge Function 배포 경로가 하나 생긴다. 무료 플랜 실행 시간 상한(자료마다 다름)을 확인해야 한다.
- 후속: 응답에 `alias_no`/`is_op` 를 주기 위해 `add_comment` 반환형을 바꾼다. 본문 길이 상한(2000 vs 4000, R-3)을 정한다.

## 열린 질문

| # | 질문 |
|---|---|
| W-Q1 | 본문 원문 상한 `B` — 기능명세 2000 vs 핸드오프 4000 (RFC R-3). DB 번역본 칸 상한 `3 × B` 가 여기에 따른다 |
| W-Q2 | 빈도 제한 수치(글 10분 3건·하루 20건, 댓글 1분 5건 — ERD E-Q4)를 누가 확정하는가 |
| W-Q3 | Azure vs DeepL 품질 비교(tech-stack T-3) 결과에 따라 기본 구현을 바꿀 것인가 |
| W-Q4 | Supabase Edge Function 무료 플랜 실행 시간 상한 확인 — 번역 타임아웃 5초 + DB 호출이 그 안에 드는가 |
| W-Q5 | 번역 실패 글을 나중에 다시 번역하는 재처리(배치)를 둘 것인가. 지금 설계에는 없다 |
