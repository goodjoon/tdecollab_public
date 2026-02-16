import { AxiosInstance } from 'axios';
import { GitlabBranch } from '../types.js';

export class GitlabBranchApi {
    constructor(private client: AxiosInstance) {}

    async getBranches(
        projectId: number,
        params?: { search?: string; perPage?: number },
    ): Promise<GitlabBranch[]> {
        const response = await this.client.get(`/projects/${projectId}/repository/branches`, {
            params: {
                search: params?.search,
                per_page: params?.perPage || 20,
            },
        });
        return response.data;
    }

    async getBranch(projectId: number, branchName: string): Promise<GitlabBranch> {
        const response = await this.client.get(
            `/projects/${projectId}/repository/branches/${encodeURIComponent(branchName)}`,
        );
        return response.data;
    }

    async createBranch(
        projectId: number,
        branchName: string,
        ref: string,
    ): Promise<GitlabBranch> {
        const response = await this.client.post(`/projects/${projectId}/repository/branches`, {
            branch: branchName,
            ref,
        });
        return response.data;
    }

    async deleteBranch(projectId: number, branchName: string): Promise<void> {
        await this.client.delete(
            `/projects/${projectId}/repository/branches/${encodeURIComponent(branchName)}`,
        );
    }
}
