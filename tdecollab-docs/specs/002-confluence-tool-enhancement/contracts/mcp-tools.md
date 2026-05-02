# API Contracts: Confluence MCP Tools (Enhanced)

## 1. confluence_create_page (Updated)

Markdown 콘텐츠를 Confluence 페이지로 생성합니다. (AI 폴백 지원 추가)

### 입력 스키마 업데이트
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `spaceKey` | string | O | 대상 스페이스 키 |
| `title` | string | O | 페이지 제목 |
| `content` | string | O | Markdown 본문 |
| `parentPageId` | string | | 상위 페이지 ID |
| `useAiFallback` | boolean | | 규칙 기반 변환 실패 시 AI를 사용하여 보정할지 여부 (기본: false) |

## 2. confluence_get_page (Updated)

페이지 ID로 Confluence 페이지를 조회합니다. (고도화된 Table 변환 지원)

### 출력 개선
- `content` 필드의 Markdown 변환 결과에서 HTML `<table>` 태그가 사라지고 Markdown `|---|` 표 형식이 제공됨.

## 3. confluence_convert_content (Updated)

Markdown과 Confluence Storage 형식 간 변환합니다. (AI 보정 옵션 추가)

### 입력 스키마 업데이트
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `content` | string | O | 변환할 콘텐츠 |
| `direction` | enum | O | `"md-to-storage"` 또는 `"storage-to-md"` |
| `useAi` | boolean | | AI를 사용하여 지능형 변환을 수행할지 여부 |
