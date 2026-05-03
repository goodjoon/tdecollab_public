# tdecollab

Confluence, JIRA, GitLab을 하나의 CLI / TUI / MCP 서버로 통합 제공하는 도구.

터미널에서 직접 사용하거나, AI 에이전트(Claude Desktop 등)와 연동하여 사용할 수 있습니다. 또한 Obsidian 플러그인을 통해 마크다운 노트를 Confluence와 양방향으로 연동할 수 있습니다.

## 지원 서비스

| 서비스 | 주요 기능 |
|--------|----------|
| **Confluence** | 페이지 CRUD, Markdown ↔ Storage Format 변환, 검색, 라벨 관리, 페이지 트리 조회 |
| **JIRA** | 이슈 CRUD, JQL 검색, 상태 변경(트랜지션), 코멘트 관리, 프로젝트/보드 조회 |
| **GitLab** | 프로젝트 조회, MR 관리, 파이프라인 조회, 브랜치 관리, 파일 조회 |

---

## 1. Obsidian 플러그인

현재 활성화된 마크다운 노트를 Confluence 페이지로 업로드하거나, 반대로 다운로드할 수 있는 Obsidian 플러그인을 제공합니다.

### 설치 방법 (BRAT)
1. Obsidian에서 **BRAT** 플러그인을 먼저 설치 및 활성화합니다.
2. `BRAT: Add a beta plugin for testing` 명령을 실행합니다.
3. **`goodjoon/tdecollab_public`** 주소를 입력하여 설치합니다.
4. 설정에서 **TDE Collab Confluence**를 활성화합니다.

### 사용법
- Obsidian의 명령어 팔레트(`Cmd/Ctrl + P`)를 열어 `TDE Collab`을 검색합니다.
- **Upload to Confluence**: 현재 열려있는 마크다운 노트를 Confluence 페이지로 업로드합니다.
- **Download from Confluence**: Confluence 페이지를 가져와 현재 마크다운 노트로 다운로드합니다.

---

## 2. CLI / TUI 및 MCP 서버

터미널에서 직접 실행하거나 Claude Desktop 등의 MCP 클라이언트와 연동할 수 있는 Node.js 기반 도구입니다.

### 요구사항

- Node.js 20 이상

### 설치 방법

```bash
# 전역 설치 (CLI/TUI 사용 시 권장)
npm install -g tdecollab

# 또는 npx로 즉시 실행 (설치 불필요)
npx -y tdecollab --help
```

### 환경변수 설정

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

### 사용법

#### TUI (Terminal UI) 모드

![](tdecollab-docs/assets/Monosnap%20tdecollab%202026-05-03%2014-21-27.png)

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

#### CLI 명령어

##### Confluence

```bash
# 스페이스 목록
tdecollab confluence space list

# 페이지를 Markdown으로 다운로드 (이미지 포함)
tdecollab confluence page get <pageId> -d --image-dir ./assets -o page.md

# 마크다운 파일로 페이지 생성/수정 (로컬 이미지 자동 업로드)
tdecollab confluence page create --space <key> --title <title> --file <path_to_md>
tdecollab confluence page update <pageId> --file <path_to_md>
```

##### JIRA / GitLab

```bash
tdecollab jira issue get PROJ-1234
tdecollab jira search "assignee = currentUser() AND status != Done"
tdecollab gitlab mr list <projectId> -s opened
```

`tdecollab <service> --help` 또는 `tdecollab <service> <command> --help`로 모든 옵션을 확인할 수 있습니다.

### MCP 서버 연동 (Claude Desktop)

Claude Desktop에서 Confluence, JIRA, GitLab 도구를 사용할 수 있습니다.

#### 설정 파일 위치

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### npx 사용 (권장 — 별도 설치 불필요)

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

#### 전역 설치 후 사용

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

#### 제공하는 MCP 도구

| 서비스 | 도구 |
|---|---|
| **Confluence (9)** | `confluence_get_page`, `confluence_create_page`, `confluence_update_page`, `confluence_delete_page`, `confluence_search_pages`, `confluence_get_spaces`, `confluence_get_page_tree`, `confluence_manage_labels`, `confluence_convert_content` |
| **JIRA (7)** | `jira_get_issue`, `jira_create_issue`, `jira_update_issue`, `jira_search_issues`, `jira_transition_issue`, `jira_manage_comments`, `jira_get_projects` |
| **GitLab (7)** | `gitlab_get_project`, `gitlab_get_merge_request`, `gitlab_create_merge_request`, `gitlab_manage_merge_request`, `gitlab_get_pipelines`, `gitlab_manage_branches`, `gitlab_get_file` |

자세한 도구별 파라미터는 Claude Desktop의 MCP 도구 검색 UI 또는 `tdecollab mcp` 실행 시 stderr 로그를 참조하세요.

---

## 라이선스

[MIT](LICENSE)