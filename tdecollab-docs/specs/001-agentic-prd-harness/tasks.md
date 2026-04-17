---
description: "Task list template for feature implementation"
---

# Tasks: Agentic PRD Harness

**Confluence Link**: `[LINK_TO_CONFLUENCE]`
**JIRA Epic/Ticket**: `[JIRA_TICKET_ID]`
**Input**: Design documents from `tdecollab-docs/specs/001-agentic-prd-harness/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 모노레포 구조 초기화 및 기반 설정

- [ ] T001 기존 `src/` 디렉토리를 `tools/` 로 이름 변경하여 MCP 프로젝트로 재정의
- [ ] T002 `frontend/` 디렉토리 생성 및 Next.js 프로젝트 초기화
- [ ] T003 `backend/` 디렉토리 생성 및 FastAPI 프로젝트 초기화
- [ ] T004 [P] 최상위 모노레포 빌드/실행 환경 구성 (pnpm workspaces 혹은 Makefile)
- [ ] T005 [P] `frontend/` Tailwind CSS 및 React 컴포넌트 프레임워크(shadcn/ui 등) 설정
- [ ] T006 [P] `backend/` PostgreSQL 데이터베이스 및 ORM (SQLAlchemy) 연동 설정
- [ ] T007 `backend/` CORS 및 기본 보안 미들웨어 설정

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 공통 데이터 모델 및 코어 모듈

- [ ] T008 `backend/app/models/` 에 `SpecificationDocument` 및 `DevelopmentTask` 엔티티 정의
- [ ] T009 `backend/app/models/` 에 `SyncState` (GitLab Polling용) 엔티티 정의
- [ ] T010 [P] 데이터베이스 마이그레이션 스크립트 작성 및 실행 (Alembic)
- [ ] T011 [P] `tools/` 하위의 JIRA, Confluence, GitLab MCP 래퍼와 `backend/` 간의 내부 API 호출 클라이언트 구성
- [ ] T012 `frontend/src/services/` 에 Backend 연동을 위한 axios 기반 API 클라이언트 초기화

---

## Phase 3: User Story 1 - 웹 기반 AI 대화를 통한 기획 문서 작성 및 Confluence 업로드 (Priority: P1) 🎯 MVP

**Goal**: AI와 대화하며 문서를 작성하고 Confluence로 발행하는 기능 구현

### Implementation for User Story 1

- [ ] T013 [P] [US1] `backend/` PRD 문서 관리를 위한 `POST /api/documents` 및 `PUT /api/documents/:id` 엔티티 API 구현
- [ ] T014 [US1] `backend/` AI 연동 로직 구현 (MCP Protocol을 통해 LLM 호출 및 문서 초안 생성)
- [ ] T015 [US1] `backend/` Confluence 연동을 위한 `POST /api/documents/:id/publish` API 구현
- [ ] T016 [P] [US1] `frontend/` AI 에이전트와 실시간 대화할 수 있는 채팅 UI 컴포넌트 구현
- [ ] T017 [P] [US1] `frontend/` 생성된 PRD 항목을 조회하고 수정할 수 있는 에디터 폼 컴포넌트 구현
- [ ] T018 [US1] `frontend/` 채팅 UI와 에디터 상태를 연동하는 페이지 작성
- [ ] T019 [US1] `frontend/` 작성 완료 후 'Confluence 동기화' 버튼 클릭 시 Backend API 호출 연동
- [ ] T020 [US1] 기능 테스트: AI 대화, 문서 갱신, Confluence 발행 E2E 흐름 점검

---

## Phase 4: User Story 2 - JIRA 개발 Task 자동 분할 및 발행 (Priority: P1)

**Goal**: 확정된 기획 문서를 기반으로 Task를 분할하고 JIRA에 선후 관계를 반영하여 티켓 생성

### Implementation for User Story 2

- [ ] T021 [P] [US2] `backend/` 문서 기반 Task 도출 AI 파이프라인 구현 (`POST /api/documents/:id/tasks/generate`)
- [ ] T022 [US2] `backend/` 도출된 Task를 JIRA Issue Link('blocks')를 포함하여 발행하는 `POST /api/documents/:id/tasks/publish` 로직 구현
- [ ] T023 [P] [US2] `frontend/` 자동 도출된 개발 Task 목록 및 우선순위/의존성을 시각화하는 표/목록 UI 컴포넌트 구현
- [ ] T024 [US2] `frontend/` 'JIRA에 발행' 버튼 기능 연동 및 응답 상태 표시
- [ ] T025 [US2] 기능 테스트: 생성된 Task가 의존성을 유지한 채 JIRA 티켓으로 올바르게 발행되는지 검증

---

## Phase 5: User Story 3 - GitLab 연동을 통한 JIRA 티켓 상태 자동 업데이트 (Priority: P2)

**Goal**: GitLab 커밋 및 MR 이벤트를 감지하여 JIRA 티켓 상태를 자동 갱신 (Webhook 및 Polling 지원)

### Implementation for User Story 3

- [ ] T026 [P] [US3] `backend/app/webhooks/` 에 GitLab Webhook 이벤트를 수신하는 `POST /api/webhooks/gitlab` API 구현
- [ ] T027 [P] [US3] `backend/` Webhook 이벤트(push, merge_request) 파싱 및 JIRA 티켓 번호 추출 유틸리티 작성
- [ ] T028 [US3] `backend/` 추출된 JIRA 티켓을 대상으로 상태(Transition)를 변경하는 JIRA API 호출 서비스 작성
- [ ] T029 [US3] `backend/` 방화벽 환경을 대비한 GitLab Polling 스케줄러(Daemon/Cron) 구현 및 `SyncState` 모델 연동 로직 작성
- [ ] T030 [US3] `backend/` `.env` 설정(`GITLAB_SYNC_MODE`)에 따라 Webhook 수신 모드와 Polling 모드 분기 처리
- [ ] T031 [US3] 기능 테스트: 모의 Webhook 데이터 전송 및 Polling 스케줄러 트리거 시 JIRA 상태가 변경되는지 E2E 테스트

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 문서 업데이트, 오류 처리 및 배포 준비

- [ ] T032 [P] 전체 서브프로젝트(`frontend/`, `backend/`, `tools/`)에 대한 린트 및 포매팅 스크립트 정비
- [ ] T033 에러 처리 공통화 및 글로벌 예외 핸들링 구조 강화 (Frontend/Backend)
- [ ] T034 [P] 빠른 시작 가이드(`quickstart.md`)에 따른 배포 안내 및 환경 변수 문서화 확인
- [ ] T035 [P] (선택) Dockerfile 작성 (Frontend, Backend, Tools)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** 은 즉시 병렬 실행 가능합니다.
- **Phase 2 (Foundational)** 은 Phase 1 완료 후 수행해야 하며, DB 모델과 클라이언트 구조를 확정합니다.
- **Phase 3 (US1)** 과 **Phase 4 (US2)** 는 의존성이 일부 있으나(Task 생성은 PRD 문서에 의존), 프론트엔드 UI 작업 등은 병렬로 진행 가능합니다. (우선 MVP인 US1 완수 권장)
- **Phase 5 (US3)** 은 US1, US2와 완전히 독립적으로 수행될 수 있는 백엔드 중심의 통합 기능입니다.

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Setup 및 Foundation 구성 (프론트/백 기본 연결 확인)
2. US1(기획서 작성 및 Confluence 배포)을 최우선으로 완료하여 주요 사용자 가치를 즉시 검증

### Incremental Delivery
1. MVP 이후 US2(JIRA Task 발행) 추가하여 개발 프로세스 연동
2. 마지막으로 US3(GitLab 상태 연동)을 추가하여 전체 자동화 하네스 완성
