# 첫 데이터 등록 후보 (검토용)

| 항목 | 내용 |
|---|---|
| 상태 | **후보 목록 — 등록 전 현장 확인 필요** |
| 근거 | PRD Q-Y1(첫 데이터는 책임자·RA 가 직접 등록), D16(앱에 데이터를 싣지 않음), 2026-10-26 대화: 히라카타 20+, 오사카·교토·나라 각 10+ |
| 등록 방법 | 앱에서 직접 (등록 전용 기기 하나). 하루 한도는 계정당 장소 15건(D30) — 부족하면 공지 전에만 임시 상향 |
| 필요한 것 | 관광 분류는 PR #12 머지와 운영 적용 뒤 (마이그레이션 `20261025000230`) |

**표기:** ✔ = v1.3 때 확인한 장소(테스트 고정 데이터에 있음, 그래도 영업 여부는 다시 확인) · ? = 이름·위치·조건을 꼭 확인 · 표시 없음 = 잘 알려진 장소, 정확한 위치만 지도에서 확인.

**이름 규칙 (2026-10-26 결정, 설계는 ADR-0026 진행 중):** 이름은 영어로 쓴다. 고유명사는 소리대로(万代 → Mandai), 일반 명사는 뜻대로(駅 → Station, 市役所 → City Hall). 현장에서 일본어로 말해야 통하는 곳(시청·병원·출입국관리국 등)은 일본어를 괄호로 붙인다. 로마자가 한 글자 이상 있어야 한다(서버가 검사할 예정). 이름은 번역하지 않는다 — 일본어 정식 이름은 Google 지도 링크와 핀으로 확인한다. "일본어 (참고)" 칸은 현장 확인용이고 등록하지 않는다.

**설명:** ja/en/ko 중 아무 언어로 써도 화면 언어로 자동 번역되게 설계 중이다(ADR-0026). 그래서 이 목록에는 아직 설명 대신 "왜"(등록할 이유, 한국어)만 적었다.

**지도 링크:** "지도 검색" 은 Google 지도 검색 주소다. 등록할 때는 그 장소의 실제 Google 지도 링크(공유 링크 `maps.app.goo.gl/…` 도 됨)로 바꾸는 게 좋다. 장소 정보를 Google 지도에서 옮겨 적지는 않는다(이용약관) — 이름·위치는 현장과 공식 사이트로 확인한다.

## 히라카타 (20+) — 22곳

| # | 등록할 이름 (영어) | 일본어 (참고) | 분류 | 왜 | 확인 | 지도 |
|---|---|---|---|---|---|---|
| 1 | Keihan Gotenyama Station | 京阪 御殿山駅 | 교통 🚉 | 가장 가까운 역. 보통 열차만 서서 교토·오사카는 枚方市에서 갈아타는 게 빠름 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%98%AA%20%E5%BE%A1%E6%AE%BF%E5%B1%B1%E9%A7%85) |
| 2 | Keihan Hirakatashi Station | 京阪 枚方市駅 | 교통 🚉 | 특급이 서는 역. 교토(기온시조)·오사카(요도야바시) 직통 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%98%AA%20%E6%9E%9A%E6%96%B9%E5%B8%82%E9%A7%85) |
| 3 | Keihan Hirakata-koen Station | 京阪 枚方公園駅 | 교통 🚉 | 히라카타 파크와 옛 숙장 거리(枚方宿) 쪽 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%98%AA%20%E6%9E%9A%E6%96%B9%E5%85%AC%E5%9C%92%E9%A7%85) |
| 4 | Bicycle Parking, Gotenyama East | 駐輪場（御殿山東） | 교통 🚉 | 하루 100엔. 자전거면 枚方市駅까지 5분 정도 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%A7%90%E8%BC%AA%E5%A0%B4%EF%BC%88%E5%BE%A1%E6%AE%BF%E5%B1%B1%E6%9D%B1%EF%BC%89) |
| 5 | Hirakata City Hall (枚方市役所) | 枚方市役所 | 서류 📄 | 전입 신고, 국민건강보험, 마이넘버. 입국 후 14일 안에 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9E%9A%E6%96%B9%E5%B8%82%E5%BD%B9%E6%89%80) |
| 6 | Nagisa Post Office | 渚郵便局 | 서류 📄 | 유초 은행 계좌, 국제 우편 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%9A%E9%83%B5%E4%BE%BF%E5%B1%80) |
| 7 | 7-Eleven Gotenyama Station | セブン-イレブン 御殿山駅前 | 생활 🛒 | 24시간, ATM, 택배 수령, 서류 인쇄 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%BB%E3%83%96%E3%83%B3-%E3%82%A4%E3%83%AC%E3%83%96%E3%83%B3%20%E5%BE%A1%E6%AE%BF%E5%B1%B1%E9%A7%85%E5%89%8D) |
| 8 | FamilyMart | ファミリーマート | 생활 🛒 | 결에서 가까운 편의점 (지점명 현장 확인) | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%83%95%E3%82%A1%E3%83%9F%E3%83%AA%E3%83%BC%E3%83%9E%E3%83%BC%E3%83%88) |
| 9 | Mandai Hirakata | 万代 枚方店 | 생활 🛒 | 가장 가깝고 싼 슈퍼 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%87%E4%BB%A3%20%E6%9E%9A%E6%96%B9%E5%BA%97) |
| 10 | LIFE Gotenyama | ライフ 御殿山店 | 생활 🛒 | 역에서 돌아오는 길의 슈퍼 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%83%A9%E3%82%A4%E3%83%95%20%E5%BE%A1%E6%AE%BF%E5%B1%B1%E5%BA%97) |
| 11 | DAISO Hirakata Mall | DAISO 枚方モール | 생활 🛒 | 첫 주에 필요한 생활용품 대부분 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=DAISO%20%E6%9E%9A%E6%96%B9%E3%83%A2%E3%83%BC%E3%83%AB) |
| 12 | (가까운 드럭스토어 — 이름은 현장에서) | ドラッグストア（近く） | 건강 ➕ | 약·생활용품. 가장 가까운 곳을 현장에서 골라 등록 | ? | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%83%89%E3%83%A9%E3%83%83%E3%82%B0%E3%82%B9%E3%83%88%E3%82%A2%EF%BC%88%E8%BF%91%E3%81%8F%EF%BC%89) |
| 13 | Nagisatanano Family Clinic | なぎさ たなの ファミリークリニック | 건강 ➕ | 가장 가까운 내과. 외국인 환자 진료 경험 많음 (정식 이름 현장 확인) | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%81%AA%E3%81%8E%E3%81%95%20%E3%81%9F%E3%81%AA%E3%81%AE%20%E3%83%95%E3%82%A1%E3%83%9F%E3%83%AA%E3%83%BC%E3%82%AF%E3%83%AA%E3%83%8B%E3%83%83%E3%82%AF) |
| 14 | Kansai Medical University Hospital (関西医科大学附属病院) | 関西医科大学附属病院 | 건강 ➕ | 枚方市駅 근처의 큰 대학병원. 소개장이 필요한 경우가 많음 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%96%A2%E8%A5%BF%E5%8C%BB%E7%A7%91%E5%A4%A7%E5%AD%A6%E9%99%84%E5%B1%9E%E7%97%85%E9%99%A2) |
| 15 | Hirakata City Hospital (市立ひらかた病院) | 市立ひらかた病院 | 건강 ➕ | 시립 종합병원 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%B8%82%E7%AB%8B%E3%81%B2%E3%82%89%E3%81%8B%E3%81%9F%E7%97%85%E9%99%A2) |
| 16 | Kansai Gaidai Gotenyama Campus | 関西外国語大学 御殿山キャンパス・グローバルタウン | 공부 📚 | 결 근처 캠퍼스 (위치·명칭 확인) | ? | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%96%A2%E8%A5%BF%E5%A4%96%E5%9B%BD%E8%AA%9E%E5%A4%A7%E5%AD%A6%20%E5%BE%A1%E6%AE%BF%E5%B1%B1%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%91%E3%82%B9%E3%83%BB%E3%82%B0%E3%83%AD%E3%83%BC%E3%83%90%E3%83%AB%E3%82%BF%E3%82%A6%E3%83%B3) |
| 17 | Hirakata T-SITE | 枚方 T-SITE | 공부 📚 | 아침 7시~밤 10시, 위층이 조용해 시험 기간에 좋음 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9E%9A%E6%96%B9%20T-SITE) |
| 18 | Hirakata Central Library (枚方市立中央図書館) | 枚方市立中央図書館 | 공부 📚 | 시립 도서관. 이용 카드 조건 확인 | ? | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9E%9A%E6%96%B9%E5%B8%82%E7%AB%8B%E4%B8%AD%E5%A4%AE%E5%9B%B3%E6%9B%B8%E9%A4%A8) |
| 19 | Chuka Soba Fumoto | 中華そば ふもと | 음식 🍜 | 枚方市駅 근처 라멘. 점심과 저녁 사이 쉼 | ✔ | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%AD%E8%8F%AF%E3%81%9D%E3%81%B0%20%E3%81%B5%E3%82%82%E3%81%A8) |
| 20 | Hirakata Park | ひらかたパーク | 관광 ⛩️ | 오래된 놀이공원. 枚方公園駅 바로 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%81%B2%E3%82%89%E3%81%8B%E3%81%9F%E3%83%91%E3%83%BC%E3%82%AF) |
| 21 | Yodogawa Riverside Park, Hirakata | 淀川河川公園 枚方地区 | 관광 ⛩️ | 강변 산책·자전거 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B7%80%E5%B7%9D%E6%B2%B3%E5%B7%9D%E5%85%AC%E5%9C%92%20%E6%9E%9A%E6%96%B9%E5%9C%B0%E5%8C%BA) |
| 22 | Kagiya Museum (鍵屋資料館) | 鍵屋資料館（枚方宿） | 관광 ⛩️ | 옛 숙장 마을과 강 배 나루터의 역사 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%8D%B5%E5%B1%8B%E8%B3%87%E6%96%99%E9%A4%A8%EF%BC%88%E6%9E%9A%E6%96%B9%E5%AE%BF%EF%BC%89) |

## 오사카 (10+) — 11곳

| # | 등록할 이름 (영어) | 일본어 (참고) | 분류 | 왜 | 확인 | 지도 |
|---|---|---|---|---|---|---|
| 1 | Osaka Immigration Services Bureau (大阪出入国在留管理局) | 大阪出入国在留管理局 | 서류 📄 | 재류 카드 갱신·자격외활동 허가. 유학생에게 가장 실용적 (코스모스퀘어) |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%A4%A7%E9%98%AA%E5%87%BA%E5%85%A5%E5%9B%BD%E5%9C%A8%E7%95%99%E7%AE%A1%E7%90%86%E5%B1%80) |
| 2 | Keihan Kyobashi Station | 京阪 京橋駅 | 교통 🚉 | JR 환상선으로 갈아타는 곳 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%98%AA%20%E4%BA%AC%E6%A9%8B%E9%A7%85) |
| 3 | Keihan Yodoyabashi Station | 京阪 淀屋橋駅 | 교통 🚉 | 게이한 본선 오사카 쪽 종점, 지하철 미도스지선 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%98%AA%20%E6%B7%80%E5%B1%8B%E6%A9%8B%E9%A7%85) |
| 4 | Osaka Station / Umeda | 大阪駅・梅田 | 교통 🚉 | JR·한큐·한신·지하철이 모이는 중심 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%A4%A7%E9%98%AA%E9%A7%85%E3%83%BB%E6%A2%85%E7%94%B0) |
| 5 | Shin-Osaka Station | 新大阪駅 | 교통 🚉 | 신칸센 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E5%A4%A7%E9%98%AA%E9%A7%85) |
| 6 | Kansai International Airport | 関西国際空港 | 교통 🚉 | 귀국·여행 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%96%A2%E8%A5%BF%E5%9B%BD%E9%9A%9B%E7%A9%BA%E6%B8%AF) |
| 7 | Osaka Castle | 大阪城 | 관광 ⛩️ | 성과 공원 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%A4%A7%E9%98%AA%E5%9F%8E) |
| 8 | Dotonbori | 道頓堀 | 관광 ⛩️ | 난바의 번화가, 글리코 간판 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%81%93%E9%A0%93%E5%A0%80) |
| 9 | Kuromon Market | 黒門市場 | 음식 🍜 | 시장 먹거리 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%BB%92%E9%96%80%E5%B8%82%E5%A0%B4) |
| 10 | Shinsekai / Tsutenkaku | 新世界・通天閣 | 관광 ⛩️ | 쿠시카쓰와 옛 오사카 분위기 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E4%B8%96%E7%95%8C%E3%83%BB%E9%80%9A%E5%A4%A9%E9%96%A3) |
| 11 | Kaiyukan Aquarium | 海遊館 | 관광 ⛩️ | 큰 수족관 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B5%B7%E9%81%8A%E9%A4%A8) |

## 교토 (10+) — 11곳

| # | 등록할 이름 (영어) | 일본어 (참고) | 분류 | 왜 | 확인 | 지도 |
|---|---|---|---|---|---|---|
| 1 | Fushimi Inari Taisha | 伏見稲荷大社 | 관광 ⛩️ | 천 개의 도리이. 게이한 伏見稲荷駅 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BC%8F%E8%A6%8B%E7%A8%B2%E8%8D%B7%E5%A4%A7%E7%A4%BE) |
| 2 | Yasaka Shrine / Gion | 八坂神社・祇園 | 관광 ⛩️ | 게이한 祇園四条駅에서 바로 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%85%AB%E5%9D%82%E7%A5%9E%E7%A4%BE%E3%83%BB%E7%A5%87%E5%9C%92) |
| 3 | Kiyomizu-dera | 清水寺 | 관광 ⛩️ | 나무 무대의 절 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%85%E6%B0%B4%E5%AF%BA) |
| 4 | Nishiki Market | 錦市場 | 음식 🍜 | 교토의 부엌 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%8C%A6%E5%B8%82%E5%A0%B4) |
| 5 | Nijo Castle | 二条城 | 관광 ⛩️ | 세계유산 성 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%8C%E6%9D%A1%E5%9F%8E) |
| 6 | Kinkaku-ji | 金閣寺 | 관광 ⛩️ | 금각 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%87%91%E9%96%A3%E5%AF%BA) |
| 7 | Ginkaku-ji / Philosopher's Path | 銀閣寺・哲学の道 | 관광 ⛩️ | 산책길 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E9%8A%80%E9%96%A3%E5%AF%BA%E3%83%BB%E5%93%B2%E5%AD%A6%E3%81%AE%E9%81%93) |
| 8 | Arashiyama Bamboo Grove | 嵐山・竹林の小径 | 관광 ⛩️ | 대나무 숲과 강 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%B5%90%E5%B1%B1%E3%83%BB%E7%AB%B9%E6%9E%97%E3%81%AE%E5%B0%8F%E5%BE%84) |
| 9 | Byodo-in, Uji | 平等院 | 관광 ⛩️ | 10엔 동전의 그 건물. 게이한 우지선 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%B9%B3%E7%AD%89%E9%99%A2) |
| 10 | Shimogamo Shrine | 下鴨神社・出町柳 | 관광 ⛩️ | 게이한 본선 교토 쪽 종점 근처 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%8B%E9%B4%A8%E7%A5%9E%E7%A4%BE%E3%83%BB%E5%87%BA%E7%94%BA%E6%9F%B3) |
| 11 | Kyoto Station | 京都駅 | 교통 🚉 | 신칸센·JR |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E9%83%BD%E9%A7%85) |

## 나라 (10+) — 11곳

| # | 등록할 이름 (영어) | 일본어 (참고) | 분류 | 왜 | 확인 | 지도 |
|---|---|---|---|---|---|---|
| 1 | Todai-ji | 東大寺 | 관광 ⛩️ | 대불 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E5%A4%A7%E5%AF%BA) |
| 2 | Nara Park | 奈良公園 | 관광 ⛩️ | 사슴 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%A5%88%E8%89%AF%E5%85%AC%E5%9C%92) |
| 3 | Kasuga Taisha | 春日大社 | 관광 ⛩️ | 등롱이 많은 신사 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%98%A5%E6%97%A5%E5%A4%A7%E7%A4%BE) |
| 4 | Kofuku-ji | 興福寺 | 관광 ⛩️ | 오층탑 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E8%88%88%E7%A6%8F%E5%AF%BA) |
| 5 | Naramachi | ならまち | 관광 ⛩️ | 옛 상가 거리 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%81%AA%E3%82%89%E3%81%BE%E3%81%A1) |
| 6 | Nara National Museum | 奈良国立博物館 | 관광 ⛩️ | 불상 전시 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%A5%88%E8%89%AF%E5%9B%BD%E7%AB%8B%E5%8D%9A%E7%89%A9%E9%A4%A8) |
| 7 | Horyu-ji | 法隆寺 | 관광 ⛩️ | 세계에서 오래된 목조 건축 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B3%95%E9%9A%86%E5%AF%BA) |
| 8 | Yakushi-ji | 薬師寺 | 관광 ⛩️ | 니시노쿄의 절 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E8%96%AC%E5%B8%AB%E5%AF%BA) |
| 9 | Heijo Palace Site | 平城宮跡 | 관광 ⛩️ | 옛 궁터, 넓은 공원 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%B9%B3%E5%9F%8E%E5%AE%AE%E8%B7%A1) |
| 10 | Kintetsu Nara Station | 近鉄奈良駅 | 교통 🚉 | 나라 공원 쪽 관문 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E8%BF%91%E9%89%84%E5%A5%88%E8%89%AF%E9%A7%85) |
| 11 | JR Nara Station | JR 奈良駅 | 교통 🚉 | JR 쪽 관문 |  | [지도 검색](https://www.google.com/maps/search/?api=1&query=JR%20%E5%A5%88%E8%89%AF%E9%A7%85) |

## 다음

1. 책임자가 목록을 보고 빼거나 더할 곳을 정한다
2. 설명 언어를 정한다 (영어 / 쉬운 일본어 / 섞기)
3. 정한 언어로 설명 초안을 쓴다 (Claude) — 한 곳에 1~2문장, 바뀌기 쉬운 영업시간은 "확인 필요" 정도로
4. 등록 (책임자·RA, 앱에서) → 공지
