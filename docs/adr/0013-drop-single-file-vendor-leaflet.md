# ADR-0013 · 단일 파일 원칙을 버리고(빌드 없음은 유지) Leaflet 을 저장소에 둔다

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-MLP v1.3 **D8** (Q-M10, Q-M13 책임자 답: 둘 다 허용), §8 "구조"·"지도 라이브러리"·"첫 화면", ML-M13, ML-P4 |
| 관련 | [ADR-0003](0003-keep-single-file-client.md) (**이 ADR 로 대체** — 이 ADR 이 아직 제안됨이라 대체 관계 확정은 책임자 확인 필요, RFC-0002 OQ-20), ADR-0008 결정 3, ADR-0012, [RFC-0002 §4.3, §9](../architecture/rfc/0002-mlp-client-only.md) |

## 배경

CLAUDE.md 는 "`index.html` 한 파일, 빌드·프레임워크·번들러 없음" 을 원칙으로 했고 ADR-0003 이 이를 이어 갔다. 프로토타입은 Leaflet 을 cdnjs 에서 `<head>` 동기 로드했다. 그 결과:

- 첫 화면이 지도 라이브러리를 기다렸다 (PRD §8 "지도 라이브러리").
- SW 가 다른 출처를 캐시하지 않아 **오프라인에서 지도 탭 자체가 실패**했다 (ML-M13 "현재").
- 외부 CDN 요청이 개인정보 목록에 하나 더 있었다 (ML-P4).

MLP 는 여기에 경계 데이터(46 KB, ADR-0012)가 더해진다. 책임자는 Q-M10(라이브러리를 저장소에)·Q-M13(단일 파일 예외)을 모두 허용했다.

## 결정 (현행 구현과 같다)

1. **원칙을 "단일 파일" 에서 "빌드 단계 없음" 으로 바꾼다.** 배포되는 파일은 사람이 쓴 그대로다. 번들러·트랜스파일러·패키지 매니저 없음. 파일 구성:
   - `index.html` — 앱 (CSS, 마크업, 스크립트 하나)
   - `vendor/leaflet/` — Leaflet **1.9.4** (`leaflet.js`, `leaflet.css`, `LICENSE` BSD-2-Clause)
   - `vendor/leaflet.markercluster/` — markercluster **1.5.3** (`leaflet.markercluster.js`, `MarkerCluster.css`, `MIT-LICENCE.txt`)
   - `data/` — 앱이 읽는 데이터 (ADR-0012)
   - `sw.js`, `manifest.webmanifest`, 아이콘
2. Leaflet 은 **지도 탭에 처음 들어갈 때** `loadLeaflet()` 이 `<link>`·`<script>` 를 넣어 같은 출처에서 불러온다. 홈·일본어·캘린더는 지도 라이브러리 없이 뜬다.
3. vendor 와 data 는 SW `SHELL` 에 넣어 설치 때 캐시한다 → 오프라인 지도(타일 제외).
4. 라이선스 파일을 함께 둔다(BSD-2 의 재배포 조건: 저작권 고지 유지). README "Files" 에 버전·라이선스를 적는다(현행).
5. vendor 갱신은 수동: 새 버전 파일로 교체 → 헤드리스·브라우저 검사 → `CACHE` 올림.
6. 헤드리스 검사는 여전히 `index.html` 의 `<script>` 만 읽는다. vendor 는 검사 대상이 아니다(`L=undefined`).

## 고려한 대안

| 대안 | 장점 | 단점 / 기각 이유 |
|---|---|---|
| ADR-0003 유지 + cdnjs + SRI (ADR-0008 결정 3) | 저장소가 가볍다. CDN 캐시 공유(현대 브라우저는 출처별 분리라 실제 이점은 작음 — *일반 지식*) | 오프라인 실패(ML-M13), 외부 요청(ML-P4), CDN 장애·차단 시 지도 불가(이 개발 환경에서도 cdnjs 차단 — QA 리포트 §2.3) |
| Leaflet·GeoJSON 을 `index.html` 에 인라인 | 단일 파일 유지 | 첫 화면이 지도 라이브러리·경계 데이터를 모두 파싱. 라이선스 고지가 파일 안에 섞인다. 수정·diff 가 어렵다 |
| npm + 번들러(Vite 등) | 의존성 갱신 자동화, 트리 셰이킹 | 빌드 단계 — GitHub Pages 루트 배포 규칙·헤드리스 검사 방식이 바뀐다. 파일 2개에 과하다 |
| Leaflet 2.0 | ESM, 현대화 | 2026-10-12 검색 기준 **알파**(2.0.0-alpha 2025-05-18, alpha.1 2025-08-16), 안정판은 1.9.4(2023-05-18) ([Leaflet 다운로드](https://leafletjs.com/download), [Leaflet 2.0 알파 공지](https://leafletjs.com/2025/05/18/leaflet-2.0.0-alpha.html)). 플러그인(markercluster) 호환 미확인 |

## 결과

- 좋은 점: 첫 화면에 지도 비용 없음. 오프라인 지도(목록·핀·경계). 외부 요청은 타일뿐. 빌드가 없어 배포·검사 방식이 그대로다.
- 크기 (`wc -c` / `gzip -c | wc -c`, 조정자 측정 — `index.html` 은 `7b6d631`, vendor 는 `78e2b4e`): 첫 화면 `index.html` 107,305 B (gzip 40,162). 지도 탭에서 더 받는 vendor 4개 합계 197,366 B (gzip 55,196) — `leaflet.js` 147,552 (42,578), `leaflet.markercluster.js` 34,136 (8,791), `leaflet.css` 14,806 (3,558), `MarkerCluster.css` 872 (269). Leaflet 을 `<head>` 에 두었다면 첫 화면 gzip 이 약 95 KB, 지금의 약 2.4배였다.
- 나쁜 점:
  - 보안 패치를 자동으로 받지 못한다 — 사람이 확인해야 한다.
  - "한 파일만 보면 된다" 는 단순성이 줄었다. CLAUDE.md 가 파일 목록과 `SHELL` 규칙을 적는다(현행).
  - SW 사전 캐시 때문에 지도를 안 쓰는 사용자도 첫 방문에 vendor 를 받는다(RFC-0002 §9.3).
- **ADR-0003 처리:** ADR-0003 결정 1("단일 파일 유지")은 이 ADR 과 충돌하므로 ADR-0003 상태를 "ADR-0013으로 대체됨" 으로 바꾼다. ADR-0003 의 나머지(데이터 계층 `CFG`/`API`, SDK 없음)는 백엔드 전제라 ADR-0009 에 따라 함께 보류된 것으로 본다. 결정 6(부수 효과는 `/* Manifest shortcuts` 아래)은 현행 코드·CLAUDE.md 에 살아 있다.
- 재검토 조건: Leaflet 2.0 안정판과 markercluster 호환판이 나올 때, 또는 vendor 가 셋 이상으로 늘어 수동 관리가 부담될 때.

## 열린 질문

| # | 질문 |
|---|---|
| V-Q1 | vendor 갱신 점검 주기(예: 학기마다 Leaflet 보안 공지 확인)와 담당 |
| V-Q2 | Leaflet 확대/축소 버튼의 영어 `title`("Zoom in/out") 을 `T` 로 바꿀지 — **해결**: `labelMap()` 이 마운트마다 `T.aZoomIn/aZoomOut` 로 `title`·`aria-label` 을 바꾼다. 저작자 표시의 "Leaflet" 접두어는 영어로 남는다(수용된 잔여) |
| V-Q3 | 저장소에 vendor 파일 출처(npm 패키지 버전, 원본 해시)를 기록할지 |
