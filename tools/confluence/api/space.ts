import { AxiosInstance } from 'axios';
import { ConfluenceSpaceResponse } from '../types.js';

export class ConfluenceSpaceApi {
    constructor(private client: AxiosInstance) { }

    async getSpaces(type: string = 'global', start = 0, limit = 25): Promise<ConfluenceSpaceResponse[]> {
        const response = await this.client.get('/rest/api/space', {
            params: { type, start, limit }
        });
        return response.data.results;
    }

    async getSpace(spaceKey: string): Promise<ConfluenceSpaceResponse> {
        const response = await this.client.get(`/rest/api/space/${spaceKey}`);
        return response.data;
    }
}
