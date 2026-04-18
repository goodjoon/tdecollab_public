import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { GitlabProjectApi } from '../../../tools/gitlab/api/project.js';

describe('GitlabProjectApi', () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const api = new GitlabProjectApi(client);

    beforeEach(() => {
        mock.reset();
    });

    it('getProjects should return project list', async () => {
        const mockData = [
            {
                id: 1,
                name: 'test-project',
                name_with_namespace: 'ns / test-project',
                path_with_namespace: 'ns/test-project',
                default_branch: 'main',
                visibility: 'private',
                web_url: 'https://gitlab.example.com/ns/test-project',
            },
        ];

        mock.onGet('/projects').reply(200, mockData);

        const result = await api.getProjects();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test-project');
        expect(result[0].id).toBe(1);
    });

    it('getProjects with search should pass search param', async () => {
        mock.onGet('/projects', {
            params: { search: 'test', owned: undefined, membership: undefined, per_page: 20 },
        }).reply(200, []);

        const result = await api.getProjects({ search: 'test' });
        expect(result).toHaveLength(0);
    });

    it('getProjects with membership should pass membership param', async () => {
        mock.onGet('/projects', {
            params: {
                search: undefined,
                owned: undefined,
                membership: true,
                per_page: 20,
            },
        }).reply(200, []);

        const result = await api.getProjects({ membership: true });
        expect(result).toHaveLength(0);
    });

    it('getProject should return project detail', async () => {
        const mockData = {
            id: 1,
            name: 'test-project',
            name_with_namespace: 'ns / test-project',
            path_with_namespace: 'ns/test-project',
            default_branch: 'main',
            visibility: 'private',
            web_url: 'https://gitlab.example.com/ns/test-project',
            ssh_url_to_repo: 'git@gitlab.example.com:ns/test-project.git',
            http_url_to_repo: 'https://gitlab.example.com/ns/test-project.git',
            description: 'A test project',
        };

        mock.onGet('/projects/1').reply(200, mockData);

        const result = await api.getProject(1);
        expect(result.id).toBe(1);
        expect(result.name).toBe('test-project');
        expect(result.description).toBe('A test project');
    });
});
