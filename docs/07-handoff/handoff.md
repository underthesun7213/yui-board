# 7단계 · 개발 핸드오프 — 디자인 스펙, 에셋, API 명세

| | |
|---|---|
| 상태 | 초안 v0.1 |
| 작성일 | 2026-10-11 |
| 근거 | `index.html`(mock data 프로토타입), `schema.sql`(미적용 설계안), `sw.js`, `manifest.webmanifest`, `.gitignore` |
| 이전 단계 | [디자인 시스템](../06-design/design-system.md) |
| 다음 단계 | [테스트 계획](../08-qa/test-plan.md) |
| 참조 | [PRD](../02-requirements/PRD.md) (§7 익명성, §7.1 S-1~S-9, §9 구성, §13 Q1~Q12), [IA](../03-ia/IA.md) (화면 ID) |

> 이 문서에서 **"제안"** 이라고 표시한 것은 아직 코드·스키마에 없는 것이다. 표시가 없는 내용은 현재 코드에서 확인한 사실이며 `파일:줄` 로 근거를 단다.

---

## 1. 핸드오프 개요

### 1.1 개발자가 받는 것

| 산출물 | 역할 |
|---|---|
| `index.html` | **하이파이 레퍼런스.** 화면·문구·인터랙션의 기준. 브라우저에서 바로 열린다(빌드 없음). 디자인 시안을 따로 두지 않고 이 파일이 시안이다 |
| `../06-design/design-system.md` | 색·타이포·간격 토큰, 컴포넌트 규칙 |
| 이 문서 | 화면 ↔ 데이터 매핑, 데이터 모델, API 명세, 필드 매핑, 에셋 목록, 배포 규칙 |
| `schema.sql` | 대상 DB 설계. 적용 전 PRD §7.1 의 S-1~S-6 수정이 선행되어야 한다 (M1) |

### 1.2 코드 구조 규칙 (`CLAUDE.md` 요약 — 실서비스 연결 후에도 유지)

- `index.html` 한 파일: `<style>` → 마크업 → `<script>` 하나. 빌드·프레임워크·번들러 없음. 이전은 합의 후에만.
- 스크립트 순서: `T`(UI 문자열 ja/en/ko) → 데이터 상수 → `S`(전체 상태) → 뷰 함수(HTML 문자열 반환) → `render()` → 위임 `click` 핸들러 하나.
- 화면 추가 = 뷰 함수 + `render()` 맵 등록 + `data-*` 분기. **개별 요소에 리스너를 달지 않는다** (`render()` 가 DOM 을 교체한다).
- 사용자 노출 문자열은 전부 `T` 에 3개 언어로. 데이터에서 온 문자열은 전부 `esc()`.
- `\uXXXX` 는 스크립트 안에서만. 마크업에는 문자를 그대로.
- 고정 폭은 한국어(가장 긺) 기준.
- 지도는 Leaflet 1회 생성, 갱신은 `updateMap()`. 뷰 전체 재렌더 금지.
- 배포 산출물이 바뀌면 `sw.js` 의 `CACHE` 를 올린다.
- 완료 판정은 `CLAUDE.md` 의 헤드리스 렌더 스크립트(모든 뷰 × 모든 언어, 예외·`undefined` 누출 없음).

**실데이터 연결 시 추가 규칙 (제안):** mock 상수를 지우고 같은 모양의 상태(`S.posts`, `S.events` …)를 `fetch` 결과로 채운 뒤 `render()` 한다. 뷰 함수는 동기 함수로 유지하고, 로딩·오류 상태는 `S` 의 플래그로 표현한다. 헤드리스 테스트가 계속 돌도록 fixture 를 남긴다.

---

## 2. 화면 ↔ 데이터 매핑

화면 ID 는 IA §2 를 따른다. "읽기/쓰기" 는 목표 백엔드 기준. RPC 는 `POST /rest/v1/rpc/<fn>`, `/api/*` 는 §5.3 의 제안 서버 엔드포인트.

| 화면 ID | 현재 mock (`index.html`) | 읽기 | 쓰기 |
|---|---|---|---|
| SYS-01 언어 메뉴 | `S.lang` (:827) | `profiles.lang` | `PATCH profiles` (`lang`) — L-3, S-1 수정 후 |
| SYS-02 토스트 | `T.*` | — | — |
| HOME-01 피드 | `POSTS` (:668), `REQS`(헤더 점, :748), `S.isRA` | `posts`, `likes`(내 좋아요), `my_incoming_requests`(점), `profiles.is_admin`(⚑ 버튼) | — |
| HOME-02 글 상세 | `POSTS[].c`, `EXBOARDS` (:746), `S.sent`, `S.mine` | `posts`, `comments`, `likes`, `exchange_requests`(보낸 요청 여부) | `likes` INSERT/DELETE, `/api/posts/:id/comments` (B-6, UI 없음) |
| HOME-03 글쓰기 | `CBOARDS` (:908), `POSTS.unshift` (:1833) | — | `/api/posts` → `create_post` |
| HOME-04 신고 시트 | `S.reps`, `S.mine` | — | `rpc/submit_report` |
| HOME-05 신고 큐 | `REPORTS` (:737) → `S.reps` | `report_queue`, `posts`/`comments`(인용문, 운영자 정책) | `rpc/moderate` |
| HOME-06 프로필 교환 | `REQS`, `EXCH` (:748-749), `POSTS`(계기 글 제목) | `my_incoming_requests`, `my_contacts`, `posts`(제목) | `rpc/respond_exchange`, `DELETE exchanges` |
| HOME-07 교환 요청 시트 | `ME` (:745), `sentToday`/`DAILY_LIMIT` (:747,750) | `profiles`(본인 이름), `residency`(본인 층), `exchange_requests`(오늘 보낸 수) | `rpc/request_exchange` |
| CAL-01 월 캘린더 | `EVENTS` (:760), `HOSTS` (:754), `TODAY` (:753) | `events`, `event_overrides` | — |
| CAL-02 이벤트 상세 | `EVENTS`, `S.going` | `events`, `event_overrides`, `event_rsvps`(내 참가) | `event_rsvps` INSERT/DELETE (Q6) |
| JP-01~JP-06 | `LESSONS` (:945), `VN` (:1176), `ENDINGS` (:1135), `S.cg` | 없음 — 정적 콘텐츠로 `index.html` 에 남긴다 | 컬렉션 저장 위치 미정 (Q9) |
| MAP-01/02 | `PLACES` (:1351), `HOME` (:1350) | `places` | (운영자) `places` — P-6 은 P2 |
| AUTH-01 (신규) | 없음 | `auth` | Q3 결정 후 (S-7) |

---

## 3. 데이터 모델

`schema.sql` 기준. 모든 테이블은 RLS 활성(`schema.sql:286-302`). "정책 없음" = RLS 켜짐 + 정책 0개 → `anon`/`authenticated` 로는 어떤 행도 읽고 쓸 수 없고 `service_role` 과 `SECURITY DEFINER` 함수만 접근한다.

### 3.1 테이블

| 테이블 (줄) | 용도 | 주요 컬럼 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|---|
| `profiles` (:28-35) | 계정 프로필 | `id`(=auth.users), `display_name`, `instagram`, `lang`, `is_admin` | 본인 (:306) | 없음 (S-7) | 본인, **컬럼 제한 없음 → S-1** (:308) | — |
| `residency` (:38-48) | 입주 이력. 방 번호 저장, 층만 노출 | `user_id`, `room`, `floor`, `active` | 본인 (:311) | — | — | — |
| `allowed_domains` (:52-55) | 가입 허용 도메인 | `domain` | **정책 없음** | — | — | — |
| `posts` (:62-75) | 글 본문(작성자 없음) | `board`, `src_lang`, `title_{en,ja,ko}`, `body_{en,ja,ko}`, `translated`, `like_count`, `comment_count`, `hidden_at` | 입주자·미숨김 (:315), 운영자 전체 (:317) | 없음 → `create_post` | 운영자 (:324) **S-3** | — |
| `post_authors` (:78-83) | 글 작성자 | `post_id`, `author_id` | **정책 없음 (의도)** | — | — | — |
| `comments` (:85-97) | 댓글 본문 | `post_id`, `parent_id`, `alias_no`, `is_op`, `src_lang`, `body_*`, `translated`, `hidden_at` | 입주자·미숨김 (:319), 운영자 (:321) | 없음 → `add_comment` | 운영자 (:326) **S-3** | — |
| `comment_authors` (:99-102) | 댓글 작성자 | `comment_id`, `author_id` | **정책 없음 (의도)** | — | — | — |
| `thread_aliases` (:105-111) | 글별 익명 번호(글쓴이=0) | `post_id`, `author_id`, `alias_no` | **정책 없음 (의도)** | — | — | — |
| `likes` (:113-118) | 좋아요 | `post_id`, `user_id` | 본인 (:330 `for all`) | 본인 | 본인 | 본인 |
| `reports` (:126-136) | 신고. 1인 1대상 1회 (unique :135) | `target_type`, `target_id`, `reason`, `reporter_id`, `resolved_at` | **없음** (운영자 포함) | 본인·입주자 (:335) | — | — |
| `mod_actions` (:138-145) | 운영 조치 서명 기록 | `actor_id`, `target_type`, `target_id`, `action` | 운영자 | 운영자 | 운영자 **S-3** | 운영자 **S-3** (:338 `for all`) |
| `exchange_requests` (:155-167) | 교환 요청 | `from_user`, `to_user`, `post_id`, `status` | 보낸·받은 사람 (:342) — **`to_user` 노출, S-2** | 없음 → `request_exchange` | 없음 → `respond_exchange` | — |
| `exchanges` (:170-177) | 수락된 쌍 (`a < b`) | `a`, `b`, `post_id` | 당사자 (:344) | 없음 → `respond_exchange` | — | 당사자 (:346) |
| `events` (:186-202) | 이벤트 (반복은 `rrule` 한 행) | `kind`, `host_label`, `title_*`/`body_*`/`place_*`, `starts_at`, `ends_at`, `rrule`, `until_on`, `capacity`, `rsvp_count` | 입주자 (:350) | 운영자 (:353) | 운영자 | 운영자 |
| `event_overrides` (:204-211) | 회차별 취소·변경 | `event_id`, `occurs_on`, `cancelled`, `title_*`, `body_*` | 입주자 (:351) | **없음 — 운영자도 못 씀** | 없음 | 없음 |
| `event_rsvps` (:213-219) | 회차 단위 참가 | `event_id`, `occurs_on`, `user_id` | 본인 (:355) | 본인 | 본인 | 본인 |
| `places` (:226-239) | 지도 장소 | `cat`, `name_*`, `note_*`, `lat`, `lng`, `google_place_id`, `walk_min`, `added_by`, `added_label`, `hidden_at` | 입주자·미숨김 (:352) | 운영자 (:354) | 운영자 | 운영자 |

enum (`schema.sql:14-18`) 은 프로토타입 키와 정확히 일치한다: `board` = `CBOARDS`, `ev_kind` = `HOSTS` 키, `place_cat` = `T.*.cats` 키, `report_reason` = `T.*.reasons` 키.

### 3.2 트리거·헬퍼

| 이름 (줄) | 내용 | 비고 |
|---|---|---|
| `bump_like_count` (:246-254) | `likes` INSERT/DELETE → `posts.like_count` ±1 | `SECURITY DEFINER` 아님 → 일반 사용자 좋아요에서 카운트가 안 오른다 **S-4** |
| `bump_comment_count` (:256-264) | `comments` → `comment_count` | `add_comment`(definer) 안에서만 INSERT 되므로 동작 |
| `is_admin()` / `is_resident()` (:271-279) | `auth.uid()` 기준 | `service_role` 호출 시 `auth.uid()` 가 null → 항상 false (Q4) |
| (없음) | `event_rsvps` → `rsvp_count` 트리거 | **Q6** |

### 3.3 뷰 (`schema.sql:366-392`)

소유자 권한으로 실행되어 RLS 를 넘어 읽되, 뷰 자신의 `where` 로 범위를 제한한다. `anon` 회수, `authenticated` SELECT 부여(:391-392).

| 뷰 | 컬럼 | 범위 |
|---|---|---|
| `my_contacts` (:366) | `id`(상대 uuid), `display_name`, `instagram`, `floor`, `post_id`, `created_at` | 내가 속한 `exchanges` |
| `my_incoming_requests` (:374) | `id`, `post_id`, `created_at`, `display_name`, `floor` | 나에게 온 `pending` 요청 |
| `report_queue` (:384) | `target_type`, `target_id`, `reason`, `n`, `last_at` | 미처리 신고, `is_admin()` 일 때만. `reporter_id` 없음. **(대상, 사유) 단위로 그룹** — 한 글이 사유 두 개로 신고되면 두 행 |

---

## 4. API 공통 — 인증·오류 형식

- 클라이언트는 `anon` 키 + 사용자 JWT 로 PostgREST(`https://<project>.supabase.co/rest/v1/`)를 직접 호출한다. 헤더: `apikey: <anon>`, `Authorization: Bearer <user JWT>`.
- `service_role` 키는 서버(제안 엔드포인트)에만 둔다 (PR-4).
- PostgREST 오류 형식: `{"code":"<SQLSTATE>","message":"...","details":...,"hint":...}`. `raise exception` 은 SQLSTATE `P0001`(HTTP 400), unique 위반 `23505`(409), RLS/권한 거부 `42501`(403, 익명은 401), check 위반 `23514`(400).

---

## 5. API 명세

### 5.1 읽기 (PostgREST)

`{lang}` 은 `S.lang`(en/ja/ko). 응답 행 수가 `limit` 보다 적으면 끝.

**언어 컬럼 선택 규칙.** 목록은 현재 언어 칸만(`title_{lang},body_{lang}`), 상세는 원문 토글(B-7)을 위해 세 언어를 모두 받는다. `src_lang` 은 항상 함께 받는다. PostgREST 는 행마다 다른 컬럼을 고를 수 없으므로 "원문 칸만" 선택은 불가능하다.

**페이지네이션 — keyset 권장 (`created_at desc, id desc`).** `offset` 은 새 글이 올라오면 중복·누락이 생긴다. 다음 페이지는 마지막 행의 `(created_at, id)` 를 커서로 쓴다. 인덱스 `posts_board_feed`/`posts_feed`(:74-75)는 `created_at` 만 담으므로 동시각 정렬은 `id` 로 보조한다.

```http
# HOME-01 피드 (게시판 필터 + 첫 페이지)
GET /rest/v1/posts?select=id,board,src_lang,title_ko,body_ko,translated,like_count,comment_count,created_at
    &board=eq.market&hidden_at=is.null&order=created_at.desc,id.desc&limit=20

# 다음 페이지 (마지막 행 created_at=2026-09-09T10:12:00Z, id=41)
GET /rest/v1/posts?select=...&board=eq.market&hidden_at=is.null
    &or=(created_at.lt.2026-09-09T10:12:00Z,and(created_at.eq.2026-09-09T10:12:00Z,id.lt.41))
    &order=created_at.desc,id.desc&limit=20

# "전체" 탭은 board 필터를 뺀다. hidden_at=is.null 은 운영자(posts_read_admin)도 피드에서 숨긴 글을 안 보게 하려고 항상 붙인다.

# HOME-01/02 내가 좋아요한 글 (화면에 보이는 id 들)
GET /rest/v1/likes?select=post_id&post_id=in.(41,40,39)

# HOME-02 글 상세 + 댓글
GET /rest/v1/posts?select=id,board,src_lang,title_en,title_ja,title_ko,body_en,body_ja,body_ko,translated,like_count,comment_count,created_at
    &id=eq.41&hidden_at=is.null
GET /rest/v1/comments?select=id,parent_id,alias_no,is_op,src_lang,body_ko,translated,created_at
    &post_id=eq.41&hidden_at=is.null&order=created_at.asc,id.asc

# HOME-02 이 글에 이미 교환 요청을 보냈는가 (exreq_mine)
GET /rest/v1/exchange_requests?select=id,status&post_id=eq.41&from_user=eq.<my uuid>

# HOME-07 오늘 보낸 요청 수 (헤더 Prefer: count=exact, Range 0-0)
GET /rest/v1/exchange_requests?select=id&from_user=eq.<my uuid>&created_at=gt.<now-24h>

# HOME-06
GET /rest/v1/my_incoming_requests?select=id,post_id,display_name,floor,created_at&order=created_at.desc
GET /rest/v1/my_contacts?select=id,display_name,instagram,floor,post_id,created_at&order=created_at.desc
GET /rest/v1/posts?select=id,title_ko&id=in.(5,3)          # 계기 글 제목. 숨겨진 글은 빠진다

# HOME-05 (운영자)
GET /rest/v1/report_queue?select=target_type,target_id,reason,n,last_at&order=last_at.desc
GET /rest/v1/posts?select=id,title_ko,body_ko,hidden_at&id=in.(7,12)      # 인용문
GET /rest/v1/comments?select=id,post_id,body_ko,hidden_at&id=in.(88)

# CAL-01 월 범위 (2026-09). 반복 일정은 시작이 이전 달일 수 있으므로 rrule 행을 함께 받아 클라이언트에서 전개
GET /rest/v1/events?select=id,kind,host_label,title_ko,place_ko,starts_at,ends_at,rrule,until_on,capacity,rsvp_count
    &starts_at=lt.2026-10-01T00:00:00+09:00
    &or=(starts_at.gte.2026-09-01T00:00:00+09:00,and(rrule.not.is.null,or(until_on.is.null,until_on.gte.2026-09-01)))
    &order=starts_at.asc
GET /rest/v1/event_overrides?select=event_id,occurs_on,cancelled,title_ko&occurs_on=gte.2026-09-01&occurs_on=lt.2026-10-01

# CAL-02
GET /rest/v1/events?select=*&id=eq.4
GET /rest/v1/event_rsvps?select=event_id,occurs_on&event_id=eq.4

# MAP-01
GET /rest/v1/places?select=id,cat,name_ko,note_ko,lat,lng,google_place_id,walk_min,added_label
    &hidden_at=is.null&order=walk_min.asc

# 본인 정보 (SYS-01, HOME-01 ⚑, HOME-07)
GET /rest/v1/profiles?select=display_name,instagram,lang,is_admin
GET /rest/v1/residency?select=floor&active=is.true
```

`places.added_by`, `events.created_by` 는 select 목록에 넣지 않는다. 입주자 RLS 로 읽을 수는 있는 uuid 이며, `my_contacts.id` 와 대조하면 장소·이벤트 등록자를 특정할 수 있다 (§9 신규 항목 N-6).

### 5.2 쓰기 RPC (`schema.sql` §11, :401-535)

현재 6개 함수 모두 `public` 회수 후 `authenticated` 에 EXECUTE 부여(:532-535). 모두 `SECURITY DEFINER set search_path = public`.

| 함수 (줄) | 시그니처 | 호출 주체 (Q4 제안 기준) | 사전 조건 | 오류 (정확한 문자열) | 부수 효과 |
|---|---|---|---|---|---|
| `create_post` (:401-421) | `(p_board board, p_src lang, p_title_en/ja/ko text, p_body_en/ja/ko text, p_translated boolean) → bigint` | **서버 전용** (`service_role`) | `is_resident()` | `not a resident` | `posts` + `post_authors` + `thread_aliases(alias_no=0)` 한 트랜잭션 |
| `add_comment` (:423-451) | `(p_post bigint, p_parent bigint, p_src lang, p_body_en/ja/ko text, p_translated boolean) → bigint` | **서버 전용** | `is_resident()` | `not a resident` | 별칭 재사용 또는 `max+1` 발급, `is_op = (alias_no=0)`, `comments` + `comment_authors`, `comment_count` +1 (트리거) |
| `request_exchange` (:453-477) | `(p_post bigint) → bigint` | 클라이언트 (`authenticated`) | 입주자, 24시간 3건 미만, 작성자 ≠ 본인, 미교환 | `not a resident`, `daily limit`, `bad target`, `already exchanged`, + unique 위반 `23505`(`exchange_one_pending`, :165) | `exchange_requests` INSERT |
| `respond_exchange` (:479-497) | `(p_req bigint, p_accept boolean) → void` | 클라이언트 | 요청이 나에게 온 `pending` | `no such request` | `status` 변경, 수락 시 `exchanges` INSERT (`on conflict do nothing`) |
| `submit_report` (:499-508) | `(p_type text, p_id bigint, p_reason report_reason) → void` | 클라이언트 | `is_resident()` | `not a resident`, `p_type` 이 post/comment 가 아니면 check 위반 `23514` | `reports` INSERT, 중복은 `on conflict do nothing` (조용히 무시) |
| `moderate` (:511-530) | `(p_type text, p_id bigint, p_action text) → void` | 클라이언트 (운영자 JWT) | `is_admin()` | `not an operator`, `p_action` 이 hide/unhide/keep 아니면 `mod_actions` check 위반 `23514` (전체 롤백) | `hidden_at` 설정/해제, 해당 대상 신고 전부 `resolved_at`, `mod_actions` INSERT |

**현재 스키마와 제안의 차이**

- **Q4 / S-5:** `create_post`, `add_comment` 는 `auth.uid()` 를 작성자로 쓴다(:418-419, :434-449). 서버가 `service_role` 로 부르면 `auth.uid()` 가 null 이라 `is_resident()` 가 false → 항상 `not a resident`. **제안 시그니처:** `create_post(p_author uuid, p_board …)`, `add_comment(p_author uuid, p_post …)`, 내부 `auth.uid()` → `p_author`, 거주 검사는 `exists(select 1 from residency where user_id = p_author and active)`. 권한은 `revoke execute … from public, anon, authenticated; grant execute … to service_role`.
- **S-2:** `request_exchange` 의 `bad target` / `already exchanged` / `23505` 가 작성자 동일성을 드러낸다. 실패한 호출은 롤백되어 3건 제한(:460-463)에 집계되지 않는다. 수정 후 오류는 하나로 균일화해야 하므로 §5.4 의 UI 매핑도 함께 바뀐다.
- **S-3:** `moderate()` 를 거치지 않는 `hidden_at` 직접 UPDATE 가 정책상 가능하다(:324-327).
- **S-6:** `add_comment` 는 글 숨김 여부, `p_parent` 소속, 1단계 제한, 길이를 검사하지 않는다.
- **Q7:** `request_exchange` 는 `posts.board` 를 확인하지 않는다(UI 는 `EXBOARDS` 로 제한, :746).
- `respond_exchange` 에는 `is_resident()` 검사가 없다(:479-497). 퇴거자도 받은 요청을 수락할 수 있다.

**직접 테이블 쓰기 (RPC 아님)**

```http
POST   /rest/v1/likes          {"post_id":41,"user_id":"<my uuid>"}     # user_id 기본값 없음 → 클라이언트가 보낸다 (likes_self check)
DELETE /rest/v1/likes?post_id=eq.41&user_id=eq.<my uuid>
POST   /rest/v1/event_rsvps    {"event_id":4,"occurs_on":"2026-09-15","user_id":"<my uuid>"}
DELETE /rest/v1/event_rsvps?event_id=eq.4&occurs_on=eq.2026-09-15&user_id=eq.<my uuid>
DELETE /rest/v1/exchanges?a=eq.<least>&b=eq.<greatest>                 # my_contacts.id 와 내 uuid 로 정렬해 계산
PATCH  /rest/v1/profiles?id=eq.<my uuid>   {"lang":"ko"}                 # S-1 수정(컬럼 한정) 전에는 배포 금지
```

`reports` 는 `reports_insert` 정책(:335)으로 직접 INSERT 도 가능하다. 두 경로가 공존하면 중복 처리가 달라진다(직접 INSERT 는 `23505`, RPC 는 무시). **제안:** `submit_report` 하나로 통일하고 직접 INSERT 정책은 제거하거나, 반대로 RPC 를 없애고 `23505` → `repAlready` 로 매핑한다.

### 5.3 서버 엔드포인트 — **제안 (아직 없음)**

PRD §9 구성. 위치는 Supabase Edge Functions(도쿄 프로젝트와 같은 리전)를 1안으로 둔다. 비밀값: `SUPABASE_SERVICE_ROLE_KEY`, `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`.

#### `POST /api/posts` (제안)

```jsonc
// 요청 — Authorization: Bearer <user JWT>
{ "board": "market", "src_lang": "ja", "title": "炊飯器ゆずります 1500円", "body": "来月帰国するので…" }

// 201
{ "id": 42, "translated": true }

// 오류
// 401 {"error":"unauthorized"}            JWT 없음/검증 실패
// 403 {"error":"not_resident"}            DB 'not a resident'
// 422 {"error":"invalid","field":"title"} 빈 값, 제목 60자 초과(M-9), 본문 상한(제안 4000자) 초과, board/src_lang enum 외
// 429 {"error":"rate_limited"}            작성 빈도 제한 (M-9, 제안)
```

#### `POST /api/posts/:id/comments` (제안)

```jsonc
// 요청
{ "src_lang": "ko", "body": "아직 자리 남았나요?", "parent_id": null }
// 201
{ "id": 88, "alias_no": 2, "is_op": false, "translated": true }
// 오류: 401, 403 not_resident, 404 post_not_found(숨김 포함 — S-6 수정 후), 422 invalid(parent 가 다른 글이거나 대댓글의 대댓글)
```

`add_comment` 는 `id` 만 반환하므로 응답의 `alias_no`/`is_op` 는 서버가 `service_role` 로 다시 읽거나 함수 반환형을 바꿔야 한다.

#### 처리 순서 (두 엔드포인트 공통)

1. `Authorization` 의 JWT 를 검증해 `user_id` 를 얻는다 (`auth.getUser(jwt)`).
2. 입력 검증(길이, enum). 클라이언트가 보낸 `src_lang` 은 작성 화면의 UI 언어(프로토타입은 `S.lang`, :1836)이다.
3. 번역: Azure Translator v3 `POST https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from={src}&to={a}&to={b}`, 헤더 `Ocp-Apim-Subscription-Key`, `Ocp-Apim-Subscription-Region`, 본문 `[{"Text":title},{"Text":body}]`. 타임아웃 5초(제안).
4. **실패 처리:** 비-2xx(F0 월 한도 초과 시 403, 초당 한도 429 등), 타임아웃, 네트워크 오류는 모두 같은 경로 — 원문을 세 언어 칸에 그대로 복사하고 `translated=false`. 작성 자체는 실패시키지 않는다 (L-2, PRD §12).
5. `service_role` 로 `rpc/create_post`(제안 시그니처, `p_author = user_id`) 호출.
6. 결과를 반환. 서버 로그에 `user_id` 와 글 id 를 함께 남기지 않는다 (작성자 테이블 외 경로로 연결이 새는 것을 막기 위해).

**문자 수 예산:** Azure 는 대상 언어마다 문자를 센다. 대상이 2개이므로 F0 월 200만 자는 원문 기준 약 100만 자다.

### 5.4 오류 → UI 문자열 매핑

| 원인 | 출처 | 표시할 `T` 키 | 상태 |
|---|---|---|---|
| `daily limit` | `request_exchange` | `exLimit` | 있음 (프로토타입은 로컬 `sentToday` 로 판단, :1873) |
| `23505` `exchange_one_pending` | `request_exchange` | `exDone` | 있음. 단 S-2 수정 시 균일 오류로 통합 |
| `already exchanged` | `request_exchange` | — | **없음.** S-2 에 따라 별도 문구를 두지 않는 것을 권장 |
| `bad target` | `request_exchange` | — | **없음** (S-2: 균일 오류) |
| `no such request` | `respond_exchange` | — | **없음** (예: 상대가 이미 처리) |
| 신고 중복 | `submit_report` | `repAlready` | 있음. 단 **RPC 가 중복을 조용히 무시하고 `void` 를 반환**하므로 서버 응답으로는 판단 불가 — 로컬 상태로만 표시 가능 |
| `not a resident` | 쓰기 함수 공통 | — | **없음** (퇴거·미등록 안내 문구 필요) |
| `not an operator` | `moderate` | — | **없음** |
| `23505` 좋아요 중복 | `likes` | — | 무시(토글 상태만 재동기화) |
| 정원 초과 | (스키마에 검사 없음, Q6) | `full` | 라벨만 있음 |
| 번역 실패 (`translated=false`) | 서버 | — | **없음.** 현재 상세 화면은 `src_lang ≠ lang` 이면 무조건 "`trBy`(Machine translation)" 와 토글을 보인다(:885). 번역 안 된 글에 "자동 번역" 이 붙는다 |
| 네트워크·5xx | 공통 | — | **없음** |
| 지도 로드 실패 | Leaflet | `mapFail` | 있음 |

성공 토스트는 기존 키를 그대로 쓴다: `posted`, `repDone`, `exSent`, `exOk`, `exNo`, `exCut`, `kept`, `hidden`, `joinedT`, `addedIcs`, `vnGot`, `vnHave`. (`T.*.reported` 는 정의만 있고 어디서도 쓰이지 않는다.)

---

## 6. 프로토타입 → 실데이터 필드 매핑

### 6.1 `POSTS` (:668) → `posts`, `comments`, `likes`

| mock | 스키마 | 비고 |
|---|---|---|
| `id` | `posts.id` | 숫자. 새 글은 `Date.now()`(:1836) — 서버 id 로 교체 |
| `board` | `board` | 값 동일 |
| `src` | `src_lang` | |
| `min` (경과 분) | `created_at` | `ago()`(:831)는 `(now - created_at)/60000` 을 받도록 |
| `t.{ja,en,ko}` | `title_ja/en/ko` | |
| `b.{ja,en,ko}` | `body_ja/en/ko` | |
| (없음) | `translated` | mock 에 없음 → §5.4 문제 |
| `likes` | `like_count` | S-4 수정 전에는 늘지 않음 |
| `liked` | `likes` 에 내 행 존재 여부 | |
| `c.length` | `comment_count` | 피드에서 댓글 배열 대신 카운터 사용 |
| `hidden` (운영 시 추가) | `hidden_at` | |
| `c[].a` | `comments.alias_no` | |
| `c[].op` | `is_op` | |
| `c[].src` | `comments.src_lang` | |
| `c[].min` | `comments.created_at` | |
| `c[].t.{…}` | `comments.body_*` | 댓글은 제목이 없는데 mock 키 이름이 `t` |
| `c[].reply: true` | `parent_id` | mock 은 **어느 댓글에 단 답인지** 정보가 없다 — 실데이터는 `parent_id` 로 들여쓰기 |
| 댓글 신고 키 `pid:ci`(배열 인덱스, :1823) | `comments.id` | 인덱스는 숨김·정렬에 따라 바뀌므로 id 로 교체 |

### 6.2 `REPORTS` (:737) → `report_queue`

| mock | 스키마 |
|---|---|
| `why` | `reason` |
| `kind: "post" \| "cmt"` | `target_type: 'post' \| 'comment'` (**값 다름**) |
| `pid` | `target_id` (댓글이면 댓글 id) |
| `n` | `n` |
| `quoted` | 뷰에 없음 → `posts`/`comments` 별도 조회 |
| `id` | 없음 → 행 키는 `(target_type, target_id, reason)`. `moderate` 는 대상 단위로 모든 사유를 한꺼번에 해결한다 |

### 6.3 `ME`, `REQS`, `EXCH` (:745-749)

| mock | 스키마 | 비고 |
|---|---|---|
| `ME.name` | `profiles.display_name` | |
| `ME.room` | `residency.room` | **노출 금지** — `exWarn` 의 `{r}` 은 층으로 (Q1) |
| `ME.insta` | `profiles.instagram` | |
| `REQS[].id` | `my_incoming_requests.id` | |
| `REQS[].name` | `display_name` | |
| `REQS[].room` | `floor` | Q1 |
| `REQS[].insta` | — | 뷰에 없음(의도). mock 도 화면에 쓰지 않음 |
| `REQS[].pid` / `at` | `post_id` / `created_at` | |
| `EXCH[].id` | (없음) | `exchanges` 에 id 없음 → `(a,b)` 로 삭제 |
| `EXCH[].name/insta/pid/at` | `my_contacts.display_name/instagram/post_id/created_at` | |
| `EXCH[].room` | `my_contacts.floor` | Q1 |
| `sentToday` | `exchange_requests` 24시간 카운트 | 함수는 "최근 24시간", mock 은 "오늘" |

### 6.4 `EVENTS` (:760), `HOSTS` (:754) → `events`, `event_rsvps`

| mock | 스키마 | 비고 |
|---|---|---|
| `id: "e1"` | `id bigint` | 문자열 → 숫자 |
| `kind` | `kind` | 값 동일 |
| `d` + `time` | `starts_at` | `Asia/Tokyo` 로 해석 (`downloadICS`, :813) |
| `d` + `end` | `ends_at` | |
| `repeat: true` | `rrule` (예: `FREQ=WEEKLY;BYDAY=TU`) + `until_on` | mock 은 회차마다 별도 행(e4, e6) — C-7 |
| `host` (→ `HOSTS[host]` 3개 언어) | `host_label text` | **스키마는 단일 언어 텍스트**. `HOSTS` 는 3개 언어 → 불일치 (§9 N-3) |
| `place.{…}` | `place_ja/en/ko` | |
| `t`, `b` | `title_*`, `body_*` | |
| `cap` | `capacity` | |
| `going` | `rsvp_count` | 트리거 없음 (Q6) |
| `S.going[id]` | `event_rsvps` 내 행 (`occurs_on` 포함) | |

### 6.5 `PLACES` (:1351) → `places`

| mock | 스키마 | 비고 |
|---|---|---|
| `id: "p1"` | `id bigint` | |
| `cat` | `cat` | 값 동일 |
| `min` | `walk_min` | |
| `lat`, `lng` | `lat`, `lng` | |
| `gid` | `google_place_id` | 링크는 `GMAP + gid` (:1349) |
| `by` | `added_label` | mock 값 `"RA"`, `"GIP"`, `"匿名"` — `"匿名"` 은 하드코딩(P-3). 실데이터는 `'Anon'` 같은 코드값을 저장하고 `T` 로 번역 표시 (제안) |
| `n.{…}` | `name_*` | |
| `d.{…}` | `note_*` | |
| `ang` (방위각) | **없음** | 코드 어디서도 읽지 않는 데이터. `T.*.ring`, 클릭 핸들러의 `g.pin` 분기(:1804)와 함께 이전 SVG 지도의 잔재로 보인다 |

### 6.6 정적 콘텐츠 (DB 로 옮기지 않음)

`LESSONS`, `VN`, `ENDINGS`, `HOSTS`(이벤트 주최 표시를 `host_label` 코드로 바꾼다면 `T` 로), `TODAY`(→ 실제 현재 날짜). 컬렉션 `S.cg` 의 저장 위치는 Q9.

---

## 7. 에셋

### 7.1 앱 아이콘 (완료)

| 파일 | 크기 | 쓰는 곳 |
|---|---|---|
| `icon-180.png` | 180×180 | `apple-touch-icon` (`index.html:15`) |
| `icon-192.png` | 192×192 | favicon(:16), manifest `any`, 바로가기 아이콘 |
| `icon-512.png` | 512×512 | manifest `any` |
| `icon-maskable-512.png` | 512×512 | manifest `maskable` |

모두 `sw.js` 의 `SHELL`(:4-12)에 들어 있다. manifest `theme_color`/`background_color` `#1D3E5C`.

### 7.2 일본어 에피소드 그림 (미제작, J-6)

| 묶음 | 데이터 | 개수 | 장면 메모 | 표시 컨테이너 |
|---|---|---|---|---|
| 만화 컷 | `LESSONS[l1..l7].cuts[]` | 7화 × 8컷 = **56** | 전부 `s` 있음 | `.cutph` 4:3 (`index.html:413`) |
| 분기형 장면 | `VN.osaka.scenes`, `VN.kyoto.scenes` | 5 + 5 = **10** | 전부 `s` 있음 | `.cgart` 4:3 (:363) |
| 엔딩 카드 | `ENDINGS` | **5** (`e_osaka_best`, `e_osaka_norm`, `e_kyoto_best`, `e_kyoto_norm`, `e_both`) | 전부 `s` 있음 | 컬렉션 `.cgart` 4:3, 엔딩 화면 `.cgart.big` **3:2** (:369) |
| 합계 | | **71** | | |

`l8` 은 `cuts: []` 이다(분기형). 각 항목에 `img:"경로"` 를 추가하면 자리표시가 교체된다 (`lesson()`, `vnView()`, `collection()`).

> 2026-10-25: 만화 컷 규격은 **대체됨** — 레벨 1~7 은 2쪽 × 4칸 페이지(세로 2:3), 규칙은 [comic-scripts.md](../06-design/comic-scripts.md) 와 RFC-0003 §10. 아래는 v1.3 시절 기록.

**규격 (제안)**

| 항목 | 값 | 근거 |
|---|---|---|
| 파일 이름 | `art/l1-01.webp` … `art/l7-08.webp` (컷 번호 2자리, 1부터) / `art/vn-osaka-1.webp` … `art/vn-kyoto-5.webp` / `art/end-osaka-best.webp` (`ENDINGS.id` 에서 `e_` 제거, `_`→`-`) | |
| 형식 | WebP, 품질 80, 장당 150KB 이하 | 71장 × 150KB ≈ 10.6MB 상한 |
| 컷·장면 크기 | **1200×900** (4:3) | 열 폭 `--col: 430px`(:35) − 좌우 18px 패딩 = 394px, 3x DPR ≈ 1182px |
| 엔딩 카드 크기 | **1200×900** (4:3), 중앙 1200×800 이 3:2 안전 영역 | 같은 이미지가 4:3(컬렉션)과 3:2(엔딩)로 `object-fit: cover`(:366) 잘린다 → 위아래 50px 씩 잘려도 되는 구도 |
| 대체 텍스트 | 현재 `alt=""` | 장면 메모 `s` 를 3개 언어로 옮겨 `alt` 로 쓰는 것을 제안 (A-5) |

주의: 컷 이미지는 `.cut img{width:100%}`(:412)로 **비율 고정이 없다**. 4:3 이 아닌 파일을 넣으면 자리표시와 높이가 달라진다 → 반드시 4:3 으로 납품하거나 `aspect-ratio` 를 추가한다.

### 7.3 외부 자원

Leaflet 1.9.4, markercluster 1.5.3 (cdnjs, `index.html:17-20`), OSM 타일. 교차 출처라 서비스 워커가 캐시하지 않는다(`sw.js:35`) → 오프라인 지도 불가(A-1).

---

## 8. 환경·배포

| 항목 | 내용 |
|---|---|
| 호스팅 | GitHub Pages, 저장소 루트. manifest `start_url`/`scope` 가 `./`, `sw.js` 도 상대 경로 → `/<repo>/` 하위 경로에서 그대로 동작 |
| 캐시 | `sw.js:2` `CACHE = "yui-v1"`. **배포 산출물이 바뀔 때마다 올린다.** 탐색 요청과 `.json` 은 network-first, 그 외 같은 출처 정적 자원은 cache-first. `art/*.webp` 도 cache-first 로 잡히므로 **같은 파일명으로 그림을 교체하면 `CACHE` 를 올려야** 새 그림이 보인다. 그림은 `SHELL` 에 넣지 않는다(설치 용량) |
| Supabase 요청 | 교차 출처라 SW 를 통과하지 않는다 → 오프라인 시 데이터 없음. 빈 상태·오류 문구 필요(§5.4) |
| 백엔드 | Supabase 무료 티어, **도쿄 리전** (`ap-northeast-1`). `schema.sql` 을 마이그레이션으로 적용 (S-1~S-6 수정본) |
| 번역 | Azure Translator F0 (월 200만 자, 초과 시 중단) |
| 비밀값 | `.gitignore` 가 `.env`, `.env.*` 를 막고 `.env.example` 만 허용. `service_role` 키와 번역 키는 커밋 금지(.gitignore 주석). 클라이언트에는 `SUPABASE_URL` 과 `anon` 키만 — 이 둘은 공개값이므로 `index.html` 에 넣어도 된다 |
| Supabase 로컬 상태 | `.branches/`, `.temp/` 무시 |
| 품질 게이트 | `CLAUDE.md` 의 헤드리스 렌더 스크립트 통과 + PRD §7 익명성 검증 테스트(8단계 test-plan) |

---

## 9. 개발 착수 전 확인 사항

### 9.1 PRD 에서 이미 정의된 항목

| 시점 | 항목 |
|---|---|
| M1 전 필수 | S-1 (`is_admin` 자기 승격), S-2 (교환 요청으로 작성자 추적), S-3 (운영 기록 우회), S-4 (좋아요 카운트), S-5 (RPC 직접 호출), S-6 (`add_comment` 검사) |
| M2 전 | Q3 로그인 방식 → S-7 가입 경로, AUTH-01 화면. Q1 방 번호 vs 층 (`exWarn`, HOME-06) |
| M3 전 | Q4 작성 함수 호출 권한(§5.2 제안 시그니처), Q6 정원·`rsvp_count`, Q7 교환 게시판 제한, M-9 길이·빈도 제한 |
| M4 전 | Q5 입주자 주최 이벤트 등록, Q8/Q11 RA 권한 |
| 기타 | Q2 미사용 실명 공개 문자열, Q9 컬렉션 저장, Q10 지표 집계, Q12 README 정정, S-8 작성자 삭제, S-9 `esc()` 누락 |

### 9.2 이 문서 작성 중 새로 확인한 항목 (PRD 미기재)

| # | 내용 | 근거 | 제안 |
|---|---|---|---|
| N-1 | Supabase 는 `public` 스키마 함수에 기본 권한으로 `anon`, `authenticated` 에 EXECUTE 를 직접 부여한다. `revoke … from public`(:532)만으로는 `anon` 권한이 남는다. Q4 를 적용할 때 `authenticated` 만 회수하면 같은 구멍이 남는다 | `schema.sql:532-535` | `revoke execute … from public, anon, authenticated` 를 명시. 테이블·뷰도 같은 기본 권한이 있으므로 RLS 를 끈 테이블이 생기지 않게 검사 |
| N-2 | `event_overrides` 에 쓰기 정책·함수가 없다. 운영자도 회차 취소·변경을 저장할 수 없다 | `schema.sql:351` (읽기만) | `events_write` 처럼 운영자 `for all` 정책 추가 |
| N-3 | `events.host_label` 은 단일 텍스트인데 프로토타입 주최 표시(`HOSTS`)는 3개 언어 | `schema.sql:189`, `index.html:754` | `host_label` 에 코드(`gip`/`office`/`ra`/`student` 또는 "Unit 12 RA")를 저장하고 `T` 로 번역, 또는 `host_*` 3개 컬럼 |
| N-4 | `translated=false` 인 글에도 상세 화면이 "자동 번역" 표시와 원문 토글을 보인다. 실패 안내 `T` 문자열이 없다 | `index.html:885` | `translated` 를 조건에 추가, `T` 에 "번역되지 않음" 3개 언어 추가 |
| N-5 | `submit_report` 는 중복을 조용히 무시하고 `void` 를 반환하는데, `reports_insert` 정책으로 직접 INSERT 도 가능하다(중복 시 `23505`). 두 경로의 동작이 다르고 RPC 경로로는 "이미 신고함"(`repAlready`, M-2)을 판단할 수 없다 | `schema.sql:335, 499-508` | 한 경로로 통일하고 중복 여부를 반환 |
| N-6 | `my_contacts.id` 가 상대의 uuid 를 준다. 입주자가 읽을 수 있는 `places.added_by`, `events.created_by`(그리고 S-2 의 `exchange_requests.to_user`)와 대조하면 교환 상대가 등록·작성한 항목을 특정할 수 있다 | `schema.sql:367, 235, 199` | 해당 컬럼을 column GRANT 에서 제외, 교환 해제는 `unlink_exchange(p_post)` 같은 RPC 로 |
| N-7 | 엔딩 카드 그림 하나가 컬렉션(4:3)과 엔딩 화면(3:2) 두 비율로 잘린다. 만화 컷 `img` 는 비율 고정이 없어 4:3 이 아니면 레이아웃이 바뀐다 | `index.html:363, 369, 412` | §7.2 규격(안전 영역) 또는 `aspect-ratio` 추가 |
| N-8 | `likes_self`, `rsvp_self` 는 `is_resident()` 를 보지 않는다. 퇴거자(입주 정보 비활성)도 좋아요·참가 행을 쓸 수 있고, `respond_exchange` 도 거주 검사가 없다 | `schema.sql:330, 355, 479` | 정책·함수에 `is_resident()` 추가 |
| N-9 | `report_queue` 에는 행 id 와 인용문이 없고 (대상, 사유)별로 행이 나뉜다. 프로토타입 큐(`REPORTS.quoted`, 사유별 카드)와 모양이 다르다. `moderate` 는 대상의 모든 사유를 한 번에 해결한다 | `schema.sql:384-389, 525` | 큐 UI 를 대상 단위로 묶고 인용문은 별도 조회 (§5.1) |
| N-10 | 미사용 데이터·코드: `PLACES[].ang`, `T.*.ring`, `T.*.reported`, 클릭 핸들러의 `g.pin` 분기 | `index.html:1352`(PLACES), `:507`, `:1804` | 실데이터 연결 시 정리 |
