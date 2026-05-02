  권장 입출력 흐름
  
  | 단계 | 입력(Input) | 작성/구현 산출물(Output) | 구현 진입 시점 | 테스트 기준/결과 |
  |---|---|---|---|---|
  | 0. 문서 진입점 | 사용자 요청, 기존 문서 현황 | cointwo-docs/README.md 또는 index.md | 항상 선행 | 최신 문서 링크, 상
  태 요약 |
  | 1. 요구사항 정제 | 사용자 요구, 시장분석 | cointwo-docs/1.분석/PRD_기능명.md, 1.분석/C.계획/기능명_사전질답.md | 아
  직 구현 금지 | PRD 승인본, 사전질답 해소본 |
  | 2. 제품 로드맵 정의 | 승인된 PRD | 1.분석/C.계획/Roadmap_Phase1.md ~ Roadmap_Phase4.md | 아직 구현 금지 | 각 Roadmap
  Phase의 범위/완료조건 확정 |
  | 3. 시스템 설계 | PRD, 사전질답, 로드맵 Phase 문서 | cointwo-docs/2.설계/Architecture/*, 2.설계/API/*, 2.설계/UI/*,
  필요 시 2.설계/Domain/* | 설계 승인 후 | API 계약, 데이터 모델, 시퀀스/아키텍처 다이어그램 |
  | 4. 구현 계획 | 설계 승인본 | cointwo-docs/3.구현/plans/YYYY-MM-DD-기능-plan.md | 이 문서 승인 후 구현 시작 | 태스크
  체크리스트, 대상 파일 목록, 검증 명령 |
  | 5. 코드 구현 | plan, 설계, PRD | backend/*, frontend/*, infra/* 코드와 테스트 코드 | 여기서 실제 구현 | 코드 리뷰,
  plan 체크 갱신 |
  | 6. 테스트 설계/실행 | PRD acceptance, 설계 계약, 구현 코드 | cointwo-docs/4.테스트/YYYY-MM-DD-기능-test-
  spec.md, ...-test-report.md, 코드 내 unit/integration test | 구현 직후 | PRD 기준 기능 테스트, 설계 기준 계약 테스트,
  실행 결과 기록 |
  | 7. 히스토리/컨텍스트 | 최종 코드, 테스트 결과 | cointwo-docs/5.히스토리/기능_context.md, changelog | 테스트 통과 후
  | 다음 작업자가 바로 이어받을 수 있는 변경 이력 |

