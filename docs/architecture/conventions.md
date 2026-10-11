# 개발 컨벤션

| | |
|---|---|
| 상태 | 제안 (v0.1) |
| 작성일 | 2026-10-11 |
| 근거 | `CLAUDE.md`, `index.html`, `sw.js`, `schema.sql`, `.gitignore`, git 기록, PRD §8, 핸드오프 §1.2 |

§1~§3 은 **현재 코드에서 실제로 쓰는 관례를 추출**한 것이다. §4 이후는 실데이터 연결(M1~M3)을 위한 **제안**이다.

---

## 1. 클라이언트 (`index.html`) — 현행 관례

### 1.1 구조 (CLAUDE.md)

`<style>` → 마크업 → `<script>` 하나. 스크립트 순서: `T` → 데이터 상수 → `S` → 뷰 함수 → `render()` → 위임 `click`·`change` 핸들러 → 매니페스트 바로가기 처리 → 서비스 워커 등록.

### 1.2 이름

| 대상 | 관례 | 예 (`index.html`) |
|---|---|---|
| 데이터 상수 | 대문자 | `POSTS`, `EVENTS`, `PLACES`, `HOSTS`, `CBOARDS`, `EXBOARDS`, `DAILY_LIMIT` |
| 변경되는 mock 배열 | `let` 대문자 | `REPORTS`, `REQS`, `EXCH` |
| 상태 | `S` 한 객체, 짧은 키 | `S.lang`, `S.pid`, `S.eid`, `S.pl`, `S.cg` |
| 뷰 함수 | 소문자 명사, 인자 없음, HTML 문자열 반환 | `feed()`, `detail()`, `profiles()`, `sheet()` |
| HTML 조각 함수 | `…HTML()` | `chipsHTML()`, `pcardHTML()`, `plistHTML()` |
| 유틸 | 짧은 소문자 | `$`, `esc`, `ago`, `who`, `toast`, `d2` |
| 다국어 필드 | `{ja, en, ko}` 객체, 키 `t`(제목), `b`(본문), `n`(이름), `d`(설명) | `p.t[S.lang]` |
| `data-*` 속성 | 동작 이름 짧게. 값 있는 것은 `dataset`, 없는 것은 `hasAttribute` | `data-p`, `data-like`, `data-back`, `data-vnnext` |
| CSS 토큰 | `--` + 일본 색 이름 | `--washi`, `--sumi`, `--ai`, `--beni` |

### 1.3 규칙 (CLAUDE.md 에서 그대로)

- 모든 사용자 노출 문자열은 `T` 에 ja/en/ko 3개 언어로. `aria-label` 포함(BUG-10).
- 데이터에서 온 문자열은 `esc()`. **서버 데이터도 예외 없음.**
- `\uXXXX` 는 스크립트 안에서만.
- 고정 폭은 한국어 기준.
- 지도는 Leaflet 1회 생성, 갱신은 `updateMap()`.
- 개별 요소에 리스너 달지 않음. 예외는 `dragScroll()`·`fadeBoards` 처럼 `render()` 바깥에 고정된 요소(`#boards`)에 한 번만 다는 것 — 현행 코드가 `el._ds`, `bn._fd` 플래그로 중복을 막는다.
- 배포 산출물이 바뀌면 `sw.js` 의 `CACHE` 올림.
- 완료 판정은 CLAUDE.md 헤드리스 하네스 `clean`.

### 1.4 코드 모양

- 2칸 들여쓰기, 큰따옴표 문자열, 템플릿 리터럴로 HTML 조립.
- 한 줄에 여러 문장을 `;` 로 잇는 압축 스타일(클릭 핸들러). 새 코드도 주변과 맞춘다.
- 세미콜론 사용. 프레임워크·모듈·`import` 없음.

## 2. 서비스 워커

- `CACHE = "yui-v<n>"`. 배포마다 올림.
- 같은 출처만 처리, 교차 출처는 통과(`return`).
- 탐색·`.json` network-first, 나머지 cache-first.

## 3. SQL (`schema.sql`) — 현행 관례

- 소문자 키워드, 테이블 복수형(`posts`, `likes`), 다국어 컬럼은 `<name>_<lang>` (`title_en`).
- enum 값은 프로토타입 키와 같다(`board` = `CBOARDS`).
- 함수: `language plpgsql security definer set search_path = public`.
- 정책 이름: `<table>_<what>` (`posts_read`, `likes_self`).
- 섹션 머리 주석 `-- ===== n. 이름 =====`, 의도적 예외는 주석으로 이유를 적는다(`-- no policies, on purpose`).

---

## 4. 실데이터 연결 규칙 (제안)

| # | 규칙 | 이유 |
|---|---|---|
| C-1 | 네트워크 호출은 `API.*` 로만. 뷰 함수 안에서 `fetch` 금지 | ADR-0003, 뷰 동기 유지 |
| C-2 | 부수 효과(세션 복원, 첫 로드, `localStorage` 읽기 시작)는 `/* Manifest shortcuts` 주석 **아래**에 | CLAUDE.md 하네스가 그 아래를 잘라낸다 |
| C-3 | fixture 상수 이름(`POSTS`, `EVENTS`, `PLACES`, `LESSONS`, `VN`, `ENDINGS`)과 하네스가 쓰는 id(`l1`, `l8`, `p13`)를 유지 | 하네스 |
| C-4 | PostgREST 요청은 컬럼을 나열한다. `select=*` 금지 | 컬럼 GRANT (ERD §5.1) |
| C-5 | 서버 응답 → 화면 모양 변환은 `to<Thing>()` 매핑 함수 한 곳 | 핸드오프 §6 |
| C-6 | 오류는 서버 코드 문자열 → `T` 키 매핑 표 하나(`ERR`)로. 모르는 코드는 일반 오류 문구 | 핸드오프 §5.4, BL-53 |
| C-7 | `localStorage` 키는 `yui.` 접두어, 접근은 `try/catch` | RFC §8 |
| C-8 | 속성값은 항상 큰따옴표. `esc()` 가 `'` 를 바꾸지 않는다 | XSS |
| C-9 | 사용자 id·토큰을 `console.log` 하지 않는다 | 익명성 |
| C-10 | 공개값만 `CFG` 에. `sb_secret_`·`service_role` 문자열이 `index.html` 에 있으면 안 된다 | PR-4, TC-PR-03 |

## 5. SQL·마이그레이션 (제안)

| # | 규칙 |
|---|---|
| D-1 | 적용은 `supabase/migrations/` 의 번호순 파일로만(ERD §7). 대시보드 SQL 편집기로 스키마를 바꾸지 않는다 |
| D-2 | 새 테이블은 같은 마이그레이션에서 `enable row level security` 와 GRANT 를 명시. 정책 0 이 의도면 주석 |
| D-3 | 새 함수는 정의 직후 `revoke execute … from public, anon, authenticated` 후 필요한 역할에만 GRANT |
| D-4 | 정의자 함수는 `set search_path = public` 필수 |
| D-5 | 오류는 `raise exception using message = '<snake_code>'`. 대상의 존재·소유를 구별하는 메시지 금지(PR-10) |
| D-6 | 정책 식의 함수 호출은 `(select fn())` 로 감싼다 |
| D-7 | 클라이언트를 깨는 변경(컬럼 삭제·이름 변경)은 두 단계로: 추가 → 클라이언트 배포 → 삭제 |

## 6. Edge Functions (제안)

- 파일: `supabase/functions/<kebab-name>/index.ts`. 공통 코드는 `supabase/functions/_shared/`(번역 어댑터, 응답 헬퍼).
- 응답 형식: 성공 `201 {…}`, 오류 `{ "error": "<snake_code>", "field"?: "<name>" }` (핸드오프 §5.3).
- 로그: 소요 시간·결과 코드만. `user_id`·본문·글 id 금지.

## 7. 저장소·브랜치·커밋

현행 git 기록은 `main` 하나에 직접 커밋하는 형태다. 제안:

| 항목 | 규칙 |
|---|---|
| 브랜치 | `main` = 배포(GitHub Pages). 작업은 `feat/…`, `fix/…`, `docs/…` 짧은 브랜치 → PR |
| 커밋 메시지 | 명령형 한 줄 요약(영어 또는 한국어), 본문에 이유. 관련 ID 를 적는다: `fix: escape room and insta in profiles() (S-9, BUG-13)` |
| PR 체크 | 하네스 `clean`, `CACHE` 올림(클라이언트 변경 시), 마이그레이션이면 익명성 케이스 통과, 문자열 3개 언어 |
| 디렉터리 | 루트: `index.html`, `sw.js`, `manifest.webmanifest`, 아이콘, `schema.sql`(설계 기록). `art/`(그림, 핸드오프 §7.2), `supabase/`(제안), `docs/` |
