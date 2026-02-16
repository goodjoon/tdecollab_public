import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { JiraSearchApi } from '../../../src/jira/api/search.js';

describe('JiraSearchApi', () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new JiraSearchApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('searchByJql should return search results', async () => {
        const mockData = {
            startAt: 0,
            maxResults: 50,
            total: 2,
            issues: [
                {
                    id: '10001',
                    key: 'PROJ-1',
                    self: '',
                    fields: { summary: 'Issue 1', status: { name: 'Open' } },
                },
                {
                    id: '10002',
                    key: 'PROJ-2',
                    self: '',
                    fields: { summary: 'Issue 2', status: { name: 'Closed' } },
                },
            ],
        };

        mock.onGet('/rest/api/2/search').reply(200, mockData);

        const result = await api.searchByJql('project = PROJ');
        expect(result.total).toBe(2);
        expect(result.issues).toHaveLength(2);
        expect(result.issues[0].key).toBe('PROJ-1');
    });

    it('searchByJql with pagination params', async () => {
        const mockData = {
            startAt: 10,
            maxResults: 5,
            total: 50,
            issues: [],
        };

        mock.onGet('/rest/api/2/search', {
            params: { jql: 'project = PROJ', startAt: 10, maxResults: 5 },
        }).reply(200, mockData);

        const result = await api.searchByJql('project = PROJ', 10, 5);
        expect(result.startAt).toBe(10);
        expect(result.maxResults).toBe(5);
        expect(result.total).toBe(50);
    });

    it('searchByJql with fields param', async () => {
        const mockData = {
            startAt: 0,
            maxResults: 50,
            total: 1,
            issues: [
                {
                    id: '10001',
                    key: 'PROJ-1',
                    self: '',
                    fields: { summary: 'Issue 1' },
                },
            ],
        };

        mock.onGet('/rest/api/2/search', {
            params: { jql: 'project = PROJ', startAt: 0, maxResults: 50, fields: 'summary,status' },
        }).reply(200, mockData);

        const result = await api.searchByJql('project = PROJ', 0, 50, ['summary', 'status']);
        expect(result.issues).toHaveLength(1);
    });
});
