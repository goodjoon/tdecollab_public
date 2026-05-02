import { AxiosInstance } from 'axios';
import { ConfluenceSearchResponse } from '../types.js';

export class ConfluenceSearchApi {
    constructor(private client: AxiosInstance) { }

    async searchByCql(cql: string, start = 0, limit = 25, expand?: string[]): Promise<ConfluenceSearchResponse> {
        const expandParam = expand ? expand.join(',') : 'body.storage,version,space,metadata.labels';
        const response = await this.client.get('rest/api/content/search', {
            params: {
                cql,
                start,
                limit,
                expand: expandParam
            }
        });

        return response.data;
    }
}
