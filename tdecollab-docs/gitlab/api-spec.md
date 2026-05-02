# GitLab REST API 스펙

## 1. 기본 정보
- Base URL: `https://gitlab.tde.example.com` (확인 필요)
- API 경로 접두사: `/api/v4`
- 인증: `PRIVATE-TOKEN` 헤더
- 서버 유형: GitLab Self-hosted
- 응답 형식: JSON
- 경로 파라미터 인코딩: `/` → `%2F` (파일 경로 등)
- 페이지네이션: Link 헤더 기반 또는 `page`/`per_page` 파라미터

## 2. 프로젝트 API

### 2.1 프로젝트 목록
- **메서드**: `GET /api/v4/projects`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `search` | string | 프로젝트명 검색 |
  | `owned` | boolean | 본인 소유 프로젝트만 |
  | `membership` | boolean | 멤버인 프로젝트만 |
  | `visibility` | string | `public`, `internal`, `private` |
  | `per_page` | number | 페이지당 결과 수 (기본: 20, 최대: 100) |
  | `page` | number | 페이지 번호 |
  | `order_by` | string | 정렬 기준 (`name`, `created_at`, `updated_at`) |
  | `sort` | string | 정렬 순서 (`asc`, `desc`) |

### 2.2 프로젝트 상세
- **메서드**: `GET /api/v4/projects/:id`
- **경로 파라미터**: `id` - 프로젝트 ID (숫자) 또는 URL-인코딩된 경로 (`namespace%2Fproject`)
- **응답 예시**:
```json
{
  "id": 1,
  "name": "프로젝트명",
  "name_with_namespace": "네임스페이스 / 프로젝트명",
  "path_with_namespace": "namespace/project",
  "default_branch": "main",
  "visibility": "private",
  "web_url": "https://gitlab.tde.example.com/namespace/project",
  "ssh_url_to_repo": "git@gitlab.tde.example.com:namespace/project.git",
  "http_url_to_repo": "https://gitlab.tde.example.com/namespace/project.git",
  "created_at": "2024-01-01T00:00:00Z",
  "last_activity_at": "2024-01-16T15:30:00Z"
}
```

## 3. Merge Request API

### 3.1 MR 목록 (프로젝트)
- **메서드**: `GET /api/v4/projects/:id/merge_requests`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `state` | string | `opened`, `closed`, `merged`, `all` |
  | `scope` | string | `created_by_me`, `assigned_to_me`, `all` |
  | `author_id` | number | 작성자 ID |
  | `assignee_id` | number | 담당자 ID |
  | `labels` | string | 라벨 필터 (쉼표 구분) |
  | `per_page` | number | 페이지당 결과 수 |

### 3.2 MR 상세
- **메서드**: `GET /api/v4/projects/:id/merge_requests/:merge_request_iid`
- **응답 주요 필드**: title, description, state, source_branch, target_branch, author, assignee, merge_status, has_conflicts, pipeline

### 3.3 MR 생성
- **메서드**: `POST /api/v4/projects/:id/merge_requests`
- **요청 본문**:
```json
{
  "source_branch": "feature/my-branch",
  "target_branch": "main",
  "title": "MR 제목",
  "description": "MR 설명",
  "assignee_id": 1,
  "reviewer_ids": [2, 3],
  "labels": "enhancement,backend"
}
```

### 3.4 MR 수정
- **메서드**: `PUT /api/v4/projects/:id/merge_requests/:merge_request_iid`
- **수정 가능 필드**: title, description, assignee_id, reviewer_ids, labels, state_event(close/reopen)

### 3.5 MR 머지
- **메서드**: `PUT /api/v4/projects/:id/merge_requests/:merge_request_iid/merge`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `merge_commit_message` | string | 머지 커밋 메시지 |
  | `squash` | boolean | 스쿼시 머지 여부 |
  | `should_remove_source_branch` | boolean | 소스 브랜치 삭제 여부 |

### 3.6 MR 변경 파일 조회
- **메서드**: `GET /api/v4/projects/:id/merge_requests/:merge_request_iid/changes`
- **응답**: MR의 변경된 파일 목록 (diff 포함)

### 3.7 MR 노트(코멘트) 목록
- **메서드**: `GET /api/v4/projects/:id/merge_requests/:merge_request_iid/notes`

### 3.8 MR 노트 추가
- **메서드**: `POST /api/v4/projects/:id/merge_requests/:merge_request_iid/notes`
- **요청 본문**: `{ "body": "코멘트 내용" }`

## 4. 파이프라인 API

### 4.1 파이프라인 목록
- **메서드**: `GET /api/v4/projects/:id/pipelines`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `scope` | string | `running`, `pending`, `finished`, `branches`, `tags` |
  | `status` | string | `created`, `waiting_for_resource`, `preparing`, `pending`, `running`, `success`, `failed`, `canceled`, `skipped`, `manual`, `scheduled` |
  | `ref` | string | 브랜치/태그 이름 |
  | `per_page` | number | 페이지당 결과 수 |

### 4.2 파이프라인 상세
- **메서드**: `GET /api/v4/projects/:id/pipelines/:pipeline_id`
- **응답 주요 필드**: id, status, ref, sha, before_sha, created_at, updated_at, started_at, finished_at, duration, web_url

### 4.3 파이프라인 작업(Job) 목록
- **메서드**: `GET /api/v4/projects/:id/pipelines/:pipeline_id/jobs`
- **응답**: 작업 목록 (name, stage, status, duration, web_url)

### 4.4 MR 파이프라인 조회
- **메서드**: `GET /api/v4/projects/:id/merge_requests/:merge_request_iid/pipelines`

## 5. 브랜치 API

### 5.1 브랜치 목록
- **메서드**: `GET /api/v4/projects/:id/repository/branches`
- **파라미터**: `search`, `per_page`, `page`

### 5.2 브랜치 상세
- **메서드**: `GET /api/v4/projects/:id/repository/branches/:branch`
- **응답**: name, commit(id, message, author), merged, protected, default

### 5.3 브랜치 생성
- **메서드**: `POST /api/v4/projects/:id/repository/branches`
- **요청 본문**: `{ "branch": "new-branch", "ref": "main" }`

### 5.4 브랜치 삭제
- **메서드**: `DELETE /api/v4/projects/:id/repository/branches/:branch`

## 6. 저장소 파일 API

### 6.1 파일 조회
- **메서드**: `GET /api/v4/projects/:id/repository/files/:file_path`
- **경로 파라미터**: `file_path` - URL 인코딩된 파일 경로 (`src%2Fmain.ts`)
- **쿼리 파라미터**: `ref` - 브랜치/태그/커밋 SHA
- **응답**:
```json
{
  "file_name": "main.ts",
  "file_path": "src/main.ts",
  "size": 1234,
  "encoding": "base64",
  "content": "aW1wb3J0Li4u...",
  "content_sha256": "...",
  "ref": "main",
  "blob_id": "...",
  "last_commit_id": "..."
}
```
- **주의**: content는 Base64 인코딩됨. 디코딩 필요

### 6.2 디렉토리 트리 조회
- **메서드**: `GET /api/v4/projects/:id/repository/tree`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `path` | string | 디렉토리 경로 (기본: 루트) |
  | `ref` | string | 브랜치/태그 |
  | `recursive` | boolean | 재귀 조회 |
  | `per_page` | number | 페이지당 결과 수 |

## 7. 응답 형식 및 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 (토큰 확인) |
| 403 | 권한 없음 (프로젝트 접근 권한) |
| 404 | 리소스 없음 |
| 405 | 허용되지 않는 메서드 (MR 머지 불가 상태 등) |
| 409 | 충돌 (브랜치 이미 존재 등) |

### 페이지네이션
- 응답 헤더에 페이지 정보 포함:
  - `X-Total`: 전체 결과 수
  - `X-Total-Pages`: 전체 페이지 수
  - `X-Page`: 현재 페이지
  - `X-Per-Page`: 페이지당 결과 수
  - `X-Next-Page`: 다음 페이지 번호
