import { AxiosInstance } from 'axios';
import { GitlabProject } from '../types.js';

export class GitlabProjectApi {
    constructor(private client: AxiosInstance) {}

    async getProjects(params?: {
        search?: string;
        owned?: boolean;
        membership?: boolean;
        perPage?: number;
    }): Promise<GitlabProject[]> {
        const response = await this.client.get('projects', {
            params: {
                search: params?.search,
                owned: params?.owned,
                membership: params?.membership,
                per_page: params?.perPage || 20,
            },
        });
        return response.data;
    }

    async getProject(projectId: number | string): Promise<GitlabProject> {
        const response = await this.client.get(`/projects/${encodeURIComponent(projectId)}`);
        return response.data;
    }
}
