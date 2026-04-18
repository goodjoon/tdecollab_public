import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { GitlabMergeRequestApi } from '../../../tools/gitlab/api/merge-request.js';

describe('GitlabMergeRequestApi', () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new GitlabMergeRequestApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('getMergeRequests should return MR list', async () => {
        const mockData = [
            {
                id: 1,
                iid: 10,
                title: 'Test MR',
                state: 'opened',
                source_branch: 'feature/test',
                target_branch: 'main',
                author: { id: 1, username: 'user1', name: 'User One' },
            },
        ];

        mock.onGet('/projects/1/merge_requests').reply(200, mockData);

        const result = await api.getMergeRequests(1);
        expect(result).toHaveLength(1);
        expect(result[0].iid).toBe(10);
        expect(result[0].title).toBe('Test MR');
    });

    it('getMergeRequest should return MR detail', async () => {
        const mockData = {
            id: 1,
            iid: 10,
            title: 'Test MR',
            description: 'MR description',
            state: 'opened',
            source_branch: 'feature/test',
            target_branch: 'main',
            author: { id: 1, username: 'user1', name: 'User One' },
            merge_status: 'can_be_merged',
            has_conflicts: false,
        };

        mock.onGet('/projects/1/merge_requests/10').reply(200, mockData);

        const result = await api.getMergeRequest(1, 10);
        expect(result.iid).toBe(10);
        expect(result.merge_status).toBe('can_be_merged');
        expect(result.has_conflicts).toBe(false);
    });

    it('createMergeRequest should post MR data', async () => {
        const mockResponse = {
            id: 2,
            iid: 11,
            title: 'New MR',
            state: 'opened',
            source_branch: 'feature/new',
            target_branch: 'main',
            web_url: 'https://gitlab.example.com/ns/project/-/merge_requests/11',
        };

        mock.onPost('/projects/1/merge_requests').reply(201, mockResponse);

        const result = await api.createMergeRequest(1, {
            source_branch: 'feature/new',
            target_branch: 'main',
            title: 'New MR',
            description: 'Some description',
        });

        expect(result.iid).toBe(11);
        expect(result.title).toBe('New MR');

        const postData = JSON.parse(mock.history.post[0].data);
        expect(postData.source_branch).toBe('feature/new');
        expect(postData.target_branch).toBe('main');
        expect(postData.title).toBe('New MR');
    });

    it('mergeMergeRequest should put merge request', async () => {
        const mockResponse = {
            id: 1,
            iid: 10,
            title: 'Test MR',
            state: 'merged',
        };

        mock.onPut('/projects/1/merge_requests/10/merge').reply(200, mockResponse);

        const result = await api.mergeMergeRequest(1, 10, { squash: true });
        expect(result.state).toBe('merged');

        const putData = JSON.parse(mock.history.put[0].data);
        expect(putData.squash).toBe(true);
    });

    it('addMergeRequestNote should post note', async () => {
        const mockResponse = {
            id: 100,
            body: 'LGTM',
            author: { id: 1, username: 'user1', name: 'User One' },
        };

        mock.onPost('/projects/1/merge_requests/10/notes').reply(201, mockResponse);

        const result = await api.addMergeRequestNote(1, 10, 'LGTM');
        expect(result.id).toBe(100);
        expect(result.body).toBe('LGTM');

        const postData = JSON.parse(mock.history.post[0].data);
        expect(postData.body).toBe('LGTM');
    });

    it('updateMergeRequest should put update data', async () => {
        const mockResponse = {
            id: 1,
            iid: 10,
            title: 'Test MR',
            state: 'closed',
        };

        mock.onPut('/projects/1/merge_requests/10').reply(200, mockResponse);

        const result = await api.updateMergeRequest(1, 10, { state_event: 'close' });
        expect(result.state).toBe('closed');
    });
});
