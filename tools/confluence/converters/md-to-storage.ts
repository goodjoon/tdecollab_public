import MarkdownIt from 'markdown-it';

export class MarkdownToStorageConverter {
    private md: MarkdownIt;

    constructor() {
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            breaks: true
        });

        // Custom renderer for code blocks to Confluence Code Macro
        this.md.renderer.rules.fence = (tokens, idx) => {
            const token = tokens[idx];
            const code = token.content.trim();
            const lang = token.info.trim();

            return `<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">${lang || 'text'}</ac:parameter>
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
        };
    }

    convert(markdown: string): string {
        return this.md.render(markdown);
    }
}
