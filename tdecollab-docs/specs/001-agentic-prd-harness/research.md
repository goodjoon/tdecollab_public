# Research: Agentic PRD Harness

## 1. 아키텍처 및 기술 스택 결정

### 1.1 Frontend (웹 UI)
- **Decision**: React + Next.js (TypeScript), Tailwind CSS
- **Rationale**: 사용자 인터페이스(기획 문서 작성, 실시간 AI 채팅 등)를 빠르게 구축하고 유지보수하기 위해 범용적이고 생태계가 넓은 React와 프레임워크인 Next.js를 채택합니다. Tailwind CSS를 사용하여 빠르고 유연한 스타일링을 적용합니다.

### 1.2 Backend (비즈니스 로직 및 AI 연동)
- **Decision**: Python + FastAPI
- **Rationale**: 사용자의 요구사항에 따라 Backend는 Python 생태계를 채택합니다. AI 연동 시 풍부한 생태계와 직관적이고 고성능의 API 개발이 가능한 FastAPI가 적합합니다.
- **Alternatives considered**: Node.js/Express (기존 TypeScript 통일을 위해 고려되었으나 Python으로 변경됨).

### 1.3 기존 도구 구조 변경 (`src/` -> `tools/`) 및 MCP (Model Context Protocol) 연동
- **Decision**: 기존 `src/` 디렉토리를 `tools/` 로 변경하고, 사내 시스템(Confluence, JIRA, GitLab)과 연계를 위한 Tool 및 MCP 프로젝트 디렉토리로 관리합니다.
- **Rationale**: TDE Collab의 핵심 역량인 MCP 및 도구 래퍼 기능의 정체성을 명확히 하고, Python 백엔드 및 웹 프론트엔드 등 다른 서브프로젝트들과의 역할 경계를 뚜렷하게 분리(Clean Architecture)하기 위함입니다. AI 에이전트는 이 `tools/` 하위의 MCP 모듈과 상호작용합니다.

## 2. 기술적 불확실성 해소 (Clarifications)

### 2.1 JIRA 티켓 생성 시 의존성(선후 관계) 처리 방안
- **Decision**: JIRA의 'Issue Link' 기능 활용.
- **Rationale**: JIRA API(`POST /rest/api/2/issueLink`)를 통해 Task 간의 선후 관계(blocks, is blocked by 등)를 명확히 표현할 수 있습니다.

### 2.2 GitLab-JIRA 연동 (상태 자동 업데이트)
- **Decision**: GitLab Webhook을 Python Backend 서버로 받아 처리하는 것을 기본으로 하되, 사내 방화벽 정책 등으로 Webhook 수신이 불가능한 환경을 대비해 **Polling 방식의 스케줄러(Daemon)** 옵션을 추가로 제공합니다.
- **Rationale**: 온프레미스 망의 보안 정책상 외부/내부망 간 혹은 서브넷 간 Webhook Inbound 통신이 막혀있을 가능성이 큽니다. 따라서 주기적으로 GitLab API를 찔러(Polling) 최신 커밋 및 MR 이벤트를 수집하고 JIRA 상태를 업데이트하는 Fallback 메커니즘이 필수적입니다.
