# Data Model: Agentic PRD Harness

## 1. 주요 엔티티 (Key Entities)

### 1.1 기획 문서 (Specification Document)
웹 UI에서 작성 및 관리되며, 이후 Confluence로 발행되는 문서 데이터 구조입니다.

- `id`: 문서 고유 식별자 (UUID)
- `title`: 문서 제목 (PRD 제목)
- `status`: 문서 상태 (Draft, Review, Approved, Published)
- `content`: 구조화된 기획 내용
  - `scenarios`: 사용자 시나리오 목록
  - `requirements`: 기능 요구사항 목록
  - `successCriteria`: 성공 기준 목록
- `confluenceUrl`: 발행된 Confluence 페이지 링크
- `createdAt` / `updatedAt`: 생성 및 수정 시간

### 1.2 개발 Task (Development Task)
기획 문서를 바탕으로 도출된 개별 작업 단위입니다.

- `id`: 임시 식별자 (JIRA 발행 전)
- `documentId`: 연관된 기획 문서 ID
- `title`: Task 제목 (JIRA Summary에 해당)
- `description`: 구현 방안 및 설계 정보
- `priority`: 우선순위 (High, Medium, Low)
- `dependencies`: 선행 Task ID 목록 (이 Task가 시작되기 전 완료되어야 할 Task들)
- `jiraIssueKey`: 발행된 JIRA 이슈 키 (예: PROJ-101)
- `status`: 작업 상태 (Todo, In Progress, In Review, Done)

### 1.3 Webhook 이벤트 (Webhook Event) - GitLab 연동용
GitLab 커밋 및 MR 상태 추적을 위한 데이터 구조입니다.

- `eventId`: 이벤트 고유 식별자
- `eventType`: 이벤트 유형 (push, merge_request)
- `projectId`: GitLab 프로젝트 ID
- `jiraIssueKeys`: 파싱된 연관 JIRA 티켓 키 목록
- `action`: 상태 변경 요청 (예: transition to In Review)

### 1.4 동기화 상태 추적 (Sync State) - Polling 방식 전용
Webhook을 사용할 수 없을 때 GitLab 폴링 주기를 효율적으로 관리하기 위한 메타데이터 구조입니다.

- `projectId`: 추적 대상 GitLab 프로젝트 ID
- `lastCommitCheckedAt`: 마지막으로 가져온 커밋의 시간(timestamp)
- `lastMrCheckedAt`: 마지막으로 가져온 MR 이벤트 시간(timestamp)
