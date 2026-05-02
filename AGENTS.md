# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# tdecollab AGENTS Guide

이 문서는 AI Agent가 이 저장소에서 작업할 때 따라야 하는 운영 규칙이다.

## 언어 규칙
- 모든 응답과 문서는 한국어로 작성한다.
- 기술용어는 번역하지 않고 원문 단어를 사용한다.
- 사용자 노출 메시지와 에러 메시지는 한국어로 작성한다.

## 핵심 원칙 (Constitution v2.0.0)
- **컨텍스트 유지**: 모든 설계 및 결정 사항은 반드시 `tdecollab-docs/`에 문서로 남겨 채팅 세션 간 컨텍스트를 유지한다.
- **코드 품질**: 재사용성, 품질, 가독성을 최우선으로 하며 사람이 이해하기 쉬운 코드를 작성한다.
- **TDD (Test-Driven Development)**: 모든 기능 구현 시 반드시 테스트 코드를 먼저 또는 함께 작성한다 (`pnpm test`).
- **시각화 및 문서화**: 문서 작성 시 Mermaid 다이어그램과 표를 활용하여 가독성을 극대화한다.
- **클린 아키텍처**: 중복 없는 코드(DRY)와 명확한 역할/기능 경계를 유지하며 모듈화된 구조를 지향한다.

## 프로젝트 개요
- 목적: TDE 포털의 Confluence, JIRA, GitLab을 CLI 및 MCP 서버로 통합 제공
- 언어/런타임: TypeScript (strict mode), Node.js ≥ 20, ESM
- 빌드: `tsup` (entry: `tools/index.ts`, `tools/cli.ts` → `dist/`)
- 개발 실행: `tsx` (watch mode)

## 빌드/실행 명령

```bash
pnpm install          # 의존성 설치
pnpm build            # tsup으로 dist/ 빌드
pnpm dev              # tsx watch로 MCP 서버 개발 실행
pnpm cli              # tsx로 CLI 직접 실행
pnpm lint             # ESLint 실행
pnpm format           # Prettier 포맷
pnpm test             # vitest watch 모드
pnpm test:run         # vitest 단일 실행 (CI용)
```

특정 테스트 파일만 실행:
```bash
pnpm test:run tools/confluence/converters/__tests__/storage-to-md.spec.ts
```

## 환경 설정

`.env.example`을 복사해 `.env`를 만든 뒤 토큰을 채워넣는다:

| 환경변수 | 설명 |
|---|---|
| `CONFLUENCE_BASE_URL` | Confluence 서버 URL |
| `CONFLUENCE_API_TOKEN` | PAT 토큰 (Bearer 인증) |
| `CONFLUENCE_USERNAME` | Basic Auth 시만 필요 (PAT 사용 시 생략) |
| `CONFLUENCE_MERMAID_MACRO_NAME` | Mermaid 매크로명 (기본: `mermaiddiagram`) |
| `JIRA_BASE_URL` | JIRA 서버 URL |
| `JIRA_API_TOKEN` | PAT 토큰 |
| `GITLAB_BASE_URL` | GitLab 서버 URL |
| `GITLAB_PRIVATE_TOKEN` | Private Token (`glpat-…`) |
| `AI_PROVIDER` | `openai` 또는 `anthropic` (기본: `openai`) |
| `AI_MODEL` | 사용할 모델 (기본: `gpt-4o`) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | AI 변환 기능 사용 시 필수 |

## 프로젝트 구조

소스 코드는 `tools/`에 위치한다 (`src/` 아님).

```
tools/
├── index.ts                  # MCP 서버 엔트리포인트
├── cli.ts                    # CLI 엔트리포인트
├── common/                   # 공통 인프라
│   ├── config.ts             # 환경변수 로드 (loadConfluenceConfig 등)
│   ├── auth.ts               # 인증 헤더 생성 유틸
│   ├── http-client.ts        # axios 인스턴스 팩토리 (인터셉터 포함)
│   ├── errors.ts             # ApiError, AuthError 등 커스텀 에러
│   ├── types.ts              # ServiceConfig 등 공통 타입
│   └── logger.ts             # 로거
├── confluence/
│   ├── api/                  # REST API 클라이언트 (content, space, search, label)
│   ├── tools/index.ts        # MCP tool 등록
│   ├── commands/index.ts     # CLI command 등록
│   ├── converters/           # Markdown ↔ Storage XML 변환 (핵심 로직)
│   │   ├── md-to-storage.ts  # Markdown → Confluence Storage XML
│   │   ├── storage-to-md.ts  # Confluence Storage XML → Markdown (turndown)
│   │   ├── ai-refiner.ts     # AI 기반 변환 보정 (OpenAI/Anthropic)
│   │   └── __tests__/        # 현재 테스트가 존재하는 유일한 위치
│   └── utils/image-downloader.ts
├── jira/                     # JIRA 모듈 (api/tools/commands)
├── gitlab/                   # GitLab 모듈 (api/tools/commands)
└── mcp/server.ts             # McpServer + StdioServerTransport 초기화
```

## 아키텍처 핵심 규칙

**3-layer 구조** — 각 서비스(`confluence/`, `jira/`, `gitlab/`)는 동일한 레이어를 가진다:

| 레이어 | 책임 | 금지 |
|---|---|---|
| `api/` | 순수 HTTP 요청/응답 | 포매팅, MCP 응답 |
| `tools/` | Zod schema 검증 → `api/` 호출 → MCP 응답 래핑 | CLI 출력 |
| `commands/` | `api/` 호출 → 터미널 출력 포매팅 (chalk, cli-table3) | MCP 응답 |

**Optional module 패턴**: `tools/` 및 `commands/`의 `registerXxxTools/Commands`는 환경변수 미설정 시 예외를 throw하지 않고 경고 로그 후 등록을 건너뛴다. MCP 서버는 설정된 서비스만 활성화된다.

**인증 흐름**: `http-client.ts`의 axios 요청 인터셉터가 `ServiceConfig.auth`를 읽어 자동 주입한다. GitLab은 `PRIVATE-TOKEN` 헤더를 사용 (Bearer 아님); `gitlab/api/client.ts`에서 헤더를 직접 설정한다.

**Confluence 변환 파이프라인**:
1. `MarkdownToStorageConverter` — `markdown-it` 커스텀 렌더러로 Mermaid/PlantUML/코드블록을 Confluence 매크로 XML로 변환
2. `StorageToMarkdownConverter` — `turndown` + GFM 플러그인으로 Storage XML → Markdown
3. `AIConversionService` — 변환 결과 보정이 필요할 때 선택적으로 사용 (`useAiFallback: true`)

## MCP 서버 설정 (Claude Desktop)

`dist/` 빌드 후 Claude Desktop `claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "tdecollab": {
      "command": "node",
      "args": ["/절대경로/tdecollab/dist/index.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "...",
        "CONFLUENCE_API_TOKEN": "..."
      }
    }
  }
}
```

## 코딩 스타일
- Prettier 규칙: `semi: true`, `singleQuote: true`, `trailingComma: all`, `printWidth: 100`
- MCP tool naming: `{service}_{action}_{resource}` (예: `confluence_get_page`, `jira_create_issue`)
- 모든 파일은 `.js` 확장자로 import (ESM + tsup 빌드 규칙)

## Git Workflow (중요)

이 프로젝트는 사내용(Private)과 공개용(Public) 레포지토리(GitHub)를 병행 운영하며, 커밋 히스토리를 분리해서 관리합니다.

### 1. 브랜치 및 리모트 구성
- **`main` 브랜치**: 모든 작업이 이루어지는 메인 브랜치. 모든 커밋 히스토리가 남으며, 사내 GitLab(`twin`)과 작업용 GitHub(`origin`)에 푸시합니다.
- **`release` 브랜치**: 과거 히스토리가 없는 **Orphan** 브랜치. 공개용 GitHub(`public`)에 푸시할 때만 사용합니다.
- **`origin` 리모트**: 작업용 Private GitHub (`goodjoon/tdecollab`)
- **`twin` 리모트**: 사내 GitLab (`gitlab.tde.sktelecom.com`)
- **`public` 리모트**: 공개용 Public GitHub (`goodjoon/tdecollab_public`)

### 2. 배포 및 동기화 워크플로우

#### 평소 개발
- `main` 브랜치에서 작업 후 `twin` 및 `origin` 리모트에 푸시합니다.

#### 공개용 릴리즈 (Public Release)
1. `release` 브랜치로 이동하여 `main`의 최신 내용을 히스토리 없이 가져옵니다.
   ```bash
   git checkout release
   git checkout main -- .
   git commit -m "Release v1.0.x: 최신 기능 반영"
   ```
2. 공개용 저장소(`public`)의 `main` 브랜치로 푸시합니다.
   ```bash
   git push public release:main
   ```
3. 태그를 달아 자동 배포를 트리거합니다.
   ```bash
   git tag obsidian-1.0.x
   git push public obsidian-1.0.x
   ```
4. 릴리즈 작업이 끝나면 반드시 `main` 브랜치로 돌아옵니다.
   ```bash
   git checkout main
   ```
   이후 작업을 `release` 브랜치에서 계속하지 않습니다.

#### 실수로 `release`에서 작업한 경우 (역방향 동기화)
1. `main` 브랜치로 이동하여 파일 내용만 복사해옵니다.
   ```bash
   git checkout main
   git checkout release -- .
   git commit -m "sync: release 브랜치의 수정 사항을 main에 반영"
   ```

**주의**: 절대로 `main` 브랜치를 `public` 리모트에 직접 푸시하지 마십시오. 사내 민감 정보 히스토리가 유출될 수 있습니다.

## 커밋 규칙
- 형식: `<type>(<scope>): <한국어 설명>`
- `type`: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- `scope`: `common`, `confluence`, `jira`, `gitlab`, `mcp`, `cli`
