import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { JiraIssueApi } from '../../../tools/jira/api/issue.js';

describe('JiraIssueApi', () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new JiraIssueApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('getIssue should return issue data', async () => {
        const mockData = {
            id: '10001',
            key: 'PROJ-1',
            self: 'https://jira.example.com/rest/api/2/issue/10001',
            fields: {
                summary: 'Test Issue',
                status: { id: '1', name: 'Open' },
                issuetype: { name: 'Task' },
                project: { key: 'PROJ' },
            },
        };

        mock.onGet('/rest/api/2/issue/PROJ-1').reply(200, mockData);

        const result = await api.getIssue('PROJ-1');
        expect(result.key).toBe('PROJ-1');
        expect(result.fields.summary).toBe('Test Issue');
    });

    it('getIssue with fields should pass fields param', async () => {
        const mockData = {
            id: '10001',
            key: 'PROJ-1',
            self: '',
            fields: { summary: 'Test' },
        };

        mock.onGet('/rest/api/2/issue/PROJ-1', {
            params: { fields: 'summary,status' },
        }).reply(200, mockData);

        const result = await api.getIssue('PROJ-1', ['summary', 'status']);
        expect(result.fields.summary).toBe('Test');
    });

    it('createIssue should post issue data', async () => {
        const mockResponse = { id: '10002', key: 'PROJ-2', self: '' };

        mock.onPost('/rest/api/2/issue').reply(201, mockResponse);

        const result = await api.createIssue({
            projectKey: 'PROJ',
            summary: 'New Issue',
            issueType: 'Task',
            description: 'Description here',
            labels: ['test'],
        });

        expect(result.key).toBe('PROJ-2');

        const postData = JSON.parse(mock.history.post[0].data);
        expect(postData.fields.project.key).toBe('PROJ');
        expect(postData.fields.summary).toBe('New Issue');
        expect(postData.fields.issuetype.name).toBe('Task');
        expect(postData.fields.description).toBe('Description here');
        expect(postData.fields.labels).toEqual(['test']);
    });

    it('createIssue with parentKey should include parent field', async () => {
        const mockResponse = { id: '10003', key: 'PROJ-3', self: '' };

        mock.onPost('/rest/api/2/issue').reply(201, mockResponse);

        await api.createIssue({
            projectKey: 'PROJ',
            summary: 'Sub-task',
            issueType: 'Sub-task',
            parentKey: 'PROJ-1',
        });

        const postData = JSON.parse(mock.history.post[0].data);
        expect(postData.fields.parent.key).toBe('PROJ-1');
    });

    it('updateIssue should put fields', async () => {
        mock.onPut('/rest/api/2/issue/PROJ-1').reply(204);

        await api.updateIssue('PROJ-1', {
            summary: 'Updated Title',
            priority: 'High',
        });

        const putData = JSON.parse(mock.history.put[0].data);
        expect(putData.fields.summary).toBe('Updated Title');
        expect(putData.fields.priority.name).toBe('High');
    });

    it('deleteIssue should send delete request', async () => {
        mock.onDelete('/rest/api/2/issue/PROJ-1').reply(204);

        await api.deleteIssue('PROJ-1');
        expect(mock.history.delete.length).toBe(1);
    });

    it('deleteIssue with subtasks should pass deleteSubtasks param', async () => {
        mock.onDelete('/rest/api/2/issue/PROJ-1', {
            params: { deleteSubtasks: true },
        }).reply(204);

        await api.deleteIssue('PROJ-1', true);
        expect(mock.history.delete.length).toBe(1);
    });
});
