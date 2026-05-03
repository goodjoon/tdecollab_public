import MarkdownIt from 'markdown-it';
import { loadConfluenceConfig } from '../../common/config.js';

function decodeLocalImagePath(value: string): string {
    try {
        return decodeURI(value);
    } catch {
        return value;
    }
}

function escapeXmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseImageDimensionTitle(title: string | null): string {
    if (!title) {
        return '';
    }

    const width = title.match(/\bwidth=(\d+)\b/i)?.[1];
    const height = title.match(/\bheight=(\d+)\b/i)?.[1];
    const attrs = [
        width ? ` ac:width="${escapeXmlAttribute(width)}"` : '',
        height ? ` ac:height="${escapeXmlAttribute(height)}"` : '',
    ];

    return attrs.join('');
}

export function stripMarkdownFrontmatter(markdown: string): string {
    const frontmatterMatch = markdown.match(/^---[ \t]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
    if (!frontmatterMatch) {
        return markdown;
    }

    return markdown.slice(frontmatterMatch[0].length).replace(/^\r?\n/, '');
}

export function stripLeakedConfluencePageIdArtifacts(markdown: string): string {
    let prepared = markdown;
    const leakedPageIdPattern =
        /^(?:[ \t]*\r?\n)*(?:---|\*\*\*)[ \t]*\r?\n+(?:[ \t]*\r?\n)*#{1,6}[ \t]+confluence\\?_page\\?_id:[ \t]*\d+[ \t]*\r?\n+/i;

    while (leakedPageIdPattern.test(prepared)) {
        prepared = prepared.replace(leakedPageIdPattern, '').replace(/^\r?\n/, '');
    }

    return prepared;
}

export function prepareMarkdownForConfluenceStorage(markdown: string): string {
    const withoutLeadingArtifacts = stripLeakedConfluencePageIdArtifacts(markdown);
    const withoutFrontmatter = stripMarkdownFrontmatter(withoutLeadingArtifacts);
    return stripLeakedConfluencePageIdArtifacts(withoutFrontmatter);
}

export class MarkdownToStorageConverter {
    private md: MarkdownIt;
    private mermaidMacroName: string;
    private inlineCodeStyle: string;

    constructor() {
        const config = loadConfluenceConfig();
        this.mermaidMacroName = config.mermaidMacroName;
        this.inlineCodeStyle = config.inlineCodeStyle;

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

            // Mermaid 처리 (기존 로직 유지)
            if (lang === 'mermaid') {
                return `<ac:structured-macro ac:name="${this.mermaidMacroName}" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
            }

            // PlantUML 처리 → plantuml 매크로로 변환
            if (lang === 'plantuml') {
                return `<ac:structured-macro ac:name="plantuml" ac:schema-version="1">
  <ac:parameter ac:name="atlassian-macro-output-type">INLINE</ac:parameter>
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
            }

            // 일반 코드 블록
            return `<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">${lang || 'text'}</ac:parameter>
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
        };

        // Custom renderer for images
        this.md.renderer.rules.image = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const src = token.attrGet('src') || '';
            const alt = token.content || '';
            const dimensionAttrs = parseImageDimensionTitle(token.attrGet('title'));

            // Handle URL vs Local file
            const isExternal = src.startsWith('http://') || src.startsWith('https://');

            // 외부 URL이면 URL 매크로, 아니면 첨부파일 매크로
            const altAttr = alt ? ` ac:alt="${escapeXmlAttribute(alt)}"` : '';
            if (isExternal) {
                return `<ac:image${altAttr}${dimensionAttrs}><ri:url ri:value="${escapeXmlAttribute(src)}" /></ac:image>`;
            } else {
                // filename can just be the basename of the src path
                const decodedSrc = decodeLocalImagePath(src);
                const filename = decodedSrc.split('/').pop() || decodedSrc;
                return `<ac:image${altAttr}${dimensionAttrs}><ri:attachment ri:filename="${escapeXmlAttribute(filename)}" /></ac:image>`;
            }
        };

        // Custom renderer for inline code
        this.md.renderer.rules.code_inline = (tokens, idx) => {
            const token = tokens[idx];
            const content = this.md.utils.escapeHtml(token.content);
            return `<code style="${this.inlineCodeStyle}">${content}</code>`;
        };

        // Task List 처리 (markdown-it 플러그인 없이 수동 처리 예시 - 실제로는 플러그인 도입 권장)
    }

    convert(markdown: string): string {
        return this.md.render(prepareMarkdownForConfluenceStorage(markdown));
    }

    extractLocalImages(markdown: string): string[] {
        const tokens = this.md.parse(prepareMarkdownForConfluenceStorage(markdown), {});
        const localImages = new Set<string>();

        const walk = (tokens: any[]) => {
            for (const token of tokens) {
                if (token.type === 'image') {
                    const src = token.attrGet('src') || '';
                    if (!src.startsWith('http://') && !src.startsWith('https://')) {
                        localImages.add(src);
                    }
                }
                if (token.children) {
                    walk(token.children);
                }
            }
        };

        walk(tokens);
        return Array.from(localImages);
    }
}
