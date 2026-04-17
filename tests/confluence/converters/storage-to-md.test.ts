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
        // turndown-plugin-gfm은 <i>를 _ 또는 *로 변환하므로 양쪽 허용
        expect(md).toMatch(/[*_]Italic[*_]/);
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
            // alt text는 파일명으로 설정됨 (Confluence storage에 alt text 없음)
            expect(md).toContain('![test.png](test.png)');
        });

        it('should convert ac:image with URL to markdown', () => {
            const html = '<ac:image><ri:url ri:value="https://example.com/image.png" /></ac:image>';
            const md = converter.convert(html);
            // URL 이미지: src=URL, alt=URL (Confluence storage 스펙)
            expect(md).toContain('(https://example.com/image.png)');
        });

        it('should convert img tag to markdown', () => {
            const html = '<img src="https://example.com/photo.jpg" alt="My Photo" />';
            const md = converter.convert(html);
            expect(md).toContain('![My Photo](https://example.com/photo.jpg)');
        });

        it('should convert img tag without alt to markdown', () => {
            const html = '<img src="https://example.com/photo.jpg" />';
            const md = converter.convert(html);
            // alt 없는 img: turndown은 빈 alt로 변환
            expect(md).toContain('(https://example.com/photo.jpg)');
        });

        it('should use imageUrlMap when provided', () => {
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';
            const imageUrlMap = new Map<string, string>();
            // imageUrlMap key는 filename 기반
            imageUrlMap.set('test.png', './images/test.png');

            const md = converter.convert(html, imageUrlMap);
            expect(md).toContain('./images/test.png');
        });

        it('should handle multiple images with imageUrlMap', () => {
            const html = `
                <ac:image><ri:attachment ri:filename="image1.png" /></ac:image>
                <p>Some text</p>
                <ac:image><ri:attachment ri:filename="image2.jpg" /></ac:image>
            `;
            const imageUrlMap = new Map<string, string>();
            imageUrlMap.set('image1.png', './images/image1.png');
            imageUrlMap.set('image2.jpg', './images/image2.jpg');

            const md = converter.convert(html, imageUrlMap);
            expect(md).toContain('./images/image1.png');
            expect(md).toContain('./images/image2.jpg');
        });

        it('should fallback to original format when imageUrlMap is not provided', () => {
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';
            const md = converter.convert(html);
            // imageUrlMap 없을 때: filename을 src로 사용
            expect(md).toContain('test.png');
        });
    });
});
