import { describe, expect, it } from 'vitest';
import { normalizeConfluencePageId } from '../../../tools/confluence/utils/page-id.js';

describe('normalizeConfluencePageId', () => {
    it('숫자 page id는 그대로 반환한다', () => {
        expect(normalizeConfluencePageId('1028471031')).toBe('1028471031');
    });

    it('modern Confluence page URL에서 page id를 추출한다', () => {
        expect(
            normalizeConfluencePageId(
                'https://confluence.tde.sktelecom.com/spaces/~1111812/pages/1028471031/PAGE_TEST_002',
            ),
        ).toBe('1028471031');
    });

    it('legacy query URL에서 page id를 추출한다', () => {
        expect(
            normalizeConfluencePageId(
                'https://confluence.tde.sktelecom.com/pages/viewpage.action?pageId=1028471031',
            ),
        ).toBe('1028471031');
    });
});
