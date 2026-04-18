import { AxiosInstance } from 'axios';
import { JiraProject, JiraBoard, JiraSprint } from '../types.js';

export class JiraProjectApi {
    constructor(private client: AxiosInstance) {}

    async getProjects(): Promise<JiraProject[]> {
        const response = await this.client.get('/rest/api/2/project');
        return response.data;
    }

    async getProject(projectKey: string): Promise<JiraProject> {
        const response = await this.client.get(`/rest/api/2/project/${projectKey}`);
        return response.data;
    }

    async getBoards(
        projectKeyOrId?: string,
        type?: string,
    ): Promise<{ values: JiraBoard[]; total: number }> {
        const params: Record<string, string> = {};
        if (projectKeyOrId) params.projectKeyOrId = projectKeyOrId;
        if (type) params.type = type;
        const response = await this.client.get('/rest/agile/1.0/board', { params });
        return response.data;
    }

    async getSprints(
        boardId: number,
        state?: string,
    ): Promise<{ values: JiraSprint[]; total: number }> {
        const params: Record<string, string> = {};
        if (state) params.state = state;
        const response = await this.client.get(`/rest/agile/1.0/board/${boardId}/sprint`, {
            params,
        });
        return response.data;
    }
}
