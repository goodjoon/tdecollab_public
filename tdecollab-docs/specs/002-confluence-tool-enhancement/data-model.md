# Data Model: Confluence Tool Enhancement (AI Conversion)

## 1. AI 변환 요청 (AI Conversion Request)

AI 에이전트(LLM)에게 변환을 요청할 때 사용하는 데이터 구조입니다.

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `sourceContent` | `string` | O | 변환할 원본 데이터 (HTML 또는 Markdown) |
| `sourceType` | `enum` | O | 원본 형식 (`"markdown"`, `"storage-xml"`) |
| `targetType` | `enum` | O | 대상 형식 (`"markdown"`, `"storage-xml"`) |
| `context` | `string` | X | 변환 시 참고할 추가 컨텍스트 (예: "Mermaid 앱 이름은 'mermaiddiagram'입니다") |

## 2. AI 변환 응답 (AI Conversion Response)

AI 에이전트(LLM)로부터 받은 변환 결과 데이터 구조입니다.

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `convertedContent` | `string` | 변환이 완료된 데이터 |
| `confidence` | `number` | 변환 결과에 대한 신뢰도 (0.0 ~ 1.0) |
| `warnings` | `string[]` | 변환 중 발생한 경고나 특이사항 |

## 3. 설정 (Configuration)

변환기 동작을 제어하기 위한 설정 모델입니다.

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|------|------|
| `mermaidMacroName` | `string` | `"mermaiddiagram"` | Confluence에 설치된 Mermaid 매크로의 이름 |
| `aiFallbackEnabled` | `boolean` | `false` | 규칙 기반 변환 실패 시 AI 사용 여부 |
| `aiProvider` | `enum` | `"openai"` | 사용할 AI 모델 공급자 (`"openai"`, `"anthropic"`) |
| `aiModel` | `string` | `"gpt-4o"` | 사용할 AI 모델 이름 |
