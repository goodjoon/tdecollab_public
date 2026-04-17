import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkdownToStorageConverter } from '../md-to-storage.js';

// mock config
vi.mock('../../common/config.js', () => ({
    loadConfluenceConfig: () => ({
        mermaidMacroName: 'mermaiddiagram'
    })
}));

describe('MarkdownToStorageConverter', () => {
    let converter: MarkdownToStorageConverter;

    beforeEach(() => {
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
        // 매크로 이름은 config에 따라 다름 (mock: mermaiddiagram, 기본값: mermaid-macro)
        expect(storage).toMatch(/ac:name="mermaid(diagram|-macro|)"/);
        expect(storage).not.toContain('ac:name="language"');
        expect(storage).toContain('graph TD');
        expect(storage).toContain('A --> B');
    });
});
