import { describe, expect, it } from 'vitest';
import { applyUrlFill, parseConfluenceUrl } from '../../tools/tui/url-parser.js';

describe('TUI Confluence URL parser', () => {
  it('modern page URL에서 space, page id, title을 추출한다', () => {
    expect(
      parseConfluenceUrl(
        'https://confluence.tde.sktelecom.com/spaces/~1111812/pages/1028471031/PAGE_TEST_002',
      ),
    ).toEqual({
      space: '~1111812',
      pageId: '1028471031',
      title: 'PAGE_TEST_002',
    });
  });

  it('page get URL quick-fill 시 현재 output 디렉토리를 유지하고 page title을 filename으로 채운다', () => {
    const next = applyUrlFill(
      'confluence:page:get',
      { space: '~1111812', pageId: '1028471031', title: 'PAGE_TEST_002' },
      { output: 'files/download/lucian01.md' },
    );

    expect(next).toMatchObject({
      space: '~1111812',
      pageId: '1028471031',
      output: 'files/download/PAGE_TEST_002.md',
    });
  });

  it('page get output이 비어 있으면 page title만으로 Markdown filename을 채운다', () => {
    const next = applyUrlFill(
      'confluence:page:get',
      { pageId: '1028471031', title: 'PAGE TEST 002' },
      {},
    );

    expect(next.output).toBe('PAGE TEST 002.md');
  });
});
