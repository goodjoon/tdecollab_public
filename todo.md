# tdecollab 구현 로드맵

## Phase 0: 프로젝트 스캐폴딩 ✅ 완료

- [x] Git 저장소 초기화
- [x] 디렉토리 구조 생성
- [x] 설정 파일 작성 (package.json, tsconfig, tsup, vitest, prettier, gitignore)
- [x] 의존성 설치 (pnpm install)
- [x] README.md, CLAUDE.md 작성
- [x] 문서 작성 (docs/ 전체 12개 파일)
  - [x] architecture.md, auth-and-config.md, mcp-server-design.md
  - [x] confluence/ (api-spec, features, mcp-tools)
  - [x] jira/ (api-spec, features, mcp-tools)
  - [x] gitlab/ (api-spec, features, mcp-tools)

---

## Phase 1: 공통 인프라 구현

모든 서비스 모듈의 기반이 되는 공통 코드. 이 단계가 완료되어야 서비스별 구현이 가능.

- [x] `src/common/types.ts` - 공통 타입/인터페이스 정의
  - ServiceConfig, PaginatedResult, PaginatedParams 인터페이스
  - ConfluenceConfig, JiraConfig, GitlabConfig 타입
  - MCP 응답 헬퍼 타입
- [x] `src/common/errors.ts` - 공통 에러 클래스
  - TdeCollabError (베이스)
  - ApiError (HTTP 에러 래핑, 상태코드/메시지)
  - AuthError (인증 실패)
  - NotFoundError (리소스 없음)
  - ConflictError (버전 충돌)
- [x] `src/common/logger.ts` - 로깅 유틸리티
  - 로그 레벨: debug, info, warn, error
  - 토큰/비밀번호 마스킹 처리
  - stderr 출력 (stdout은 MCP stdio용으로 예약)
- [x] `src/common/config.ts` - 환경변수/설정 로딩
  - dotenv 기반 .env 파일 로딩
  - 서비스별 설정 로드 함수 (loadConfluenceConfig, loadJiraConfig, loadGitlabConfig)
  - 필수 환경변수 검증 및 한국어 에러 메시지
  - 기본값 처리
- [x] `src/common/auth.ts` - 인증 매니저
  - createBasicAuth(email, tokenOrPassword) → Base64 헤더 생성
  - createTokenAuth(token) → PRIVATE-TOKEN 헤더 생성
  - 인증 방식 우선순위 처리 (token > password)
- [x] `src/common/http-client.ts` - HTTP 클라이언트 래퍼
  - axios 인스턴스 팩토리 (서비스별 baseURL + 인증 헤더 주입)
  - 에러 인터셉터 (HTTP 에러 → ApiError/AuthError/NotFoundError 변환)
  - URL 보정 로직 (사용자가 전체 URL 입력 시 base URL 추출)
  - 타임아웃 설정 (기본 30초)
  - 응답 로깅 (debug 레벨)
- [x] 공통 인프라 단위 테스트
  - tests/common/config.test.ts
  - tests/common/auth.test.ts
  - tests/common/http-client.test.ts
  - tests/common/errors.test.ts

---

## Phase 2: Confluence 모듈 구현

### 2-1. API 클라이언트 레이어

- [x] `src/confluence/types.ts` - Confluence 전용 타입
  - Page, Space, Label, SearchResult, PageTree 인터페이스
  - API 응답 타입 (ConfluencePageResponse, ConfluenceSearchResponse 등)
- [x] `src/confluence/api/client.ts` - Confluence API 클라이언트 초기화
  - createConfluenceClient() → axios 인스턴스 (baseURL + Basic Auth)
- [x] `src/confluence/api/content.ts` - 페이지 CRUD API
  - getPage(id, expand?) → 페이지 상세 조회
  - getPageByTitle(spaceKey, title) → 제목으로 조회
  - createPage(spaceKey, title, body, parentId?, labels?) → 생성
  - updatePage(id, title, body, version) → 수정 (버전 자동 증가)
  - deletePage(id) → 삭제
  - getChildPages(id, start?, limit?) → 자식 페이지 목록
- [x] `src/confluence/api/space.ts` - 스페이스 API
  - getSpaces(type?, start?, limit?) → 스페이스 목록
  - getSpace(spaceKey) → 스페이스 상세
- [x] `src/confluence/api/search.ts` - 검색 API
  - searchByCql(cql, start?, limit?, expand?) → CQL 검색
- [x] `src/confluence/api/label.ts` - 라벨 API
  - getLabels(pageId) → 라벨 조회
  - addLabels(pageId, labels[]) → 라벨 추가
  - removeLabel(pageId, labelName) → 라벨 삭제
- [x] Confluence API 테스트 작성

### 2-2. Markdown ↔ Storage 변환기

- [x] `src/confluence/converters/md-to-storage.ts` - Markdown → Storage HTML
  - markdown-it 기반 HTML 렌더링 (GFM 테이블 지원)
  - 코드 블록 → Confluence code 매크로 변환
  - PlantUML 블록 → plantuml 매크로 변환
  - 체크박스 → task-list 매크로 변환
  - 헤딩 스타일 처리
- [x] `src/confluence/converters/storage-to-md.ts` - Storage HTML → Markdown
  - HTML 요소 → Markdown 역변환
  - Confluence 매크로 → 코드 블록 또는 주석 처리
- [x] 변환기 테스트 작성 (다양한 Markdown 케이스)

### 2-3. MCP 도구

- [x] `src/confluence/tools/index.ts` - 도구 일괄 등록 (registerConfluenceTools)
- [x] 개별 도구 구현 (9개)
  - [x] confluence_get_page
  - [x] confluence_create_page
  - [x] confluence_update_page
  - [x] confluence_delete_page
  - [x] confluence_search_pages
  - [x] confluence_get_page_tree
  - [x] confluence_get_spaces
  - [x] confluence_manage_labels
  - [x] confluence_convert_content

### 2-4. CLI 커맨드

- [x] `src/confluence/commands/index.ts` - Confluence CLI 서브커맨드 등록
- [x] page 커맨드 (get, create, update, delete, tree)
- [x] space 커맨드 (list, get)
- [x] search 커맨드
- [x] label 커맨드 (list, add, remove)
- [x] convert 커맨드

---

## Phase 3: JIRA 모듈 구현

### 3-1. API 클라이언트 레이어

- [ ] `src/jira/types.ts` - JIRA 전용 타입
  - Issue, Project, Transition, Comment, Board, Sprint 인터페이스
- [ ] `src/jira/api/client.ts` - JIRA API 클라이언트 초기화
- [ ] `src/jira/api/issue.ts` - 이슈 CRUD API
  - getIssue(issueKey, fields?, expand?)
  - createIssue(projectKey, issueType, summary, fields?)
  - updateIssue(issueKey, fields?, update?)
  - deleteIssue(issueKey, deleteSubtasks?)
- [ ] `src/jira/api/search.ts` - JQL 검색 API
  - searchByJql(jql, startAt?, maxResults?, fields?)
- [ ] `src/jira/api/transition.ts` - 트랜지션 API
  - getTransitions(issueKey)
  - doTransition(issueKey, transitionId, fields?)
- [ ] `src/jira/api/comment.ts` - 코멘트 API
  - getComments(issueKey, startAt?, maxResults?)
  - addComment(issueKey, body)
  - updateComment(issueKey, commentId, body)
  - deleteComment(issueKey, commentId)
- [ ] `src/jira/api/project.ts` - 프로젝트/보드 API
  - getProjects()
  - getProject(projectKey)
  - getBoards(projectKey?, type?)
  - getSprints(boardId, state?)
- [ ] JIRA API 테스트 작성

### 3-2. MCP 도구

- [ ] `src/jira/tools/index.ts` - 도구 일괄 등록 (registerJiraTools)
- [ ] 개별 도구 구현 (7개)
  - [ ] jira_get_issue
  - [ ] jira_create_issue
  - [ ] jira_update_issue
  - [ ] jira_search_issues
  - [ ] jira_transition_issue
  - [ ] jira_manage_comments
  - [ ] jira_get_projects

### 3-3. CLI 커맨드

- [ ] `src/jira/commands/index.ts` - JIRA CLI 서브커맨드 등록
- [ ] issue 커맨드 (get, create, update, transition, transitions)
- [ ] search 커맨드
- [ ] comment 커맨드 (list, add, update, delete)
- [ ] project 커맨드 (list, get)
- [ ] board 커맨드 (list, sprints)

---

## Phase 4: GitLab 모듈 구현

### 4-1. API 클라이언트 레이어

- [ ] `src/gitlab/types.ts` - GitLab 전용 타입
  - Project, MergeRequest, Pipeline, Job, Branch, RepositoryFile 인터페이스
- [ ] `src/gitlab/api/client.ts` - GitLab API 클라이언트 초기화 (PRIVATE-TOKEN 헤더)
- [ ] `src/gitlab/api/project.ts` - 프로젝트 API
  - getProjects(search?, owned?, membership?)
  - getProject(projectId)
- [ ] `src/gitlab/api/merge-request.ts` - MR API
  - getMergeRequests(projectId, state?, scope?)
  - getMergeRequest(projectId, mrIid, includeChanges?)
  - createMergeRequest(projectId, sourceBranch, targetBranch, title, description?)
  - updateMergeRequest(projectId, mrIid, fields)
  - mergeMergeRequest(projectId, mrIid, options?)
  - getMergeRequestNotes(projectId, mrIid)
  - addMergeRequestNote(projectId, mrIid, body)
- [ ] `src/gitlab/api/pipeline.ts` - 파이프라인 API
  - getPipelines(projectId, status?, ref?)
  - getPipeline(projectId, pipelineId)
  - getPipelineJobs(projectId, pipelineId)
  - getMergeRequestPipelines(projectId, mrIid)
- [ ] `src/gitlab/api/branch.ts` - 브랜치 API
  - getBranches(projectId, search?)
  - getBranch(projectId, branchName)
  - createBranch(projectId, branchName, ref)
  - deleteBranch(projectId, branchName)
- [ ] `src/gitlab/api/repository.ts` - 저장소 파일 API
  - getFile(projectId, filePath, ref?)
  - getTree(projectId, path?, ref?, recursive?)
- [ ] GitLab API 테스트 작성

### 4-2. MCP 도구

- [ ] `src/gitlab/tools/index.ts` - 도구 일괄 등록 (registerGitlabTools)
- [ ] 개별 도구 구현 (7개)
  - [ ] gitlab_get_project
  - [ ] gitlab_get_merge_request
  - [ ] gitlab_create_merge_request
  - [ ] gitlab_manage_merge_request
  - [ ] gitlab_get_pipelines
  - [ ] gitlab_manage_branches
  - [ ] gitlab_get_file

### 4-3. CLI 커맨드

- [ ] `src/gitlab/commands/index.ts` - GitLab CLI 서브커맨드 등록
- [ ] project 커맨드 (list, get)
- [ ] mr 커맨드 (list, get, create, merge, close, comment)
- [ ] pipeline 커맨드 (list, get)
- [ ] branch 커맨드 (list, get, create, delete)
- [ ] file 커맨드 (get, tree)

---

## Phase 5: MCP 서버 통합

- [ ] `src/mcp/server.ts` - McpServer 인스턴스 생성, 메타데이터 설정
- [ ] `src/mcp/transport.ts` - StdioServerTransport 설정
- [ ] `src/mcp/tool-registry.ts` - 3개 모듈의 도구 일괄 등록
  - registerConfluenceTools(server)
  - registerJiraTools(server)
  - registerGitlabTools(server)
- [ ] `src/index.ts` - MCP 서버 엔트리포인트 (dotenv 로드 → 서버 생성 → 도구 등록 → transport 연결)
- [ ] MCP 서버 통합 테스트
  - stdio transport 기반 요청/응답 테스트
  - 도구 목록 조회 테스트
  - 각 서비스별 대표 도구 호출 테스트

---

## Phase 6: CLI 통합

- [ ] `src/cli.ts` - commander 기반 통합 CLI 엔트리포인트
  - dotenv 로드
  - 서비스별 서브커맨드 등록: confluence, jira, gitlab
  - config 서브커맨드 (설정 확인/인증 테스트)
  - 글로벌 옵션: --json (JSON 출력), --verbose (디버그 로그)
- [ ] 각 서비스 commands/index.ts에서 서브커맨드 등록
- [ ] CLI 출력 포매팅 (chalk 컬러, cli-table3 테이블)
- [ ] CLI 통합 테스트

---

## Phase 7: 품질 및 배포

- [ ] ESLint 설정 및 전체 코드 린팅
- [ ] 테스트 커버리지 확인 및 보완
- [ ] `pnpm build` 빌드 검증 (dist/index.js, dist/cli.js)
- [ ] Claude Desktop MCP 연동 테스트
- [ ] Claude Code MCP 연동 테스트
- [ ] `.mcp.json` 설정 파일 예시 작성
- [ ] Docker 지원 (선택)
  - [ ] Dockerfile 작성
  - [ ] docker-compose.yml 작성
- [ ] CI/CD 파이프라인 (선택)
  - [ ] GitHub Actions 워크플로우 (.github/workflows/ci.yml)
  - [ ] 빌드 + 테스트 + 린트 자동화

---

## 참고: 구현 우선순위 가이드

각 Phase 내에서도 우선순위가 있다면:

1. **Phase 1** (공통 인프라)은 반드시 먼저 완료
2. **Phase 2~4** (서비스 모듈)는 독립적이므로 병렬 진행 가능하나, Confluence부터 시작 권장 (aicc-pm 참고 코드 활용 가능)
3. 각 서비스 내에서: API 레이어 → MCP 도구 → CLI 커맨드 순서로 구현 (하위 레이어 먼저)
4. **Phase 5~6** (통합)은 최소 1개 서비스 모듈이 완료된 후 진행 가능
5. **Phase 7** (품질/배포)은 전체 기능 구현 후
