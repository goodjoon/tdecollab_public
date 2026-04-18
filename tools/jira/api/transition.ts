import { AxiosInstance } from 'axios';
import { JiraTransition } from '../types.js';

export class JiraTransitionApi {
    constructor(private client: AxiosInstance) {}

    async getTransitions(issueKey: string): Promise<JiraTransition[]> {
        const response = await this.client.get(`/rest/api/2/issue/${issueKey}/transitions`);
        return response.data.transitions;
    }

    async doTransition(
        issueKey: string,
        transitionId: string,
        fields?: Record<string, unknown>,
    ): Promise<void> {
        const data: Record<string, unknown> = {
            transition: { id: transitionId },
        };
        if (fields) {
            data.fields = fields;
        }
        await this.client.post(`/rest/api/2/issue/${issueKey}/transitions`, data);
    }
}
