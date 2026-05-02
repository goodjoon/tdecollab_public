import { AxiosInstance } from 'axios';
import { GitlabRepositoryFile, GitlabTreeEntry } from '../types.js';

export class GitlabRepositoryApi {
    constructor(private client: AxiosInstance) {}

    async getFile(
        projectId: number,
        filePath: string,
        ref?: string,
    ): Promise<GitlabRepositoryFile> {
        const encodedPath = encodeURIComponent(filePath);
        const response = await this.client.get(
            `/projects/${projectId}/repository/files/${encodedPath}`,
            { params: { ref: ref || 'HEAD' } },
        );
        const file: GitlabRepositoryFile = response.data;
        // Base64 디코딩
        if (file.encoding === 'base64') {
            file.content = Buffer.from(file.content, 'base64').toString('utf-8');
        }
        return file;
    }

    async getTree(
        projectId: number,
        params?: { path?: string; ref?: string; recursive?: boolean; perPage?: number },
    ): Promise<GitlabTreeEntry[]> {
        const response = await this.client.get(`/projects/${projectId}/repository/tree`, {
            params: {
                path: params?.path,
                ref: params?.ref,
                recursive: params?.recursive,
                per_page: params?.perPage || 100,
            },
        });
        return response.data;
    }
}
