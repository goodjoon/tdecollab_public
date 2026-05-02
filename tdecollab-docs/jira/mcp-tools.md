# JIRA MCP 도구 스펙

## 개요
JIRA 관련 MCP 도구 7개를 정의한다. 모든 도구는 `jira_` 접두사를 사용한다.

## 1. jira_get_issue

JIRA 이슈의 상세 정보를 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `issueKey` | string | O | 이슈 키 (예: PROJ-123) |
| `fields` | string[] | | 반환할 필드 목록 (미지정 시 주요 필드 반환) |

### 출력
```json
{
  "key": "PROJ-123",
  "summary": "이슈 제목",
  "status": "진행 중",
  "assignee": "홍길동",
  "reporter": "김철수",
  "priority": "High",
  "issueType": "Task",
  "description": "이슈 설명...",
  "labels": ["backend", "api"],
  "created": "2024-01-15",
  "updated": "2024-01-16",
  "url": "https://jira.tde.example.com/browse/PROJ-123"
}
```

## 2. jira_create_issue

JIRA에 새 이슈를 생성한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectKey` | string | O | 프로젝트 키 |
| `issueType` | string | O | 이슈 타입 (Task, Bug, Story 등) |
| `summary` | string | O | 이슈 제목 |
| `description` | string | | 이슈 설명 |
| `assignee` | string | | 담당자 사용자명 |
| `priority` | string | | 우선순위 (Highest, High, Medium, Low, Lowest) |
| `labels` | string[] | | 라벨 목록 |
| `parentKey` | string | | 상위 이슈 키 (서브태스크 생성 시) |

### 출력
```json
{
  "key": "PROJ-124",
  "id": "10002",
  "url": "https://jira.tde.example.com/browse/PROJ-124"
}
```

## 3. jira_update_issue

기존 JIRA 이슈의 필드를 업데이트한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `issueKey` | string | O | 이슈 키 |
| `fields` | object | O | 업데이트할 필드 (summary, description, assignee, priority, labels 등) |

### 출력
```json
{
  "key": "PROJ-123",
  "message": "이슈가 업데이트되었습니다",
  "updatedFields": ["summary", "assignee"]
}
```

## 4. jira_search_issues

JQL 쿼리로 JIRA 이슈를 검색한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `jql` | string | O | | JQL 쿼리 문자열 |
| `maxResults` | number | | 20 | 최대 결과 수 |
| `fields` | string[] | | | 반환할 필드 목록 |

### 출력
```json
{
  "total": 42,
  "issues": [
    {
      "key": "PROJ-123",
      "summary": "이슈 제목",
      "status": "진행 중",
      "assignee": "홍길동",
      "priority": "High",
      "issueType": "Task",
      "updated": "2024-01-16"
    }
  ]
}
```

## 5. jira_transition_issue

이슈의 상태를 변경한다 (워크플로우 트랜지션 실행).

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `issueKey` | string | O | 이슈 키 |
| `transitionId` | string | △ | 트랜지션 ID (transitionName과 택1) |
| `transitionName` | string | △ | 트랜지션 이름 (transitionId와 택1) |

### 동작
1. transitionName이 주어진 경우, 가능한 트랜지션 목록에서 이름 매칭하여 ID 결정
2. 해당 트랜지션 실행
3. 매칭되는 트랜지션이 없으면 가능한 트랜지션 목록과 함께 에러 반환

### 출력
```json
{
  "key": "PROJ-123",
  "previousStatus": "할 일",
  "newStatus": "진행 중",
  "transition": "진행 시작"
}
```

## 6. jira_manage_comments

이슈의 코멘트를 조회, 추가, 수정, 삭제한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `issueKey` | string | O | 이슈 키 |
| `action` | enum | O | `"list"`, `"add"`, `"update"`, `"delete"` |
| `body` | string | △ | 코멘트 내용 (add, update 시 필수) |
| `commentId` | string | △ | 코멘트 ID (update, delete 시 필수) |

### 출력 (list)
```json
{
  "comments": [
    {
      "id": "100",
      "body": "코멘트 내용",
      "author": "홍길동",
      "created": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 3
}
```

## 7. jira_get_projects

접근 가능한 JIRA 프로젝트 및 보드 목록을 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `includeBoards` | boolean | | false | Agile 보드 정보 포함 여부 |
| `projectKey` | string | | | 특정 프로젝트 상세 조회 |

### 출력
```json
{
  "projects": [
    {
      "key": "PROJ",
      "name": "프로젝트명",
      "lead": "홍길동",
      "issueTypes": ["Task", "Bug", "Story"],
      "url": "https://jira.tde.example.com/browse/PROJ"
    }
  ],
  "boards": [
    {
      "id": 1,
      "name": "PROJ 보드",
      "type": "scrum",
      "projectKey": "PROJ"
    }
  ]
}
```
