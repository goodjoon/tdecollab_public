import { AxiosInstance } from 'axios';
import { JiraComment } from '../types.js';

export class JiraCommentApi {
    constructor(private client: AxiosInstance) {}

    async getComments(
        issueKey: string,
        startAt = 0,
        maxResults = 50,
    ): Promise<{ comments: JiraComment[]; total: number; startAt: number; maxResults: number }> {
        const response = await this.client.get(`/rest/api/2/issue/${issueKey}/comment`, {
            params: { startAt, maxResults },
        });
        return response.data;
    }

    async addComment(issueKey: string, body: string): Promise<JiraComment> {
        const response = await this.client.post(`/rest/api/2/issue/${issueKey}/comment`, { body });
        return response.data;
    }

    async updateComment(issueKey: string, commentId: string, body: string): Promise<JiraComment> {
        const response = await this.client.put(
            `/rest/api/2/issue/${issueKey}/comment/${commentId}`,
            { body },
        );
        return response.data;
    }

    async deleteComment(issueKey: string, commentId: string): Promise<void> {
        await this.client.delete(`/rest/api/2/issue/${issueKey}/comment/${commentId}`);
    }
}
