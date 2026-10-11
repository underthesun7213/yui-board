# 기술 검토서 · 기술 스택 선정서

| | |
|---|---|
| 상태 | 제안 (v0.1) |
| 작성일 | 2026-10-11 |
| 대상 | M1(백엔드 기반) 진입 직전. README "Next" 와 PRD §8·§9 의 선택을 검증한다 |
| 근거 문서 | `README.md`, `CLAUDE.md`, [PRD](../02-requirements/PRD.md) §3 G3·G6, §7, §8, §9, §11, §12, [정책](../04-spec/policy.md) POL-5·6·8, [핸드오프](../07-handoff/handoff.md) §5.3·§8 |
| 짝 문서 | [RFC-0001](rfc/0001-m1-backend-foundation.md), [ERD](erd.md), ADR [0002](../adr/0002-write-path-and-translation.md)·[0004](../adr/0004-login-method.md)·[0008](../adr/0008-hosting.md) |

> **사실 확인 방법과 한계.** 가격·무료 한도는 2026-10-11 에 웹 검색으로 확인했다. 이 날 작업 환경에서 공식 페이지 직접 열람(WebFetch)이 DNS 오류로 실패해, 수치는 **검색 결과에 인용된 공식 문서·3자 가이드**에서 가져왔다. 표의 "신뢰도" 칸에 출처 종류를 적었다. **M1 착수 때 공식 페이지·대시보드에서 다시 확인**하고 이 문서의 날짜를 고친다. 추정은 *추정* 이라고 표시했다.

---

## 1. 결론 요약

| 영역 | README 의 선택 | 판정 | 조건·변경점 |
|---|---|---|---|
| 백엔드·DB·인증 | Supabase 무료, 도쿄 리전 | **유지** | 새 API 키(`sb_publishable_…`/`sb_secret_…`)로 시작한다. 레거시 `anon`/`service_role` JWT 키는 2026년 말 폐기 예정(§2.1). 무료 프로젝트 1주 비활동 일시정지·백업 없음은 운영 리스크로 관리(§6) |
| 작성 시 번역 | Azure Translator F0 (월 200만 자) | **유지** | 예상 사용량은 한도의 약 10% (*추정*, §3.2). 번역기 호출은 어댑터 하나로 감싸 DeepL Free 로 교체 가능하게 둔다 |
| 서버 코드 위치 | (PRD §9 "서버 함수", 핸드오프 §5.3 1안 Edge Functions) | **Supabase Edge Functions** | 비밀값이 Supabase 밖으로 나가지 않는다. 별도 계정·과금 없음 |
| 정적 호스팅 | GitHub Pages | **유지 (M1~M3)** | 응답 헤더를 설정할 수 없으므로 CSP 는 `<meta>` 로. 헤더가 꼭 필요해지면 Cloudflare Pages 로 이전(ADR-0008) |
| 지도 | Leaflet + OSM 표준 타일, Google 은 `place_id` 링크만 | **유지** | 사용량은 "가벼운 사용" 범위(*추정*). 타일 사전 다운로드(오프라인 캐시) 금지. 저작자 표시에 저작권 페이지 링크 추가 필요(§5, 신규 발견) |
| 클라이언트 | 단일 `index.html`, 빌드·프레임워크 없음 | **유지** (ADR-0003) | Supabase SDK 를 넣지 않고 `fetch` 래퍼로 PostgREST·Auth·Edge Function 을 부른다(RFC §6) |
| 로그인 | `<room>@yui.local` 또는 학교 이메일 (Q3 미결) | **제안: 이메일 OTP 코드 + 방 초대 코드** | ADR-0004. 방 계정 이름 바꾸기 방식은 작성자 이력이 다음 입주자에게 넘어가는 결함이 있다(§4.2) |
| 이메일 발송 | (없음) | **외부 SMTP 필요** | Supabase 기본 발송은 시간당 몇 통 수준이라 학기 초 가입 몰림을 못 견딘다(§4.3) |

---

## 2. 백엔드 플랫폼

### 2.1 확인한 사실 (2026-10-11)

| 항목 | 값 | 신뢰도 | 출처 |
|---|---|---|---|
| 무료 플랜 DB 용량 | 500 MB | 3자 가이드 다수 일치 | [makerkit](https://makerkit.dev/blog/saas/supabase-pricing), [costbench](https://costbench.com/software/database-as-service/supabase/free-plan/) |
| 무료 플랜 MAU | 50,000 (2025년 자료는 10,000 — 구버전으로 판단) | 3자 가이드 | [jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [uibakery](https://uibakery.io/blog/supabase-pricing) |
| 무료 플랜 egress | 월 5 GB | 3자 가이드 | [makerkit](https://makerkit.dev/blog/md/saas/supabase-pricing) |
| 무료 플랜 Edge Function 호출 | 월 500,000 (구자료는 일 1,000) | 3자 가이드 | [costbench](https://costbench.com/software/database-as-service/supabase/free-plan/), [focusreactive](https://focusreactive.com/blog/supabase-price/) |
| 무료 프로젝트 수 | 활성 2개 | 3자 가이드 | [makerkit](https://makerkit.dev/blog/saas/supabase-pricing) |
| 비활동 일시정지 | 1주 비활동 시 자동 일시정지 | 3자 가이드 다수 일치 | [jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) |
| Pro 요금 | 조직당 월 $25 | 3자 가이드 | [costbench](https://costbench.com/software/developer-tools/supabase-dev/free-plan/) |
| API 키 체계 | `sb_publishable_…`(공개, 저권한) / `sb_secret_…`(RLS 우회, 백엔드 전용). 레거시 `anon`/`service_role` 는 각각의 구버전. **2026년 말까지 폐기 예정**, 두 체계 병행 가능. 새 키는 JWT 가 아니다 | **공식 문서** | [Supabase: Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys), [changelog](https://supabase.com/changelog/29260-upcoming-changes-to-supabase-api-keys) |
| 새 객체 기본 권한 | `public` 의 새 테이블·함수에 대한 기본 권한은 대시보드 "Default privileges for new entities" 와 `alter default privileges` 로 바뀐다. 3자 자료에 따르면 **2026-05-30 이후 새 테이블은 Data API 에 자동 노출되지 않는다**(공식 공지 미확인) | 공식 문서 + 미확인 3자 | [Supabase: Data API](https://supabase.com/docs/guides/database/data-api), [createwith](https://www.createwith.com/tool/supabase/updates/supabase-requires-explicit-permission-grants-for-new-tables-starting-may-30) |
| 가입 전 훅 | `before-user-created` 훅(Postgres 함수 또는 HTTP)으로 가입을 거부할 수 있고, 허용 도메인 제한이 공식 예시 | **공식 문서** | [Supabase: Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) |
| 도쿄 리전 | `ap-northeast-1` | 이번 검색으로는 확인 못 함 — 프로젝트 생성 화면에서 확인 | — |

**설계에 주는 영향**

- PRD·핸드오프의 "`service_role` 키", "`anon` 키" 는 **키 이름**으로는 `sb_secret_…`, `sb_publishable_…` 로 읽는다. Postgres 안의 **역할 이름**(`service_role`, `anon`, `authenticated`)은 그대로다. PR-2·PR-4 의 뜻은 바뀌지 않는다.
- 새 키는 JWT 가 아니므로, 클라이언트는 `apikey: <publishable>` 와 `Authorization: Bearer <사용자 access token>` 을 따로 보낸다. Edge Function 은 사용자 토큰을 직접 검증한다(RFC §5.2).
- 기본 권한이 언제든 바뀔 수 있으므로 마이그레이션이 **모든 GRANT/REVOKE 를 명시**한다. 기본값에 기대지 않는다(N-1, [ERD §5](erd.md#5-권한-grant-설계)).

### 2.2 후보 비교

평가 기준과 가중치는 이 프로젝트의 원칙에서 정했다: 비용 0(G6), 구조적 익명성(G3, PR-1~PR-3), 개발자 소수, 일본 사용자.

| 기준 (가중치) | Supabase (도쿄) | Firebase (Firestore + Functions) | Cloudflare D1 + Workers | PocketBase 자체 호스팅 |
|---|---|---|---|---|
| 익명성 구조를 DB 로 강제 (30) | **5** — Postgres RLS·`SECURITY DEFINER`·컬럼 GRANT. `schema.sql` 이 이미 이 모델 | 3 — 보안 규칙으로 컬렉션 차단 가능. 함수가 서버 SDK 로 쓰면 규칙 우회 | 2 — RLS 없음. 모든 권한 검사를 Worker 코드로 | 3 — 컬렉션 규칙. 단일 바이너리 |
| 비용 0 유지 (25) | 4 — 무료 한도 안. 일시정지·백업 없음이 대가 | 3 — Functions 는 종량제(Blaze) 결제 수단 등록 필요 (*일반 지식, 이번에 미확인*) | 5 — 무료 Workers 일 10만 요청 ([Cloudflare](https://developers.cloudflare.com/workers/platform/pricing/)) | 2 — 상시 VM 필요 |
| 운영 부담 (20) | 4 — 관리형 Postgres·Auth·함수 | 4 | 3 — 인증을 직접 | 1 — 서버·백업·TLS 직접 |
| 기존 자산 재사용 (15) | **5** — `schema.sql`, 핸드오프 §5 API 가 전부 PostgREST 기준 | 1 — 전면 재설계 | 1 | 1 |
| 일본 지연 (10) | 5 — 도쿄 리전 | 4 | 5 — 엣지 | 지역 선택에 따름 |
| **가중 합 (100점 환산)** | **92** | 63 | 60 | 44 |

**선정: Supabase.** 핵심 불변식(본문·작성자 분리, 작성자 테이블 무정책 RLS)을 DB 엔진이 강제하는 후보는 Postgres RLS 뿐이다. 나머지 후보는 그 보장을 애플리케이션 코드 리뷰로 옮긴다.

### 2.3 서버 코드 위치 (작성 시 번역)

| 후보 | 장점 | 단점 | 판정 |
|---|---|---|---|
| **Supabase Edge Functions** | 비밀값(`sb_secret`, 번역 키)이 Supabase 프로젝트 비밀값 저장소에만 있다. 무료 월 50만 호출(§2.1). 배포 CLI 하나 | Deno 런타임. 무료 플랜 실행 시간 상한이 자료마다 다르다(10초라는 3자 자료 있음 — [focusreactive](https://focusreactive.com/blog/supabase-price/)) → 번역 타임아웃 5초로 상한 안에 둔다 | **선정** |
| Cloudflare Workers | 무료 일 10만 요청, CPU 10ms/호출 ([Cloudflare](https://developers.cloudflare.com/workers/platform/limits/)) | 비밀값이 두 회사로 흩어진다. 번역 응답 대기는 CPU 시간이 아니라 괜찮지만, 계정·배포 경로가 하나 더 | 대안 |
| Postgres 안에서 `pg_net` 으로 번역 호출 | 서버 코드 없음 | 비동기 호출이라 "작성 시 번역 후 한 트랜잭션"이 깨진다. 번역 키가 DB 에 저장된다 | 기각 |

---

## 3. 번역

### 3.1 확인한 사실 (2026-10-11)

| 서비스 | 무료 한도 | 한도 초과 시 | 신뢰도 | 출처 |
|---|---|---|---|---|
| Azure Translator F0 | 월 200만 자 (표준 번역 + 사용자 지정 학습 합산). 공백·문장부호·모든 코드 포인트를 센다 | F0 는 과금 대신 중단(README 주장). 한 3자 자료만 확인, 공식 문구는 미확인 | 공식 가격 페이지(일본어판) + 3자 | [Azure 가격(ja)](https://azure.microsoft.com/ja-jp/pricing/details/cognitive-services/translator/), [turbo360](https://azure-cost-management-playbook.turbo360.com/docs/ai-translator) |
| Azure S1 | 3자 자료 기준 100만 자당 $10 (공식 금액 미확인) | 종량 과금 | 3자 | [immersivetranslate](https://immersivetranslate.com/en/docs/services/azure/) |
| DeepL API Free | 월 50만 자 | 다음 주기까지 거부(3자 자료) | **공식 지원 문서** (한도) | [DeepL support](https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-Free) |
| Google Cloud Translation | 월 50만 자 (3자 자료, 결제 수단 등록 필요) | 과금 | 3자 | [bluente](https://bluente.com/blog/best-translation-apis-free-tiers) |

### 3.2 사용량 추정 (*추정*)

| 가정 | 값 | 근거 |
|---|---|---|
| 월 글 수 | 130 (주 30건) | PRD §11 목표 |
| 글 평균 길이 (제목+본문) | 300자 | *추정* (프로토타입 mock 글 기준 100~300자) |
| 글당 댓글 | 5개 × 80자 | *추정* |
| 원문 글자 수 / 월 | 130×300 + 650×80 ≈ **9.1만 자** | |
| 번역 대상 언어 | 2 (원문 외 두 언어) | Azure 는 대상 언어마다 센다 (핸드오프 §5.3) |
| 과금 글자 수 / 월 | ≈ **18만 자** = F0 의 약 **9%** | |

목표를 5배 넘게 쓰여도 F0 안이다. DeepL Free(50만 자)도 들어가지만 여유가 2.7배뿐이다.

### 3.3 비교와 선정

| 기준 (가중치) | Azure F0 | DeepL Free | Google | LibreTranslate 자체 호스팅 |
|---|---|---|---|---|
| 무료 한도 여유 (35) | 5 (≈11배) | 3 (≈2.7배) | 3 | 5 (무제한, 서버 비용) |
| 초과 시 과금 위험 없음 (25) | 4 (중단 동작 — 공식 문구 재확인 필요) | 4 | 1 (결제 수단 필수) | 5 |
| ja↔ko↔en 품질 (20) | 미평가 | 미평가 | 미평가 | 2 (*일반적 평가, 미검증*) |
| 운영 부담 (20) | 5 | 5 | 4 | 1 |

품질은 이 문서에서 판정하지 않는다. 실제 기숙사 글 20건 정도로 Azure 와 DeepL 결과를 나란히 보는 비교를 M3 전에 한다(열린 질문 T-3).

**선정: Azure Translator F0 유지.** 서버 코드는 `translate(texts, from, to[]) → {ok, texts}` 하나의 어댑터로 감싸, DeepL 로 바꿀 때 Edge Function 한 파일만 고치게 한다(ADR-0002).

**개인정보 영향.** 글·댓글 본문이 Microsoft 로 전송된다. 작성자 ID 는 보내지 않는다(요청에는 본문만). 개인정보처리방침(PR-12, POL-5-6)에 "번역을 위해 본문을 외부 번역 서비스에 보낸다"를 적어야 한다 — PRD·정책서에 아직 없다.

---

## 4. 인증 (Q3) — 기술 검토

결정 자체는 [ADR-0004](../adr/0004-login-method.md). 여기서는 기술 사실만 정리한다.

### 4.1 PWA 에서 매직 링크의 문제

iOS 에서 홈 화면에 설치한 PWA 는 Safari 와 저장소가 분리된다(*일반 지식, 이번에 출처 미확인 — ENV-1 실기기로 확인할 것*). 이메일의 매직 링크를 누르면 Safari 에서 열려 로그인되고, 설치된 앱은 여전히 로그아웃 상태다. **6자리 OTP 코드**를 앱 안에 입력하는 방식은 이 문제가 없다.

### 4.2 방 계정(`<room>@yui.local`) 이름 바꾸기 방식의 결함 — 신규 발견

`schema.sql:23-26` 주석은 "방을 새 입주자에게 넘길 때 auth 행 이름만 바꾸므로 uuid 가 그대로이고 작성 이력이 정확하다"고 한다. 그러나 uuid 가 **방**에 묶이면:

- 이전 입주자가 쓴 글의 `post_authors.author_id` 가 새 입주자의 uuid 가 된다. M-7(본인 글 수정·삭제)이 들어오면 새 입주자가 이전 입주자의 글을 고치거나 지울 수 있다.
- `exchanges`, `my_contacts` 가 그대로 넘어간다 → 새 입주자가 이전 입주자의 교환 상대(이름·Instagram)를 본다. PR-8 위반.
- `residency` 테이블(사람별 입주 이력, `residency_one_per_user`)과 모델이 모순된다.

따라서 uuid 는 **사람**에 묶고, 방은 `residency` 이력으로 관리해야 한다.

### 4.3 이메일 발송 한도

Supabase 기본 SMTP 는 시간당 2~4통 수준이고 사전 승인된 주소로만 보낸다는 3자 자료가 있다(수치는 자료마다 다름 — [makerkit](https://makerkit.dev/docs/next-supabase-turbo/going-to-production/authentication), [sendlayer](https://sendlayer.com/blog/supabase-custom-smtp-and-email-configuration-guide/)). 학기 초 한 주에 수백 명이 가입하므로(PRD §11 "학기 전환 후 잔존") **외부 SMTP 제공자**가 필요하다. 무료 SMTP 제공자의 한도는 이번에 확인하지 않았다(열린 질문 T-2). 커스텀 SMTP 를 켠 뒤의 Supabase 쪽 한도도 대시보드 Authentication › Rate Limits 에서 확인한다.

---

## 5. 지도

### 5.1 확인한 사실 (2026-10-11)

| 항목 | 내용 | 출처 |
|---|---|---|
| OSM 표준 타일 정책 | 기부 자원으로 운영, **SLA 없음**(best-effort). 서비스를 저하시키면 예고 없이 차단. 많이 쓰는 앱 배포는 운영 작업반 사전 허가 필요. 다른 OSM 기반 제공자나 자체 타일 서버를 권장 | [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) (검색 결과 발췌) |
| 오프라인용 대량 다운로드 | 영역 단위 사전 다운로드는 "heavy use" 로 간주(커뮤니티 설명, 공식 문구 미확인) | [legal-talk 2013](https://lists.openstreetmap.org/pipermail/legal-talk/2013-December/007684.html) |
| OpenFreeMap | 공개 인스턴스 무료·무제한·키 없음. **벡터 타일만**(MapLibre GL), 래스터 미제공 | [openfreemap.org](https://openfreemap.org), [GitHub](https://github.com/tbodt/openfreemap) |

### 5.2 판정

- **OSM 표준 타일 유지.** 이용자 650명, 장소 13곳이 모두 도보 15분 안(POL-8-1)이라 한 사람이 보는 타일 수는 수십 장 수준이다(*추정*). "heavy use" 에 해당하지 않는다고 본다. 단 SLA 가 없으므로 P-5(지도 실패 시 목록 유지)가 계속 필수다.
- 서비스 워커는 타일을 **캐시하지 않는다**(현재 `sw.js:35` 교차 출처 무시 — 유지). 오프라인 지도(A-1 한계)는 해결하지 않는다.
- **저작자 표시 보완 (신규 발견):** `index.html:1546` 의 `attribution:'&copy; OpenStreetMap'` 에 저작권 페이지(`https://www.openstreetmap.org/copyright`) 링크가 없다. OSM 저작자 표시 지침에 맞게 링크와 "contributors" 표기를 넣는다(지침 원문은 M1 때 확인). 백로그 항목으로 제안한다.
- 대안 경로: OSM 차단·정책 변경 시 OpenFreeMap + MapLibre GL 로 이전. 단 MapLibre GL 은 Leaflet 보다 무겁고 `updateMap()` 구조를 다시 짜야 한다 → 그때 ADR.

---

## 6. 정적 호스팅

결정은 [ADR-0008](../adr/0008-hosting.md).

| 항목 | GitHub Pages | Cloudflare Pages |
|---|---|---|
| 사이트 크기 | 1 GB 이하 | (이번에 미확인) |
| 대역폭 | 월 100 GB **소프트** 한도, 초과 시 429 가능 | egress 추가 요금 없음 (Workers 문서) |
| 빌드 | 시간당 10회 (Actions 배포는 예외) | — |
| 응답 헤더(CSP 등) | 설정 불가 (검색으로 확인 못 함 — 일반 지식) | `_headers` 파일 (이번에 미확인) |
| 출처 | [GitHub Docs: Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |

**대역폭 추정 (*추정*):** `index.html` ≈ 0.2 MB(현재 약 1,900줄), 아이콘 포함 셸 ≈ 0.5 MB. 650명이 학기에 10번 새 버전을 받아도 3.3 GB. 그림 71장(핸드오프 §7.2 상한 10.6 MB)을 전원이 받아도 7 GB. 100 GB 한도에 한참 못 미친다.

---

## 7. 클라이언트 의존성

| 의존성 | 현재 | 판정 |
|---|---|---|
| Leaflet 1.9.4, markercluster 1.5.3 (cdnjs) | `index.html:17-20`, **`integrity`(SRI) 속성 없음** | 유지하되 SRI 해시 추가. 로그인 후에는 같은 페이지 `localStorage` 에 세션 토큰이 생기므로 CDN 변조가 곧 토큰 탈취다(신규 발견, RFC §4) |
| Supabase JS SDK | 없음 | **넣지 않는다.** 이유: 의존성·CDN 신뢰 경계 추가, CLAUDE.md 헤드리스 하네스가 `new Function` 으로 스크립트를 실행하므로 전역 SDK 가 없을 때도 돌아야 함. PostgREST·Auth REST 는 `fetch` 로 충분하다(RFC §6, ADR-0003) |

---

## 8. 비용 추정 (월)

| 항목 | 무료 한도 | 예상 사용 (*추정*) | 비용 |
|---|---|---|---|
| Supabase DB | 500 MB | 글 3개 언어 ≈ 3 KB × 130/월 + 댓글 → 연 10 MB 미만 | 0 |
| Supabase MAU | 50,000 | ≤ 650 | 0 |
| Supabase egress | 5 GB | 주간 활성 200명 × 월 30세션 × 요청 10개 × 20 KB ≈ 1.2 GB | 0 |
| Edge Functions | 50만 호출 | 글·댓글·수정 ≈ 1,000/월 | 0 |
| Azure Translator F0 | 200만 자 | ≈ 18만 자 | 0 |
| GitHub Pages | 100 GB | < 10 GB | 0 |
| SMTP | 미확인 | 학기 초 수백 통, 평소 OTP 로그인 | 0 목표 (T-2) |
| **합계** | | | **0엔 목표** |

비용이 0 이 아니게 되는 조건: (1) 일시정지가 운영에 지장을 줄 때 Supabase Pro $25/월, (2) 자동 백업이 필요할 때(무료 플랜 백업 없음 — 3자 자료).

---

## 9. 열린 질문

| # | 질문 | 영향 |
|---|---|---|
| T-1 | 도쿄 리전(`ap-northeast-1`)이 무료 플랜 새 프로젝트에서 선택 가능한가 | 지연, PRD §8 |
| T-2 | 무료 SMTP 제공자 선택과 그 한도. 학기 초 가입 몰림(수백 통/주)을 견디는가 | ADR-0004 |
| T-3 | Azure vs DeepL 의 ja↔ko 번역 품질 비교 (실제 글 20건) | ADR-0002, PRD §11 비원어 열람 |
| T-4 | Azure F0 의 "초과 시 중단" 을 공식 문서로 확인 | POL-6-4 |
| T-5 | 무료 플랜 비활동 일시정지를 방학 기간에 받아들일지, Pro 로 갈지 | 가용성 |
| T-6 | 백업: 무료 플랜에서 주기적 `pg_dump` 를 할지. 덤프에는 `post_authors` 가 들어가므로 보관 장소가 `service_role` 과 같은 신뢰 수준이어야 한다 | 익명성, [infra §5](infra.md) |
