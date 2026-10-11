# YUI Board 설계 문서

기획 문서([docs/README.md](../README.md))를 이어받는 개발 설계 문서다. 2026-10-11, M0(프로토타입) → M1(백엔드 기반) 전환 직전에 작성했다.

**형식: SAD 대신 RFC 하나 + ADR.** 사용자 650명, 개발자 소수, 비용 0, 컨테이너 4개 규모라 아키텍처를 [RFC-0001](rfc/0001-m1-backend-foundation.md) 한 문서에 모았다. 예외로 ERD 는 핵심 보안 장치라 따로 두었다. 이유는 RFC-0001 §0.

| 문서 | 내용 | 기획 짝 |
|---|---|---|
| [tech-stack.md](tech-stack.md) | 기술 검토서 · 스택 선정 (가격·한도 확인일 2026-10-11) | PRD |
| [rfc/0001-m1-backend-foundation.md](rfc/0001-m1-backend-foundation.md) | 아키텍처: C4, 신뢰 경계, 쓰기 경로, 데이터 계층, 오프라인, 시퀀스 | 기능명세, 핸드오프 §5 |
| [erd.md](erd.md) | 현행 vs 제안 ERD, 권한, 함수, 마이그레이션 순서 | 핸드오프 §3, PRD §7.1 |
| [openapi.yaml](openapi.yaml) | Edge Function + PostgREST RPC 설계 명세 | 핸드오프 §5 |
| [infra.md](infra.md) | 구성도, 환경, 배포, 백업 | 출시 계획 |
| [conventions.md](conventions.md) | 현행 관례 추출 + 실데이터 연결 규칙 | CLAUDE.md |

## ADR (모두 "제안됨")

| # | 결정 |
|---|---|
| [0001](../adr/0001-structural-anonymity.md) | 익명성은 DB 구조로 강제 |
| [0002](../adr/0002-write-path-and-translation.md) | 본문 쓰기 = Edge Function 번역 후 `p_author` service RPC (Q4) |
| [0003](../adr/0003-keep-single-file-client.md) | 단일 `index.html` 유지, SDK 없이 데이터 계층 |
| [0004](../adr/0004-login-method.md) | 이메일 OTP + 방 초대 코드 (Q3) |
| [0005](../adr/0005-exchange-request-redesign.md) | 교환 요청 재설계 (S-2) |
| [0006](../adr/0006-append-only-moderation-log.md) | 운영 기록 추가 전용 (S-3) |
| [0007](../adr/0007-anonymous-metrics.md) | 익명 일별 카운터 지표 (Q10) |
| [0008](../adr/0008-hosting.md) | GitHub Pages 유지 + meta CSP·SRI |

QA 테스트 계획은 [docs/08-qa/test-plan.md](../08-qa/test-plan.md) 가 담당한다. 설계 쪽 추가 케이스는 [ERD §8](erd.md#8-익명성-검증-케이스-추가-제안) 에 제안만 했다.
