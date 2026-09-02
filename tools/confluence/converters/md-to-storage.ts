import MarkdownIt from 'markdown-it';
import { loadConfluenceConfig } from '../../common/config.js';

// Mermaid 렌더링에 사용하는 Confluence 매크로 이름 (TDE Confluence 기준 고정값)
const MERMAID_MACRO_NAME = 'mermaid-macro';
const DEFAULT_INLINE_CODE_STYLE = 'color: #d04437; font-weight: bold;';
const TASK_ITEM_PATTERN = /^\[([ xX])\]\s+/;
const RAW_HTML_LITERAL_OR_BREAK_PATTERN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<br\s*\/?>/gi;

export interface MarkdownToStorageConverterOptions {
    baseUrl?: string;
    inlineCodeStyle?: string;
}

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

/**
 * raw HTML 줄바꿈 tag를 Confluence Storage XML 형식으로 정규화한다.
 *
 * @param rawHtml markdown-it이 분리한 raw HTML token
 */
function normalizeRawHtmlBreaksForConfluenceStorage(rawHtml: string): string {
    return rawHtml.replace(RAW_HTML_LITERAL_OR_BREAK_PATTERN, (segment) => {
        // comment와 CDATA의 literal은 보존하고 실제 줄바꿈 tag만 정규화한다.
        return /^<br\s*\/?>$/i.test(segment) ? '<br />' : segment;
    });
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

function getTaskMarker(content: string): { checked: boolean; body: string } | null {
    const match = content.match(TASK_ITEM_PATTERN);
    if (!match) {
        return null;
    }

    return {
        checked: match[1].toLowerCase() === 'x',
        body: content.slice(match[0].length),
    };
}

function findMatchingCloseIndex(tokens: any[], openIndex: number): number {
    const openToken = tokens[openIndex];
    let nesting = 1;

    for (let idx = openIndex + 1; idx < tokens.length; idx++) {
        const token = tokens[idx];
        if (token.type === openToken.type) {
            nesting++;
        }
        if (token.type === openToken.type.replace('_open', '_close')) {
            nesting--;
            if (nesting === 0) {
                return idx;
            }
        }
    }

    return openIndex;
}

function annotateTaskListTokens(tokens: any[]): void {
    const listItemStack: number[] = [];

    for (let idx = 0; idx < tokens.length; idx++) {
        const token = tokens[idx];

        if (token.type === 'list_item_open') {
            listItemStack.push(idx);
            continue;
        }

        if (token.type === 'list_item_close') {
            listItemStack.pop();
            continue;
        }

        if (token.type !== 'inline' || listItemStack.length === 0) {
            continue;
        }

        const task = getTaskMarker(token.content);
        if (!task) {
            continue;
        }

        const listItemOpenIndex = listItemStack[listItemStack.length - 1];
        if (tokens[listItemOpenIndex].meta?.task) {
            continue;
        }

        token.content = task.body;
        if (token.children?.[0]?.type === 'text') {
            token.children[0].content = token.children[0].content.replace(TASK_ITEM_PATTERN, '');
        }

        tokens[listItemOpenIndex].meta = {
            ...(tokens[listItemOpenIndex].meta || {}),
            task,
        };

        if (tokens[idx - 1]?.type === 'paragraph_open') {
            tokens[idx - 1].meta = {
                ...(tokens[idx - 1].meta || {}),
                taskBodyParagraph: true,
            };
        }
        if (tokens[idx + 1]?.type === 'paragraph_close') {
            tokens[idx + 1].meta = {
                ...(tokens[idx + 1].meta || {}),
                taskBodyParagraph: true,
            };
        }
    }

    annotateTaskListBoundaries(tokens);
    annotateTaskListCloseTokens(tokens);
}

function annotateTaskListBoundaries(tokens: any[]): void {
    for (let idx = 0; idx < tokens.length; idx++) {
        const token = tokens[idx];
        if (token.type !== 'bullet_list_open') {
            continue;
        }

        const closeIndex = findMatchingCloseIndex(tokens, idx);
        const directItemIndexes: number[] = [];

        for (let cursor = idx + 1; cursor < closeIndex; cursor++) {
            if (tokens[cursor].type === 'list_item_open' && tokens[cursor].level === token.level + 1) {
                directItemIndexes.push(cursor);
            }
        }

        if (directItemIndexes.length === 0) {
            continue;
        }

        const itemKinds = directItemIndexes.map((itemIndex) => !!tokens[itemIndex].meta?.task);
        const firstIsNormal = !itemKinds[0];
        const lastIsNormal = !itemKinds[itemKinds.length - 1];

        token.meta = { ...(token.meta || {}), renderList: firstIsNormal };
        tokens[closeIndex].meta = { ...(tokens[closeIndex].meta || {}), renderList: lastIsNormal };

        directItemIndexes.forEach((itemIndex, itemPosition) => {
            const itemToken = tokens[itemIndex];
            if (!itemToken.meta?.task) {
                return;
            }

            itemToken.meta.taskCloseParentBefore = itemPosition > 0 && !itemKinds[itemPosition - 1];
            itemToken.meta.taskOpenParentAfter =
                itemPosition < itemKinds.length - 1 && !itemKinds[itemPosition + 1];
        });
    }
}

function annotateTaskListCloseTokens(tokens: any[]): void {
    const listItemStack: number[] = [];

    for (let idx = 0; idx < tokens.length; idx++) {
        const token = tokens[idx];

        if (token.type === 'list_item_open') {
            listItemStack.push(idx);
            continue;
        }

        if (token.type !== 'list_item_close') {
            continue;
        }

        const openIndex = listItemStack.pop();
        if (openIndex === undefined || !tokens[openIndex].meta?.task) {
            continue;
        }

        token.meta = {
            ...(token.meta || {}),
            task: tokens[openIndex].meta.task,
            taskOpenParentAfter: tokens[openIndex].meta.taskOpenParentAfter,
        };
    }
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
    private inlineCodeStyle: string;

    constructor(options?: MarkdownToStorageConverterOptions) {
        if (options) {
            this.inlineCodeStyle = options.inlineCodeStyle || DEFAULT_INLINE_CODE_STYLE;
        } else {
            const config = loadConfluenceConfig();
            this.inlineCodeStyle = config.inlineCodeStyle;
        }

        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            breaks: true,
            xhtmlOut: true // Confluence XML 파서와의 호환성을 위해 XHTML 출력 활성화
        });

        this.md.renderer.rules.html_inline = (tokens, idx) => {
            return normalizeRawHtmlBreaksForConfluenceStorage(tokens[idx].content);
        };

        this.md.renderer.rules.html_block = (tokens, idx) => {
            return normalizeRawHtmlBreaksForConfluenceStorage(tokens[idx].content);
        };

        this.md.core.ruler.after('inline', 'confluence_task_list', (state) => {
            annotateTaskListTokens(state.tokens);
        });

        this.md.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
            if (tokens[idx].meta?.renderList === false) {
                return '';
            }
            return self.renderToken(tokens, idx, options);
        };

        this.md.renderer.rules.bullet_list_close = (tokens, idx, options, env, self) => {
            if (tokens[idx].meta?.renderList === false) {
                return '';
            }
            return self.renderToken(tokens, idx, options);
        };

        this.md.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
            const task = tokens[idx].meta?.task;
            if (!task) {
                return self.renderToken(tokens, idx, options);
            }

            const prefix = tokens[idx].meta.taskCloseParentBefore ? '</ul>\n' : '';
            const status = task.checked ? 'complete' : 'incomplete';
            return `${prefix}<ac:task-list><ac:task><ac:task-status>${status}</ac:task-status><ac:task-body>`;
        };

        this.md.renderer.rules.list_item_close = (tokens, idx, options, env, self) => {
            if (!tokens[idx].meta?.task) {
                return self.renderToken(tokens, idx, options);
            }

            const suffix = tokens[idx].meta.taskOpenParentAfter ? '\n<ul>' : '';
            return suffix;
        };

        this.md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
            if (tokens[idx].meta?.taskBodyParagraph) {
                return '';
            }
            return self.renderToken(tokens, idx, options);
        };

        this.md.renderer.rules.paragraph_close = (tokens, idx, options, env, self) => {
            const task = tokens[idx].meta?.taskBodyParagraph;
            if (task) {
                return '</ac:task-body></ac:task></ac:task-list>';
            }
            return self.renderToken(tokens, idx, options);
        };

        // Custom renderer for code blocks
        this.md.renderer.rules.fence = (tokens, idx) => {
            const token = tokens[idx];
            const code = token.content.trim();
            const lang = token.info.trim().toLowerCase();

            // Mermaid 처리 (기존 로직 유지)
            if (lang === 'mermaid') {
                return `<ac:structured-macro ac:name="${MERMAID_MACRO_NAME}" ac:schema-version="1">
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
