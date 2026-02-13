# tdecollab 프로젝트 가이드

## 프로젝트 개요

TDE 포털의 Confluence, JIRA, GitLab을 CLI 및 MCP 서버로 통합 제공하는 TypeScript 프로젝트.

## 빌드 및 실행

```bash
pnpm install          # 의존성 설치
pnpm build            # tsup으로 빌드 (dist/ 출력)
pnpm dev              # 개발 모드 (tsx watch)
pnpm cli              # CLI 실행
pnpm test             # vitest 테스트
pnpm test:run         # vitest 단일 실행
pnpm format           # prettier 포맷팅
```

## 프로젝트 구조

```
src/
├── index.ts                  # MCP 서버 엔트리포인트
├── cli.ts                    # CLI 엔트리포인트 (commander)
├── common/                   # 공통 인프라
│   ├── config.ts             # 환경변수/설정 로딩 (dotenv)
│   ├── auth.ts               # 인증 매니저 (Basic Auth, Token)
│   ├── http-client.ts        # axios 래퍼 (baseURL, 인증 헤더 주입)
│   ├── errors.ts             # 공통 에러 타입
│   ├── types.ts              # 공통 인터페이스
│   └── logger.ts             # 로깅 유틸리티
├── confluence/               # Confluence 모듈
│   ├── api/                  # REST API 클라이언트 (순수 HTTP 레이어)
│   ├── tools/                # MCP 도구 정의 (Zod 스키마 + 핸들러)
│   ├── converters/           # Markdown ↔ Confluence Storage 변환
│   └── commands/             # CLI 커맨드 정의
├── jira/                     # JIRA 모듈 (api/tools/commands)
├── gitlab/                   # GitLab 모듈 (api/tools/commands)
└── mcp/                      # MCP 서버 코어
    ├── server.ts             # McpServer 인스턴스
    ├── transport.ts          # Transport 설정 (stdio)
    └── tool-registry.ts      # 전체 도구 통합 등록
```

## 아키텍처 레이어

각 서비스 모듈은 3개 레이어로 구성:
1. **api/**: 순수 REST API 클라이언트. HTTP 요청/응답만 담당
2. **tools/**: MCP 도구 정의. api 레이어를 호출하여 MCP 응답으로 래핑
3. **commands/**: CLI 커맨드. api 레이어를 호출하여 터미널 출력으로 포매팅

## 코딩 스타일

- TypeScript strict 모드
- ESM (import/export)
- Prettier: semi, singleQuote, trailingComma: all, printWidth: 100
- MCP 도구 네이밍: `{service}_{action}_{resource}` (예: `confluence_get_page`)
- 한국어 우선: 사용자 노출 메시지와 문서는 한국어로 작성
- 에러 메시지도 한국어로 작성

## 핵심 의존성

- `@modelcontextprotocol/sdk`: MCP 서버 SDK
- `zod`: MCP 도구 스키마 검증
- `axios`: HTTP 클라이언트
- `commander`: CLI 프레임워크
- `dotenv`: 환경변수 로딩
- `markdown-it`: Markdown 변환

## TDE 환경 정보

- Confluence: `https://confluence.tde.sktelecom.com` (Server/DC, REST API v1)
- JIRA: `https://jira.tde.sktelecom.com` (Server/DC, REST API v2)
- GitLab: `https://gitlab.tde.sktelecom.com` (Self-hosted, API v4)
- 인증: Confluence/JIRA는 HTTP Basic Auth(email:token), GitLab은 PRIVATE-TOKEN 헤더

## 커밋 규칙

- 커밋 메시지 형식: `<type>(<scope>): <설명>`
- type: feat, fix, docs, refactor, test, chore
- scope: common, confluence, jira, gitlab, mcp, cli
- 설명은 한국어로 작성
