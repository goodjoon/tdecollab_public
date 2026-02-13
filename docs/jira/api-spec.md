# JIRA REST API 스펙

## 1. 기본 정보
- Base URL: `https://jira.tde.sktelecom.com` (확인 필요)
- REST API 접두사: `/rest/api/2`
- Agile API 접두사: `/rest/agile/1.0`
- 인증: HTTP Basic Auth (Email:API-Token 또는 Email:Password)
- 서버 유형: JIRA Server/Data Center
- 응답 형식: JSON

## 2. 이슈 API

### 2.1 이슈 조회
- **메서드**: `GET /rest/api/2/issue/{issueIdOrKey}`
- **경로 파라미터**: `issueIdOrKey` - 이슈 키(PROJ-123) 또는 숫자 ID
- **쿼리 파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `fields` | string | 반환할 필드 (쉼표 구분, `*all` 전체) |
  | `expand` | string | 확장 옵션 (`renderedFields`, `changelog`, `transitions`) |
- **응답 예시**:
```json
{
  "id": "10001",
  "key": "PROJ-123",
  "self": "https://jira.tde.sktelecom.com/rest/api/2/issue/10001",
  "fields": {
    "summary": "이슈 요약",
    "status": { "name": "진행 중", "id": "3" },
    "assignee": { "displayName": "홍길동", "emailAddress": "hong@sktelecom.com" },
    "reporter": { "displayName": "김철수" },
    "priority": { "name": "High", "id": "2" },
    "issuetype": { "name": "Task", "id": "10001" },
    "project": { "key": "PROJ", "name": "프로젝트명" },
    "description": "이슈 설명 내용",
    "created": "2024-01-15T10:00:00.000+0900",
    "updated": "2024-01-16T15:30:00.000+0900",
    "labels": ["backend", "api"],
    "components": [{ "name": "API Server" }]
  }
}
```

### 2.2 이슈 생성
- **메서드**: `POST /rest/api/2/issue`
- **요청 본문**:
```json
{
  "fields": {
    "project": { "key": "PROJ" },
    "issuetype": { "name": "Task" },
    "summary": "새 이슈 제목",
    "description": "이슈 상세 설명",
    "assignee": { "name": "hong" },
    "priority": { "name": "High" },
    "labels": ["backend"],
    "components": [{ "name": "API Server" }]
  }
}
```
- **응답**: `{ "id": "10002", "key": "PROJ-124", "self": "..." }`

### 2.3 이슈 수정
- **메서드**: `PUT /rest/api/2/issue/{issueIdOrKey}`
- **요청 본문** (fields 방식):
```json
{
  "fields": {
    "summary": "수정된 제목",
    "description": "수정된 설명"
  }
}
```
- **요청 본문** (update 방식):
```json
{
  "update": {
    "labels": [{ "add": "new-label" }, { "remove": "old-label" }],
    "components": [{ "add": { "name": "New Component" } }]
  }
}
```
- **응답**: 204 No Content

### 2.4 이슈 삭제
- **메서드**: `DELETE /rest/api/2/issue/{issueIdOrKey}`
- **파라미터**: `deleteSubtasks` (boolean) - 서브태스크도 함께 삭제
- **응답**: 204 No Content

## 3. 검색 API

### 3.1 JQL 검색
- **메서드**: `GET /rest/api/2/search` 또는 `POST /rest/api/2/search`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `jql` | string | JQL 쿼리 문자열 |
  | `startAt` | number | 시작 인덱스 (기본: 0) |
  | `maxResults` | number | 최대 결과 수 (기본: 50, 최대: 1000) |
  | `fields` | string[] | 반환할 필드 목록 |
  | `expand` | string | 확장 옵션 |
- **JQL 예시**:
  - `project = PROJ AND status = "진행 중"`
  - `assignee = currentUser() ORDER BY updated DESC`
  - `project = PROJ AND sprint in openSprints()`
  - `labels = "backend" AND created >= -7d`
- **응답**:
```json
{
  "startAt": 0,
  "maxResults": 50,
  "total": 123,
  "issues": [
    { "id": "...", "key": "PROJ-123", "fields": { ... } }
  ]
}
```

## 4. 트랜지션 API

### 4.1 가능한 트랜지션 조회
- **메서드**: `GET /rest/api/2/issue/{issueIdOrKey}/transitions`
- **파라미터**: `expand=transitions.fields`
- **응답**:
```json
{
  "transitions": [
    { "id": "11", "name": "진행 시작", "to": { "name": "진행 중" } },
    { "id": "21", "name": "완료", "to": { "name": "완료" } }
  ]
}
```

### 4.2 트랜지션 실행
- **메서드**: `POST /rest/api/2/issue/{issueIdOrKey}/transitions`
- **요청 본문**:
```json
{
  "transition": { "id": "11" },
  "fields": {
    "resolution": { "name": "Done" }
  }
}
```
- **응답**: 204 No Content

## 5. 코멘트 API

### 5.1 코멘트 목록 조회
- **메서드**: `GET /rest/api/2/issue/{issueIdOrKey}/comment`
- **파라미터**: `startAt`, `maxResults`, `orderBy`, `expand`
- **응답**:
```json
{
  "comments": [
    {
      "id": "100",
      "body": "코멘트 내용",
      "author": { "displayName": "홍길동" },
      "created": "2024-01-15T10:00:00.000+0900",
      "updated": "2024-01-15T10:00:00.000+0900"
    }
  ],
  "total": 5,
  "startAt": 0,
  "maxResults": 50
}
```

### 5.2 코멘트 추가
- **메서드**: `POST /rest/api/2/issue/{issueIdOrKey}/comment`
- **요청 본문**: `{ "body": "코멘트 내용" }`

### 5.3 코멘트 수정
- **메서드**: `PUT /rest/api/2/issue/{issueIdOrKey}/comment/{commentId}`
- **요청 본문**: `{ "body": "수정된 코멘트" }`

### 5.4 코멘트 삭제
- **메서드**: `DELETE /rest/api/2/issue/{issueIdOrKey}/comment/{commentId}`
- **응답**: 204 No Content

## 6. 프로젝트 API

### 6.1 프로젝트 목록
- **메서드**: `GET /rest/api/2/project`
- **응답**: 접근 가능한 프로젝트 배열

### 6.2 프로젝트 상세
- **메서드**: `GET /rest/api/2/project/{projectIdOrKey}`
- **응답**: 프로젝트 상세 (이름, 키, 리드, 이슈 타입 등)

## 7. 보드 API (Agile)

### 7.1 보드 목록
- **메서드**: `GET /rest/agile/1.0/board`
- **파라미터**: `type`, `name`, `projectKeyOrId`

### 7.2 보드 상세
- **메서드**: `GET /rest/agile/1.0/board/{boardId}`

### 7.3 보드 스프린트 목록
- **메서드**: `GET /rest/agile/1.0/board/{boardId}/sprint`
- **파라미터**: `state` (`active`, `future`, `closed`)

## 8. 메타데이터 API

### 8.1 이슈 생성 메타
- **메서드**: `GET /rest/api/2/issue/createmeta`
- **파라미터**: `projectKeys`, `issuetypeNames`, `expand=projects.issuetypes.fields`
- **용도**: 프로젝트별 사용 가능한 이슈 타입 및 필수 필드 조회

### 8.2 현재 사용자
- **메서드**: `GET /rest/api/2/myself`

## 9. 응답 형식 및 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 조회 성공 |
| 201 | 생성 성공 |
| 204 | 수정/삭제 성공 (본문 없음) |
| 400 | 잘못된 요청 (필드 오류, JQL 구문 오류) |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 이슈/프로젝트 없음 |
| 409 | 충돌 |
