import { describe, expect, it, vi } from 'vitest';
import {
  ObsidianImageDownloader,
  bufferToExactArrayBuffer,
  createRequestUrlBinaryDownloader,
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

  it('uses an injected Obsidian binary downloader instead of the shared axios attachment downloader', async () => {
    const writeBinary = vi.fn().mockResolvedValue(undefined);
    const downloadAttachment = vi.fn().mockResolvedValue(Buffer.alloc(0));
    const downloadBinary = vi.fn().mockResolvedValue(Buffer.from('<svg>ok</svg>'));
    const downloader = new ObsidianImageDownloader(
      {
        getAttachments: vi.fn().mockResolvedValue([
          {
            title: 'diagram.svg',
            _links: { download: '/download/attachments/123/diagram.svg' },
          },
        ]),
        downloadAttachment,
      },
      {
        adapter: { writeBinary },
        imageDir: 'Projects/TDE/assets',
        markdownBaseDir: 'Projects/TDE',
        pageId: '123',
        baseUrl: 'https://confluence.example.com',
        downloadBinary,
      },
    );

    await downloader.downloadAllImages(
      '<ac:image><ri:attachment ri:filename="diagram.svg" /></ac:image>',
    );

    expect(downloadBinary).toHaveBeenCalledWith(
      'https://confluence.example.com/download/attachments/123/diagram.svg',
    );
    expect(downloadAttachment).not.toHaveBeenCalled();
    const written = writeBinary.mock.calls[0][1] as ArrayBuffer;
    expect(Buffer.from(written).toString('utf8')).toBe('<svg>ok</svg>');
  });

  it('normalizes attachment download URLs without a double slash after the host', async () => {
    const writeBinary = vi.fn().mockResolvedValue(undefined);
    const downloadBinary = vi.fn().mockResolvedValue(Buffer.from('<svg>ok</svg>'));
    const downloader = new ObsidianImageDownloader(
      {
        getAttachments: vi.fn().mockResolvedValue([
          {
            title: 'diagram.svg',
            _links: {
              download:
                '/download/attachments/1012333590/lvmf.arch.draw.v2-01.svg?version=1&api=v2',
            },
          },
        ]),
        downloadAttachment: vi.fn(),
      },
      {
        adapter: { writeBinary },
        imageDir: 'files/download/assets',
        markdownBaseDir: 'files/download',
        pageId: '1012333590',
        baseUrl: 'https://confluence.tde.sktelecom.com/',
        downloadBinary,
      },
    );

    await downloader.downloadAllImages(
      '<ac:image><ri:attachment ri:filename="diagram.svg" /></ac:image>',
    );

    expect(downloadBinary).toHaveBeenCalledWith(
      'https://confluence.tde.sktelecom.com/download/attachments/1012333590/lvmf.arch.draw.v2-01.svg?version=1&api=v2',
    );
  });

  it('does not write an image when the downloaded binary payload is empty', async () => {
    const writeBinary = vi.fn().mockResolvedValue(undefined);
    const downloader = new ObsidianImageDownloader(
      {
        getAttachments: vi.fn().mockResolvedValue([
          {
            title: 'empty.svg',
            _links: { download: '/download/attachments/123/empty.svg' },
          },
        ]),
        downloadAttachment: vi.fn(),
      },
      {
        adapter: { writeBinary },
        imageDir: 'Projects/TDE/assets',
        markdownBaseDir: 'Projects/TDE',
        pageId: '123',
        baseUrl: 'https://confluence.example.com',
        downloadBinary: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      },
    );

    const mapping = await downloader.downloadAllImages(
      '<ac:image><ri:attachment ri:filename="empty.svg" /></ac:image>',
    );

    expect(writeBinary).not.toHaveBeenCalled();
    expect(mapping.size).toBe(0);
  });

  it('creates a requestUrl based downloader with auth headers and exact binary bytes', async () => {
    const requestUrl = vi.fn().mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/svg+xml' },
      arrayBuffer: bufferToExactArrayBuffer(Buffer.from('<svg>ok</svg>')),
    });
    const downloadBinary = createRequestUrlBinaryDownloader(requestUrl, {
      Authorization: 'Bearer token',
    });

    const binary = await downloadBinary('https://confluence.example.com/download/file.svg');

    expect(requestUrl).toHaveBeenCalledWith({
      url: 'https://confluence.example.com/download/file.svg',
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
      throw: true,
    });
    expect(binary.byteLength).toBe(13);
    expect(Buffer.from(binary).toString('utf8')).toBe('<svg>ok</svg>');
  });
});
