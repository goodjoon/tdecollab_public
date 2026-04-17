<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
  - Added: 문서 기반 원칙 (Document-Driven)
  - Added: 철저한 추적성 (Traceability)
  - Added: 인간 승인 필수 (Human Approval)
  - Added: 완전한 감사 가능성 (Auditability)
  - Added: 시스템 통합 및 자동화 (System Integration)
- Added sections: 워크플로우 제약사항, 거버넌스 (Governance)
- Removed sections: 기존 템플릿 예시
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: 없음
-->
# TDE Collab 헌장

## 핵심 원칙

### I. 문서 기반 원칙 (Document-Driven)
모든 정의, 설계, 진행, 리뷰 과정은 반드시 문서화되어야 합니다. PRD, 기능정의서, 테스트설계서, UI/UX 정의서 등 모든 산출물은 Confluence를 통해 생성되고 관리됩니다. 코드를 작성하기 전에 반드시 문서를 통한 합의가 선행되어야 합니다.

### II. 철저한 추적성 (Traceability)
문서(Confluence) - 티켓(JIRA) - 코드(GitLab) - 상태 간의 완전한 추적성을 보장해야 합니다. JIRA 티켓은 관련된 Confluence 문서를 참조해야 하며, GitLab의 모든 커밋과 MR(Merge Request)은 관련된 JIRA 티켓 번호를 포함하여 자동으로 상태가 동기화되도록 합니다.

### III. 인간 승인 필수 (Human Approval)
AI 에이전트에 의한 자동화된 개발 및 작업 수행이 이루어지더라도, 중요한 의사결정, 설계 확정, 코드 리뷰 완료 및 프로덕션 배포는 반드시 권한을 가진 사람(Human)의 명시적인 승인을 거쳐야 합니다.

### IV. 완전한 감사 가능성 (Auditability)
AI 에이전트가 수행한 모든 작업(프롬프트, 도구 호출, 시스템 변경 등)과 자동화 파이프라인의 실행 이력은 영구적으로 기록되고 감사 가능해야 합니다. 어떤 결정이 왜 내려졌는지 사후에 명확히 파악할 수 있어야 합니다.

### V. 시스템 연동 및 자동화 (System Integration & Automation)
사내 온프레미스 시스템(Confluence, JIRA, GitLab)의 API 및 Webhook을 적극 활용하여 수작업을 최소화합니다. 에이전틱(Agentic) AI 개발 도구는 이 플랫폼 위에서 헌장의 흐름을 강제하는 하네스(Harness)로 동작해야 합니다.

## 워크플로우 제약사항

1. **기획 및 설계**: Confluence에 PRD 및 관련 문서 작성
2. **작업 할당**: 승인된 문서를 바탕으로 JIRA에 개발 Task 생성
3. **구현**: JIRA 티켓을 기준으로 작업 진행 (GitLab 저장소 브랜치 생성)
4. **리뷰 및 통합**: GitLab에 푸시 및 MR 생성 시 JIRA 티켓 상태 자동 업데이트, 사람의 리뷰 및 승인 후 머지

## 거버넌스

- 이 헌장은 TDE Collab 프로젝트의 모든 에이전트 및 인간의 활동에 최우선적으로 적용됩니다.
- 헌장 수정 시 반드시 팀의 합의와 명시적인 버전 업데이트, 변경 이력 문서화가 필요합니다.
- 프로젝트 내 모든 자동화 스크립트와 AI 프롬프트는 본 헌장의 규칙을 위반하지 않도록 구성되어야 합니다.

**Version**: 1.1.0 | **Ratified**: 2026-04-17 | **Last Amended**: 2026-04-17
