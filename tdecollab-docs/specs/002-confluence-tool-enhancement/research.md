# Research: Confluence Tool Enhancement (Advanced MD Conversion)

## 1. Mermaid Macro Storage Format (Server/DC)

### 1.1 기본 XML 구조
Confluence Server 및 Data Center에서 가장 널리 사용되는 Mermaid 앱(weweave 등)의 표준 저장 형식은 다음과 같습니다.

```xml
<ac:structured-macro ac:name="mermaiddiagram" ac:schema-version="1">
  <ac:plain-text-body>
    <![CDATA[
graph TD
    A[Start] --> B{Process}
    B --> C[End]
    ]]>
  </ac:plain-text-body>
</ac:structured-macro>
```

### 1.2 가변적인 매크로 이름 (ac:name)
설치된 앱에 따라 매크로 이름이 다를 수 있습니다:
- `mermaiddiagram` (weweave - 가장 일반적)
- `mermaid` (다른 앱)
- `capable-mermaid` (Capable 앱)

**Decision**: 환경 변수나 설정을 통해 `MERMAID_MACRO_NAME`을 지정할 수 있도록 하고, 기본값은 `mermaiddiagram`으로 설정합니다.

---

## 2. HTML to Markdown 변환 (Table 지원)

### 2.1 TurndownService 도입
기존의 정규표현식 기반 변환은 중첩된 태그나 복잡한 표(Table) 구조에서 실패할 확률이 매우 높습니다. `turndown` 라이브러리를 사용하여 안정적인 변환을 수행합니다.

**기술 스택**:
- `turndown`: HTML to Markdown 변환 코어.
- `turndown-plugin-gfm`: GitHub Flavored Markdown(Table, TaskList 등) 지원 플러그인.
- `jsdom`: Node.js 환경에서 HTML 파싱을 위한 DOM 시뮬레이션.

### 2.2 Table 변환 전략
- `turndown-plugin-gfm`의 `tables` 규칙을 활성화합니다.
- Confluence 특유의 `ac:structured-macro` 태그는 `turndown`의 `keep` 또는 커스텀 rule을 통해 별도로 처리(예: 코드 블록, 이미지)한 후 나머지 일반 HTML 요소만 `turndown`으로 변환합니다.

---

## 3. AI 기반 지능형 폴백 (AI Refiner)

### 3.1 목적
규칙 기반 변환기가 해결하지 못하는 복잡한 케이스(예: 깨진 Markdown, 복잡한 셀 병합이 포함된 HTML 표 등)를 보정합니다.

### 3.2 프롬프트 설계 (초안)
- **Role**: 전문적인 기술 문서 변환 전문가.
- **Task**: 입력된 텍스트(HTML 또는 Markdown)를 대상 형식(Confluence Storage XML 또는 Clean Markdown)으로 변환하라.
- **Constraints**: 
  - 원래의 의미와 데이터를 100% 보존할 것.
  - Confluence 매크로 문법을 정확히 준수할 것.
  - 추가적인 설명 없이 변환된 결과물만 반환할 것.

### 3.3 인터페이스
`AIConversionService` 클래스를 정의하고, OpenAI/Anthropic SDK를 연동합니다. 환경 변수 `OPENAI_API_KEY` 등이 설정되어 있을 때만 활성화됩니다.

---

## 4. 테스트 환경 구축

### 4.1 부모 페이지 정보
- URL: `https://confluence.tde.example.com/spaces/~1234567/pages/951466645/`
- Space Key: `~1234567`
- Parent Page ID: `951466645`

### 4.2 테스트 시나리오
1. **CLI 테스트**: `tdecollab confluence page create --parent 951466645 --file test-doc.md` 실행 후 생성 결과 확인.
2. **MCP 테스트**: Claude를 통해 "951466645 하위에 Mermaid와 표가 포함된 문서를 생성해줘"라고 요청하여 도구 호출 확인.
3. **역변환 테스트**: 생성된 페이지를 다시 `get` 하여 Markdown 표가 원본과 일치하는지 확인.
