import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { JSDOM } from 'jsdom';

export class StorageToMarkdownConverter {
    private turndown: TurndownService;

    constructor() {
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

                if (macroName === 'mermaid' || macroName === 'mermaiddiagram' || macroName === 'capable-mermaid') {
                    let body = element.querySelector('[data-macro-body]')?.textContent || '';
                    // 임시 CDATA 태그 제거
                    body = body.replace(/__CDATA_START__/g, '').replace(/__CDATA_END__/g, '');
                    return `\n\`\`\`mermaid\n${body.trim()}\n\`\`\`\n`;
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
            .replace(/<ac:plain-text-body>/gi, '<div data-macro-body>')
            .replace(/<\/ac:plain-text-body>/gi, '</div>');

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
        return this.turndown.turndown(document.body.innerHTML).trim();
    }
}
