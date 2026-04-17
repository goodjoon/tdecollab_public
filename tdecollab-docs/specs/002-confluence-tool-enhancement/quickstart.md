# Quickstart: Confluence Tool Enhancement Testing

## 1. 테스트 환경 설정

### 1.1 환경 변수 (.env) 확인
프로젝트 루트의 `.env` 파일에 다음 설정이 포함되어 있는지 확인하십시오.
```env
CONFLUENCE_BASE_URL=https://confluence.tde.sktelecom.com
CONFLUENCE_EMAIL=사번@sktelecom.com
CONFLUENCE_API_TOKEN=your-token
# AI 폴백을 위해 필요한 경우 (선택)
OPENAI_API_KEY=sk-...
```

### 1.2 의존성 설치
```bash
pnpm install
```

## 2. CLI를 통한 업로드 테스트

### 2.1 로컬 문서를 서브페이지로 생성
`tdecollab-docs/` 내의 Mermaid와 표가 포함된 문서를 지정된 부모 페이지(`951466645`) 하위에 생성합니다.

```bash
pnpm cli confluence page create \
  --space "~1111812" \
  --title "Confluence 고도화 테스트 - $(date +%Y%m%d)" \
  --parent "951466645" \
  --file "tdecollab-docs/specs/001-agentic-prd-harness/plan.md"
```

## 3. MCP 도구를 통한 연동 테스트

Claude Desktop 등의 MCP 클라이언트에서 다음 프롬프트를 사용하여 테스트를 수행하십시오.

> "951466645 하위에 Mermaid와 표가 포함된 문서를 하나 만들어줘. 제목은 'MCP 연동 테스트'로 해줘. tdecollab-docs/specs/001-agentic-prd-harness/spec.md 파일의 내용을 참고해서 만들어주면 좋겠어."

## 4. 검증 방법
- 생성된 Confluence 페이지로 접속하여 Mermaid 다이어그램이 정상 렌더링되는지 확인합니다.
- 페이지의 표가 깨지거나 HTML 태그가 그대로 노출되지 않는지 확인합니다.
- `pnpm cli confluence page get <생성된_ID>` 명령을 실행하여, 반환되는 Markdown에 표 형식이 `|---|`로 잘 변환되어 있는지 확인합니다.
