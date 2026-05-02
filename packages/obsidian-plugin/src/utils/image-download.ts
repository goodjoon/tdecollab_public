import path from 'path';
import { ImageDownloader, type ImageReference } from '../../../../tools/confluence/utils/image-downloader.js';
import type { ConfluenceContentApi } from '../../../../tools/confluence/api/content.js';

export type DownloadSaveMode = 'overwrite' | 'new';

export interface DocumentFolderOptions {
  saveMode: DownloadSaveMode;
  currentFile?: { parent: { path: string } | null } | null;
  defaultDownloadPath?: string;
}

export interface ObsidianBinaryAdapter {
  writeBinary(normalizedPath: string, data: ArrayBuffer): Promise<void>;
}

export interface ObsidianImageDownloaderOptions {
  adapter: ObsidianBinaryAdapter;
  imageDir: string;
  markdownBaseDir: string;
  pageId: string;
  baseUrl: string;
}

function normalizeVaultPath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .trim();
}

function joinVaultPath(...parts: string[]): string {
  return normalizeVaultPath(parts.filter(Boolean).join('/'));
}

export function resolveDocumentFolderPath(options: DocumentFolderOptions): string {
  if (options.saveMode === 'overwrite' && options.currentFile?.parent) {
    return normalizeVaultPath(options.currentFile.parent.path);
  }

  return normalizeVaultPath(options.defaultDownloadPath || '');
}

export function resolveImageFolderPath(documentFolderPath: string, imageDir: string): string {
  return joinVaultPath(documentFolderPath, imageDir || 'assets');
}

export function toMarkdownRelativePath(markdownBaseDir: string, imageVaultPath: string): string {
  const normalizedBase = normalizeVaultPath(markdownBaseDir);
  const normalizedImagePath = normalizeVaultPath(imageVaultPath);

  if (!normalizedBase) {
    return normalizedImagePath;
  }

  return path.posix.relative(normalizedBase, normalizedImagePath) || path.posix.basename(normalizedImagePath);
}

export function bufferToExactArrayBuffer(data: Buffer | ArrayBuffer | ArrayBufferView): ArrayBuffer {
  const view =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : ArrayBuffer.isView(data)
        ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        : new Uint8Array(Buffer.from(data));

  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class ObsidianImageDownloader {
  private referenceExtractor: ImageDownloader;

  constructor(
    private api: ConfluenceContentApi,
    private options: ObsidianImageDownloaderOptions,
  ) {
    this.referenceExtractor = new ImageDownloader(api, {
      outputDir: '',
      pageId: options.pageId,
      baseUrl: options.baseUrl,
    });
  }

  extractImageReferences(html: string): ImageReference[] {
    return this.referenceExtractor.extractImageReferences(html);
  }

  async downloadImage(ref: ImageReference): Promise<{ key: string; markdownPath: string } | null> {
    try {
      let buffer: Buffer;
      let filename: string;

      if (ref.type === 'attachment' && ref.filename) {
        const attachments = await this.api.getAttachments(this.options.pageId, ref.filename);
        const attachment = attachments[0];

        if (!attachment) {
          console.warn(`[tdecollab] 첨부 이미지를 찾을 수 없습니다: ${ref.filename}`);
          return null;
        }

        const downloadUrl = attachment._links.download;
        const fullUrl = downloadUrl.startsWith('http')
          ? downloadUrl
          : `${this.options.baseUrl}${downloadUrl}`;

        buffer = await this.api.downloadAttachment(fullUrl);
        filename = ref.filename;
      } else if (ref.type === 'url' && ref.url) {
        const urlPath = new URL(ref.url).pathname;
        filename = path.posix.basename(urlPath) || 'image.png';
        buffer = await this.api.downloadAttachment(ref.url);
      } else {
        console.warn(`[tdecollab] 잘못된 이미지 참조입니다: ${JSON.stringify(ref)}`);
        return null;
      }

      const outputPath = joinVaultPath(this.options.imageDir, sanitizeFilename(filename));
      const arrayBuffer = bufferToExactArrayBuffer(buffer);

      console.log(
        `[tdecollab] 이미지 저장: ${outputPath}, bytes=${arrayBuffer.byteLength}, source=${filename}`,
      );

      await this.options.adapter.writeBinary(outputPath, arrayBuffer);

      const markdownPath = toMarkdownRelativePath(this.options.markdownBaseDir, outputPath);
      const key = ref.type === 'attachment' ? ref.filename : ref.url || ref.originalTag;
      return { key: key!, markdownPath };
    } catch (error: any) {
      console.error(`[tdecollab] 이미지 다운로드 실패: ${error.message}`, error);
      return null;
    }
  }

  async downloadAllImages(html: string): Promise<Map<string, string>> {
    const references = this.extractImageReferences(html);
    const mapping = new Map<string, string>();

    console.log(`[tdecollab] 다운로드 대상 이미지: ${references.length}개`);

    for (const ref of references) {
      const result = await this.downloadImage(ref);
      if (result) {
        mapping.set(result.key, result.markdownPath);
      }
    }

    console.log(`[tdecollab] 이미지 다운로드 완료: ${mapping.size}/${references.length}개`);
    return mapping;
  }
}
