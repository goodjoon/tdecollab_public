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
- pnpm

## 설치

```bash
pnpm install
pnpm build
```

## 설정

`.env.example`을 `.env`로 복사한 후 각 서비스의 인증 정보를 입력합니다.

```bash
cp .env.example .env
```

### 환경변수

```env
# Confluence
CONFLUENCE_BASE_URL=https://confluence.tde.sktelecom.com
CONFLUENCE_EMAIL=사번@sktelecom.com
CONFLUENCE_API_TOKEN=your-api-token

# JIRA
JIRA_BASE_URL=https://jira.tde.sktelecom.com
JIRA_EMAIL=사번@sktelecom.com
JIRA_API_TOKEN=your-api-token

# GitLab
GITLAB_BASE_URL=https://gitlab.tde.sktelecom.com
GITLAB_PRIVATE_TOKEN=your-private-token
```

## 사용법

### CLI

```bash
# Confluence
tdecollab confluence page get <pageId>
tdecollab confluence page create --space <key> --title <title> --file <path>
tdecollab confluence search <query>

# JIRA
tdecollab jira issue get <issueKey>
tdecollab jira search <jql>
tdecollab jira issue transition <issueKey> --to <status>

# GitLab
tdecollab gitlab mr list <projectId> --state opened
tdecollab gitlab pipeline get <projectId> <pipelineId>
```

### MCP 서버

Claude Desktop 또는 Claude Code에서 MCP 서버로 연동하여 사용할 수 있습니다.

```json
{
  "mcpServers": {
    "tdecollab": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/tdecollab"
    }
  }
}
```

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
src/
├── index.ts          # MCP 서버 엔트리포인트
├── cli.ts            # CLI 엔트리포인트
├── common/           # 공통 모듈 (인증, HTTP, 설정, 에러)
├── confluence/       # Confluence 모듈 (api/tools/commands/converters)
├── jira/             # JIRA 모듈 (api/tools/commands)
├── gitlab/           # GitLab 모듈 (api/tools/commands)
└── mcp/              # MCP 서버 코어
```

## 문서

상세한 설계 문서는 `docs/` 디렉토리를 참조하세요.

- [아키텍처](docs/architecture.md)
- [인증 및 설정](docs/auth-and-config.md)
- [MCP 서버 설계](docs/mcp-server-design.md)
- Confluence: [API 스펙](docs/confluence/api-spec.md) | [기능 정의](docs/confluence/features.md) | [MCP 도구](docs/confluence/mcp-tools.md)
- JIRA: [API 스펙](docs/jira/api-spec.md) | [기능 정의](docs/jira/features.md) | [MCP 도구](docs/jira/mcp-tools.md)
- GitLab: [API 스펙](docs/gitlab/api-spec.md) | [기능 정의](docs/gitlab/features.md) | [MCP 도구](docs/gitlab/mcp-tools.md)
