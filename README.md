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
# Confluence (현재 지원)
CONFLUENCE_BASE_URL=https://confluence.example.com
CONFLUENCE_USERNAME=your-username  # Basic Auth 사용 시 (선택)
CONFLUENCE_API_TOKEN=your-api-token

# JIRA (개발 예정)
JIRA_BASE_URL=https://jira.example.com
JIRA_USERNAME=your-username
JIRA_API_TOKEN=your-api-token

# GitLab (개발 예정)
GITLAB_BASE_URL=https://gitlab.example.com
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

#### Confluence (현재 지원)

```bash
# 스페이스 목록 조회
tdecollab confluence space list

# 페이지 조회
tdecollab confluence page get <pageId>
tdecollab confluence page get <pageId> --raw          # Storage Format 출력
tdecollab confluence page get <pageId> --quiet        # 메타데이터 생략
tdecollab confluence page get <pageId> --raw --quiet > page.html

# 이미지 다운로드와 함께 페이지 조회
tdecollab confluence page get <pageId> --download-images                    # 이미지를 ./images에 다운로드
tdecollab confluence page get <pageId> -d --image-dir ./my-images          # 커스텀 디렉토리에 다운로드
tdecollab confluence page get <pageId> -d -o page.md                       # Markdown 파일로 저장
tdecollab confluence page get <pageId> -d --image-dir ./assets -o page.md  # 이미지와 함께 저장

# 페이지 생성
tdecollab confluence page create --space <key> --title <title> --content "Markdown 내용"
tdecollab confluence page create --space <key> --title <title> --file <path>

# 페이지 검색 (CQL)
tdecollab confluence search "title ~ 'guide'"
tdecollab confluence search "space = MYSPACE AND type = page"
```

#### JIRA (개발 예정)

```bash
tdecollab jira issue get <issueKey>
tdecollab jira search <jql>
```

#### GitLab (개발 예정)

```bash
tdecollab gitlab mr list <projectId>
```

### MCP 서버 (Claude Desktop 연동)

Claude Desktop에서 Confluence 도구를 사용할 수 있습니다.

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
        "CONFLUENCE_API_TOKEN": "your-api-token"
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
        "CONFLUENCE_API_TOKEN": "your-api-token"
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
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

설정 후 Claude Desktop을 재시작하면 Confluence 도구를 사용할 수 있습니다.

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
