import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ConfluenceSpaceApi } from '../../../tools/confluence/api/space.js';

describe('ConfluenceSpaceApi', () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new ConfluenceSpaceApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('getSpaces should return list', async () => {
        const mockData = { results: [{ key: 'DS', name: 'Dev Space' }] };

        mock.onGet('/rest/api/space').reply(200, mockData);

        const result = await api.getSpaces();
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('DS');
    });

    it('getSpace should return details', async () => {
        const mockData = { key: 'DS', name: 'Dev Space' };

        mock.onGet('/rest/api/space/DS').reply(200, mockData);

        const result = await api.getSpace('DS');
        expect(result.name).toBe('Dev Space');
    });
});
