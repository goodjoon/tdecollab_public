import { AxiosInstance } from 'axios';
import { JiraSearchResponse } from '../types.js';

export class JiraSearchApi {
    constructor(private client: AxiosInstance) {}

    async searchByJql(
        jql: string,
        startAt = 0,
        maxResults = 50,
        fields?: string[],
    ): Promise<JiraSearchResponse> {
        const params: Record<string, unknown> = {
            jql,
            startAt,
            maxResults,
        };
        if (fields && fields.length > 0) {
            params.fields = fields.join(',');
        }
        const response = await this.client.get('rest/api/2/search', { params });
        return response.data;
    }
}
