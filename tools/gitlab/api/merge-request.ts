import { AxiosInstance } from 'axios';
import { GitlabMergeRequest, GitlabNote } from '../types.js';

export class GitlabMergeRequestApi {
    constructor(private client: AxiosInstance) {}

    async getMergeRequests(
        projectId: number,
        params?: { state?: string; scope?: string; labels?: string; perPage?: number },
    ): Promise<GitlabMergeRequest[]> {
        const response = await this.client.get(`/projects/${projectId}/merge_requests`, {
            params: {
                state: params?.state || 'opened',
                scope: params?.scope,
                labels: params?.labels,
                per_page: params?.perPage || 20,
            },
        });
        return response.data;
    }

    async getMergeRequest(projectId: number, mrIid: number): Promise<GitlabMergeRequest> {
        const response = await this.client.get(
            `/projects/${projectId}/merge_requests/${mrIid}`,
        );
        return response.data;
    }

    async getMergeRequestChanges(projectId: number, mrIid: number): Promise<GitlabMergeRequest> {
        const response = await this.client.get(
            `/projects/${projectId}/merge_requests/${mrIid}/changes`,
        );
        return response.data;
    }

    async createMergeRequest(
        projectId: number,
        data: {
            source_branch: string;
            target_branch: string;
            title: string;
            description?: string;
            assignee_id?: number;
            reviewer_ids?: number[];
            labels?: string;
        },
    ): Promise<GitlabMergeRequest> {
        const response = await this.client.post(`/projects/${projectId}/merge_requests`, data);
        return response.data;
    }

    async updateMergeRequest(
        projectId: number,
        mrIid: number,
        data: {
            title?: string;
            description?: string;
            assignee_id?: number;
            reviewer_ids?: number[];
            labels?: string;
            state_event?: 'close' | 'reopen';
        },
    ): Promise<GitlabMergeRequest> {
        const response = await this.client.put(
            `/projects/${projectId}/merge_requests/${mrIid}`,
            data,
        );
        return response.data;
    }

    async mergeMergeRequest(
        projectId: number,
        mrIid: number,
        params?: {
            merge_commit_message?: string;
            squash?: boolean;
            should_remove_source_branch?: boolean;
        },
    ): Promise<GitlabMergeRequest> {
        const response = await this.client.put(
            `/projects/${projectId}/merge_requests/${mrIid}/merge`,
            params,
        );
        return response.data;
    }

    async getMergeRequestNotes(projectId: number, mrIid: number): Promise<GitlabNote[]> {
        const response = await this.client.get(
            `/projects/${projectId}/merge_requests/${mrIid}/notes`,
        );
        return response.data;
    }

    async addMergeRequestNote(
        projectId: number,
        mrIid: number,
        body: string,
    ): Promise<GitlabNote> {
        const response = await this.client.post(
            `/projects/${projectId}/merge_requests/${mrIid}/notes`,
            { body },
        );
        return response.data;
    }
}
