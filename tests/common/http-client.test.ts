import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createHttpClient } from '../../tools/common/http-client.js';
import { ApiError, AuthError, NotFoundError } from '../../tools/common/errors.js';

describe('HTTP Client', () => {
    const mockAxios = new MockAdapter(axios);
    const config = {
        baseUrl: 'https://api.example.com',
        auth: { username: 'user', token: 'pass' }
    };

    // createHttpClient uses axios.create(), which returns a new instance.
    // axios-mock-adapter usually mocks the default axios instance or a specific one.
    // We need to ensure we mock the instance created by createHttpClient.
    // However, createHttpClient creates a *new* instance. 
    // We can't easily mock the instance *inside* the function without dependency injection or mocking axios.create.

    // Let's spy on axios.create to return an instance we can mock.
    // Or simpler: MockAdapter on the default axios might not work if we create a new instance that doesn't inherit defaults properly or if axios.create returns a completely separate object (it does).

    // Actually, axios-mock-adapter can mock any instance.
    // So we create the client, then attach the mock adapter to it.

    it('should attach auth headers', async () => {
        const client = createHttpClient(config);
        const mock = new MockAdapter(client);

        let capturedAuth: string | undefined;
        mock.onGet('/test').reply(reqConfig => {
            capturedAuth = reqConfig.headers?.Authorization as string;
            return [200, { success: true }];
        });

        await client.get('/test');
        // config에 token만 있으면 Bearer, username+token이면 Basic
        // 현재 config: { username: 'user', token: 'pass' } → username이 있어도 token 단독 우선(Bearer)이면 Bearer
        // http-client: token 단독 우선 → Bearer pass
        expect(capturedAuth).toBe('Bearer pass');
    });

    it('should handle 401 Unauthorized', async () => {
        const client = createHttpClient(config);
        const mock = new MockAdapter(client);

        mock.onGet('/401').reply(401, { message: 'Unauthorized' });

        await expect(client.get('/401')).rejects.toThrow(AuthError);
    });

    it('should handle 404 Not Found', async () => {
        const client = createHttpClient(config);
        const mock = new MockAdapter(client);

        mock.onGet('/404').reply(404, { message: 'Not Found' });

        await expect(client.get('/404')).rejects.toThrow(NotFoundError);
    });

    it('should handle general API errors', async () => {
        const client = createHttpClient(config);
        const mock = new MockAdapter(client);

        mock.onGet('/500').reply(500, { message: 'Internal Server Error' });

        await expect(client.get('/500')).rejects.toThrow(ApiError);
    });
});
