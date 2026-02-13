import { describe, it, expect } from 'vitest';
import { createBasicAuthHeader, createBearerAuthHeader, getAuthHeader } from '../../src/common/auth.js';

describe('Auth Helpers', () => {
    it('should create basic auth header', () => {
        const header = createBasicAuthHeader('user', 'pass');
        expect(header).toBe('Basic dXNlcjpwYXNz'); // user:pass base64
    });

    it('should create bearer auth header', () => {
        const header = createBearerAuthHeader('token123');
        expect(header).toBe('Bearer token123');
    });

    describe('getAuthHeader', () => {
        it('should return Basic Auth for Confluence/Jira config', () => {
            const config = {
                baseUrl: 'http://example.com',
                auth: {
                    username: 'user',
                    token: 'pass'
                }
            };

            const headers = getAuthHeader(config);
            expect(headers).toEqual({ Authorization: 'Basic dXNlcjpwYXNz' });
        });

        it('should return Bearer Auth for Token-only config', () => {
            const config = {
                baseUrl: 'http://example.com',
                auth: {
                    token: 'token123'
                }
            };

            const headers = getAuthHeader(config);
            expect(headers).toEqual({ Authorization: 'Bearer token123' });
        });

        it('should return empty object if no auth', () => {
            const config = {
                baseUrl: 'http://example.com',
                auth: {}
            };

            const headers = getAuthHeader(config);
            expect(headers).toEqual({});
        });
    });
});
