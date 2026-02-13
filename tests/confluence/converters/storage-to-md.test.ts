import { describe, it, expect } from 'vitest';
import { StorageToMarkdownConverter } from '../../../src/confluence/converters/storage-to-md.js';

describe('StorageToMarkdownConverter', () => {
    const converter = new StorageToMarkdownConverter();

    it('should convert HTML headings to markdown', () => {
        const html = '<h1>Title</h1><p>Body</p>';
        const md = converter.convert(html);
        expect(md).toContain('# Title');
        expect(md).toContain('Body');
    });

    it('should convert bold/italic', () => {
        const html = '<p><b>Bold</b> and <i>Italic</i></p>';
        const md = converter.convert(html);
        expect(md).toContain('**Bold**');
        expect(md).toContain('*Italic*');
    });

    it('should convert code macro', () => {
        const html = `<ac:structured-macro ac:name="code">
<ac:parameter ac:name="language">js</ac:parameter>
<ac:plain-text-body><![CDATA[console.log(1)]]></ac:plain-text-body>
</ac:structured-macro>`;

        const md = converter.convert(html);
        expect(md).toContain('```js');
        expect(md).toContain('console.log(1)');
        expect(md).toContain('```');
    });
});
