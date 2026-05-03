import { describe, expect, it, vi } from 'vitest';
import {
  assertNewPageTitleAvailable,
  buildDuplicatePageTitleMessage,
  isDuplicatePageTitleApiError,
} from '../src/utils/page-title.js';

describe('Confluence page title utilities', () => {
  it('allows new page upload when no page with the same title exists in the space', async () => {
    const getPageByTitle = vi.fn().mockResolvedValue(null);

    await expect(
      assertNewPageTitleAvailable({ getPageByTitle }, '~1111812', 'test001'),
    ).resolves.toBeUndefined();

    expect(getPageByTitle).toHaveBeenCalledWith('~1111812', 'test001', ['version', 'space']);
  });

  it('throws a Korean rename warning when the same title already exists in the space', async () => {
    const getPageByTitle = vi.fn().mockResolvedValue({ id: '1029310383', title: 'test001' });

    await expect(
      assertNewPageTitleAvailable({ getPageByTitle }, '~1111812', 'test001'),
    ).rejects.toThrow(
      "이미 'test001' 페이지가 '~1111812' Space에 존재합니다. Obsidian 파일 이름을 바꾼 뒤 다시 업로드하세요.",
    );
  });

  it('recognizes Confluence duplicate-title API errors from create page responses', () => {
    const error = {
      statusCode: 400,
      message:
        'API 요청 실패 (400): A page with this title already exists: A page already exists with the title test001 in the space with key ~1111812.',
    };

    expect(isDuplicatePageTitleApiError(error)).toBe(true);
    expect(buildDuplicatePageTitleMessage('test001', '~1111812')).toBe(
      "이미 'test001' 페이지가 '~1111812' Space에 존재합니다. Obsidian 파일 이름을 바꾼 뒤 다시 업로드하세요.",
    );
  });
});
