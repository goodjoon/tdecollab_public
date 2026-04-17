import MarkdownIt from 'markdown-it';
import { loadConfluenceConfig } from '../../common/config.js';

export class MarkdownToStorageConverter {
    private md: MarkdownIt;
    private mermaidMacroName: string;

    constructor() {
        const config = loadConfluenceConfig();
        this.mermaidMacroName = config.mermaidMacroName;

        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            breaks: true,
            xhtmlOut: true // Confluence XML 파서와의 호환성을 위해 XHTML 출력 활성화
        });

        // Custom renderer for code blocks
        this.md.renderer.rules.fence = (tokens, idx) => {
            const token = tokens[idx];
            const code = token.content.trim();
            const lang = token.info.trim().toLowerCase();

            // Mermaid 처리
            if (lang === 'mermaid') {
                return `<ac:structured-macro ac:name="${this.mermaidMacroName}" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
            }

            // 일반 코드 블록
            return `<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">${lang || 'text'}</ac:parameter>
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
        };

        // Task List 처리 (markdown-it 플러그인 없이 수동 처리 예시 - 실제로는 플러그인 도입 권장)
    }

    convert(markdown: string): string {
        return this.md.render(markdown);
    }
}
