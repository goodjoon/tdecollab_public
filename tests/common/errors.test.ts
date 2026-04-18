import { describe, it, expect } from 'vitest';
import { TdeCollabError, ApiError, AuthError, NotFoundError, ConflictError } from '../../tools/common/errors.js';

describe('Error Classes', () => {
    it('should inherit from Error', () => {
        const error = new TdeCollabError('test error');
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('test error');
        expect(error.name).toBe('TdeCollabError');
    });

    it('ApiError should have status code', () => {
        const error = new ApiError(400, 'Bad Request', { detail: 'invalid' });
        expect(error).toBeInstanceOf(TdeCollabError);
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('400');
        expect(error.data).toEqual({ detail: 'invalid' });
    });

    it('AuthError should have default message', () => {
        const error = new AuthError();
        expect(error.message).toBe('인증에 실패했습니다');
        expect(error).toBeInstanceOf(TdeCollabError);
    });

    it('NotFoundError should format message', () => {
        const error = new NotFoundError('Page', '123');
        expect(error.message).toBe("Page '123'를 찾을 수 없습니다");
    });

    it('ConflictError should set message', () => {
        const error = new ConflictError('Version conflict');
        expect(error.message).toBe('Version conflict');
    });
});
