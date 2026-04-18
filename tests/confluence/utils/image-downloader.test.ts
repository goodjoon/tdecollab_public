import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ImageDownloader } from '../../../tools/confluence/utils/image-downloader.js';
import { ConfluenceContentApi } from '../../../tools/confluence/api/content.js';

describe('ImageDownloader', () => {
    const mockApi = {
        getAttachments: vi.fn(),
        downloadAttachment: vi.fn(),
    } as unknown as ConfluenceContentApi;

    const testOutputDir = './test-images';
    const options = {
        outputDir: testOutputDir,
        pageId: '123',
        baseUrl: 'https://confluence.example.com',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // 테스트 디렉토리가 있으면 삭제
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true });
        }
    });

    afterEach(() => {
        // 테스트 후 정리
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true });
        }
    });

    describe('extractImageReferences', () => {
        it('should extract attachment images', () => {
            const downloader = new ImageDownloader(mockApi, options);
            const html = '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>';

            const refs = downloader.extractImageReferences(html);

            expect(refs).toHaveLength(1);
            expect(refs[0].type).toBe('attachment');
            expect(refs[0].filename).toBe('test.png');
        });

        it('should extract URL images from ac:image', () => {
            const downloader = new ImageDownloader(mockApi, options);
            const html = '<ac:image><ri:url ri:value="https://example.com/image.png" /></ac:image>';

            const refs = downloader.extractImageReferences(html);

            expect(refs).toHaveLength(1);
            expect(refs[0].type).toBe('url');
            expect(refs[0].url).toBe('https://example.com/image.png');
        });

        it('should extract img tags', () => {
            const downloader = new ImageDownloader(mockApi, options);
            const html = '<img src="https://example.com/photo.jpg" alt="My Photo" />';

            const refs = downloader.extractImageReferences(html);

            expect(refs).toHaveLength(1);
            expect(refs[0].type).toBe('url');
            expect(refs[0].url).toBe('https://example.com/photo.jpg');
            expect(refs[0].altText).toBe('My Photo');
        });

        it('should extract multiple images', () => {
            const downloader = new ImageDownloader(mockApi, options);
            const html = `
                <ac:image><ri:attachment ri:filename="image1.png" /></ac:image>
                <p>Text</p>
                <ac:image><ri:url ri:value="https://example.com/image2.png" /></ac:image>
                <img src="https://example.com/image3.jpg" />
            `;

            const refs = downloader.extractImageReferences(html);

            expect(refs).toHaveLength(3);
            expect(refs[0].type).toBe('attachment');
            expect(refs[1].type).toBe('url');
            expect(refs[2].type).toBe('url');
        });
    });

    describe('downloadImage', () => {
        it('should download attachment image', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('fake-image-data');

            (mockApi.getAttachments as any).mockResolvedValue([
                {
                    id: 'att1',
                    title: 'test.png',
                    _links: { download: '/download/attachments/123/test.png' }
                }
            ]);
            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const ref = {
                type: 'attachment' as const,
                filename: 'test.png',
                originalTag: '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeTruthy();
            expect(localPath).toContain('test.png');
            expect(fs.existsSync(localPath!)).toBe(true);
            expect(fs.readFileSync(localPath!).toString()).toBe('fake-image-data');
        });

        it('should download URL image', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('url-image-data');

            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const ref = {
                type: 'url' as const,
                url: 'https://example.com/image.png',
                originalTag: '<img src="https://example.com/image.png" />'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeTruthy();
            expect(localPath).toContain('image.png');
            expect(fs.existsSync(localPath!)).toBe(true);
        });

        it('should handle attachment not found', async () => {
            const downloader = new ImageDownloader(mockApi, options);

            (mockApi.getAttachments as any).mockResolvedValue([]);

            const ref = {
                type: 'attachment' as const,
                filename: 'missing.png',
                originalTag: '<ac:image><ri:attachment ri:filename="missing.png" /></ac:image>'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeNull();
        });

        it('should handle download error', async () => {
            const downloader = new ImageDownloader(mockApi, options);

            (mockApi.getAttachments as any).mockResolvedValue([
                {
                    id: 'att1',
                    title: 'test.png',
                    _links: { download: '/download/attachments/123/test.png' }
                }
            ]);
            (mockApi.downloadAttachment as any).mockRejectedValue(new Error('Network error'));

            const ref = {
                type: 'attachment' as const,
                filename: 'test.png',
                originalTag: '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeNull();
        });

        it('should handle filename collision', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('image-data');

            // 첫 번째 파일 생성
            fs.mkdirSync(testOutputDir, { recursive: true });
            fs.writeFileSync(path.join(testOutputDir, 'test.png'), 'existing');

            (mockApi.getAttachments as any).mockResolvedValue([
                {
                    id: 'att1',
                    title: 'test.png',
                    _links: { download: '/download/attachments/123/test.png' }
                }
            ]);
            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const ref = {
                type: 'attachment' as const,
                filename: 'test.png',
                originalTag: '<ac:image><ri:attachment ri:filename="test.png" /></ac:image>'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeTruthy();
            expect(localPath).toContain('test_1.png'); // 중복 처리
            expect(fs.existsSync(localPath!)).toBe(true);
        });

        it('should sanitize special characters in filename', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('image-data');

            (mockApi.getAttachments as any).mockResolvedValue([
                {
                    id: 'att1',
                    title: 'test file (1).png',
                    _links: { download: '/download/attachments/123/test%20file%20(1).png' }
                }
            ]);
            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const ref = {
                type: 'attachment' as const,
                filename: 'test file (1).png',
                originalTag: '<ac:image><ri:attachment ri:filename="test file (1).png" /></ac:image>'
            };

            const localPath = await downloader.downloadImage(ref);

            expect(localPath).toBeTruthy();
            // 특수문자가 _로 변환되어야 함
            expect(path.basename(localPath!)).toMatch(/test_file/);
        });
    });

    describe('downloadAllImages', () => {
        it('should download all images and return mapping', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('image-data');

            (mockApi.getAttachments as any).mockResolvedValue([
                {
                    id: 'att1',
                    title: 'image1.png',
                    _links: { download: '/download/attachments/123/image1.png' }
                }
            ]);
            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const html = `
                <ac:image><ri:attachment ri:filename="image1.png" /></ac:image>
                <img src="https://example.com/image2.jpg" />
            `;

            const mapping = await downloader.downloadAllImages(html);

            expect(mapping.size).toBe(2);
            expect(Array.from(mapping.keys())).toContain('<ac:image><ri:attachment ri:filename="image1.png" /></ac:image>');
        });

        it('should handle partial failures', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const mockBuffer = Buffer.from('image-data');

            // 첫 번째는 성공, 두 번째는 실패
            (mockApi.getAttachments as any)
                .mockResolvedValueOnce([
                    {
                        id: 'att1',
                        title: 'image1.png',
                        _links: { download: '/download/attachments/123/image1.png' }
                    }
                ])
                .mockResolvedValueOnce([]); // 두 번째는 attachment 없음

            (mockApi.downloadAttachment as any).mockResolvedValue(mockBuffer);

            const html = `
                <ac:image><ri:attachment ri:filename="image1.png" /></ac:image>
                <ac:image><ri:attachment ri:filename="missing.png" /></ac:image>
            `;

            const mapping = await downloader.downloadAllImages(html);

            expect(mapping.size).toBe(1); // 성공한 것만 포함
        });

        it('should return empty map when no images found', async () => {
            const downloader = new ImageDownloader(mockApi, options);
            const html = '<p>No images here</p>';

            const mapping = await downloader.downloadAllImages(html);

            expect(mapping.size).toBe(0);
        });
    });
});
