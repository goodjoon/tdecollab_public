import { describe, expect, it } from 'vitest';
import { parseParentPageUrl } from '../src/utils/confluence-url.js';

describe('Confluence URL utilities', () => {
  it('parses modern parent page URLs into space key and page id', () => {
    expect(
      parseParentPageUrl(
        'https://confluence.tde.sktelecom.com/spaces/~1111812/pages/1012333590/lvmf.arch.design.v2',
      ),
    ).toEqual({
      spaceKey: '~1111812',
      parentId: '1012333590',
    });
  });

  it('parses legacy query URLs into space key and page id', () => {
    expect(
      parseParentPageUrl(
        'https://confluence.tde.sktelecom.com/pages/viewpage.action?pageId=1012333590&spaceKey=DEV',
      ),
    ).toEqual({
      spaceKey: 'DEV',
      parentId: '1012333590',
    });
  });

  it('returns an empty result for non-url values', () => {
    expect(parseParentPageUrl('1012333590')).toEqual({});
    expect(parseParentPageUrl('')).toEqual({});
  });
});
