import { describe, expect, it } from 'vitest';
import { resolveCurrentVersionForUpdate } from '../../../tools/confluence/utils/version.js';

describe('Confluence version utilities', () => {
    it('updatePage에 전달할 값은 next version이 아니라 현재 page version이다', () => {
        expect(resolveCurrentVersionForUpdate(3)).toBe(3);
    });

    it('현재 버전을 알 수 없으면 1을 fallback으로 사용한다', () => {
        expect(resolveCurrentVersionForUpdate(undefined)).toBe(1);
        expect(resolveCurrentVersionForUpdate(null)).toBe(1);
    });
});
