<!--
Sync Impact Report:
- Version change: 1.1.0 -> 2.0.0 (MAJOR bump: Total rewrite based on new requirements)
- Modified principles:
  - Added: @tdecollab-docs/ 기반 컨텍스트 유지 (Context Maintenance)
  - Added: 코드 품질 및 가독성 (Code Quality & Readability)
  - Added: 테스트 주도 개발 (Test-Driven Development)
  - Added: 시각화 및 문서화 (Rich Documentation)
  - Added: 클린 아키텍처 및 클린 코드 (Clean Architecture & Code)
- Added sections: 추가 제약 사항 (Additional Constraints), 개발 워크플로우 (Development Workflow)
- Removed sections: 기존 헌장 내용 전체 (Total rewrite)
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: 없음
-->
# TDE Collab 헌장

## 핵심 원칙

### I. @tdecollab-docs/ 기반 컨텍스트 유지 (Context Maintenance)
모든 분석, 설계, 의사결정 기록은 반드시 `@tdecollab-docs/` 디렉토리에 문서로 남겨야 합니다. 이를 통해 서로 다른 채팅 세션에서도 AI 에이전트와 인간이 동일한 컨텍스트를 유지하고 협업할 수 있도록 합니다.

### II. 코드 품질 및 가독성 (Code Quality & Readability)
모든 코드는 재사용성, 품질, 가독성을 최우선으로 합니다. 사람이 코드를 따라가기 쉽고 이해하기 좋게 작성되어야 하며, 명확한 네이밍과 관습을 준수합니다.

### III. 테스트 주도 개발 (Test-Driven Development)
기능 구현 시 반드시 테스트 코드를 함께 작성해야 합니다. 테스트는 구현의 정확성을 보장할 뿐만 아니라, 코드의 사용법을 설명하는 문서의 역할도 겸합니다.

### IV. 시각화 및 문서화 (Rich Documentation)
문서 작성 시 Mermaid 다이어그램(Sequence, Flowchart, Class 등)과 표를 적극적으로 활용합니다. 텍스트 위주의 나열보다는 시각적인 도구를 통해 깔끔하고 가독성 좋은 정보를 제공합니다.

### V. 클린 아키텍처 및 클린 코드 (Clean Architecture & Code)
클린 아키텍처와 클린 코드를 기반으로 중복이 없고(DRY), 역할과 기능의 경계(Boundary)를 명확히 합니다. 각 모듈은 단일 책임 원칙을 준수하며 결합도를 낮추고 응집도를 높입니다.

## 추가 제약 사항 (Additional Constraints)

- **모듈화된 서브프로젝트 구조**: 역할과 책임에 따라 서브프로젝트 단위로 모듈화된 구조를 유지합니다. 이는 대규모 프로젝트에서도 유지보수성을 확보하기 위함입니다.
- **사용자 경험(UX) 중시**: 최종 사용자가 시스템을 사용함에 있어 불편함이 없도록 직관적이고 일관된 경험을 제공하는 것을 목표로 합니다.

## 개발 워크플로우 (Development Workflow)

1. **분석 및 설계**: `@tdecollab-docs/`에 분석 및 설계 문서 작성 (다이어그램 포함).
2. **테스트 작성**: 구현 전 또는 구현과 동시에 테스트 코드 작성.
3. **구현**: 클린 아키텍처 및 클린 코드 원칙을 준수하여 모듈별 구현.
4. **검증**: 전체 테스트 수행 및 문서 업데이트.

## 거버넌스

- 이 헌장은 프로젝트의 모든 개발 활동에서 최우선 순위를 가집니다.
- 헌장 수정 시 시맨틱 버저닝(Semantic Versioning)을 준수하여 버전을 업데이트합니다.
- 모든 코드 리뷰와 PR은 이 헌장의 준수 여부를 확인해야 합니다.

**Version**: 2.0.0 | **Ratified**: 2024-05-24 | **Last Amended**: 2024-05-24
