# MCP 서버 설계

## 1. MCP 프로토콜 개요

### 1.1 Model Context Protocol 소개
MCP(Model Context Protocol)는 AI 모델이 외부 도구와 데이터 소스에 접근할 수 있도록 하는 표준 프로토콜이다. tdecollab은 MCP 서버로 동작하여 Claude 등의 AI 에이전트가 TDE 포털의 Confluence, JIRA, GitLab을 직접 사용할 수 있게 한다.

### 1.2 @modelcontextprotocol/sdk
공식 TypeScript SDK를 사용한다. 주요 클래스:
- `McpServer`: 서버 인스턴스 생성 및 도구 등록
- `StdioServerTransport`: stdio 기반 통신 (프로세스 입출력)
- `StreamableHTTPServerTransport`: HTTP 기반 통신 (향후 확장)

### 1.3 핵심 개념
- **Tool (도구)**: AI가 호출할 수 있는 함수. 입력 스키마(Zod)와 핸들러 함수로 구성
- **Resource (리소스)**: AI가 읽을 수 있는 데이터 소스 (향후 확장 가능)
- **Prompt (프롬프트)**: 미리 정의된 프롬프트 템플릿 (향후 확장 가능)

## 2. 서버 구성

### 2.1 McpServer 초기화
```typescript
const server = new McpServer({
  name: 'tdecollab',
  version: '0.1.0',
});
```

### 2.2 Transport 설정
기본은 stdio transport로, Claude Desktop이나 Claude Code에서 프로세스를 직접 실행하여 통신한다.

```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2.3 서버 메타데이터
- name: `tdecollab`
- version: package.json의 version과 동기화
- capabilities: tools (도구 제공)

## 3. 도구(Tool) 등록 아키텍처

### 3.1 tool-registry.ts의 역할
각 서비스 모듈의 `tools/index.ts`에서 도구 등록 함수를 export하고, `tool-registry.ts`가 이를 모아서 McpServer에 일괄 등록한다.

```typescript
// mcp/tool-registry.ts
import { registerConfluenceTools } from '../confluence/tools/index.js';
import { registerJiraTools } from '../jira/tools/index.js';
import { registerGitlabTools } from '../gitlab/tools/index.js';

export function registerAllTools(server: McpServer) {
  registerConfluenceTools(server);
  registerJiraTools(server);
  registerGitlabTools(server);
}
```

### 3.2 개별 도구 등록 패턴
각 도구는 Zod 스키마로 입력을 정의하고, 핸들러 함수에서 API 레이어를 호출한다.

```typescript
// 예: confluence/tools/get-page.ts
server.tool(
  'confluence_get_page',
  '페이지 ID로 Confluence 페이지를 조회합니다',
  {
    pageId: z.string().describe('페이지 ID'),
    format: z.enum(['markdown', 'storage']).default('markdown').describe('본문 반환 형식'),
  },
  async ({ pageId, format }) => {
    const page = await confluenceApi.getPage(pageId, format);
    return {
      content: [{ type: 'text', text: JSON.stringify(page, null, 2) }],
    };
  }
);
```

## 4. 도구 네이밍 컨벤션

### 4.1 네이밍 패턴
`{service}_{action}_{resource}`

### 4.2 전체 도구 목록

**Confluence (9개)**
| 도구명 | 설명 |
|--------|------|
| `confluence_get_page` | 페이지 ID로 조회 (제목, 본문, 메타데이터) |
| `confluence_create_page` | Markdown으로 새 페이지 생성 |
| `confluence_update_page` | 기존 페이지 내용 업데이트 |
| `confluence_delete_page` | 페이지 삭제 |
| `confluence_search_pages` | CQL 또는 텍스트로 검색 |
| `confluence_get_page_tree` | 페이지 하위 트리 조회 |
| `confluence_get_spaces` | 스페이스 목록 조회 |
| `confluence_manage_labels` | 라벨 조회/추가/삭제 |
| `confluence_convert_content` | Markdown ↔ Storage 변환 |

**JIRA (7개)**
| 도구명 | 설명 |
|--------|------|
| `jira_get_issue` | 이슈 상세 조회 |
| `jira_create_issue` | 새 이슈 생성 |
| `jira_update_issue` | 이슈 필드 업데이트 |
| `jira_search_issues` | JQL로 이슈 검색 |
| `jira_transition_issue` | 이슈 상태 변경 |
| `jira_manage_comments` | 코멘트 조회/추가/수정/삭제 |
| `jira_get_projects` | 프로젝트 및 보드 조회 |

**GitLab (7개)**
| 도구명 | 설명 |
|--------|------|
| `gitlab_get_project` | 프로젝트 조회 (목록/상세) |
| `gitlab_get_merge_request` | MR 조회 (목록/상세) |
| `gitlab_create_merge_request` | 새 MR 생성 |
| `gitlab_manage_merge_request` | MR 머지/상태변경/코멘트 |
| `gitlab_get_pipelines` | 파이프라인 조회 |
| `gitlab_manage_branches` | 브랜치 조회/생성/삭제 |
| `gitlab_get_file` | 파일/디렉토리 조회 |

## 5. 에러 처리

### 5.1 MCP 표준 에러 응답
도구 실행 중 에러 발생 시 `isError: true`와 함께 한국어 에러 메시지를 반환한다.

```typescript
return {
  content: [{ type: 'text', text: '페이지를 찾을 수 없습니다 (ID: 12345)' }],
  isError: true,
};
```

### 5.2 에러 유형별 처리
| HTTP 상태 | 에러 유형 | MCP 응답 |
|-----------|----------|----------|
| 401 | 인증 실패 | `인증에 실패했습니다. 환경변수를 확인해주세요.` |
| 403 | 권한 없음 | `해당 리소스에 접근 권한이 없습니다.` |
| 404 | 리소스 없음 | `요청한 리소스를 찾을 수 없습니다.` |
| 409 | 버전 충돌 | `다른 사용자가 먼저 수정했습니다. 다시 시도해주세요.` |
| 500 | 서버 오류 | `서버 내부 오류가 발생했습니다.` |

## 6. Claude Desktop / Claude Code 연동

### 6.1 Claude Desktop 설정
`~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tdecollab": {
      "command": "node",
      "args": ["/path/to/tdecollab/dist/index.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.tde.sktelecom.com",
        "CONFLUENCE_EMAIL": "사번@sktelecom.com",
        "CONFLUENCE_API_TOKEN": "your-token",
        "JIRA_BASE_URL": "https://jira.tde.sktelecom.com",
        "JIRA_EMAIL": "사번@sktelecom.com",
        "JIRA_API_TOKEN": "your-token",
        "GITLAB_BASE_URL": "https://gitlab.tde.sktelecom.com",
        "GITLAB_PRIVATE_TOKEN": "your-token"
      }
    }
  }
}
```

### 6.2 Claude Code 설정
프로젝트의 `.mcp.json` 또는 `~/.claude/settings.json`에 설정:
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

환경변수는 `.env` 파일에서 자동으로 로드되므로, `env` 필드 대신 `.env` 파일을 사용하는 것을 권장한다.
