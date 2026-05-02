# Obsidian Confluence Plugin Design

## 1. Overview
현재 선택한 마크다운 문서를 Confluence 페이지로 생성/업데이트 하거나, Confluence 페이지의 내용을 마크다운 문서로 다운로드할 수 있는 Obsidian 플러그인을 개발합니다.

이 플러그인은 `tdecollab` 프로젝트 내의 변환 로직(Markdown ↔ Storage XML)을 재사용하여 독립된(Standalone) 플러그인으로 빌드됩니다.

## 2. Architecture & Tech Stack
- **위치**: `packages/obsidian-plugin` 하위 프로젝트로 추가. (Monorepo 구조 활용)
- **빌드**: `tdecollab`의 `tools/confluence` 코드 및 API 로직을 번들링 (Desktop-only 타겟, Node.js 환경 의존성 포함). 빌드 도구로는 Obsidian 커뮤니티 표준인 `esbuild` 혹은 기존에 사용하는 `tsup` 활용.
- **플랫폼**: Obsidian 데스크톱 플러그인 (Node.js API 사용). 모바일 지원은 향후 검토.

## 3. Data Flow & Frontmatter Mapping
Obsidian 노트와 Confluence 페이지 간의 연결 고리는 문서의 Frontmatter를 통해 관리됩니다.

### 3.1. Upload (Markdown -> Confluence)
1. **명령어 실행**: "Confluence: Upload Current Document" 명령 실행.
2. **Frontmatter 확인**:
   - `confluence_page_id`가 존재하면 덮어쓰기 API (`PUT /rest/api/content/{id}`) 호출.
   - 존재하지 않으면 새 페이지 생성 API (`POST /rest/api/content`) 호출.
3. **업로드 및 응답**:
   - `markdown-it` 기반의 `md-to-storage` 변환기를 이용해 마크다운 내용을 Storage XML로 변환.
   - API 통신 시 사용자 플러그인 설정에서 가져온 인증 정보 사용.
4. **결과 처리**:
   - 새 페이지 생성 시 문서의 Frontmatter에 `confluence_page_id: {id}` 속성을 삽입(추가).
   - 성공/실패 여부를 Obsidian `Notice` UI로 표시.

### 3.2. Download (Confluence -> Markdown)
1. **명령어 실행**: "Confluence: Download to Current Document" 명령 실행.
2. **Frontmatter 확인**: `confluence_page_id`가 없으면 플러그인이 모달을 띄워 Page ID를 사용자로부터 입력받음.
3. **다운로드 및 응답**:
   - `GET /rest/api/content/{id}?expand=body.storage` 호출하여 Storage XML 조회.
   - `turndown` 기반의 `storage-to-md` 변환기로 마크다운으로 변환.
4. **결과 처리**:
   - 현재 열려있는 마크다운 파일의 본문(Frontmatter 제외)을 새로 변환된 마크다운 내용으로 덮어씀.
   - 필요 시 Frontmatter에 `confluence_page_id` 기입.
   - 성공/실패 `Notice` 출력.

## 4. User Interface (UI)
- **플러그인 설정 화면 (Settings Tab)**:
  - `Confluence Base URL`
  - `Username / Email` (필수, PAT 혹은 Basic Auth 사용 시)
  - `API Token` (안전한 저장을 위해 패스워드 타입 필드 사용 고려)
  - `Default Space Key` (새 페이지를 생성할 때 기본 저장될 스페이스)
- **명령어 (Command Palette)**:
  - `Confluence: Upload Current Note`
  - `Confluence: Download (Override) Current Note`

## 5. Error Handling
- 인증 오류 (401, 403) 발생 시 명확한 에러 메시지와 함께 설정 탭으로 이동할 것을 `Notice`로 안내.
- 변환 실패 시 콘솔에 상세 로그를 남기고, 사용자에게는 `Notice`를 통해 실패했음을 알림.
- 네트워크가 연결되어 있지 않은 오프라인 환경일 경우를 대비해 예외 처리.

## 6. Implementation Plan
추후 `writing-plans` 스킬을 호출하여 단계별 구현 계획을 세울 예정.