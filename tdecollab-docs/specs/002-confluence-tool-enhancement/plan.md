# Implementation Plan: Confluence Tool Enhancement (Advanced MD Conversion)

**Branch**: `002-confluence-tool-enhancement` | **Date**: 2024-05-24 | **Spec**: [Link to Spec](./spec.md)
**Input**: .env 파일에 이미 api key 들이 설정되어있으니 이 설정을 기반으로 cli 와 mcp 모두를 테스트 해보도록 하자. confluence 의 나의 workspace 의 특정 페이지에 (https://confluence.tde.sktelecom.com/spaces/~1111812/pages/951466645/...) 서브페이지를 만들고, tdecollab-docs/ 내의 문서들 중 표와 mermaid 다이어그램들이 있는 페이지를 업로드 하여 테스트해보도록 하자.

## Summary

Confluence와 Markdown 간의 양방향 변환 기능을 고도화합니다. 특히 Mermaid 다이어그램의 매크로 변환, 표(Table)의 정확한 Markdown 변환, 그리고 규칙 기반 변환이 어려울 경우 LLM을 활용한 지능형 폴백 변환 기능을 구현합니다. 또한 실제 환경(.env 기반)에서 지정된 페이지에 테스트 문서를 업로드하여 CLI와 MCP 도구의 동작을 검증합니다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: [@modelcontextprotocol/sdk, axios, markdown-it, turndown, jsdom]  
**Storage**: N/A (Confluence API)  
**Testing**: [vitest, pnpm test, custom integration scripts]  
**Target Platform**: MCP Server, CLI  
**Project Type**: mcp-server/cli  
**Performance Goals**: AI 폴백 시 지연 시간 최소화 (프롬프트 최적화)  
**Constraints**: 클린 아키텍처 준수, 헌장 v2.0.0(문서 중심, TDD) 준수  

## 헌장 검토 (Constitution Check)

*GATE: 기획(Phase 0) 전에 통과해야 하며, 설계(Phase 1) 이후 재확인해야 합니다.*

- [x] **컨텍스트 유지 (Context Maintenance)**: `tdecollab-docs/`에 모든 설계 및 의사결정 문서가 작성되었습니까?
- [x] **코드 품질 및 가독성 (Code Quality)**: 정규표현식 대신 안정적인 파서(turndown 등)를 도입합니까?
- [x] **TDD (Test-Driven Development)**: 변환 로직에 대한 단위 테스트와 통합 테스트가 계획되어 있습니까?
- [x] **시각화 (Rich Documentation)**: 변환 흐름 및 AI 폴백 로직이 시각화되었습니까?
- [x] **클린 아키텍처 (Clean Architecture)**: 변환기(Converter)와 AI 서비스가 명확히 분리되었습니까?

## Project Structure

### Documentation (this feature)

```text
tdecollab-docs/specs/002-confluence-tool-enhancement/
├── plan.md              # This file
├── research.md          # Phase 0: Mermaid XML 구조 및 Turndown 적용 연구
├── data-model.md        # Phase 1: AI 변환 요청/응답 모델
├── quickstart.md        # Phase 1: 테스트 실행 가이드
└── tasks.md             # Phase 2: 구현 태스크
```

### Source Code (repository root)

```text
src/
├── confluence/
│   ├── converters/      # 고도화된 변환 로직
│   │   ├── md-to-storage.ts
│   │   ├── storage-to-md.ts
│   │   └── ai-refiner.ts # 신규: AI 기반 변환 보정
│   ├── api/             # 페이지 생성/조회 API
│   └── tools/           # MCP 도구 (AI 폴백 옵션 추가)
```

## Phase 0: Outline & Research

1. **Mermaid 매크로 XML 조사**: Confluence Server/DC에서 Mermaid 다이어그램을 렌더링하기 위한 정확한 `ac:structured-macro` 구조 및 파라미터 확인.
2. **HTML to Markdown 라이브러리 검토**: `turndown` 라이브러리를 사용하여 복잡한 `table` 구조를 Markdown 표로 안정적으로 변환하는 방법 연구.
3. **AI 폴백 프롬프트 설계**: 변환 실패 구문(HTML/Broken MD)을 입력받아 유효한 XML/MD로 변환하기 위한 LLM 프롬프트 최적화.

## Phase 1: Design & Implementation

1. **MarkdownToStorageConverter 고도화**:
   - `mermaid` 렌더러 추가.
   - 코드 블록 매크로 파라미터 처리 강화.
2. **StorageToMarkdownConverter 고도화**:
   - `turndown` 도입 및 `table` 변환 플러그인 적용.
   - Confluence 매크로(code, mermaid) 역변환 로직 강화.
3. **AI Refiner 구현**:
   - 규칙 기반 변환 결과가 유효하지 않거나 명시적 요청 시 LLM API 호출 인터페이스 구현.
4. **Integration Test Environment**:
   - `.env` 정보를 로드하여 실제 Confluence API와 통신하는 테스트 모듈 구축.
   - 특정 부모 페이지 ID(`951466645`) 하위에 서브페이지를 생성/조회하는 시나리오 작성.

## Phase 2: Execution & Validation

- `pnpm test`를 통한 변환 로직 단위 테스트 수행.
- CLI 및 MCP 도구를 사용하여 `tdecollab-docs/` 문서를 실제 Confluence에 업로드하여 결과 확인.
- 업로드된 문서의 Mermaid 및 Table 렌더링 결과 수동 검증 및 AI 보정 동작 확인.

---

**Structure Decision**: 기존의 취약한 정규표현식 기반 로직을 폐기하고, 표준화된 라이브러리(`turndown`)와 지능형 에이전트(AI Refiner)를 결합한 하이브리드 변환 아키텍처를 채택합니다.
