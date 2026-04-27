# tdecollab

TDE 포털의 Confluence, JIRA, GitLab과 상호작용하는 CLI 및 MCP(Model Context Protocol) 통합 도구.

## 개요

tdecollab은 TDE 포털에서 제공하는 협업 도구들을 하나의 CLI와 MCP 서버로 통합하여, 터미널이나 AI 에이전트(Claude 등)를 통해 편리하게 사용할 수 있도록 하는 경량화 서비스입니다.

### 지원 서비스

| 서비스 | 주요 기능 |
|--------|----------|
| **Confluence** | 페이지 CRUD, Markdown↔Storage 변환, 검색, 라벨 관리, 페이지 트리 조회 |
| **JIRA** | 이슈 CRUD, JQL 검색, 상태 변경(트랜지션), 코멘트 관리, 프로젝트/보드 조회 |
| **GitLab** | 프로젝트 조회, MR 관리, 파이프라인 조회, 브랜치 관리, 파일 조회 |

## 요구사항

- Node.js 20 이상

## 설치

### npm에서 설치 (권장)

```bash
# 전역 설치
npm install -g tdecollab

# 또는 npx로 즉시 실행 (설치 불필요)
npx -y tdecollab --help
```

### 소스에서 빌드 (개발자용)

```bash
git clone <repository-url>
cd tdecollab
pnpm install
pnpm build
```

## 설정

### 환경변수

tdecollab은 다음 환경변수를 통해 각 서비스에 접속합니다:

```env
# Confluence
CONFLUENCE_BASE_URL=https://confluence.example.com
CONFLUENCE_USERNAME=your-username  # Basic Auth 사용 시 (선택)
CONFLUENCE_API_TOKEN=your-api-token

# JIRA
JIRA_BASE_URL=https://jira.example.com
JIRA_USERNAME=your-username         # PAT 사용 시 생략 가능 (선택)
JIRA_API_TOKEN=your-api-token

# GitLab
GITLAB_BASE_URL=https://gitlab.example.com   # 미설정 시 https://gitlab.com
GITLAB_PRIVATE_TOKEN=your-private-token
```

### 설정 방법

**방법 1: .env 파일 사용 (로컬 개발)**

```bash
# 프로젝트 루트에 .env 파일 생성
echo "CONFLUENCE_BASE_URL=https://confluence.example.com" > .env
echo "CONFLUENCE_API_TOKEN=your-token" >> .env
```

**방법 2: 환경변수 직접 설정**

```bash
export CONFLUENCE_BASE_URL=https://confluence.example.com
export CONFLUENCE_API_TOKEN=your-token
tdecollab confluence space list
```

**방법 3: MCP 서버 설정에 포함 (Claude Desktop)**

Claude Desktop 설정 파일의 `env` 섹션에 환경변수를 추가합니다 (아래 MCP 서버 섹션 참조).

## 사용법

### CLI 명령어

전체 명령어에 대한 상세한 옵션 및 사용 예시는 [CLI 사용 가이드](tdecollab-docs/cli/usage-guide.md)를 참조하세요.

특히, **Markdown 파일을 Confluence에 업로드**하거나, 반대로 **Confluence 페이지를 Markdown으로 변환하여 이미지와 함께 로컬에 다운로드**하는 상세한 방법은 해당 가이드에 자세히 설명되어 있습니다.

#### Confluence

```bash
# 스페이스 목록 조회
tdecollab confluence space list

# 페이지 조회 및 다운로드 (Markdown 변환 및 이미지 로컬 저장)
tdecollab confluence page get <pageId> -d --image-dir ./assets -o page.md

# 마크다운 파일로 페이지 생성/수정 (로컬 이미지 자동 업로드 지원)
tdecollab confluence page create --space <key> --title <title> --file <path_to_md>
tdecollab confluence page update <pageId> --file <path_to_md>
```

*(JIRA, GitLab 명령어 및 기타 상세 사용법은 [CLI 사용 가이드](tdecollab-docs/cli/usage-guide.md) 참조)*

### MCP 도구 목록

MCP 서버를 통해 AI 에이전트(Claude 등)에서 사용할 수 있는 도구입니다.

#### Confluence (9개)

**[최근 업데이트 🚀]**
- `confluence_create_page` 및 `confluence_update_page` 도구에 `baseDir` 파라미터가 추가되어, 로컬 마크다운 파일 내의 **로컬 이미지(예: `![img](./test.png)`)를 자동으로 인식하고 Confluence 첨부파일로 업로드**합니다.
- `confluence_update_page`에서 `version`을 생략할 경우 자동으로 현재 버전을 조회하여 업데이트를 수행합니다.
- 복잡한 표나 렌더링에 사용할 수 있는 `useAiFallback` 기능이 페이지 생성, 수정 및 조회 도구 전반에 일관되게 적용되었습니다.

| 도구 | 설명 |
|------|------|
| `confluence_get_page` | 페이지 상세 조회 (Markdown 변환, 이미지 다운로드, AI 보정 지원) |
| `confluence_create_page` | 새 페이지 생성 (Markdown → Storage Format 자동 변환, 로컬 이미지 자동 업로드, AI 보정 지원) |
| `confluence_update_page` | 페이지 수정 (버전 자동 관리, 로컬 이미지 자동 업로드, AI 보정 지원) |
| `confluence_delete_page` | 페이지 삭제 |
| `confluence_search_pages` | CQL로 페이지 검색 |
| `confluence_get_spaces` | 스페이스 목록 조회 |
| `confluence_get_page_tree` | 하위 페이지(자식 페이지) 목록 조회 |
| `confluence_manage_labels` | 페이지 라벨 조회/추가/삭제 |
| `confluence_convert_content` | Markdown ↔ Storage Format 양방향 변환 |

#### JIRA (7개)

| 도구 | 설명 |
|------|------|
| `jira_get_issue` | 이슈 상세 조회 |
| `jira_create_issue` | 새 이슈 생성 |
| `jira_update_issue` | 이슈 수정 |
| `jira_search_issues` | JQL로 이슈 검색 |
| `jira_transition_issue` | 이슈 상태 변경 (트랜지션 조회/실행) |
| `jira_manage_comments` | 코멘트 조회/추가/수정/삭제 |
| `jira_get_projects` | 프로젝트/보드/스프린트 조회 |

#### GitLab (7개)

| 도구 | 설명 |
|------|------|
| `gitlab_get_project` | 프로젝트 목록 또는 상세 조회 |
| `gitlab_get_merge_request` | MR 목록 또는 상세 조회 (변경 파일 포함 가능) |
| `gitlab_create_merge_request` | 새 Merge Request 생성 |
| `gitlab_manage_merge_request` | MR 머지/닫기/재열기/코멘트 추가 |
| `gitlab_get_pipelines` | 파이프라인 목록 또는 상세 조회 (Job 포함 가능) |
| `gitlab_manage_branches` | 브랜치 목록/상세/생성/삭제 |
| `gitlab_get_file` | 파일 내용 또는 디렉토리 트리 조회 |

### MCP 서버 (Claude Desktop 연동)

Claude Desktop에서 Confluence, JIRA, GitLab 도구를 사용할 수 있습니다.

#### 설정 파일 위치

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### npx 사용 (권장)

별도 설치 없이 최신 버전을 자동으로 실행합니다:

```json
{
  "mcpServers": {
    "tdecollab": {
      "command": "npx",
      "args": ["-y", "tdecollab", "mcp"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.example.com",
        "CONFLUENCE_USERNAME": "your-username",
        "CONFLUENCE_API_TOKEN": "your-api-token",
        "JIRA_BASE_URL": "https://jira.example.com",
        "JIRA_API_TOKEN": "your-jira-token",
        "GITLAB_BASE_URL": "https://gitlab.example.com",
        "GITLAB_PRIVATE_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

#### 전역 설치 사용

```bash
npm install -g tdecollab
```

```json
{
  "mcpServers": {
    "tdecollab": {
      "command": "tdecollab",
      "args": ["mcp"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.example.com",
        "CONFLUENCE_USERNAME": "your-username",
        "CONFLUENCE_API_TOKEN": "your-api-token",
        "JIRA_BASE_URL": "https://jira.example.com",
        "JIRA_API_TOKEN": "your-jira-token",
        "GITLAB_BASE_URL": "https://gitlab.example.com",
        "GITLAB_PRIVATE_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

#### 로컬 개발 버전 사용

```json
{
  "mcpServers": {
    "tdecollab-dev": {
      "command": "node",
      "args": ["/absolute/path/to/tdecollab/dist/index.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.example.com",
        "CONFLUENCE_USERNAME": "your-username",
        "CONFLUENCE_API_TOKEN": "your-api-token",
        "JIRA_BASE_URL": "https://jira.example.com",
        "JIRA_API_TOKEN": "your-jira-token",
        "GITLAB_BASE_URL": "https://gitlab.example.com",
        "GITLAB_PRIVATE_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

설정 후 Claude Desktop을 재시작하면 Confluence, JIRA, GitLab 도구를 사용할 수 있습니다.

## 개발

```bash
# 개발 모드 (MCP 서버)
pnpm dev

# CLI 실행
pnpm cli -- confluence page get 12345

# 테스트
pnpm test

# 빌드
pnpm build

# 포맷팅
pnpm format
```

## 프로젝트 구조

```
tools/                # (기존 src/) 사내 시스템 연계용 Tool & MCP
├── index.ts          # MCP 서버 엔트리포인트
├── cli.ts            # CLI 엔트리포인트
├── common/           # 공통 모듈 (인증, HTTP, 설정, 에러)
├── confluence/       # Confluence 모듈 (api/tools/commands/converters)
├── jira/             # JIRA 모듈 (api/tools/commands)
├── gitlab/           # GitLab 모듈 (api/tools/commands)
└── mcp/              # MCP 서버 코어

backend/              # Agentic PRD Harness 백엔드 (Python/FastAPI)
├── app/
│   ├── api/          # 엔드포인트 및 라우터
│   ├── core/         # 비즈니스 로직, 데이터베이스, AI 연동
│   ├── models/       # 데이터 모델 (SQLAlchemy)
│   └── webhooks/     # GitLab Webhook 연동
└── tests/

frontend/             # Agentic PRD Harness 프론트엔드 (React/Next.js)
├── src/
│   ├── components/   # UI 컴포넌트 (shadcn/ui)
│   ├── pages/        # 웹 페이지
│   └── services/     # 백엔드 API 호출
└── tests/
```

## 실행 방법 (Agentic PRD Harness)

새롭게 추가된 기획 문서 관리 및 개발 연동 웹 UI를 실행하는 방법입니다.

### 1. 필수 요구사항
- Node.js 20+
- Python 3.11+
- pnpm

### 2. 초기 셋업
가상환경(venv)을 생성하고 프론트엔드/백엔드 패키지를 모두 설치합니다.
```bash
make setup
```

### 3. 서버 실행
MCP, 백엔드(FastAPI), 프론트엔드(Next.js)를 동시에 실행합니다.
```bash
make dev
```
- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)


## 문서

상세한 설계 문서는 `tdecollab-docs/` 디렉토리를 참조하세요.

- [아키텍처](tdecollab-docs/architecture.md)
- [인증 및 설정](tdecollab-docs/auth-and-config.md)
- [MCP 서버 설계](tdecollab-docs/mcp-server-design.md)
- [npm 패키지 등록(Publish) 가이드](tdecollab-docs/npm-publish-guide.md)
- Confluence: [API 스펙](tdecollab-docs/confluence/api-spec.md) | [기능 정의](tdecollab-docs/confluence/features.md) | [MCP 도구](tdecollab-docs/confluence/mcp-tools.md)
- JIRA: [API 스펙](tdecollab-docs/jira/api-spec.md) | [기능 정의](tdecollab-docs/jira/features.md) | [MCP 도구](tdecollab-docs/jira/mcp-tools.md)
- GitLab: [API 스펙](tdecollab-docs/gitlab/api-spec.md) | [기능 정의](tdecollab-docs/gitlab/features.md) | [MCP 도구](tdecollab-docs/gitlab/mcp-tools.md)
