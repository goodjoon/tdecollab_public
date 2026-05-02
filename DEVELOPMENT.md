# Development Guide

tdecollab 저장소에서 직접 개발할 때 참고하는 가이드입니다. 일반 사용자용 문서는 [README.md](README.md)를 참조하세요.

## 요구사항

- Node.js 20+
- pnpm
- (Agentic PRD Harness 실행 시) Python 3.11+

## 초기 셋업

```bash
git clone <repository-url>
cd tdecollab
pnpm install
```

## 빌드 / 실행 명령

```bash
pnpm install          # 의존성 설치
pnpm build            # tsup으로 dist/ 빌드 (cli/index/tui/index 엔트리)
pnpm dev              # tsx watch로 MCP 서버 개발 실행
pnpm cli              # tsx로 CLI 직접 실행
pnpm tui              # tsx로 TUI 직접 실행
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm test             # vitest watch 모드
pnpm test:run         # vitest 단일 실행 (CI용)
```

특정 테스트만 실행:

```bash
pnpm test:run tools/confluence/converters/__tests__/storage-to-md.spec.ts
```

## 글로벌 명령으로 로컬 빌드 사용 (배포 없이)

```bash
pnpm build
npm link    # 또는 pnpm link --global
```

이후 어디서든 `tdecollab` 명령을 실행하면 현재 워킹 디렉토리의 `dist/`를 가리킵니다. 코드 수정 후 `pnpm build`만 다시 하면 즉시 반영됩니다.

해제: `npm uninstall -g tdecollab`

## 프로젝트 구조

```
tools/                      # 사내 시스템 연계용 Tool & MCP (TypeScript, ESM)
├── index.ts                # MCP 서버 엔트리포인트
├── cli.ts                  # CLI 엔트리포인트 (인자 없으면 TUI로 분기)
├── common/                 # 공통 모듈 (인증, HTTP, 설정, 에러)
├── confluence/             # api/ + tools/ + commands/ + converters/
├── jira/                   # api/ + tools/ + commands/
├── gitlab/                 # api/ + tools/ + commands/
├── mcp/                    # MCP 서버 코어
└── tui/                    # Ink 기반 TUI
    ├── index.tsx           # TUI 엔트리
    ├── App.tsx             # 화면 라우터
    ├── components/         # AppShell, Panel, MenuTree, FormField, FilePicker, ...
    ├── screens/            # MenuScreen, FormScreen, RunningScreen, ...
    └── executor/           # 커맨드별 실제 API 호출

backend/                    # Agentic PRD Harness 백엔드 (Python/FastAPI)
frontend/                   # Agentic PRD Harness 프론트엔드 (React/Next.js)
```

## 아키텍처 핵심 규칙

각 서비스(`confluence/`, `jira/`, `gitlab/`)는 동일한 3-layer 구조:

| 레이어 | 책임 | 금지 |
|---|---|---|
| `api/` | 순수 HTTP 요청/응답 | 포매팅, MCP 응답 |
| `tools/` | Zod schema 검증 → `api/` 호출 → MCP 응답 래핑 | CLI 출력 |
| `commands/` | `api/` 호출 → 터미널 출력 포매팅 | MCP 응답 |

**Optional module 패턴**: 각 `registerXxxCommands`/`registerXxxTools`는 환경변수 미설정 시 예외를 throw하지 않고 경고 로그 후 등록을 건너뜁니다. 설정된 서비스만 활성화됩니다.

## 코딩 스타일

- Prettier: `semi: true`, `singleQuote: true`, `trailingComma: all`, `printWidth: 100`
- MCP tool naming: `{service}_{action}_{resource}` (예: `confluence_get_page`)
- 모든 import는 `.js` 확장자 (ESM + tsup 빌드 규칙)

## 커밋 규칙

- 형식: `<type>(<scope>): <한국어 설명>`
- `type`: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`
- `scope`: `common`, `confluence`, `jira`, `gitlab`, `mcp`, `cli`, `tui`

## Agentic PRD Harness (선택)

기획 문서 관리 + 개발 연동 웹 UI를 함께 실행하는 경우:

```bash
# 가상환경 생성 + 프론트/백엔드 패키지 일괄 설치
make setup

# MCP + Backend(FastAPI) + Frontend(Next.js) 동시 실행
make dev
```

- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

## 내부 설계 문서

상세한 설계 문서는 `tdecollab-docs/` 디렉토리에 있습니다 (npm 배포에는 포함되지 않음).

- [아키텍처](tdecollab-docs/architecture.md)
- [인증 및 설정](tdecollab-docs/auth-and-config.md)
- [MCP 서버 설계](tdecollab-docs/mcp-server-design.md)
- [npm 패키지 배포 가이드](tdecollab-docs/npm-publish-guide.md)
- Confluence: [API 스펙](tdecollab-docs/confluence/api-spec.md) · [기능](tdecollab-docs/confluence/features.md) · [MCP 도구](tdecollab-docs/confluence/mcp-tools.md)
- JIRA: [API 스펙](tdecollab-docs/jira/api-spec.md) · [기능](tdecollab-docs/jira/features.md) · [MCP 도구](tdecollab-docs/jira/mcp-tools.md)
- GitLab: [API 스펙](tdecollab-docs/gitlab/api-spec.md) · [기능](tdecollab-docs/gitlab/features.md) · [MCP 도구](tdecollab-docs/gitlab/mcp-tools.md)

## AI Agent 운영 규칙

이 저장소에서 AI Agent로 작업할 경우 [AGENTS.md](AGENTS.md)를 따라주세요.

## 배포 (메인테이너용)

```bash
# 1. 버전 bump (package.json)
# 2. 빌드 + 검증
pnpm build
npm pack --dry-run

# 3. npm 배포
npm login    # 최초 1회
npm publish
```

배포 전 체크리스트:
- ☑️ `version` 필드 bump
- ☑️ `pnpm test:run` 통과
- ☑️ `pnpm build` 성공
- ☑️ `npm pack --dry-run`으로 포함 파일 확인 (dist/, README.md, package.json, LICENSE만 있어야 함)
- ☑️ 변경사항 커밋 + 태그
