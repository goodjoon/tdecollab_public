import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { createRequire } from 'node:module';

export interface JiraIssueInfo {
    summary: string;
    status: string;
}

export interface StorageToMarkdownOptions {
    /** JIRA 티켓 링크 생성에 사용할 베이스 URL (예: https://jira.example.com). 미설정 시 JIRA_BASE_URL 환경변수 사용. */
    jiraBaseUrl?: string;
}

function parseHtmlDocument(html: string): Document {
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
        const parser = new window.DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    const requireBase = process.argv[1] || `${process.cwd()}/package.json`;
    const nodeRequire = createRequire(requireBase);
    const { JSDOM } = nodeRequire('jsdom') as typeof import('jsdom');
    return new JSDOM(html).window.document;
}

function getXmlAttribute(attrs: string, name: string): string | undefined {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return attrs.match(new RegExp(`(?:^|\\s)${escapedName}="([^"]*)"`, 'i'))?.[1];
}

function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeMarkdownImageText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
}

function escapeMarkdownImageDestination(value: string): string {
    return value.replace(/\)/g, '\\)');
}

function buildImageDimensionAttributes(attrs: string): string {
    const width = getXmlAttribute(attrs, 'ac:width') || getXmlAttribute(attrs, 'width');
    const height = getXmlAttribute(attrs, 'ac:height') || getXmlAttribute(attrs, 'height');
    return [
        width ? ` width="${escapeHtmlAttribute(width)}"` : '',
        height ? ` height="${escapeHtmlAttribute(height)}"` : '',
    ].join('');
}

export class StorageToMarkdownConverter {
    private turndown: TurndownService;
    private jiraBaseUrl: string;
    private jiraIssueMap: Map<string, JiraIssueInfo> | undefined;

    constructor(options: StorageToMarkdownOptions = {}) {
        this.jiraBaseUrl = options.jiraBaseUrl || process.env.JIRA_BASE_URL || '';
        this.jiraIssueMap = undefined;
        this.turndown = new TurndownService({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced'
        });

        this.turndown.use(gfm);
        this.setupRules();
    }

    private setupRules() {
        this.turndown.addRule('imagesWithDimensions', {
            filter: (node) => {
                if (node.nodeName.toLowerCase() !== 'img') return false;
                const element = node as HTMLElement;
                return element.hasAttribute('width') || element.hasAttribute('height');
            },
            replacement: (_content, node) => {
                const element = node as HTMLElement;
                const src = element.getAttribute('src') || '';
                const alt = element.getAttribute('alt') || '';
                const width = element.getAttribute('width');
                const height = element.getAttribute('height');
                const title = [
                    width ? `width=${width}` : '',
                    height ? `height=${height}` : '',
                ].filter(Boolean).join(' ');

                return `![${escapeMarkdownImageText(alt)}](${escapeMarkdownImageDestination(src)} "${title}")`;
            }
        });

        this.turndown.addRule('lists', {
            filter: (node) => {
                const nodeName = node.nodeName.toLowerCase();
                if (nodeName !== 'ul' && nodeName !== 'ol') return false;
                return Array.from((node as HTMLElement).children).some(child => {
                    return child.nodeName.toLowerCase() === 'li'
                        && this.getExplicitListItemDepth(child as HTMLElement) !== undefined;
                });
            },
            replacement: (_content, node) => {
                return this.renderList(node as HTMLElement, 0);
            }
        });

        // Table 변환 규칙 강화 (정렬 정보 보존)
        this.turndown.addRule('tables', {
            filter: ['table'],
            replacement: (content, node) => {
                const element = node as HTMLTableElement;
                const rows = Array.from(element.rows);
                if (rows.length === 0) return '';

                let mdTable = '\n\n';

                rows.forEach((row, index) => {
                    const cells = Array.from(row.cells);
                    const cellContents = cells.map(cell => {
                        // 셀 내부의 개행은 공백으로 치환하여 테이블 깨짐 방지
                        return this.turndown.turndown(cell.innerHTML).replace(/\n/g, ' ').trim();
                    });

                    mdTable += `| ${cellContents.join(' | ')} |\n`;

                    // 헤더 행 구분선 (정렬 정보 포함)
                    if (index === 0) {
                        const separators = cells.map(cell => {
                            const style = (cell as HTMLElement).getAttribute('style') || '';
                            const align = style.match(/text-align:\s*(\w+)/i)?.[1]?.toLowerCase();
                            if (align === 'center') return ':---:';
                            if (align === 'right') return '---:';
                            if (align === 'left') return ':---';
                            return '---';
                        });
                        mdTable += `| ${separators.join(' | ')} |\n`;
                    }
                });

                return mdTable + '\n';
            }
        });

        // Confluence 매크로 (변환된 div 태그) 처리
        this.turndown.addRule('confluenceMacro', {
            filter: (node) => {
                return node.nodeName === 'DIV' && node.getAttribute('data-macro-name-tag') !== null;
            },
            replacement: (content, node) => {
                const element = node as HTMLElement;
                const macroName = element.getAttribute('data-macro-name');

                if (macroName === 'code') {
                    const lang = element.querySelector('[data-macro-param-name="language"]')?.textContent || 'text';
                    let body = element.querySelector('[data-macro-body]')?.textContent || '';
                    // 임시 CDATA 태그 제거
                    body = body.replace(/__CDATA_START__/g, '').replace(/__CDATA_END__/g, '');
                    return `\n\`\`\`${lang}\n${body.trim()}\n\`\`\`\n`;
                }

                if (macroName === 'mermaid' || macroName === 'mermaiddiagram' || macroName === 'capable-mermaid' || macroName === 'mermaid-macro') {
                    let body = element.querySelector('[data-macro-body]')?.textContent || '';
                    // 임시 CDATA 태그 제거
                    body = body.replace(/__CDATA_START__/g, '').replace(/__CDATA_END__/g, '');
                    return `\n\`\`\`mermaid\n${body.trim()}\n\`\`\`\n`;
                }

                if (macroName === 'plantuml') {
                    let body = element.querySelector('[data-macro-body]')?.textContent || '';
                    body = body.replace(/__CDATA_START__/g, '').replace(/__CDATA_END__/g, '');
                    return `\n\`\`\`plantuml\n${body.trim()}\n\`\`\`\n`;
                }

                if (macroName === 'expand') {
                    const title = element.querySelector('[data-macro-param-name="title"]')?.textContent?.trim() || '더보기';
                    const richBody = element.querySelector('[data-macro-rich-body]');
                    const bodyMd = richBody
                        ? this.turndown.turndown(richBody.innerHTML).trim()
                        : '';
                    return `\n\n<details>\n<summary>${title}</summary>\n\n${bodyMd}\n\n</details>\n\n`;
                }

                if (macroName === 'jira') {
                    const key = element.querySelector('[data-macro-param-name="key"]')?.textContent?.trim();
                    if (key) {
                        const base = this.jiraBaseUrl.replace(/\/$/, '');
                        const url = base ? `${base}/browse/${key}` : `https://jira.atlassian.com/browse/${key}`;
                        const info = this.jiraIssueMap?.get(key);
                        if (info) {
                            return ` [${key}](${url}) ${info.summary} \`${info.status}\` `;
                        }
                        return ` [${key}](${url}) `;
                    }
                    return '';
                }

                return `\n<!-- Macro: ${macroName} -->\n`;
            }
        });
    }

    private renderList(listElement: HTMLElement, depth: number): string {
        const isOrdered = listElement.nodeName.toLowerCase() === 'ol';
        const start = Number(listElement.getAttribute('start') || '1');
        let orderedIndex = Number.isFinite(start) && start > 0 ? start : 1;

        const renderedItems = Array.from(listElement.children)
            .filter((child): child is HTMLElement => child.nodeName.toLowerCase() === 'li')
            .map((item) => {
                const itemDepth = this.getListItemDepth(item, depth);
                const marker = isOrdered ? `${orderedIndex++}.` : '-';
                const indent = '    '.repeat(itemDepth);
                const content = this.renderListItemContent(item);
                const firstLine = `${indent}${marker}${content ? ` ${content.split('\n')[0]}` : ''}`;
                const remainingLines = content
                    .split('\n')
                    .slice(1)
                    .filter(line => line.trim().length > 0)
                    .map(line => `${indent}  ${line}`)
                    .join('\n');

                const nestedLists = Array.from(item.children)
                    .filter((child): child is HTMLElement => {
                        const nodeName = child.nodeName.toLowerCase();
                        return nodeName === 'ul' || nodeName === 'ol';
                    })
                    .map(child => this.renderList(child, itemDepth + 1).trim())
                    .filter(Boolean)
                    .join('\n');

                return [firstLine, remainingLines, nestedLists].filter(Boolean).join('\n');
            })
            .filter(Boolean);

        return `\n\n${renderedItems.join('\n')}\n\n`;
    }

    private renderListItemContent(item: HTMLElement): string {
        const clone = item.cloneNode(true) as HTMLElement;

        clone.querySelectorAll('ul, ol').forEach(child => child.remove());

        return this.turndown
            .turndown(clone.innerHTML)
            .replace(/\n{2,}/g, '\n')
            .trim();
    }

    private getListItemDepth(item: HTMLElement, fallbackDepth: number): number {
        return this.getExplicitListItemDepth(item) ?? fallbackDepth;
    }

    private getExplicitListItemDepth(item: HTMLElement): number | undefined {
        const explicitDepth = item.getAttribute('data-indent-level')
            || item.getAttribute('data-indent')
            || item.getAttribute('data-level');

        if (explicitDepth !== null) {
            const parsedDepth = Number(explicitDepth);
            if (Number.isFinite(parsedDepth) && parsedDepth >= 0) {
                return parsedDepth;
            }
        }

        const className = item.getAttribute('class') || '';
        const classDepth = className.match(/(?:^|\s)(?:ql-indent|indent)-(\d+)(?:\s|$)/)?.[1];
        if (classDepth) {
            const parsedDepth = Number(classDepth);
            if (Number.isFinite(parsedDepth) && parsedDepth >= 0) {
                return parsedDepth;
            }
        }

        const style = item.getAttribute('style') || '';
        const marginLeftPx = style.match(/margin-left:\s*(\d+(?:\.\d+)?)px/i)?.[1];
        if (marginLeftPx) {
            const parsedPx = Number(marginLeftPx);
            if (Number.isFinite(parsedPx) && parsedPx > 0) {
                return Math.max(0, Math.round(parsedPx / 40));
            }
        }

        return undefined;
    }

    private normalizeMalformedConfluenceLists(document: Document): void {
        let changed = true;

        while (changed) {
            changed = false;
            const lists = Array.from(document.querySelectorAll('ul, ol'));

            for (const list of lists) {
                const childLists = Array.from(list.children).filter((child): child is HTMLElement => {
                    const nodeName = child.nodeName.toLowerCase();
                    return nodeName === 'ul' || nodeName === 'ol';
                });

                for (const childList of childLists) {
                    const previous = childList.previousElementSibling;
                    if (previous?.nodeName.toLowerCase() === 'li') {
                        previous.appendChild(childList);
                        changed = true;
                    }
                }
            }
        }
    }

    convert(storageHtml: string, imageUrlMap?: Map<string, string>, jiraIssueMap?: Map<string, JiraIssueInfo>): string {
        this.jiraIssueMap = jiraIssueMap;
        if (!storageHtml) return '';

        // 1. Confluence 전용 태그를 표준 HTML 태그로 치환 (JSDOM 호환성)
        // CDATA 섹션을 텍스트로 보존하기 위해 임시 치환
        let processedHtml = storageHtml
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, (match, p1) => {
                return `__CDATA_START__${p1}__CDATA_END__`;
            })
            .replace(/<ac:structured-macro\s+ac:name="([^"]*)"/gi, '<div data-macro-name-tag data-macro-name="$1"')
            .replace(/<\/ac:structured-macro>/gi, '</div>')
            .replace(/<ac:parameter\s+ac:name="([^"]*)"/gi, '<div data-macro-param-tag data-macro-param-name="$1"')
            .replace(/<\/ac:parameter>/gi, '</div>')
            .replace(/<ac:plain-text-body>/gi, '<pre data-macro-body>')
            .replace(/<\/ac:plain-text-body>/gi, '</pre>')
            .replace(/<ac:rich-text-body>/gi, '<div data-macro-rich-body>')
            .replace(/<\/ac:rich-text-body>/gi, '</div>')
            .replace(/<ac:image([^>]*)>[\s\S]*?<ri:attachment\s+ri:filename="([^"]*)"\s*\/?>[\s\S]*?<\/ac:image>/gi, (match, attrs, filename) => {
                const altMatch = attrs.match(/ac:alt="([^"]*)"/i);
                const alt = altMatch ? altMatch[1] : filename;
                const dimensions = buildImageDimensionAttributes(attrs);
                return `<img src="${escapeHtmlAttribute(filename)}" alt="${escapeHtmlAttribute(alt)}"${dimensions} />`;
            })
            .replace(/<ac:image([^>]*)>[\s\S]*?<ri:url\s+ri:value="([^"]*)"\s*\/?>[\s\S]*?<\/ac:image>/gi, (match, attrs, url) => {
                const altMatch = attrs.match(/ac:alt="([^"]*)"/i);
                const alt = altMatch ? altMatch[1] : '';
                const dimensions = buildImageDimensionAttributes(attrs);
                return `<img src="${escapeHtmlAttribute(url)}" alt="${escapeHtmlAttribute(alt)}"${dimensions} />`;
            });

        // 2. DOM 파싱 (Browser/Node 분기)
        const document = parseHtmlDocument(processedHtml);

        this.normalizeMalformedConfluenceLists(document);

        // 이미지 처리
        if (imageUrlMap && imageUrlMap.size > 0) {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                if (src && imageUrlMap.has(src)) {
                    img.setAttribute('src', imageUrlMap.get(src)!);
                }
            });
        }

        // 3. Turndown 변환
        let markdown = this.turndown.turndown(document.body.innerHTML).trim();

        // 4. 헤딩 내 숫자 뒤 점 이스케이프 제거 (예: `## 1\.` → `## 1.`)
        markdown = markdown.replace(/^(#{1,6}\s.*?)\\\./gm, '$1.');

        this.jiraIssueMap = undefined;
        return markdown + '\n';
    }
}
