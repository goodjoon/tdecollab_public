---

description: "Task list for Confluence Tool Enhancement implementation"
---

# Tasks: Confluence Tool Enhancement (Advanced MD Conversion)

**Confluence Link**: `[LINK_TO_CONFLUENCE]`  
**JIRA Epic/Ticket**: `[JIRA_TICKET_ID]`  
**Input**: Design documents from `tdecollab-docs/specs/002-confluence-tool-enhancement/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/mcp-tools.md

**Tests (MANDATORY)**: 헌장 III 원칙에 따라 모든 기능 구현 시 테스트 코드를 반드시 작성해야 합니다. `pnpm test`를 통해 검증합니다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 기초 환경 및 신규 라이브러리 설정

- [x] T001 [P] Install new dependencies: `turndown`, `turndown-plugin-gfm`, `jsdom`, `@types/jsdom`
- [x] T002 [P] Configure `MERMAID_MACRO_NAME` and AI related variables in `src/common/config.ts`
- [x] T003 Setup common testing utilities for conversion in `src/confluence/converters/__tests__/test-utils.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 핵심 변환 엔진 고도화 및 AI 서비스 인터페이스 구축

- [x] T004 [P] Implement `AIProvider` interface and basic `AIConversionService` in `src/confluence/converters/ai-refiner.ts`
- [x] T005 [P] Integrate `jsdom` and `turndown` with GFM plugin in `src/confluence/converters/storage-to-md.ts`
- [x] T006 Update `MarkdownToStorageConverter` to support custom macro naming in `src/confluence/converters/md-to-storage.ts`

**Checkpoint**: 인프라 준비 완료 - 사용자 스토리별 구현 시작 가능

---

## Phase 3: User Story 1 - 지능형 Markdown → Confluence 업로드 (Priority: P1) 🎯 MVP

**Goal**: Mermaid 및 코드 블록을 Confluence 전용 매크로로 정확히 변환

**Independent Test**: `pnpm test src/confluence/converters/__tests__/md-to-storage.spec.ts`

### Tests for User Story 1 (MANDATORY) ⚠️

- [x] T007 [P] [US1] Create unit tests for Mermaid conversion in `src/confluence/converters/__tests__/md-to-storage.spec.ts`
- [x] T008 [P] [US1] Create unit tests for enhanced code block conversion in `src/confluence/converters/__tests__/md-to-storage.spec.ts`

### Implementation for User Story 1

- [x] T009 [US1] Implement Mermaid macro renderer in `src/confluence/converters/md-to-storage.ts`
- [x] T010 [US1] Refine code block macro renderer to handle various languages in `src/confluence/converters/md-to-storage.ts`
- [x] T011 [US1] Update `confluence_create_page` tool to use the enhanced converter in `src/confluence/tools/index.ts`

**Checkpoint**: US1 구현 완료 - Mermaid 및 코드 블록 정상 렌더링 확인 가능

---

## Phase 4: User Story 2 - 정확한 표(Table) 변환 (Priority: P2)

**Goal**: Confluence HTML 표를 깨끗한 Markdown 표로 변환

**Independent Test**: `pnpm test src/confluence/converters/__tests__/storage-to-md.spec.ts`

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T012 [P] [US2] Create unit tests for table conversion (including complex cells) in `src/confluence/converters/__tests__/storage-to-md.spec.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement table conversion rules using `turndown` in `src/confluence/converters/storage-to-md.ts`
- [x] T014 [US2] Handle Confluence-specific macro extraction before HTML parsing in `src/confluence/converters/storage-to-md.ts`
- [x] T015 [US2] Update `confluence_get_page` tool to return clean Markdown tables in `src/confluence/tools/index.ts`

**Checkpoint**: US2 구현 완료 - 페이지 조회 시 HTML 태그 없이 Markdown 표 확인 가능

---

## Phase 5: User Story 3 - AI 기반 폴백(Fallback) 변환 (Priority: P3)

**Goal**: 규칙 기반 변환 실패 시 AI 에이전트를 통한 지능형 보정

**Independent Test**: `pnpm test src/confluence/converters/__tests__/ai-refiner.spec.ts`

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T016 [P] [US3] Create tests for AI fallback logic with mock LLM response in `src/confluence/converters/__tests__/ai-refiner.spec.ts`

### Implementation for User Story 3

- [x] T017 [US3] Implement LLM prompt engineering for storage-xml/markdown conversion in `src/confluence/converters/ai-refiner.ts`
- [x] T018 [US3] Integrate `AIConversionService` into tools with `useAiFallback` option in `src/confluence/tools/index.ts`
- [x] T019 [US3] Update `confluence_convert_content` tool to support AI-assisted conversion in `src/confluence/tools/index.ts`

**Checkpoint**: US3 구현 완료 - 모든 변환 예외 상황에 대한 AI 대응 가능

---

## Phase 6: Polish & Validation (Real-world Integration)

**Purpose**: 실제 환경(.env) 기반 통합 테스트 및 문서화 마무리

- [x] T020 [P] Create integration test script `scripts/test-confluence-enhancement.ts` to verify sub-page creation
- [x] T021 [P] Run CLI upload test: `pnpm cli confluence page create --parent 951466645 --file tdecollab-docs/specs/001-agentic-prd-harness/plan.md`
- [ ] T022 [P] Run MCP tool test via Claude with real Mermaid content
- [x] T023 [P] Update `tdecollab-docs/specs/002-confluence-tool-enhancement/quickstart.md` with final verification results
