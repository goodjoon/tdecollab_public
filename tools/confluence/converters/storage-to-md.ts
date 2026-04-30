import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { JSDOM } from 'jsdom';

export interface StorageToMarkdownOptions {
    /** JIRA 티켓 링크 생성에 사용할 베이스 URL (예: https://jira.example.com). 미설정 시 JIRA_BASE_URL 환경변수 사용. */
    jiraBaseUrl?: string;
}

export class StorageToMarkdownConverter {
    private turndown: TurndownService;
    private jiraBaseUrl: string;

    constructor(options: StorageToMarkdownOptions = {}) {
        this.jiraBaseUrl = options.jiraBaseUrl || process.env.JIRA_BASE_URL || '';
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

                if (macroName === 'jira') {
                    const key = element.querySelector('[data-macro-param-name="key"]')?.textContent?.trim();
                    if (key) {
                        const base = this.jiraBaseUrl.replace(/\/$/, '');
                        const url = base ? `${base}/browse/${key}` : `https://jira.atlassian.com/browse/${key}`;
                        return ` [${key}](${url}) `;
                    }
                    return '';
                }

                return `\n<!-- Macro: ${macroName} -->\n`;
            }
        });
    }

    convert(storageHtml: string, imageUrlMap?: Map<string, string>): string {
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
            .replace(/<ac:image([^>]*)>[\s\S]*?<ri:attachment\s+ri:filename="([^"]*)"\s*\/?>[\s\S]*?<\/ac:image>/gi, (match, attrs, filename) => {
                const altMatch = attrs.match(/ac:alt="([^"]*)"/i);
                const alt = altMatch ? altMatch[1] : filename;
                return `<img src="${filename}" alt="${alt}" />`;
            })
            .replace(/<ac:image([^>]*)>[\s\S]*?<ri:url\s+ri:value="([^"]*)"\s*\/?>[\s\S]*?<\/ac:image>/gi, (match, attrs, url) => {
                const altMatch = attrs.match(/ac:alt="([^"]*)"/i);
                const alt = altMatch ? altMatch[1] : '';
                return `<img src="${url}" alt="${alt}" />`;
            });

        // 2. JSDOM 파싱
        const dom = new JSDOM(processedHtml);
        const document = dom.window.document;

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

        return markdown + '\n';
    }
}
