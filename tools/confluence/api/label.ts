import { AxiosInstance } from 'axios';
import { ConfluenceLabel } from '../types.js';

export class ConfluenceLabelApi {
    constructor(private client: AxiosInstance) { }

    async getLabels(pageId: string): Promise<ConfluenceLabel[]> {
        const response = await this.client.get(`/rest/api/content/${pageId}/label`);
        return response.data.results;
    }

    async addLabels(pageId: string, labels: string[]): Promise<void> {
        const data = labels.map(name => ({ prefix: 'global', name }));
        await this.client.post(`/rest/api/content/${pageId}/label`, data);
    }

    async removeLabel(pageId: string, labelName: string): Promise<void> {
        // Label deletion usually requires query param for name
        // /rest/api/content/{id}/label?name={name}
        await this.client.delete(`/rest/api/content/${pageId}/label`, {
            params: { name: labelName }
        });
    }
}
