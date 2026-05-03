import { describe, it, expect } from 'vitest';
import { MarkdownToStorageConverter } from '../../../tools/confluence/converters/md-to-storage.js';

describe('MarkdownToStorageConverter', () => {
    const converter = new MarkdownToStorageConverter();

    it('should convert basic markdown to HTML', () => {
        const md = '# Hello\n\nWorld';
        const html = converter.convert(md);
        expect(html).toContain('<h1>Hello</h1>');
        expect(html).toContain('<p>World</p>');
    });

    it('should convert code block to Code Macro', () => {
        const md = '```typescript\nconst a = 1;\n```';
        const html = converter.convert(md);

        expect(html).toContain('<ac:structured-macro ac:name="code"');
        expect(html).toContain('<ac:parameter ac:name="language">typescript</ac:parameter>');
        expect(html).toContain('<![CDATA[const a = 1;]]>');
    });

    it('should decode URL-encoded local image filenames for Confluence attachments', () => {
        const html = converter.convert('![diagram](assets/%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%9D%B4%EB%AF%B8%EC%A7%80001.svg)');

        expect(html).toContain('ri:filename="테스트이미지001.svg"');
    });

    it('should restore Confluence image dimensions from markdown image title', () => {
        const html = converter.convert('![diagram](assets/diagram.png "width=320 height=180")');

        expect(html).toContain('<ac:image ac:alt="diagram" ac:width="320" ac:height="180">');
        expect(html).toContain('ri:filename="diagram.png"');
    });

    it('should strip Obsidian YAML frontmatter before converting to Confluence storage', () => {
        const md = [
            '---',
            'confluence_page_id: 1028470454',
            'tags:',
            '  - confluence',
            '---',
            '# tdecollab CLI 사용 가이드',
            '',
            '본문입니다.',
        ].join('\n');

        const html = converter.convert(md);

        expect(html).not.toContain('confluence_page_id');
        expect(html).not.toContain('<hr');
        expect(html).toContain('<h1>tdecollab CLI 사용 가이드</h1>');
        expect(html).toContain('<p>본문입니다.</p>');
    });

    it('should strip previously leaked confluence page id artifacts at the document start', () => {
        const md = [
            '---',
            '',
            '## confluence\\_page\\_id: 1028470454',
            '',
            '# tdecollab CLI 사용 가이드',
        ].join('\n');

        const html = converter.convert(md);

        expect(html).not.toContain('confluence');
        expect(html).not.toContain('<hr');
        expect(html).toContain('<h1>tdecollab CLI 사용 가이드</h1>');
    });

    it('should keep normal horizontal rules that are not frontmatter', () => {
        const html = converter.convert('# Title\n\n---\n\nBody');

        expect(html).toContain('<h1>Title</h1>');
        expect(html).toContain('<hr');
        expect(html).toContain('<p>Body</p>');
    });
});
