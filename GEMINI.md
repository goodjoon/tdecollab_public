# tdecollab AGENTS Guide

이 문서는 Codex가 `/Users/goodjoon/develop/personal/tdecollab` 저장소에서 작업할 때 따라야 하는 운영 규칙이다.

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
- 언어/런타임: TypeScript, Node.js
- 아키텍처: service별 `api/`, `tools/`, `commands/` 3-layer 구조

## 빌드/실행 명령
```bash
pnpm install
pnpm build
pnpm dev
pnpm cli
pnpm test
pnpm test:run
pnpm format
```

## 프로젝트 구조
```
src/
├── index.ts                  # MCP 서버 엔트리포인트
├── cli.ts                    # CLI 엔트리포인트
├── common/                   # 공통 인프라
│   ├── config.ts
│   ├── auth.ts
│   ├── http-client.ts
│   ├── errors.ts
│   ├── types.ts
│   └── logger.ts
├── confluence/               # Confluence 모듈
│   ├── api/
│   ├── tools/
│   ├── converters/
│   └── commands/
├── jira/                     # JIRA 모듈 (api/tools/commands)
├── gitlab/                   # GitLab 모듈 (api/tools/commands)
└── mcp/                      # MCP 서버 코어
    ├── server.ts
    ├── transport.ts
    └── tool-registry.ts
```

## 아키텍처 규칙
- `api/`: 순수 REST API client. HTTP 요청/응답 책임만 가진다.
- `tools/`: MCP tool 정의. Zod schema 검증 후 `api/` 호출 결과를 MCP 응답으로 래핑한다.
- `commands/`: CLI command 정의. `api/` 호출 결과를 터미널 출력으로 포매팅한다.
- cross-layer 책임 침범을 피한다.

## 코딩 스타일
- TypeScript strict mode 유지
- ESM (`import`/`export`) 사용
- Prettier 규칙 준수
  - `semi: true`
  - `singleQuote: true`
  - `trailingComma: all`
  - `printWidth: 100`
- MCP tool naming은 `{service}_{action}_{resource}` 패턴 사용
  - 예: `confluence_get_page`

## 핵심 의존성
- `@modelcontextprotocol/sdk`
- `zod`
- `axios`
- `commander`
- `dotenv`
- `markdown-it`

## TDE 환경 정보
- Confluence: `https://confluence.tde.sktelecom.com` (Server/DC, REST API v1)
- JIRA: `https://jira.tde.sktelecom.com` (Server/DC, REST API v2)
- GitLab: `https://gitlab.tde.sktelecom.com` (Self-hosted, API v4)
- 인증
  - Confluence/JIRA: HTTP Basic Auth (`email:token`)
  - GitLab: `PRIVATE-TOKEN` header

## 변경 작업 원칙
- 기존 구조와 module 경계를 우선 유지한다.
- 설정/인증/HTTP 공통 로직은 `src/common/`에 둔다.
- 기능 추가 시 가능한 한 service module 내부(`confluence/`, `jira/`, `gitlab/`)에서 캡슐화한다.
- 문서/코드 변경 시 관련 테스트 또는 검증 명령(`pnpm test`, 필요 시 `pnpm test:run`)을 우선 수행한다.

## 커밋 규칙
- 커밋 메시지 형식: `<type>(<scope>): <설명>`
- `type`: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- `scope`: `common`, `confluence`, `jira`, `gitlab`, `mcp`, `cli`
- 설명은 한국어로 작성

## Active Technologies
- TypeScript (Node.js 20+) + React/Next.js (Frontend), Express/NestJS (Backend), @modelcontextprotocol/sdk, axios (001-agentic-prd-harness)
- 내부 데이터 관리를 위한 PostgreSQL 또는 단순 파일(JSON) 스토리지 (결정 필요시 기본적으로 기존 환경 활용) (001-agentic-prd-harness)
- TypeScript (Frontend, Tools), Python 3.11+ (Backend) + Next.js, FastAPI, @modelcontextprotocol/sdk (001-agentic-prd-harness)
- PostgreSQL (Backend DB) (001-agentic-prd-harness)

## Recent Changes
- 001-agentic-prd-harness: Added TypeScript (Node.js 20+) + React/Next.js (Frontend), Express/NestJS (Backend), @modelcontextprotocol/sdk, axios
