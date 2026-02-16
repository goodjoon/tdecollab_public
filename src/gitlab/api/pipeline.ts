import { AxiosInstance } from 'axios';
import { GitlabPipeline, GitlabJob } from '../types.js';

export class GitlabPipelineApi {
    constructor(private client: AxiosInstance) {}

    async getPipelines(
        projectId: number,
        params?: { status?: string; ref?: string; perPage?: number },
    ): Promise<GitlabPipeline[]> {
        const response = await this.client.get(`/projects/${projectId}/pipelines`, {
            params: {
                status: params?.status,
                ref: params?.ref,
                per_page: params?.perPage || 20,
            },
        });
        return response.data;
    }

    async getPipeline(projectId: number, pipelineId: number): Promise<GitlabPipeline> {
        const response = await this.client.get(
            `/projects/${projectId}/pipelines/${pipelineId}`,
        );
        return response.data;
    }

    async getPipelineJobs(projectId: number, pipelineId: number): Promise<GitlabJob[]> {
        const response = await this.client.get(
            `/projects/${projectId}/pipelines/${pipelineId}/jobs`,
        );
        return response.data;
    }

    async getMergeRequestPipelines(
        projectId: number,
        mrIid: number,
    ): Promise<GitlabPipeline[]> {
        const response = await this.client.get(
            `/projects/${projectId}/merge_requests/${mrIid}/pipelines`,
        );
        return response.data;
    }
}
