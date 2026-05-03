import path from 'path';

export interface ObsidianReadBinaryAdapter {
  readBinary(normalizedPath: string): Promise<ArrayBuffer>;
}

export interface AttachmentUploadApi {
  uploadAttachment(
    pageId: string,
    filename: string,
    fileContent: Buffer,
    contentType?: string,
  ): Promise<unknown>;
}

export interface UploadLocalImagesOptions {
  adapter: ObsidianReadBinaryAdapter;
  contentApi: AttachmentUploadApi;
  pageId: string;
  markdownPath: string;
  imageSources: string[];
}

export interface UploadedLocalImage {
  imageSource: string;
  vaultPath: string;
  filename: string;
}

function normalizeVaultPath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .trim();
}

function decodeVaultPath(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

export function resolveLocalImageVaultPath(markdownPath: string, imageSource: string): string {
  const normalizedSource = decodeVaultPath(normalizeVaultPath(imageSource));

  if (imageSource.startsWith('/')) {
    return normalizedSource;
  }

  if (!markdownPath.includes('/')) {
    return normalizedSource;
  }

  const markdownDir = path.posix.dirname(normalizeVaultPath(markdownPath));
  return normalizeVaultPath(path.posix.join(markdownDir, normalizedSource));
}

export function getImageContentType(filename: string): string {
  const ext = path.posix.extname(filename).toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';

  return 'application/octet-stream';
}

export async function uploadLocalImages(options: UploadLocalImagesOptions): Promise<UploadedLocalImage[]> {
  const uploaded: UploadedLocalImage[] = [];

  for (const imageSource of options.imageSources) {
    if (isExternalImage(imageSource)) {
      continue;
    }

    const vaultPath = resolveLocalImageVaultPath(options.markdownPath, imageSource);
    const filename = path.posix.basename(decodeVaultPath(normalizeVaultPath(imageSource)));

    try {
      const binary = await options.adapter.readBinary(vaultPath);
      const buffer = Buffer.from(binary);
      const contentType = getImageContentType(filename);

      console.log(
        `[tdecollab] 이미지 attachment 업로드: pageId=${options.pageId}, filename=${filename}, vaultPath=${vaultPath}, bytes=${buffer.byteLength}, contentType=${contentType}`,
      );

      await options.contentApi.uploadAttachment(options.pageId, filename, buffer, contentType);
      uploaded.push({ imageSource, vaultPath, filename });
    } catch (error: any) {
      console.error(
        `[tdecollab] 이미지 attachment 업로드 실패: imageSource=${imageSource}, vaultPath=${vaultPath}, error=${error.message}`,
        error,
      );
    }
  }

  return uploaded;
}
