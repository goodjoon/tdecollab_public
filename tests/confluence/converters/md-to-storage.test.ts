import { describe, it, expect } from 'vitest';
import { MarkdownToStorageConverter } from '../../../src/confluence/converters/md-to-storage.js';

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
});
