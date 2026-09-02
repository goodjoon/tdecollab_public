import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownToStorageConverter } from '../md-to-storage.js';

describe('MarkdownToStorageConverter', () => {
    let converter: MarkdownToStorageConverter;

    beforeEach(() => {
        vi.stubEnv('CONFLUENCE_BASE_URL', 'https://confluence.example.com');
        vi.stubEnv('CONFLUENCE_API_TOKEN', 'test-token');
        converter = new MarkdownToStorageConverter();
    });

    it('should convert standard markdown to HTML', () => {
        const md = '# Hello\nWorld';
        const storage = converter.convert(md);
        expect(storage).toContain('<h1>Hello</h1>');
        expect(storage).toContain('<p>World</p>');
    });

    it('should convert code blocks to Confluence code macro', () => {
        const md = '```typescript\nconst x = 1;\n```';
        const storage = converter.convert(md);
        expect(storage).toContain('ac:name="code"');
        expect(storage).toContain('ac:name="language">typescript');
        expect(storage).toContain('CDATA[const x = 1;]]>');
    });

    it('should convert mermaid blocks to Confluence mermaid macro', () => {
        const md = '```mermaid\ngraph TD\nA --> B\n```';
        const storage = converter.convert(md);
        // 매크로 이름은 TDE Confluence 기준 'mermaid-macro'로 고정한다.
        expect(storage).toContain('ac:name="mermaid-macro"');
        expect(storage).not.toContain('ac:name="language"');
        expect(storage).toContain('graph TD');
        expect(storage).toContain('A --> B');
    });

    it('should convert markdown task list markers to Confluence task list storage', () => {
        const storage = converter.convert(['- [ ] 할 일', '- [x] 완료'].join('\n'));

        expect(storage).toContain('<ac:task-list>');
        expect(storage).toContain('<ac:task-status>incomplete</ac:task-status>');
        expect(storage).toContain('<ac:task-body>할 일</ac:task-body>');
        expect(storage).toContain('<ac:task-status>complete</ac:task-status>');
        expect(storage).toContain('<ac:task-body>완료</ac:task-body>');
        expect(storage).not.toContain('[ ]');
        expect(storage).not.toContain('[x]');
    });

    it('should keep normal bullets when markdown task items are mixed with regular list items', () => {
        const storage = converter.convert(['- 일반 항목', '- [ ] 체크 항목', '- 다음 항목'].join('\n'));

        expect(storage).toContain('<li>일반 항목</li>');
        expect(storage).toContain('<ac:task-body>체크 항목</ac:task-body>');
        expect(storage).toContain('<li>다음 항목</li>');
        expect(storage).not.toContain('<li>[ ] 체크 항목</li>');
    });

    it('should close task body before rendering nested bullet items under a markdown task', () => {
        const storage = converter.convert(
            ['- 일반 항목', '- [x] 체크 항목', '  - 하위 항목', '- 다음 항목'].join('\n'),
        );

        expect(storage).toContain('<ac:task-body>체크 항목</ac:task-body></ac:task></ac:task-list>');
        expect(storage).toContain('<li>하위 항목</li>');
        expect(storage).toContain('<li>다음 항목</li>');
        expect(storage).not.toContain('<ac:task-body>체크 항목\n<ul>');
    });

    it('Markdown image title의 width/height를 Confluence image 속성으로 복원한다', () => {
        const storage = converter.convert('![diagram](assets/diagram.png "width=320 height=180")');

        expect(storage).toContain('<ac:image ac:alt="diagram" ac:width="320" ac:height="180">');
        expect(storage).toContain('ri:filename="diagram.png"');
    });

    it('should not require environment config when converter options are provided', () => {
        vi.unstubAllEnvs();

        const optionConverter = new MarkdownToStorageConverter({
            baseUrl: 'https://confluence.example.com',
        });
        const storage = optionConverter.convert('```mermaid\ngraph TD\nA --> B\n```');

        expect(storage).toContain('ac:name="mermaid-macro"');
    });

    it('should strip Obsidian YAML frontmatter before converting to Confluence storage', () => {
        const md = [
            '---',
            'confluence_page_id: 1028470454',
            '---',
            '# tdecollab CLI 사용 가이드',
        ].join('\n');

        const storage = converter.convert(md);

        expect(storage).not.toContain('confluence_page_id');
        expect(storage).not.toContain('<hr');
        expect(storage).toContain('<h1>tdecollab CLI 사용 가이드</h1>');
    });

    it('should strip leaked page id artifacts while preserving normal horizontal rules', () => {
        const leaked = [
            '---',
            '',
            '## confluence\\_page\\_id: 1028470454',
            '',
            '# Title',
            '',
            '---',
            '',
            'Body',
        ].join('\n');

        const storage = converter.convert(leaked);

        expect(storage).not.toContain('confluence');
        expect(storage).toContain('<h1>Title</h1>');
        expect(storage).toContain('<hr');
        expect(storage).toContain('<p>Body</p>');
    });

    it('raw HTML 줄바꿈 태그를 Confluence XHTML self-closing tag로 정규화한다', () => {
        const markdown = ['| 값 |', '|---|', '| 첫째<br>둘째<BR>셋째<br/>넷째<br />다섯째 |'].join('\n');

        const storage = converter.convert(markdown);

        expect(storage).toContain('<td>첫째<br />둘째<br />셋째<br />넷째<br />다섯째</td>');
        expect(storage).not.toContain('<br>');
        expect(storage).not.toContain('<BR>');
    });

    it('block raw HTML 줄바꿈 태그도 XHTML self-closing tag로 정규화한다', () => {
        const storage = converter.convert(['앞', '', '<br>', '', '뒤'].join('\n'));

        expect(storage).toContain('<p>앞</p>\n<br />\n<p>뒤</p>');
    });

    it('code context의 literal br tag는 정규화하지 않는다', () => {
        const markdown = ['`<br>`', '', '```html', '<br>', '```'].join('\n');

        const storage = converter.convert(markdown);

        expect(storage).toContain('&lt;br&gt;');
        expect(storage).toContain('<![CDATA[<br>]]>');
    });

    it('raw HTML token 내부의 CDATA와 comment literal br는 정규화하지 않는다', () => {
        const markdown = ['<![CDATA[<br>]]>', '', '<!-- literal <br> -->'].join('\n');

        const storage = converter.convert(markdown);

        expect(storage).toContain('<![CDATA[<br>]]>');
        expect(storage).toContain('<!-- literal <br> -->');
    });

    it('comment와 CDATA 사이의 실제 raw HTML br tag만 XHTML 형식으로 정규화한다', () => {
        const markdown = '<div><!-- literal <br> --><br><![CDATA[<br>]]><BR></div>';

        const storage = converter.convert(markdown);

        expect(storage).toBe('<div><!-- literal <br> --><br /><![CDATA[<br>]]><br /></div>');
    });
});
