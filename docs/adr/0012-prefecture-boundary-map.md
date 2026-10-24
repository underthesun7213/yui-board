# ADR-0012 · 도도부현 경계 지도 — Natural Earth 단순화본을 별도 파일로 지연 로드해 같은 Leaflet 지도의 GeoJSON 레이어로 그린다

| | |
|---|---|
| 상태 | 제안됨 |
| 날짜 | 2026-10-12 |
| 근거 | PRD-MLP D5, ML-M5, ML-M6, ML-M7, ML-M11, ML-M13, §6 (MAP-03 실패 상태), §8 "구조"·"경계 데이터", Q-M12, Q-M13 |
| 관련 | [RFC-0002 §7.4~7.5](../architecture/rfc/0002-mlp-client-only.md#74-일본-전체--도도부현-선택-현행), ADR-0013, ADR-0014 |

## 배경

"일본 전체" 모드는 **실제 도도부현 경계 지도**에서 도도부현을 눌러 고른다(D5). 필요한 것:

- 47개 도도부현 폴리곤과 JIS 코드(장소의 `pref` 와 맞추기 위해), 3개 언어 이름
- 배포해도 되는 라이선스 (Q-M12)
- 첫 화면을 무겁게 하지 않는 크기 (PRD §8: 목표 150 KB 이하 *추정치*)
- 지도는 한 번만 만든다 (ML-M11) — 경계를 위해 두 번째 지도를 만들지 않는다
- 헤드리스 검사: 뷰 함수 안에서 불러오지 않는다 (ML-M5)
- 데이터를 못 불러와도 고를 수 있어야 한다 (PRD §6 MAP-03, ML-M6)

## 결정 (현행 구현과 같다)

1. **출처: Natural Earth admin-1(States, Provinces)** 의 일본 47개 피처. Natural Earth 는 모든 래스터·벡터 데이터를 **퍼블릭 도메인**으로 두며 사용 허가도 출처 표시도 필요 없다고 밝힌다([Natural Earth Terms of Use 미러](https://public.data.npolar.no/quantarctica/Quantarctica/Basemap/World/1st_ReadMe_NE_50m_Countries_Terms%20of%20Use%20Natural%20Earth.htm), [Debian cartopy copyright](https://metadata-backend.ftp-master.debian.org/changelogs/main/p/python-cartopy/stable_copyright), 2026-10-12 검색 확인. naturalearthdata.com 원문은 이 환경에서 접속되지 않아 미러로 확인). 출처 표시 의무는 없지만 README·`PREFS` 주석에 출처를 적는다(현행).
2. **단순화:** 개발 시점에 mapshaper 로 한 번 단순화해 저장소에 넣는다. 원본은 `ne_10m_admin_1_states_provinces.geojson`(nvkelso/natural-earth-vector, master, 2026-10-12 받음)의 `iso_a2 == "JP"` 47개 피처, 명령은 mapshaper 0.6 `-simplify 15% keep-shapes -filter-islands min-area=5km2 … precision=0.0005` — 재현 절차 전체는 `data/README.md`. 결과 46,340 바이트(gzip 12,523), 1줄. 속성은 `{c, ja, en, ko}` 네 개만 남긴다(`c` = JIS 코드 `"01"`~`"47"`). → Natural Earth admin-1 에 있는 **GADM 유래 열**(라이선스 우려가 있으면 지우라고 Natural Earth 가 권함, [Natural Earth 포럼](https://www.naturalearthdata.com/?p=3348), 2026-10-12 검색 확인)이 결과물에 남지 않는다.
3. **별도 파일** `data/japan-prefectures.geojson`. `index.html` 에 넣지 않는다(ADR-0013).
4. **지연 로드:** 일본 전체 모드에 처음 들어가는 **동작 처리 코드**(`enterMap()` → `ensurePrefs()`)가 `fetch` 한다. 뷰는 결과(`PREFGEO`)를 읽지도 않는다 — 지도 런타임만 쓴다. 실패하면 `prefFail` 로 문구를 띄우고 다음 진입에 재시도. SW 는 설치 때 사전 캐시하고 이후 network-first.
5. **같은 Leaflet 인스턴스의 `L.geoJSON` 레이어.** 처음 한 번 만들고 모드를 떠나면 지도에서 떼기만 한다. 스타일 3단계(선택 / 장소 있음 / 없음). 폴리곤(또는 목록)을 누르면 `selectPref(code)` → `pushState`(OS 뒤로 가기가 일본 전체로 돌아옴) → `updateMap(true)` → 그 도도부현의 **가장 큰 폴리곤**(`mainBounds()`, 외곽 고리 면적 기준)에 맞춤. 섬(이즈 제도, 아마미, 사키시마)이 맞춤 범위를 바다로 넓히지 않는다.
6. **도도부현 목록을 늘 함께 둔다** (지방별 8묶음, 장소 수 표시). 작은 도도부현을 손가락으로 누르기 어려운 문제와 데이터 로드 실패를 같이 해결한다(ML-M6).

## 고려한 대안

### 표현 방식

| 대안 | 장점 | 단점 / 기각 이유 |
|---|---|---|
| **타일 그리드(타일 카토그램)** — 47개를 같은 크기 칸으로 배치 | 파일이 거의 없다(좌표 47쌍). 모든 도도부현이 같은 크기라 누르기 쉽다. 지도 라이브러리 없이 HTML 로 | D5 "**실제** 도도부현 경계 지도" 가 아니다. 고른 뒤 실제 지도로 전환하는 두 단계 UI 가 된다 |
| 정적 SVG 지도 (Leaflet 밖) | 타일 요청 없이 즉시, 오프라인 완전 동작 | 지도 패러다임이 둘(SVG + Leaflet)이 되어 확대·선택 상태를 옮겨야 한다. "같은 지도 객체" (ML-M5) 와 다르다 |
| 경계용 두 번째 Leaflet 지도 | 모드 분리가 쉽다 | ML-M11 위반, 메모리·타일 두 배 |
| GeoJSON 을 `index.html` 에 인라인 | fetch·실패 처리 없음, 단일 파일 유지 | 지도를 안 쓰는 사용자도 첫 화면에서 46 KB 를 파싱. Q-M13 이 허용으로 답해져 이유가 사라짐 |
| 벡터 타일 | 확대 단계별 정밀도 | 생성 도구·서빙이 필요하다. 47개 폴리곤에 과하다 |

### 데이터 출처

| 출처 | 라이선스 (2026-10-12 검색 기준) | 판단 |
|---|---|---|
| **Natural Earth admin-1** | 퍼블릭 도메인, 허가·출처 표시 불필요 (위 결정 1). admin-1 은 10m 축척 테마 | **선택.** 이름 필드와 ISO 3166-2 코드가 있어 변환이 쉽다 — `c` ← `iso_3166_2`(`JP-27` → `"27"`), `ja` ← `name_ja`, `ko` ← `name_ko`, `en` ← `name`(장음 기호 제거) (`data/README.md`) |
| 국토수치정보 行政区域 (N03, 국토교통성) | 무상 제공, 다운로드 사이트 이용 규약을 따라야 하고 항목에 따라 민간 정보를 포함한 2차 저작물이라 규약 확인 필요 ([국토교통성 자료](https://www.mlit.go.jp/common/001152704.pdf), [N03 제품 사양](https://nlftp.mlit.go.jp/ksj/gml/product_spec/KS-PS-N03-v4_1.pdf)). CC BY 여부는 이번 검색으로 확인 못 함 | 정밀하지만 시정촌 단위라 크다 — 도도부현 병합·강한 단순화 필요. 라이선스 확인 부담 |
| 지구지도 일본 (국토지리원) | 국토지리원 콘텐츠는 출처 명시를 요구한다는 설명이 있으나 이 데이터의 규약은 이번 검색으로 확인 못 함 ([국토지리원 Q&A](https://www.gsi.go.jp/LAW/2930-qa.html)) | 출처 표시·규약 확인이 필요해 보류 |
| GADM | 학술·비상업 사용만 자유, **재배포·상업 사용은 사전 허가 필요**라는 문구가 여러 2차 출처에 인용됨 ([Natural Earth 포럼](https://www.naturalearthdata.com/?p=3348), [OSM legal-talk 2015](https://lists.openstreetmap.org/pipermail/legal-talk/2015-August/008178.html)). gadm.org 원문은 이 환경에서 접속되지 않음 | **기각** — 공개 저장소에 넣는 것 자체가 재배포 |
| geoBoundaries | 프로젝트 데이터는 대체로 CC BY 4.0(출처 표시 필요), 다만 gbOpen 도 경계마다 라이선스가 섞일 수 있어 메타데이터 확인 필요, gbAuthoritative 는 비상업 조건 ([atlas.co 요약](https://atlas.co/data-sources/geo-boundaries/), [geobounds COPYRIGHTS](https://stat.ethz.ch/CRAN/web/packages/geobounds/COPYRIGHTS)) | 쓸 수 있지만 출처 표시·경계별 확인이 필요. NE 로 충분 |
| OSM 행정 경계 | ODbL — 저작자 표시와 데이터베이스 공유 조건(*일반 지식, 이번에 원문 확인 안 함*) | 추출·병합 작업이 크고 조건이 붙는다 |

## 결과

- 좋은 점: 라이선스 부담 없음. 46 KB 로 PRD 목표(150 KB)의 1/3. 첫 화면 비용 0(지연 로드), 오프라인 동작(사전 캐시). 지도 인스턴스 하나에 레이어만 붙였다 뗀다. 목록이 경계 실패·작은 도도부현 문제를 모두 받는다.
- 나쁜 점:
  - 단순화로 해안선·경계가 거칠다 — 선택용으로는 충분, 측량용 아님.
  - **해결:** 이 ADR 첫 판의 "맞춤 범위가 피처 전체라 섬을 포함한 도도부현(도쿄 = 이즈 제도, 파일에 하치조지마 부근 `[139.791, 33.1355]` 좌표. 가고시마, 오키나와)이 바다 화면이 된다" 는 `mainBounds()` 로 해결됐다(Playwright "Tokyo's mainland fit"). 대신 섬에 있는 장소는 맞춤 화면 밖에 있을 수 있다 — 핀은 그대로 보이고 이동하면 된다.
  - 도도부현 이름이 GeoJSON 속성과 `PREFS` 두 곳에 있다(화면은 `PREFS` 만 씀). `data/README.md` 가 "같은 원본에서 함께 다시 만든다" 고 적어 위험을 줄였지만 코드로 강제되지는 않는다.
  - Natural Earth 의 admin-1 테마 페이지는 이 테마를 아직 beta 로 표시한다([Admin 1 – States, Provinces](https://www.naturalearthdata.com/?p=480), 2026-10-12 검색 요약으로 확인, 원문 접속 불가) — 경계 정확도 보증 없음.
  - **해결:** 첫 판의 "재현 절차가 저장소에 없다" 는 `data/README.md`(원본·축척·받은 날짜, 속성 변환, mapshaper 명령·단순화 비율)로 해결됐다. 원본이 `master` 브랜치라 같은 명령도 시점에 따라 결과가 다를 수 있다 — 커밋 해시를 적어 두면 완전히 재현된다.

## 열린 질문

| # | 질문 |
|---|---|
| B-Q1 | 재현 절차를 `data/README.md` 에 기록할 것 — **해결** (`data/README.md`). 남은 것: 원본 natural-earth-vector 커밋 해시 |
| B-Q2 | 섬이 있는 도도부현의 맞춤 규칙 — **해결** (가장 큰 폴리곤, `mainBounds()`) |
| B-Q3 | GeoJSON 속성의 이름(`ja/en/ko`)을 지울지 — `PREFS` 와 중복이고 쓰지 않는다. 지우면 몇 KB 줄어든다 |
| B-Q4 | "Made with Natural Earth" 표시를 지도 저작자 표시에 넣을지 (의무 아님, 예의) |
