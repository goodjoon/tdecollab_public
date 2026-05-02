import { describe, expect, it, vi } from 'vitest';
import {
  ObsidianImageDownloader,
  bufferToExactArrayBuffer,
  resolveDocumentFolderPath,
  resolveImageFolderPath,
  toMarkdownRelativePath,
} from '../src/utils/image-download.js';

describe('Obsidian image download utilities', () => {
  it('places the image directory under the current note folder when overwriting', () => {
    const folderPath = resolveDocumentFolderPath({
      saveMode: 'overwrite',
      currentFile: { parent: { path: 'Projects/TDE' } },
      defaultDownloadPath: 'Inbox',
    });

    expect(folderPath).toBe('Projects/TDE');
    expect(resolveImageFolderPath(folderPath, 'assets')).toBe('Projects/TDE/assets');
  });

  it('places the image directory under the configured download folder for new notes', () => {
    const folderPath = resolveDocumentFolderPath({
      saveMode: 'new',
      currentFile: { parent: { path: 'Ignored' } },
      defaultDownloadPath: 'Downloads/Confluence/',
    });

    expect(folderPath).toBe('Downloads/Confluence');
    expect(resolveImageFolderPath(folderPath, 'assets')).toBe('Downloads/Confluence/assets');
  });

  it('uses note-folder-relative markdown links for downloaded images', () => {
    expect(toMarkdownRelativePath('Projects/TDE', 'Projects/TDE/assets/diagram.png')).toBe(
      'assets/diagram.png',
    );
    expect(toMarkdownRelativePath('', 'assets/root.png')).toBe('assets/root.png');
  });

  it('converts Buffer slices to exact ArrayBuffers without losing bytes', () => {
    const source = Buffer.from('xximage-bytesyy');
    const sliced = source.subarray(2, source.length - 2);

    const arrayBuffer = bufferToExactArrayBuffer(sliced);

    expect(arrayBuffer.byteLength).toBe(sliced.byteLength);
    expect(Buffer.from(arrayBuffer).toString('utf8')).toBe('image-bytes');
  });

  it('writes downloaded images through the vault adapter with non-empty binary data', async () => {
    const source = Buffer.from('xximage-bytesyy');
    const sliced = source.subarray(2, source.length - 2);
    const writeBinary = vi.fn().mockResolvedValue(undefined);
    const downloader = new ObsidianImageDownloader(
      {
        getAttachments: vi.fn().mockResolvedValue([
          {
            title: 'diagram.png',
            _links: { download: '/download/attachments/123/diagram.png' },
          },
        ]),
        downloadAttachment: vi.fn().mockResolvedValue(sliced),
      },
      {
        adapter: { writeBinary },
        imageDir: 'Projects/TDE/assets',
        markdownBaseDir: 'Projects/TDE',
        pageId: '123',
        baseUrl: 'https://confluence.example.com',
      },
    );

    const mapping = await downloader.downloadAllImages(
      '<ac:image><ri:attachment ri:filename="diagram.png" /></ac:image>',
    );

    expect(writeBinary).toHaveBeenCalledTimes(1);
    expect(writeBinary).toHaveBeenCalledWith('Projects/TDE/assets/diagram.png', expect.any(ArrayBuffer));
    const written = writeBinary.mock.calls[0][1] as ArrayBuffer;
    expect(written.byteLength).toBe(sliced.byteLength);
    expect(Buffer.from(written).toString('utf8')).toBe('image-bytes');
    expect(mapping.get('diagram.png')).toBe('assets/diagram.png');
  });
});
