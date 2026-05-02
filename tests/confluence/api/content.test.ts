import { describe, it, expect, vi, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ConfluenceContentApi } from '../../../tools/confluence/api/content.js';

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

    describe('Attachment methods', () => {
        it('getAttachments should return attachment list', async () => {
            const pageId = '123';
            const mockAttachments = {
                results: [
                    {
                        id: 'att1',
                        type: 'attachment',
                        title: 'image.png',
                        metadata: { mediaType: 'image/png' },
                        extensions: { mediaType: 'image/png', fileSize: 1024 },
                        _links: { download: '/download/attachments/123/image.png' }
                    }
                ]
            };

            mock.onGet(`/rest/api/content/${pageId}/child/attachment`)
                .reply(200, mockAttachments);

            const result = await api.getAttachments(pageId);
            expect(result).toEqual(mockAttachments.results);
            expect(result[0].title).toBe('image.png');
        });

        it('getAttachments with filename should filter by filename', async () => {
            const pageId = '123';
            const filename = 'specific.png';
            const mockAttachments = {
                results: [
                    {
                        id: 'att1',
                        type: 'attachment',
                        title: filename,
                        metadata: { mediaType: 'image/png' },
                        extensions: { mediaType: 'image/png', fileSize: 2048 },
                        _links: { download: '/download/attachments/123/specific.png' }
                    }
                ]
            };

            mock.onGet(`/rest/api/content/${pageId}/child/attachment`, {
                params: { filename, expand: 'version' }
            }).reply(200, mockAttachments);

            const result = await api.getAttachments(pageId, filename);
            expect(result).toEqual(mockAttachments.results);
            expect(result[0].title).toBe(filename);
        });

        it('downloadAttachment should return buffer', async () => {
            const downloadUrl = 'https://confluence.example.com/download/attachments/123/image.png';
            const mockImageData = Buffer.from('fake-image-data');

            mock.onGet(downloadUrl).reply(200, mockImageData);

            const result = await api.downloadAttachment(downloadUrl);
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe('fake-image-data');
        });

        it('downloadAttachment should handle binary data', async () => {
            const downloadUrl = '/download/attachments/123/image.png';
            const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header

            mock.onGet(downloadUrl).reply(200, binaryData);

            const result = await api.downloadAttachment(downloadUrl);
            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBe(4);
        });
    });
});
