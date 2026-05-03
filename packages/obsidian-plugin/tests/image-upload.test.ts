import { describe, expect, it, vi } from 'vitest';
import {
  getImageContentType,
  resolveLocalImageVaultPath,
  uploadLocalImages,
} from '../src/utils/image-upload.js';

describe('Obsidian image upload utilities', () => {
  it('resolves local image paths relative to the current note folder', () => {
    expect(resolveLocalImageVaultPath('files/download/page.md', 'assets/diagram.svg')).toBe(
      'files/download/assets/diagram.svg',
    );
    expect(resolveLocalImageVaultPath('page.md', 'assets/root.png')).toBe('assets/root.png');
    expect(resolveLocalImageVaultPath('files/page.md', '/shared/image.png')).toBe('shared/image.png');
  });

  it('decodes URL-encoded local image paths before reading from the vault', async () => {
    const readBinary = vi.fn().mockResolvedValue(Buffer.from('<svg>ok</svg>'));
    const uploadAttachment = vi.fn().mockResolvedValue({ id: 'att1' });

    const uploaded = await uploadLocalImages({
      adapter: { readBinary },
      contentApi: { uploadAttachment },
      pageId: '1012333590',
      markdownPath: 'files/download/lvmf.arch.design.v2.md',
      imageSources: ['assets/%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%9D%B4%EB%AF%B8%EC%A7%80001.svg'],
    });

    expect(readBinary).toHaveBeenCalledWith('files/download/assets/테스트이미지001.svg');
    expect(uploadAttachment).toHaveBeenCalledWith(
      '1012333590',
      '테스트이미지001.svg',
      Buffer.from('<svg>ok</svg>'),
      'image/svg+xml',
    );
    expect(uploaded[0].filename).toBe('테스트이미지001.svg');
  });

  it('detects common image content types', () => {
    expect(getImageContentType('diagram.svg')).toBe('image/svg+xml');
    expect(getImageContentType('photo.JPG')).toBe('image/jpeg');
    expect(getImageContentType('image.png')).toBe('image/png');
    expect(getImageContentType('unknown.bin')).toBe('application/octet-stream');
  });

  it('reads local image files from the vault and uploads them as Confluence attachments', async () => {
    const readBinary = vi.fn().mockResolvedValue(Buffer.from('<svg>ok</svg>'));
    const uploadAttachment = vi.fn().mockResolvedValue({ id: 'att1' });

    const uploaded = await uploadLocalImages({
      adapter: { readBinary },
      contentApi: { uploadAttachment },
      pageId: '1012333590',
      markdownPath: 'files/download/lvmf.arch.design.v2.md',
      imageSources: ['assets/lvmf.arch.draw.v2-01.svg'],
    });

    expect(readBinary).toHaveBeenCalledWith('files/download/assets/lvmf.arch.draw.v2-01.svg');
    expect(uploadAttachment).toHaveBeenCalledWith(
      '1012333590',
      'lvmf.arch.draw.v2-01.svg',
      Buffer.from('<svg>ok</svg>'),
      'image/svg+xml',
    );
    expect(uploaded).toEqual([
      {
        filename: 'lvmf.arch.draw.v2-01.svg',
        imageSource: 'assets/lvmf.arch.draw.v2-01.svg',
        vaultPath: 'files/download/assets/lvmf.arch.draw.v2-01.svg',
      },
    ]);
  });

  it('skips external image URLs', async () => {
    const readBinary = vi.fn();
    const uploadAttachment = vi.fn();

    const uploaded = await uploadLocalImages({
      adapter: { readBinary },
      contentApi: { uploadAttachment },
      pageId: '1012333590',
      markdownPath: 'files/download/page.md',
      imageSources: ['https://example.com/image.png'],
    });

    expect(readBinary).not.toHaveBeenCalled();
    expect(uploadAttachment).not.toHaveBeenCalled();
    expect(uploaded).toEqual([]);
  });
});
