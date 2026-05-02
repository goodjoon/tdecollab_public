import { AxiosInstance } from 'axios';
import { ConfluencePageResponse, CreatePageParams, UpdatePageParams, ConfluenceLabel, ConfluenceAttachmentResponse } from '../types.js';


export class ConfluenceContentApi {
    constructor(private client: AxiosInstance) { }

    async getPage(id: string, expand?: string[]): Promise<ConfluencePageResponse> {
        const expandParam = expand ? expand.join(',') : 'body.storage,version,space,metadata.labels';
        const response = await this.client.get(`rest/api/content/${id}`, {
            params: { expand: expandParam }
        });
        return response.data;
    }

    async getPageByTitle(spaceKey: string, title: string, expand?: string[]): Promise<ConfluencePageResponse | null> {
        const expandParam = expand ? expand.join(',') : 'body.storage,version,space';
        const response = await this.client.get('rest/api/content', {
            params: {
                spaceKey,
                title,
                expand: expandParam,
                limit: 1
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0];
        }
        return null;
    }

    async createPage(params: CreatePageParams): Promise<ConfluencePageResponse> {
        const data: any = {
            type: 'page',
            title: params.title,
            space: { key: params.spaceKey },
            body: {
                storage: {
                    value: params.body,
                    representation: 'storage'
                }
            }
        };

        if (params.parentId) {
            data.ancestors = [{ id: params.parentId }];
        }

        const response = await this.client.post('rest/api/content', data);

        // add labels if provided
        if (params.labels && params.labels.length > 0) {
            await this.addLabels(response.data.id, params.labels);
            // refetch to include labels in response if needed, 
            // but simpler to just return the create response.
            // Or we can construct the object.
        }

        return response.data;
    }

    async updatePage(params: UpdatePageParams): Promise<ConfluencePageResponse> {
        const data = {
            version: { number: params.version + 1 },
            title: params.title,
            type: 'page',
            body: {
                storage: {
                    value: params.body,
                    representation: 'storage'
                }
            }
        };

        const response = await this.client.put(`rest/api/content/${params.id}`, data);
        return response.data;
    }

    async deletePage(id: string): Promise<void> {
        await this.client.delete(`rest/api/content/${id}`);
    }

    async getChildPages(id: string, start = 0, limit = 25): Promise<ConfluencePageResponse[]> {
        const response = await this.client.get(`rest/api/content/${id}/child/page`, {
            params: { start, limit }
        });
        return response.data.results;
    }

    // Label helper inside content api or separate? 
    // Let's implement basic label addition here since it's used in create.
    // Actually, label logic is in label.ts, but due to circular dependency or convenience...
    // Let's implement it here privately or import it.
    // Better to keep it separate as per plan, but `this.client` is available here.
    // I'll implement a simple one here or use the separate class later. 
    // For now, simple implementation to support createPage.
    private async addLabels(id: string, labels: string[]): Promise<void> {
        const data = labels.map(name => ({ prefix: 'global', name }));
        await this.client.post(`rest/api/content/${id}/label`, data);
    }

    // Attachment 관련 메서드 (upsert: 기존 파일이 있으면 업데이트, 없으면 신규 업로드)
    async uploadAttachment(pageId: string, filename: string, fileContent: Buffer, contentType?: string): Promise<ConfluenceAttachmentResponse> {
        const FormData = (await import('form-data')).default;

        // 기존 첨부파일 존재 여부 확인
        const existingAttachments = await this.getAttachments(pageId, filename);
        const existing = existingAttachments.find(a => a.title === filename);

        const form = new FormData();
        form.append('file', fileContent, {
            filename: filename,
            contentType: contentType || 'application/octet-stream'
        });

        const headers = {
            ...form.getHeaders(),
            'X-Atlassian-Token': 'nocheck',
            'Accept': 'application/json',
        };

        let response;
        if (existing) {
            // 기존 파일 업데이트 (POST to /data endpoint)
            response = await this.client.post(
                `rest/api/content/${pageId}/child/attachment/${existing.id}/data`,
                form,
                { headers }
            );
        } else {
            // 신규 업로드
            response = await this.client.post(
                `rest/api/content/${pageId}/child/attachment`,
                form,
                { headers }
            );
        }

        // Confluence API returns { results: [Attachment] } 
        if (response.data && response.data.results && response.data.results.length > 0) {
            return response.data.results[0];
        }
        return response.data;
    }

    async getAttachments(pageId: string, filename?: string): Promise<ConfluenceAttachmentResponse[]> {
        const response = await this.client.get(`rest/api/content/${pageId}/child/attachment`, {
            params: {
                filename,
                expand: 'version'
            }
        });
        return response.data.results;
    }

    async downloadAttachment(downloadUrl: string): Promise<Buffer> {
        // Strip leading slash to respect baseURL path (like /wiki)
        const targetUrl = downloadUrl.startsWith('/') ? downloadUrl.substring(1) : downloadUrl;
        
        const response = await this.client.get(targetUrl, {
            responseType: 'arraybuffer'
        });
        const data = response.data;
        if (data instanceof Buffer) {
            return data;
        }
        if (data instanceof ArrayBuffer) {
            return Buffer.from(data);
        }
        // Fallback for other types (e.g. Uint8Array)
        return Buffer.from(data);
    }
}
