import { describe, it, expect, vi, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ConfluenceContentApi } from '../../../src/confluence/api/content.js';

describe('ConfluenceContentApi', () => {
    const mockAxios = new MockAdapter(axios);
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new ConfluenceContentApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('getPage should return page data', async () => {
        const pageId = '123';
        const mockData = { id: pageId, title: 'Test Page' };

        // Default expand
        mock.onGet(`/rest/api/content/${pageId}`, { params: { expand: 'body.storage,version,space,metadata.labels' } })
            .reply(200, mockData);

        const result = await api.getPage(pageId);
        expect(result).toEqual(mockData);
    });

    it('createPage should post data', async () => {
        const params = { spaceKey: 'DS', title: 'New Page', body: '<p>Content</p>' };
        const mockResponse = { id: '456', title: 'New Page' };

        mock.onPost('/rest/api/content').reply(200, mockResponse);

        const result = await api.createPage(params);
        expect(result).toEqual(mockResponse);
    });

    it('createPage with labels should add labels', async () => {
        const params = { spaceKey: 'DS', title: 'New Page', body: '<p>Content</p>', labels: ['tag1'] };
        const mockResponse = { id: '456', title: 'New Page' };

        mock.onPost('/rest/api/content').reply(200, mockResponse);
        mock.onPost('/rest/api/content/456/label').reply(200);

        const result = await api.createPage(params);
        expect(result).toEqual(mockResponse);
        // Verify label call
        expect(mock.history.post.length).toBe(2);
        expect(mock.history.post[1].url).toBe('/rest/api/content/456/label');
    });
});
