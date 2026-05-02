# GitLab MCP 도구 스펙

## 개요
GitLab 관련 MCP 도구 7개를 정의한다. 모든 도구는 `gitlab_` 접두사를 사용한다.

## 1. gitlab_get_project

GitLab 프로젝트를 조회한다 (목록 또는 상세).

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | | 프로젝트 ID (지정 시 상세 조회) |
| `search` | string | | 프로젝트명 검색 (목록 조회 시) |
| `owned` | boolean | | 소유 프로젝트만 필터 |
| `membership` | boolean | | 멤버십 프로젝트만 필터 |

### 출력
```json
{
  "projects": [
    {
      "id": 1,
      "name": "프로젝트명",
      "nameWithNamespace": "네임스페이스 / 프로젝트명",
      "defaultBranch": "main",
      "visibility": "private",
      "webUrl": "https://gitlab.tde.example.com/namespace/project",
      "lastActivityAt": "2024-01-16"
    }
  ]
}
```

## 2. gitlab_get_merge_request

MR 목록 또는 상세를 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `mrIid` | number | | MR IID (지정 시 상세 조회) |
| `state` | enum | | `"opened"`, `"closed"`, `"merged"`, `"all"` (목록 조회 시) |
| `includeChanges` | boolean | | 변경 파일 포함 여부 (상세 조회 시) |

### 출력 (상세)
```json
{
  "iid": 42,
  "title": "MR 제목",
  "description": "MR 설명",
  "state": "opened",
  "sourceBranch": "feature/my-branch",
  "targetBranch": "main",
  "author": "홍길동",
  "assignee": "김철수",
  "mergeStatus": "can_be_merged",
  "hasConflicts": false,
  "webUrl": "https://...",
  "pipelineStatus": "success",
  "changes": [
    { "oldPath": "src/main.ts", "newPath": "src/main.ts", "diff": "..." }
  ]
}
```

## 3. gitlab_create_merge_request

새 Merge Request를 생성한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `sourceBranch` | string | O | 소스 브랜치 |
| `targetBranch` | string | O | 타겟 브랜치 |
| `title` | string | O | MR 제목 |
| `description` | string | | MR 설명 |

### 출력
```json
{
  "iid": 43,
  "title": "MR 제목",
  "webUrl": "https://gitlab.tde.example.com/namespace/project/-/merge_requests/43",
  "sourceBranch": "feature/my-branch",
  "targetBranch": "main"
}
```

## 4. gitlab_manage_merge_request

MR 머지, 상태 변경, 코멘트 추가 등 관리 작업을 수행한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `mrIid` | number | O | MR IID |
| `action` | enum | O | `"merge"`, `"close"`, `"reopen"`, `"comment"` |
| `comment` | string | △ | 코멘트 내용 (action=comment 시 필수) |
| `squash` | boolean | | 스쿼시 머지 (action=merge 시) |
| `removeSourceBranch` | boolean | | 소스 브랜치 삭제 (action=merge 시) |

### 출력
```json
{
  "iid": 42,
  "action": "merge",
  "message": "MR이 성공적으로 머지되었습니다",
  "state": "merged"
}
```

## 5. gitlab_get_pipelines

CI/CD 파이프라인 목록 또는 상세를 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `pipelineId` | number | | 파이프라인 ID (지정 시 상세 조회) |
| `status` | string | | 상태 필터 (`running`, `success`, `failed` 등) |
| `ref` | string | | 브랜치/태그 필터 |
| `includeJobs` | boolean | | 작업(Job) 목록 포함 여부 |

### 출력 (상세)
```json
{
  "id": 100,
  "status": "success",
  "ref": "main",
  "sha": "abc123...",
  "createdAt": "2024-01-16T10:00:00Z",
  "duration": 120,
  "webUrl": "https://...",
  "jobs": [
    {
      "name": "test",
      "stage": "test",
      "status": "success",
      "duration": 45
    },
    {
      "name": "deploy",
      "stage": "deploy",
      "status": "success",
      "duration": 30
    }
  ]
}
```

## 6. gitlab_manage_branches

브랜치를 조회, 생성, 삭제한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `action` | enum | O | `"list"`, `"get"`, `"create"`, `"delete"` |
| `branchName` | string | △ | 브랜치 이름 (get/create/delete 시 필수) |
| `ref` | string | △ | 기준 ref (create 시 필수) |
| `search` | string | | 검색 키워드 (list 시) |

### 출력 (list)
```json
{
  "branches": [
    {
      "name": "main",
      "commit": { "id": "abc123", "message": "최근 커밋 메시지" },
      "merged": false,
      "protected": true,
      "default": true
    },
    {
      "name": "feature/my-branch",
      "commit": { "id": "def456", "message": "기능 추가" },
      "merged": false,
      "protected": false,
      "default": false
    }
  ]
}
```

## 7. gitlab_get_file

저장소의 파일 내용 또는 디렉토리 트리를 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `projectId` | number | O | 프로젝트 ID |
| `path` | string | O | 파일 경로 또는 디렉토리 경로 |
| `ref` | string | | 브랜치/태그/커밋 (기본: 기본 브랜치) |
| `type` | enum | | `"file"` (기본) 또는 `"tree"` |
| `recursive` | boolean | | 재귀 조회 (type=tree 시) |

### 출력 (file)
```json
{
  "fileName": "main.ts",
  "filePath": "src/main.ts",
  "size": 1234,
  "content": "import { McpServer } from '@modelcontextprotocol/sdk';\n...",
  "ref": "main",
  "lastCommitId": "abc123"
}
```

### 출력 (tree)
```json
{
  "path": "src",
  "ref": "main",
  "entries": [
    { "name": "index.ts", "type": "blob", "path": "src/index.ts" },
    { "name": "common", "type": "tree", "path": "src/common" },
    { "name": "confluence", "type": "tree", "path": "src/confluence" }
  ]
}
```
