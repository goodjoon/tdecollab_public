import { describe, it, expect, beforeEach } from 'vitest';
import { StorageToMarkdownConverter } from '../storage-to-md.js';

describe('StorageToMarkdownConverter', () => {
    let converter: StorageToMarkdownConverter;

    beforeEach(() => {
        converter = new StorageToMarkdownConverter();
    });

    it('should convert simple HTML to markdown', () => {
        const html = '<h1>Title</h1><p>Hello world</p>';
        const md = converter.convert(html);
        expect(md).toContain('# Title');
        expect(md).toContain('Hello world');
    });

    it('should convert HTML tables to markdown tables', () => {
        const html = `
            <table>
                <thead>
                    <tr><th>Header 1</th><th>Header 2</th></tr>
                </thead>
                <tbody>
                    <tr><td>Cell 1</td><td>Cell 2</td></tr>
                </tbody>
            </table>
        `;
        const md = converter.convert(html);
        expect(md).toContain('| Header 1 | Header 2 |');
        expect(md).toContain('| --- | --- |');
        expect(md).toContain('| Cell 1 | Cell 2 |');
    });

    it('should convert Confluence code macro back to markdown block', () => {
        const html = `
            <ac:structured-macro ac:name="code">
                <ac:parameter ac:name="language">python</ac:parameter>
                <ac:plain-text-body><![CDATA[print("hello")]]></ac:plain-text-body>
            </ac:structured-macro>
        `;
        const md = converter.convert(html);
        expect(md).toContain('```python');
        expect(md).toContain('print("hello")');
        expect(md).toContain('```');
    });

    it('should convert Confluence mermaid macro back to markdown mermaid block', () => {
        const html = `
            <ac:structured-macro ac:name="mermaiddiagram">
                <ac:plain-text-body><![CDATA[graph TD\nA --> B]]></ac:plain-text-body>
            </ac:structured-macro>
        `;
        const md = converter.convert(html);
        expect(md).toContain('```mermaid');
        expect(md).toContain('graph TD');
        expect(md).toContain('A --> B');
        expect(md).toContain('```');
    });
});
