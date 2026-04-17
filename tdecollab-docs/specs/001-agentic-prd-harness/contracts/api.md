# API Contracts

이 문서는 Frontend(웹 UI)와 Backend, 그리고 GitLab Webhook 연동을 위한 인터페이스 규약을 정의합니다.

## 1. Web API (Frontend <-> Backend)

### 1.1 기획 문서 (PRD) 관리

#### `POST /api/documents`
새로운 기획 문서(초안)를 생성합니다.
- **Request**: `{ "title": "문서 제목" }`
- **Response**: `{ "id": "doc-uuid", "title": "문서 제목", "status": "Draft" }`

#### `PUT /api/documents/:id`
기획 문서의 항목(요구사항, 시나리오 등)을 업데이트합니다.
- **Request**: `{ "content": { "scenarios": [...], "requirements": [...] } }`
- **Response**: `200 OK`

#### `POST /api/documents/:id/publish`
문서를 Confluence에 업로드/동기화합니다.
- **Request**: `{}`
- **Response**: `{ "confluenceUrl": "https://confluence.tde.../page" }`

### 1.2 개발 Task 관리 및 JIRA 연동

#### `POST /api/documents/:id/tasks/generate`
AI(또는 서버 로직)를 통해 문서 내용 기반으로 Task 초안 목록을 도출합니다.
- **Request**: `{}`
- **Response**: `{ "tasks": [ { "id": "t-1", "title": "...", "dependencies": [] } ] }`

#### `POST /api/documents/:id/tasks/publish`
확정된 Task 목록을 JIRA 티켓으로 발행합니다.
- **Request**: `{ "tasks": [...] }`
- **Response**: `{ "jiraIssues": [ { "taskId": "t-1", "issueKey": "PROJ-101" } ] }`

## 2. Webhook API (GitLab -> Backend)

#### `POST /api/webhooks/gitlab`
GitLab에서 발생하는 이벤트를 수신하여 JIRA 상태를 자동 업데이트합니다. (방화벽 정책상 Webhook이 가능한 환경)
- **Headers**: `X-Gitlab-Token: <WEBHOOK_SECRET>`
- **Request** (Push Event):
  ```json
  {
    "object_kind": "push",
    "commits": [
      {
        "id": "commit-sha",
        "message": "PROJ-101: 기능 구현 완료",
        "author": { "name": "User" }
      }
    ]
  }
  ```
- **Response**: `200 OK`

## 3. Polling Daemon (Backend -> GitLab)

Webhook을 사용할 수 없는 환경을 위한 대안적인 폴링(Polling) 스케줄러 규약입니다.
- **방식**: Backend의 백그라운드 태스크(또는 Cron Job)가 주기적으로 GitLab API (`GET /api/v4/projects/:id/repository/commits` 및 `GET /api/v4/projects/:id/merge_requests`)를 호출합니다.
- **동작**: 
  1. 마지막으로 확인한 커밋 시간(또는 ID) 이후에 추가된 새 이벤트를 가져옵니다.
  2. 가져온 이벤트 내의 JIRA 이슈 키를 파싱하여, Webhook을 받았을 때와 동일한 JIRA 상태 업데이트 비즈니스 로직을 실행합니다.
