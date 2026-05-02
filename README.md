# tdecollab

Confluence, JIRA, GitLab을 하나의 CLI / TUI / MCP 서버로 통합 제공하는 도구.

터미널에서 직접 사용하거나, AI 에이전트(Claude Desktop 등)와 연동하여 사용할 수 있습니다.

## 지원 서비스

| 서비스 | 주요 기능 |
|--------|----------|
| **Confluence** | 페이지 CRUD, Markdown ↔ Storage Format 변환, 검색, 라벨 관리, 페이지 트리 조회 |
| **JIRA** | 이슈 CRUD, JQL 검색, 상태 변경(트랜지션), 코멘트 관리, 프로젝트/보드 조회 |
| **GitLab** | 프로젝트 조회, MR 관리, 파이프라인 조회, 브랜치 관리, 파일 조회 |

## 요구사항

- Node.js 20 이상

## 설치

```bash
# 전역 설치
npm install -g tdecollab

# 또는 npx로 즉시 실행 (설치 불필요)
npx -y tdecollab --help
```

## 설정

각 서비스 접속에 필요한 환경변수:

```env
# Confluence
CONFLUENCE_BASE_URL=https://confluence.example.com
CONFLUENCE_USERNAME=your-username    # Basic Auth 사용 시 (선택)
CONFLUENCE_API_TOKEN=your-api-token

# JIRA
JIRA_BASE_URL=https://jira.example.com
JIRA_USERNAME=your-username          # PAT 사용 시 생략 가능 (선택)
JIRA_API_TOKEN=your-api-token

# GitLab
GITLAB_BASE_URL=https://gitlab.example.com   # 미설정 시 https://gitlab.com
GITLAB_PRIVATE_TOKEN=your-private-token
```

설정 로드 우선순위:

| 우선순위 | 위치 | 설명 |
|---|---|---|
| 1 | 셸 환경변수 / MCP `env` | `export CONFLUENCE_BASE_URL=...` 또는 Claude Desktop 설정의 `env` 섹션 |
| 2 | `./tdecollab.env` | 현재 작업 디렉토리의 프로젝트별 설정 |
| 3 | `~/.config/tdecollab/.env` | 사용자 글로벌 기본 설정 |

상위 우선순위에 이미 설정된 값은 하위 설정 파일 값으로 덮어쓰지 않습니다.

## 사용법

### TUI (Terminal UI) 모드
![[img_20260429004932.png]]

인자 없이 실행하면 인터랙티브 TUI가 시작됩니다 — 메뉴 탐색, 폼 입력, 실시간 결과 확인이 한 화면에서 가능합니다.

```bash
tdecollab
```

| 단축키 | 동작 |
|---|---|
| `↑↓` `Tab` `Shift+Tab` | 메뉴/필드 이동 |
| `↵` | 메뉴 펼치기 / 경로 선택창 / 토글 |
| `Ctrl+R` | 폼 실행 |
| `Ctrl+S` | 입력값을 프리셋으로 저장 |
| `Esc` | 뒤로 |
| `q` | 종료 |
| `j/k` `Ctrl+D/U` `Ctrl+F/B` `g/G` | 결과 마크다운 뷰 vim 스타일 스크롤 |

마지막 사용값은 `.tdecollab.json`에, 명령 히스토리는 `~/.tdecollab_history.json`에 자동 저장됩니다.

### CLI 명령어

#### Confluence

```bash
# 스페이스 목록
tdecollab confluence space list

# 페이지를 Markdown으로 다운로드 (이미지 포함)
tdecollab confluence page get <pageId> -d --image-dir ./assets -o page.md

# 마크다운 파일로 페이지 생성/수정 (로컬 이미지 자동 업로드)
tdecollab confluence page create --space <key> --title <title> --file <path_to_md>
tdecollab confluence page update <pageId> --file <path_to_md>
```

#### JIRA / GitLab

```bash
tdecollab jira issue get PROJ-1234
tdecollab jira search "assignee = currentUser() AND status != Done"
tdecollab gitlab mr list <projectId> -s opened
```

`tdecollab <service> --help` 또는 `tdecollab <service> <command> --help`로 모든 옵션을 확인할 수 있습니다.

## MCP 서버 (Claude Desktop 연동)

Claude Desktop에서 Confluence, JIRA, GitLab 도구를 사용할 수 있습니다.

### 설정 파일 위치

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### npx 사용 (권장 — 별도 설치 불필요)

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

### 전역 설치 후 사용

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

설정 후 Claude Desktop을 재시작하면 도구가 활성화됩니다.

### 제공 MCP 도구

| 서비스 | 도구 |
|---|---|
| **Confluence (9)** | `confluence_get_page`, `confluence_create_page`, `confluence_update_page`, `confluence_delete_page`, `confluence_search_pages`, `confluence_get_spaces`, `confluence_get_page_tree`, `confluence_manage_labels`, `confluence_convert_content` |
| **JIRA (7)** | `jira_get_issue`, `jira_create_issue`, `jira_update_issue`, `jira_search_issues`, `jira_transition_issue`, `jira_manage_comments`, `jira_get_projects` |
| **GitLab (7)** | `gitlab_get_project`, `gitlab_get_merge_request`, `gitlab_create_merge_request`, `gitlab_manage_merge_request`, `gitlab_get_pipelines`, `gitlab_manage_branches`, `gitlab_get_file` |

자세한 도구별 파라미터는 Claude Desktop의 MCP 도구 검색 UI 또는 `tdecollab mcp` 실행 시 stderr 로그를 참조하세요.

## 라이선스

[MIT](LICENSE)
