# 8단계 · QA 리포트 (M0 프로토타입, 1회차)

| | |
|---|---|
| 실행일 | 2026-10-11 |
| 대상 커밋 | `78ee98d` (`index.html`, `sw.js` `CACHE = "yui-v1"`) |
| 테스트 계획 | [test-plan.md](test-plan.md) — TC-ID 는 계획과 같다 |
| 실행 환경 | 헤드리스 Chromium (Playwright 1.56.1, chromium-1194), 375×812, DPR 2, `isMobile`, 터치, iPhone Safari UA / Node.js 22.22.0 |
| 실행하지 않은 환경 | **iOS Safari, Android Chrome 실기기, 데스크톱 브라우저는 이번 회차에 실행하지 않았다** (TC-A-08 미실행) |

---

## 1. 요약

전체 93개 케이스 중 71개를 실행했다. 화면 케이스는 en / ja / ko 세 언어로 모두 돌렸고, **세 언어 모두 기대결과를 충족해야 Pass** 로 판정했다.

| 결과 | 건수 | 비고 |
|---|---|---|
| Pass | **51** | |
| Fail | **19** | 결함 15건(→ 결함 13개, §5), PRD 에 "없음"으로 이미 적힌 미구현 4건(§6) |
| Blocked | **1** | TC-P-10 실제 CDN·OSM 타일 — 샌드박스 프록시가 차단 |
| 미실행 | **22** | 백엔드 (M1 이후) 20건, 배포 시점 점검 1건(TC-A-07), 실기기 1건(TC-A-08) |
| **합계** | **93** | |

- JS 예외(pageerror)는 3개 언어 전 플로우에서 **0건**.
- XSS(TC-SEC-01, 02)는 **Pass**. 제목 `<img src=x onerror=alert(1)>` 가 피드·상세·신고 시트·교환 시트 어디에서도 요소로 바뀌지 않았다.
- 심각도 **높음 2건**: 지도 탭에서 언어를 바꾸면 지도가 빈 칸이 됨(BUG-01, PRD P-1 에 기록된 문제 재현), 댓글 "숨기기"가 성공 토스트를 띄우지만 아무것도 숨기지 않음(BUG-02, PRD M-4 재현).
- 4.2 의 종료 기준("높음 이상 0건, 또는 PRD 에 프로토타입 한계로 기록")은 **두 건 모두 PRD 에 기록되어 있어 형식상 충족**한다. 다만 BUG-02 는 운영자에게 거짓 성공을 보여 주므로 M4 전에 반드시 고쳐야 한다.

## 2. 실행 방법

### 2.1 헤드리스 렌더 (`CLAUDE.md` 스크립트)

`CLAUDE.md` 의 "Testing" 절에 있는 스크립트를 **수정 없이** 저장소 루트에서 실행했다.

```
$ node -e '…CLAUDE.md 의 스크립트 그대로…'
clean
```

출력은 `clean` 한 줄이다. 11개 뷰 × 3개 언어, 분기형 에피소드 오사카·교토 각 6개 상태(장면 5 + 엔딩)에서 예외와 `undefined` / `[object Object]` 누출이 없었다 → **TC-L-02 Pass**.

### 2.2 Playwright 하네스

- 저장소 루트를 `python3 -m http.server 8765` 로 서빙했다.
- 하네스는 데이터 속성(`data-p`, `data-why`, `data-hide` …)으로 버튼을 눌러 F-1 ~ F-7 을 진행하고, 화면 DOM 과 앱 상태(`S`, `POSTS`, `LMAP`)를 읽어 기대결과와 비교했다. 언어마다 새 브라우저 컨텍스트에서 처음부터 실행했다.
- 레이아웃 측정은 상태를 직접 설정(`S.view = …; render()`)해 19개 화면 상태 × 3개 언어를 돌며 `scrollWidth > clientWidth`, 화면 밖으로 나간 요소, 요소 높이(줄바꿈)를 쟀다.
- 하네스 스크립트는 세션 작업 폴더에만 있고 저장소에는 넣지 않았다. 필요하면 `docs/08-qa/` 또는 별도 경로에 추가할 수 있다.

### 2.3 네트워크 제약과 대체

이 실행 환경의 외부 프록시는 `cdnjs.cloudflare.com` 과 `tile.openstreetmap.org` 접속을 거부한다(`CONNECT tunnel failed, 403`).

| 실행 | Leaflet | 지도 타일 | 쓰인 케이스 |
|---|---|---|---|
| 실제 네트워크 | 로드 실패 (`typeof L === "undefined"`) | 실패 | TC-P-08 (실패 안내), TC-P-10 → **Blocked** |
| 대체 실행 | npm 레지스트리에서 받은 **같은 버전** `leaflet@1.9.4`, `leaflet.markercluster@1.5.3` 의 `dist` 파일을 Playwright `route` 로 cdnjs URL 에 응답 | 계속 차단 (회색 배경) | TC-P-01 ~ P-07, P-09 |

대체 실행에서는 원래의 `.min.js` 대신 같은 버전의 비압축 `dist/leaflet.js` 를 썼다. 동작은 같지만 **실제 CDN 응답과 타일 렌더링은 확인하지 못했다**. 그래서 스크린샷의 지도에는 타일이 없다.

## 3. 결과표

근거는 하네스가 기록한 값이다. 언어별 값이 같으면 en 값만 적었다.

### 3.1 홈 · 게시판 · 보안

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-B-01 | Pass | 게시판별 카드 수 free 2, meet 1, unit 2, market 1, lost 1, all 7. 각 탭에 해당 게시판 글만 (3개 언어) |
| TC-B-02 | Pass | 7장, 경과 시간 38, 52, 150, 260, 300, 420, 1500분 순. 카드마다 게시판·시간·제목·발췌·댓글 수·좋아요 수 |
| TC-B-03 | Pass | 게시판 5종, `maxlength=60`, 70자 입력 → 60자, 규칙 4개, 익명 안내 표시 |
| TC-B-04 | Pass | en "Anon 1 / Anon 2 / Author", ja "匿名 1 / 匿名 2 / 投稿者", ko "익명 1 / 익명 2 / 글쓴이" |
| TC-B-05 | Pass | 좋아요 31 → 32(`aria-pressed=true`) → 31 |
| TC-B-06 | **Fail (미구현)** | 글 상세에 댓글·대댓글 입력란 없음. PRD B-6 "작성 UI 없음"과 일치 |
| TC-B-07 | Pass | 빈 제목으로 올리기 → 글쓰기 화면에 머무름. 단 아무 안내도 없음 (§7 관찰 1) |
| TC-B-08 | **Fail** | 제목·본문 입력 후 게시판을 "양도"로 바꾸면 제목 `""`, 본문 길이 0 (3개 언어). → BUG-03 · [스크린샷 03](screenshots/03-en-compose-after-board-change.png) |
| TC-B-09 | Pass | 올린 뒤 view=feed, 게시판 필터=all, 맨 위 글 = 방금 쓴 글, 저장 게시판=market, 토스트 "Posted" / "投稿しました" / "올렸습니다" |
| TC-B-10 | Pass | 일본어 원문 글(id 2)을 en, ko 에서 열면 토글 표시, 번역 → 원문 → 번역 제목 전환 정상. ja 에서는 토글 없음 · [스크린샷 02](screenshots/02-en-detail-translated.png) |
| TC-B-11 | Pass | 방금 쓴 글(원문 언어 = UI 언어)에 토글 없음 |
| TC-B-12 | Pass | 분실물 글을 숨긴 뒤 분실물 탭: "Nothing here yet. Write the first one." (ja, ko 도 해당 문구) |
| TC-SEC-01 | Pass | 피드·상세·신고 시트·교환 시트에서 생긴 `<img>` 0개, alert 대화상자 0회. 상세 제목 `innerHTML` = `&lt;img src=x onerror=alert(1)&gt;` · [스크린샷 04](screenshots/04-en-feed-xss-escaped.png) |
| TC-SEC-02 | Pass | 본문 `<script>…</script><b>bold</b> & "q"` 가 문자 그대로 표시, `<script>`·`<b>` 요소 0개 |
| TC-SEC-03 | **Fail (코드 검토)** | `profiles()` 가 `r.room`, `x.room`, `x.insta`(링크 텍스트와 `href`)를 `esc()` 없이 출력. 지금은 값이 상수라 실행으로 악용할 경로는 없음. → BUG-13 |

### 3.2 신고 · 운영

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-M-01 | Pass | 사유 6개, 큐 2 → 3건, 토스트 "Reported. An RA will look at it." |
| TC-M-02 | Pass | 시트 제목 "Report this comment", 큐에 kind=cmt, pid=2, ci=0 |
| TC-M-03 | Pass | 같은 글 재신고 → 시트 안 열림, 토스트 "You already reported this" |
| TC-M-04 | Pass | 큐 5건, 항목마다 사유·대상·건수·인용문. "Left up" 후 큐에서 제거 · [스크린샷 06](screenshots/06-en-ra-queue.png) |
| TC-M-05 | Pass | 글 7, 4 의 신고를 "숨기기" → 피드 id 목록에서 7, 4 사라짐 |
| TC-M-06 | **Fail** | 댓글 신고 "숨기기" → 토스트 "Hidden", 큐에서 삭제. 그러나 상세에 그 댓글이 그대로 있음 (3개 언어). → BUG-02 · [스크린샷 07](screenshots/07-en-hidden-comment-still-visible.png) |
| TC-M-07 | **Fail** | 신고 완료 후 view=feed. 신고한 글 문맥을 잃음 (IA-3). → BUG-08 |
| TC-M-08 | **Fail (미구현)** | 운영자 화면에 숨김 목록·복원 없음. PRD M-6 "운영자용 숨김 목록 없음"과 일치 |
| TC-M-09 | **Fail (미구현)** | 클릭 핸들러와 상세 화면에 수정·삭제 경로 없음 (코드 검토). PRD M-7 "없음"과 일치 |
| TC-M-10 | Pass | RA 일 때 ⚑ 가 HOME-01 에서만 보이고 다른 화면에서 숨겨짐 |
| TC-M-11 | 미실행 | 백엔드 (M1 이후) |

### 3.3 프로필 교환

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-X-01 | Pass | 교환 버튼: 유닛 #2 없음, 모집 #3 있음, 분실물 #4 있음, 양도 #5 있음, 자유 #6·#8 없음 |
| TC-X-02 | Pass | 보내기 전 경고: "Your name and room number (4112 Juha Bak) will be sent to them. They see it whether or not they accept." 단, 위치로 **방 번호**를 보여 줌 → TC-PR-06 |
| TC-X-03 | Pass | 3건 보낸 뒤 4번째 → 시트 안 열림, 토스트 "You can send up to 3 requests a day" |
| TC-X-04 | Pass | 받은 요청 "3617 Mina Tanaka would like to exchange profiles. Accept?" → 수락 시 교환 목록 맨 위로. 거절은 mock 요청이 1건뿐이라 하네스가 테스트용 요청 1건을 `REQS` 에 추가한 뒤 확인 — 목록에서 삭제, 교환 목록에 추가 안 됨, 토스트 표시 |
| TC-X-05 | Pass | Sofia Rossi · Room 2305 · `https://instagram.com/sofia.rss` · 계기 글 제목. 해제 후 목록에서 삭제 |
| TC-X-06 | Pass | 요청 있을 때 `raflag hasdot`, 수락 후 `raflag` |
| TC-X-07 | Pass | 보낸 뒤 버튼 비활성, "⇄ Request already sent", 토스트 "Request sent" |
| TC-X-08 | 미실행 | 백엔드 (M1 이후) |

### 3.4 캘린더

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-C-01 | Pass | en "September 2026", ja "2026年9月", ko "2026년 9월". 오늘 2026-09-09 강조, 30일, 이전/다음 달 이동 정상 · [스크린샷 10](screenshots/10-ko-calendar.png) |
| TC-C-02 | Pass | 9/12 선택 → e3 1건, 다시 누르면 다가오는 3건, 9/13 → "Nothing on this day." |
| TC-C-03 | Pass | 점 종류 ra, office, student, gip 4종 |
| TC-C-04 | Pass | "September 12 (Sat) 07:30–20:00", 주최·장소·"5 / 8", 설명 |
| TC-C-05 | Pass | 참가 → "6 / 8", 토스트 "You're on the list", 취소 → "5 / 8". 정원 찬 e5 "40 / 40 — Full", 버튼 비활성 |
| TC-C-06 | Pass (헤드리스 범위) | `e3.ics` 다운로드. `DTSTART;TZID=Asia/Tokyo:20260912T073000`, `DTEND;TZID=Asia/Tokyo:20260912T200000`, 언어별 `SUMMARY`. 실기기 캘린더 앱에서 여는 것은 미확인 (§7 관찰 3) |
| TC-C-07 | 미실행 | 백엔드 (M1 이후) |
| TC-C-08 | 미실행 | 백엔드 (M1 이후) |

### 3.5 일본어 학습

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-J-01 | Pass | 에피소드 8행(만화 7 + 분기형 1). 레벨 1: 컷 8개, 표현 3개(일본어·읽기·해설) |
| TC-J-02 | Pass | 루트 2개, 오사카·교토 각 5장면. 선택 후 피드백 표시, 선택지 전부 비활성 · [스크린샷 14](screenshots/14-ja-vn-feedback.png) |
| TC-J-03 | Pass | 오사카 전부 정답 5/5 → 베스트("See you again tomorrow"), 교토 전부 오답 0/5 → 노멀("The ochazuke story"). 토스트 "New card unlocked". 두 루트 완료 후 "both" 해금 |
| TC-J-04 | Pass | 컬렉션 "3 / 5": 획득 3장, 잠김 2장 · [스크린샷 16](screenshots/16-ja-collection.png) |
| TC-J-05 | **Fail (미구현)** | 새로고침 후 획득 카드 0장. PRD J-7 "세션 내에서만 유지"와 일치 (저장 위치 Q9 미결) |

### 3.6 지도

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-P-01 | Pass (대체 실행) | Leaflet 컨테이너, 結 마커, 클러스터 2 + 단일 핀 2, 목록 13곳 |
| TC-P-02 | Pass (대체 실행) | 목록/마커 수 transit 3/3, daily 5/5, food 1/1, study 1/1, admin 2/2, health 1/1, 전체 13/13 |
| TC-P-03 | Pass (대체 실행) | "Getting around · 7 min walk" / "Bike lockers (Gotenyama-higashi)" / 설명 / "Added by · 匿名" / `https://www.google.com/maps/place/?q=place_id:…` · [스크린샷 17](screenshots/17-en-map-placecard.png) |
| TC-P-04 | **Fail** | 익명 라벨이 en "Added by · 匿名", ko "추가 · 匿名". ja 만 정상. → BUG-09 |
| TC-P-05 | Pass (대체 실행) | 핀 선택·카테고리 변경 후에도 `LMAP` 같은 인스턴스. 선택 시 줌 16, 같은 항목 재선택 시 카드 닫힘 (§7 관찰 2) |
| TC-P-06 | **Fail** | 언어 메뉴만 열어도 `#lmap` 자식 0개, `.leaflet-container` 없음 (3개 언어). → BUG-01 |
| TC-P-07 | **Fail** | 언어 변경 후 `#lmap` 비어 있음, `LMAP` 은 남아 있음(`LMAP still set=true`) — PRD P-1 에 적힌 원인 그대로. → BUG-01 · [스크린샷 18](screenshots/18-ko-map-blank-after-language-change.png) |
| TC-P-08 | Pass | 실제 네트워크(CDN 차단)에서 "The map could not load. The list below still works." / ja / ko 문구 + 목록 13곳 · [스크린샷 19](screenshots/19-en-map-fallback-cdn-blocked.png) |
| TC-P-09 | Pass (대체 실행) | 다른 탭에 갔다가 돌아오면 지도 다시 생성 |
| TC-P-10 | **Blocked** | cdnjs, tile.openstreetmap.org 접속이 프록시에서 거부(403). 실제 CDN·타일 로드 확인 불가 |

### 3.7 공통 · i18n · 레이아웃

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-L-01 | Pass | 기본 en. 메뉴로 ja/ko 전환 시 `S.lang`, `<html lang>`, 탭바("◇홈"), 제목("결 게시판") 즉시 변경 |
| TC-L-02 | Pass | `CLAUDE.md` 스크립트 출력 `clean` (§2.1) |
| TC-L-03 | **Fail** | 375px HOME-01 에서 ja/ko 언어 버튼이 글자 단위로 세로 줄바꿈(71×67px, "日/本/語", "한/국/어"), en 은 부제 "GLOBAL COMMONS 結 -YUI-" 가 3줄. RA 버튼이 있으면 430px 에서도 ja/ko 버튼이 2줄. → BUG-07 · [스크린샷 24](screenshots/24-ja-feed-header.png), [20](screenshots/20-ko-feed.png), [01](screenshots/01-en-feed.png) |
| TC-L-04 | **Fail** | 하드코딩: `aria-label` "Language", "Profiles", "RA", "write", "prev", "next" (언어 무관 영어). en 신고 큐 "Post · 1 reports" (복수형). 장소 익명 라벨 "匿名" (TC-P-04). → BUG-09, BUG-10 |
| TC-L-05 | 미실행 | 백엔드 (M1 이후) |
| TC-L-06 | 미실행 | 백엔드 (M1 이후) |
| TC-L-07 | Pass | 19개 화면 상태 × 3개 언어에서 문서 폭 375px, 가로 스크롤 0. `scrollWidth > clientWidth` 인 요소는 의도된 가로 스크롤 2개(게시판 탭 `nav#boards`, 지도 칩 `#mfilters`)뿐. ko 게시판 탭 365/339px 로 가장 짧음 |
| TC-L-08 | **Fail** | 한국어 본문이 어절 중간에서 줄바꿈("그 / 대로예요", "도 / 후쿠지", "내솥 코 / 팅도"). CSS 에 `word-break` 지정 없음. → BUG-12 · [스크린샷 20](screenshots/20-ko-feed.png) |

### 3.8 PWA · 접근성 · 내비게이션

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-A-01 | Pass | `display=standalone`, `start_url=./`, 아이콘 3개 HTTP 200, maskable 있음, 바로가기 `./?tab=1`, `./?compose=1` |
| TC-A-02 | Pass | `sw.js` 등록·페이지 제어, 캐시 `yui-v1` 에 `/`, `/index.html`, 매니페스트, 아이콘 4개. 오프라인 새로고침 → 피드 7장 표시 |
| TC-A-03 | Pass | 오프라인에서 지도 탭: Leaflet 미캐시(`typeof L === "undefined"`) → 실패 안내 + 목록. PRD A-1 에 적힌 한계대로 |
| TC-A-04 | Pass | `?tab=1` → 캘린더(탭 2 선택), `?compose=1` → 글쓰기, 뒤로 → 피드 |
| TC-A-05 | **Fail** | 44×44px 미만: 뒤로 ‹ 15×23, 댓글 신고 ⚑ 24×29, 헤더 ⇄·⚑ 29~30×33, 언어 버튼 높이 33, 번역 토글 79×19, 캘린더 날짜 38×34, 지도 칩 높이 34. `aria-label` 은 있으나 영어 고정(TC-L-04). → BUG-11 |
| TC-A-06 | Pass | JS 예외 0건. 콘솔 오류는 전부 네트워크: OSM 타일 실패 111건, cdnjs 실패(차단·오프라인), "Service Worker registration blocked by Playwright" 경고(하네스 설정상 정상) |
| TC-A-07 | 미실행 | 배포 시점 점검. 이번 회차는 산출물을 바꾸지 않았으므로 해당 없음 |
| TC-A-08 | 미실행 | 실기기(iOS Safari, Android Chrome) 없음 |
| TC-NAV-01 | Pass | HOME-02 ‹ → HOME-01 |
| TC-NAV-02 | **Fail** | CAL-02 ‹ → view=feed, 탭바는 "Calendar" 선택 상태, ＋·⚑·⇄ 가 피드에 그대로. → BUG-05 · [스크린샷 12](screenshots/12-en-back-from-event-lands-on-feed.png) |
| TC-NAV-03 | **Fail** | JP-02 ‹ → feed (기대 JP-01). → BUG-05 |
| TC-NAV-04 | **Fail** | 피드 → 글 상세 → 브라우저 뒤로: URL 이 `about:blank` 로, 앱을 떠남. → BUG-06 |

### 3.9 익명성 · 개인정보 · 보안 (백엔드)

| TC-ID | 결과 | 근거 |
|---|---|---|
| TC-PR-01 | 미실행 | 백엔드 (M1 이후). 스키마가 적용된 DB 없음 |
| TC-PR-02 | 미실행 | 백엔드 (M1 이후) |
| TC-PR-03 | Pass (현 시점) | `index.html`, `sw.js`, `manifest.webmanifest` 에서 `service_role`, `eyJ…` JWT, `supabase.co`, `apikey` 검색 결과 0건. 아직 백엔드 연결 전이므로 M2 이후 재검증 필요 |
| TC-PR-04 | 미실행 | 백엔드 (M1 이후) |
| TC-PR-05 | 미실행 | 백엔드 (M1 이후) |
| TC-PR-06 | **Fail (UI 부분)** | 교환 경고(3개 언어)에 "4112", 받은 요청에 "3617 Mina Tanaka", 교환 목록에 "Room 2305". README·스키마 원칙("층만 보여준다")과 다름 — PRD Q1 미결. 백엔드 부분은 미실행. → BUG-04 · [스크린샷 21](screenshots/21-ko-exchange-sheet.png) |
| TC-PR-07 | 미실행 | 백엔드 (M1 이후) |
| TC-PR-08 | 미실행 | 백엔드 (M1 이후). PRD §7.1 S-1 에서 정적 검토로 결함이 이미 확인됨 → 지금 실행하면 Fail 이 예상된다 |
| TC-PR-09 | 미실행 | 백엔드 (M1 이후). S-2 정적 검토 결함 있음 |
| TC-PR-10 | 미실행 | 백엔드 (M1 이후). S-3 정적 검토 결함 있음 |
| TC-PR-11 | 미실행 | 문서 없음 (M5 범위) |
| TC-S-04 | 미실행 | 백엔드 (M1 이후). S-4 정적 검토 결함 있음 |
| TC-S-05 | 미실행 | 백엔드 (M1 이후) |
| TC-S-06 | 미실행 | 백엔드 (M1 이후) |
| TC-S-07 | 미실행 | 백엔드 (M1 이후), Q3 결정 대기 |
| TC-S-08 | 미실행 | 백엔드 (M1 이후) |

> 이 환경에는 `psql` 클라이언트만 있고 Postgres 서버가 없어 `schema.sql` 을 적용해 볼 수 없었다. 백엔드 케이스는 실행 결과가 없으며, "예상 Fail" 은 PRD §7.1 의 정적 검토를 옮겨 적은 것이지 실행 결과가 아니다.

## 4. 스크린샷

375×812, DPR 2 (PNG 16장, 약 1.9MB). 지도에 타일이 없는 것은 §2.3 의 네트워크 차단 때문이다.

| # | 파일 | 내용 |
|---|---|---|
| 01 | [01-en-feed.png](screenshots/01-en-feed.png) | en 피드. 헤더 부제 3줄 줄바꿈 (BUG-07) |
| 02 | [02-en-detail-translated.png](screenshots/02-en-detail-translated.png) | 일본어 원문 글을 en 으로: 번역 표시 + 원문 보기 토글 |
| 03 | [03-en-compose-after-board-change.png](screenshots/03-en-compose-after-board-change.png) | 게시판을 바꾼 직후 비어 버린 제목·본문 (BUG-03) |
| 04 | [04-en-feed-xss-escaped.png](screenshots/04-en-feed-xss-escaped.png) | XSS 제목·본문이 문자 그대로 표시된 피드 |
| 06 | [06-en-ra-queue.png](screenshots/06-en-ra-queue.png) | RA 신고 큐 ("1 reports" 복수형, BUG-10) |
| 07 | [07-en-hidden-comment-still-visible.png](screenshots/07-en-hidden-comment-still-visible.png) | "숨기기" 처리 후에도 남아 있는 댓글 (BUG-02) |
| 10 | [10-ko-calendar.png](screenshots/10-ko-calendar.png) | ko 캘린더, 9/12 선택 |
| 12 | [12-en-back-from-event-lands-on-feed.png](screenshots/12-en-back-from-event-lands-on-feed.png) | 이벤트 상세에서 뒤로 → 피드 + 탭바는 Calendar (BUG-05) |
| 14 | [14-ja-vn-feedback.png](screenshots/14-ja-vn-feedback.png) | 분기형 장면, 선택 후 피드백 |
| 16 | [16-ja-collection.png](screenshots/16-ja-collection.png) | 컬렉션 3/5 |
| 17 | [17-en-map-placecard.png](screenshots/17-en-map-placecard.png) | 지도(대체 Leaflet) + 장소 카드 "Added by · 匿名" (BUG-09) |
| 18 | [18-ko-map-blank-after-language-change.png](screenshots/18-ko-map-blank-after-language-change.png) | en → ko 변경 직후 빈 지도 (BUG-01) |
| 19 | [19-en-map-fallback-cdn-blocked.png](screenshots/19-en-map-fallback-cdn-blocked.png) | CDN 차단 시 실패 안내 + 목록 |
| 20 | [20-ko-feed.png](screenshots/20-ko-feed.png) | ko 피드. "한/국/어" 세로 줄바꿈, 어절 중간 줄바꿈 (BUG-07, BUG-12) |
| 21 | [21-ko-exchange-sheet.png](screenshots/21-ko-exchange-sheet.png) | ko 교환 요청 경고. 방 번호 "4112" 노출 (BUG-04) |
| 24 | [24-ja-feed-header.png](screenshots/24-ja-feed-header.png) | ja 헤더 확대. "日/本/語" 세로 줄바꿈 (BUG-07) |

## 5. 결함 목록

| BUG-ID | 심각도 | 제목 | 재현 절차 | 기대 / 실제 | 관련 요구사항 · TC |
|---|---|---|---|---|---|
| BUG-01 | 높음 | 지도 탭에서 언어 메뉴를 열거나 언어를 바꾸면 지도가 빈 칸이 된다 | 1. 지도 탭 2. 🌐 언어 메뉴 열기 (또는 다른 언어 선택) | 기대: 지도 유지, 라벨만 변경 / 실제: `#lmap` 이 빈 `div` 로 교체되고 `LMAP` 이 남아 있어 `initMap()` 이 다시 불리지 않음. 다른 탭에 갔다 와야 복구 | P-1 · TC-P-06, TC-P-07 |
| BUG-02 | 높음 | 댓글 신고를 "숨기기" 해도 댓글이 숨겨지지 않는데 성공 토스트가 뜨고 큐에서 사라진다 | 1. 댓글 있는 글 상세 2. 댓글 ⚑ → 사유 선택 3. 헤더 ⚑ → 해당 항목 "숨기기" 4. 글 상세 다시 열기 | 기대: 댓글이 입주자에게 보이지 않음 / 실제: 댓글 그대로. 토스트 "Hidden", 신고는 큐에서 삭제되어 운영자가 다시 볼 방법 없음 | M-4, M-6 · TC-M-06 |
| BUG-03 | 중간 | 글쓰기에서 게시판을 바꾸면 입력한 제목·본문이 사라진다 | 1. ＋ 2. 제목·본문 입력 3. 게시판 선택 변경 | 기대: 입력 유지 / 실제: `change` 핸들러가 `render()` 를 불러 폼 전체를 새로 그림 → 제목·본문 빈 칸 | B-3 · TC-B-08 |
| BUG-04 | 중간 | 프로필 교환 화면이 방 번호를 보여 준다 | 1. 양도 글 → 교환 요청 (경고 문구) 2. 헤더 ⇄ (받은 요청, 교환 목록) | 기대: 층만 표시 (README, `schema.sql` 뷰) / 실제: "4112", "3617", "Room 2305" 노출. 3개 언어 문구(`exWarn`, `room`)가 방 번호 전제 | PR-7, X-2, PRD Q1 · TC-PR-06 |
| BUG-05 | 중간 | 하위 화면의 ‹ 뒤로가 항상 피드로 가고 탭바와 화면이 어긋난다 | 1. 캘린더 → 이벤트 상세 → ‹ (또는 일본어 → 레벨 1 → ‹) | 기대: CAL-01 / JP-01 / 실제: HOME-01 피드, 탭바는 "캘린더"/"일본어" 선택 상태 그대로 | IA-1 · TC-NAV-02, TC-NAV-03 |
| BUG-06 | 중간 | 브라우저·Android 뒤로 버튼이 앱을 떠난다 | 1. 피드 → 글 상세 2. 브라우저 뒤로 | 기대: 피드로 / 실제: 이전 페이지(`about:blank`)로 이동, 앱 이탈. History API 미사용 | IA-2 · TC-NAV-04 |
| BUG-07 | 중간 | 375px 헤더에서 ja/ko 언어 버튼이 글자 단위로 세로 줄바꿈된다 | 1. 375px, HOME-01 2. 언어 ja 또는 ko | 기대: 버튼 한 줄 / 실제: "日/本/語", "한/국/어" 3줄(71×67px). en 은 부제 3줄. RA 버튼이 있으면 360~390px 에서 3줄, 414~430px 에서 2줄. RA 버튼이 없는 일반 입주자도 375px 이하에서 2줄 | §8 레이아웃 · TC-L-03 |
| BUG-08 | 낮음 | 신고 후 피드로 강제 이동한다 | 1. 글 상세 2. ⚑ → 사유 선택 | 기대: 글 상세에 머무르고 토스트만 / 실제: 피드로 이동 | IA-3, M-1 · TC-M-07 |
| BUG-09 | 낮음 | 장소 카드의 익명 라벨이 모든 언어에서 "匿名" | 1. en 또는 ko 로 지도 탭 2. "Bike lockers" 등 익명 추가 장소 선택 | 기대: "Anonymous" / "익명" / 실제: "Added by · 匿名", "추가 · 匿名" (`PLACES[].by` 문자열 그대로 출력) | P-3, §8 문자열 · TC-P-04, TC-L-04 |
| BUG-10 | 낮음 | 하드코딩된 영어 `aria-label` 과 복수형 오류 | 1. ja/ko 로 전환 후 헤더·글쓰기·캘린더 버튼의 `aria-label` 확인 2. en 신고 큐 | 기대: 언어별 라벨, "1 report" / 실제: "Language", "Profiles", "RA", "write", "prev", "next" 고정. "Post · 1 reports" | L-1, A-5, §8 문자열 · TC-L-04 |
| BUG-11 | 낮음 | 주요 터치 영역이 44×44px 보다 작다 | 375px 에서 버튼 크기 측정 | 기대: 44×44px 이상 / 실제: 뒤로 ‹ 15×23, 댓글 ⚑ 24×29, ⇄·⚑ 29~30×33, 번역 토글 79×19, 날짜 칸 38×34 | A-5 · TC-A-05 |
| BUG-12 | 낮음 | 한국어 본문이 어절 중간에서 줄바뀜 | ko 피드·상세 | 기대: 어절 단위 줄바꿈 / 실제: "그 / 대로예요", "도 / 후쿠지". `word-break: keep-all` 미지정 | §8 레이아웃 · TC-L-08 |
| BUG-13 | 낮음 | `profiles()` 가 방 번호·Instagram 핸들을 이스케이프하지 않는다 | `index.html` `profiles()` 코드 검토 | 기대: 데이터 값은 모두 `esc()` / 실제: `r.room`, `x.room`, `x.insta` 미이스케이프. 실데이터 연결 시 저장형 XSS 경로가 됨 | S-9, §8 보안 · TC-SEC-03 |

## 6. 미구현 (PRD 에 이미 "없음"으로 기록 — 결함 목록과 분리)

| TC-ID | 요구사항 | 내용 | PRD 표기 |
|---|---|---|---|
| TC-B-06 | B-6 (P0) | 댓글·대댓글 작성 UI 없음 | "표시만 있음, 작성 UI 없음" |
| TC-M-08 | M-6 (P0) | 운영자 숨김 목록·복원 없음 | "운영자용 숨김 목록 없음" |
| TC-M-09 | M-7 (P0) | 본인 글·댓글 수정·삭제 없음 | "없음 (스키마에도 함수·정책 없음)" |
| TC-J-05 | J-7 (P1) | 컬렉션 진행이 새로고침하면 사라짐 | "세션 내에서만 유지" |

P0 인 B-6, M-6, M-7 은 첫 출시 전에 화면설계와 구현이 필요하다.

## 7. 관찰 사항 (결함으로 올리지 않음)

1. **빈 글쓰기 제출에 안내가 없다.** 제목이나 본문이 비어 있으면 아무 반응 없이 머문다. 결함은 아니지만 사용성 테스트에서 관찰할 것.
2. **카테고리를 바꾼 직후 0.25초 안에 핀을 고르면** `fitBounds` 애니메이션이 끝나며 줌이 15로 남을 수 있다. 하네스가 연속 클릭할 때만 보였고, 0.8초 기다리면 항상 16이었다. 사람이 재현하기는 어렵다.
3. **`.ics` 에 `VTIMEZONE` 블록이 없다.** `TZID=Asia/Tokyo` 만 있다. Google·Apple 캘린더는 보통 받아들이지만 실기기에서 확인해야 한다(TC-C-06 의 실기기 부분). `SUMMARY` 의 쉼표·세미콜론 이스케이프(RFC 5545)도 없다 — 지금 데이터에는 해당 문자가 없다.
4. en 장소 카드에 "Getting around ·  7 min walk" 처럼 공백이 두 칸 들어간다(`T.en.walk` 가 빈 문자열).
5. 숨긴 글도 `S.pid` 를 알면 상세를 그릴 수 있다. 프로토타입 내부 상태라 문제는 아니고, 실서비스에서는 RLS 로 막아야 한다(TC-S-06 의 "숨긴 글의 댓글 SELECT"와 같은 범주).

## 8. 다음 회차 권장

- BUG-01, BUG-02 수정 후 TC-P-06, P-07, M-06 과 같은 영역 회귀.
- 실기기(iOS Safari, Android Chrome) 회차: TC-A-08, C-6 실기기 부분, BUG-06(Android 뒤로 버튼), BUG-07(실제 시스템 폰트에서의 줄바꿈), BUG-11.
- CDN 이 열린 네트워크에서 TC-P-10.
- M1 에서 6.10 전체. 이때 PRD §7.1 S-1 ~ S-6 수정이 선행되어야 Pass 가 가능하다.
- `index.html` 을 바꾸면 `sw.js` 의 `CACHE` 를 올리고 TC-A-07 을 실행.
