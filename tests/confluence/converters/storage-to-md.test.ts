import { describe, it, expect } from 'vitest';
import { StorageToMarkdownConverter } from '../../../tools/confluence/converters/storage-to-md.js';

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

    describe('Image conversion', () => {
        it('should convert ac:image with attachment to markdown', () => {
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';
            const md = converter.convert(html);
            expect(md).toContain('![test.png](attachment:test.png)');
        });

        it('should convert ac:image with URL to markdown', () => {
            const html = '<ac:image><ri:url ri:value="https://example.com/image.png" /></ac:image>';
            const md = converter.convert(html);
            expect(md).toContain('![image.png](https://example.com/image.png)');
        });

        it('should convert img tag to markdown', () => {
            const html = '<img src="https://example.com/photo.jpg" alt="My Photo" />';
            const md = converter.convert(html);
            expect(md).toContain('![My Photo](https://example.com/photo.jpg)');
        });

        it('should convert img tag without alt to markdown', () => {
            const html = '<img src="https://example.com/photo.jpg" />';
            const md = converter.convert(html);
            expect(md).toContain('![photo.jpg](https://example.com/photo.jpg)');
        });

        it('should use imageUrlMap when provided', () => {
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';
            const imageUrlMap = new Map<string, string>();
            imageUrlMap.set('<ac:image><ri:attachment ri:filename="test.png" /></ac:image>', './images/test.png');

            const md = converter.convert(html, imageUrlMap);
            expect(md).toContain('![test](./images/test.png)');
            expect(md).not.toContain('attachment:');
        });

        it('should handle multiple images with imageUrlMap', () => {
            const html = `
                <ac:image><ri:attachment ri:filename="image1.png" /></ac:image>
                <p>Some text</p>
                <ac:image><ri:attachment ri:filename="image2.jpg" /></ac:image>
            `;
            const imageUrlMap = new Map<string, string>();
            imageUrlMap.set('<ac:image><ri:attachment ri:filename="image1.png" /></ac:image>', './images/image1.png');
            imageUrlMap.set('<ac:image><ri:attachment ri:filename="image2.jpg" /></ac:image>', './images/image2.jpg');

            const md = converter.convert(html, imageUrlMap);
            expect(md).toContain('![image1](./images/image1.png)');
            expect(md).toContain('![image2](./images/image2.jpg)');
        });

        it('should fallback to original format when imageUrlMap is not provided', () => {
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';
            const md = converter.convert(html);
            expect(md).toContain('attachment:test.png');
        });
    });
});
