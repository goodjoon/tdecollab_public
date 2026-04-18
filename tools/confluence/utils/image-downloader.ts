import fs from 'fs';
import path from 'path';
import { ConfluenceContentApi } from '../api/content.js';
import { logger } from '../../common/logger.js';

export interface ImageDownloadOptions {
    outputDir: string; // 이미지 저장 디렉토리
    pageId: string; // 페이지 ID
    baseUrl: string; // Confluence base URL
}

export interface ImageReference {
    type: 'attachment' | 'url';
    filename?: string; // attachment인 경우
    url?: string; // URL인 경우
    originalTag: string; // 원본 태그
    altText?: string; // 대체 텍스트
}

export class ImageDownloader {
    constructor(
        private api: ConfluenceContentApi,
        private options: ImageDownloadOptions,
    ) { }

    // Storage HTML에서 이미지 참조 추출
    extractImageReferences(html: string): ImageReference[] {
        const references: ImageReference[] = [];

        // 1. ac:image 태그에서 attachment 추출
        // <ac:image><ri:attachment ri:filename="image.png" /></ac:image>
        const attachmentRegex =
            /<ac:image[^>]*>[\s\S]*?<ri:attachment\s+ri:filename="([^"]+)"[\s\S]*?<\/ac:image>/g;
        let match;
        while ((match = attachmentRegex.exec(html)) !== null) {
            references.push({
                type: 'attachment',
                filename: match[1],
                originalTag: match[0],
            });
        }

        // 2. ac:image 태그에서 URL 추출
        // <ac:image><ri:url ri:value="https://example.com/image.png" /></ac:image>
        const urlInAcImageRegex =
            /<ac:image[^>]*>[\s\S]*?<ri:url\s+ri:value="([^"]+)"[\s\S]*?<\/ac:image>/g;
        while ((match = urlInAcImageRegex.exec(html)) !== null) {
            references.push({
                type: 'url',
                url: match[1],
                originalTag: match[0],
            });
        }

        // 3. 일반 img 태그
        // <img src="https://example.com/image.png" alt="description" />
        const imgRegex = /<img\s+[^>]*\/?>/g;
        while ((match = imgRegex.exec(html)) !== null) {
            const imgTag = match[0];
            // src 추출
            const srcMatch = /src="([^"]+)"/.exec(imgTag);
            // alt 추출
            const altMatch = /alt="([^"]*)"/.exec(imgTag);

            if (srcMatch) {
                references.push({
                    type: 'url',
                    url: srcMatch[1],
                    originalTag: imgTag,
                    altText: altMatch ? altMatch[1] : '',
                });
            }
        }

        return references;
    }

    // 파일명 sanitize (특수문자 제거)
    private sanitizeFilename(filename: string): string {
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    // 파일명 중복 처리
    private getUniqueFilename(dir: string, filename: string): string {
        const sanitized = this.sanitizeFilename(filename);
        const ext = path.extname(sanitized);
        const base = path.basename(sanitized, ext);

        let counter = 1;
        let uniqueName = sanitized;

        while (fs.existsSync(path.join(dir, uniqueName))) {
            uniqueName = `${base}_${counter}${ext}`;
            counter++;
        }

        return uniqueName;
    }

    // 이미지 다운로드 및 로컬 경로 반환
    async downloadImage(ref: ImageReference): Promise<string | null> {
        try {
            let buffer: Buffer;
            let filename: string;

            if (ref.type === 'attachment' && ref.filename) {
                // Confluence attachment 다운로드
                logger.info(`Downloading attachment: ${ref.filename}`);
                const attachments = await this.api.getAttachments(this.options.pageId, ref.filename);

                if (attachments.length === 0) {
                    logger.warn(`Attachment not found: ${ref.filename}`);
                    return null;
                }

                const attachment = attachments[0];
                const downloadUrl = attachment._links.download;

                // download URL이 상대 경로인 경우 base URL 추가
                const fullUrl = downloadUrl.startsWith('http')
                    ? downloadUrl
                    : `${this.options.baseUrl}${downloadUrl}`;

                buffer = await this.api.downloadAttachment(fullUrl);
                filename = ref.filename;
            } else if (ref.type === 'url' && ref.url) {
                // 외부 URL 이미지 다운로드
                logger.info(`Downloading image from URL: ${ref.url}`);

                // URL에서 파일명 추출
                const urlPath = new URL(ref.url).pathname;
                filename = path.basename(urlPath) || 'image.png';

                // axios를 사용하여 다운로드 (api client 재사용)
                buffer = await this.api.downloadAttachment(ref.url);
            } else {
                logger.warn(`Invalid image reference: ${JSON.stringify(ref)}`);
                return null;
            }

            // 출력 디렉토리 생성
            if (!fs.existsSync(this.options.outputDir)) {
                fs.mkdirSync(this.options.outputDir, { recursive: true });
            }

            // 파일명 정리 (중복 시 덮어쓰기)
            const sanitized = this.sanitizeFilename(filename);
            const outputPath = path.join(this.options.outputDir, sanitized);

            // 파일 저장
            fs.writeFileSync(outputPath, buffer);
            logger.info(`Image saved: ${outputPath}`);

            return outputPath;
        } catch (error: any) {
            logger.error(`Failed to download image: ${error.message}`);
            return null;
        }
    }

    // 모든 이미지 다운로드 및 매핑 반환 (원본 태그 -> 로컬 경로)
    async downloadAllImages(html: string): Promise<Map<string, string>> {
        const references = this.extractImageReferences(html);
        const mapping = new Map<string, string>();

        logger.info(`Found ${references.length} image(s) to download`);

        for (const ref of references) {
            const localPath = await this.downloadImage(ref);
            if (localPath) {
                const key = ref.type === 'attachment' ? ref.filename : (ref.url || ref.originalTag);
                mapping.set(key!, localPath);
            }
        }

        logger.info(`Successfully downloaded ${mapping.size} image(s)`);
        return mapping;
    }
}
