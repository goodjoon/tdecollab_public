---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Confluence Link**: `[LINK_TO_CONFLUENCE]`  
**JIRA Epic/Ticket**: `[JIRA_TICKET_ID]`  
**Input**: Design documents from `tdecollab-docs/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests (MANDATORY)**: 헌장 III 원칙에 따라 모든 기능 구현 시 테스트 코드를 반드시 작성해야 합니다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Setup database schema/models and migrations (if applicable)
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup core architecture boundaries (api, tools, commands)
- [ ] T007 Configure error handling and logging infrastructure

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: `pnpm test [path/to/test]`

### Tests for User Story 1 (MANDATORY) ⚠️

> **TDD: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Unit test for [component] in src/[module]/__tests__/test_[name].spec.ts
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/[name].spec.ts

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement [Model/API] in src/[module]/api/
- [ ] T013 [P] [US1] Implement [Tool] in src/[module]/tools/
- [ ] T014 [US1] Implement [Command] in src/[module]/commands/
- [ ] T015 [US1] Verify implementation with `pnpm test`

**Checkpoint**: User Story 1 fully functional and verified

---

[Repeat Phase 3 pattern for User Story 2, 3...]

---

## Phase N: Polish & Documentation

- [ ] TXXX [P] Final documentation updates in `tdecollab-docs/` (Mermaid diagrams & Tables)
- [ ] TXXX Code cleanup and refactoring (DRY & Clean Code)
- [ ] TXXX Verify all tests pass with `pnpm test`
