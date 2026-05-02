import { AxiosInstance } from 'axios';
import { JiraIssueResponse, CreateIssueParams, UpdateIssueParams } from '../types.js';

export class JiraIssueApi {
    constructor(private client: AxiosInstance) {}

    async getIssue(issueKey: string, fields?: string[], expand?: string[]): Promise<JiraIssueResponse> {
        const params: Record<string, string> = {};
        if (fields && fields.length > 0) {
            params.fields = fields.join(',');
        }
        if (expand && expand.length > 0) {
            params.expand = expand.join(',');
        }
        const response = await this.client.get(`/rest/api/2/issue/${issueKey}`, { params });
        return response.data;
    }

    async createIssue(params: CreateIssueParams): Promise<JiraIssueResponse> {
        const fields: Record<string, unknown> = {
            project: { key: params.projectKey },
            summary: params.summary,
            issuetype: { name: params.issueType },
        };

        if (params.description) fields.description = params.description;
        if (params.assignee) fields.assignee = { name: params.assignee };
        if (params.priority) fields.priority = { name: params.priority };
        if (params.labels) fields.labels = params.labels;
        if (params.components) {
            fields.components = params.components.map((name) => ({ name }));
        }
        if (params.parentKey) {
            fields.parent = { key: params.parentKey };
        }
        if (params.customFields) {
            Object.assign(fields, params.customFields);
        }

        const response = await this.client.post('rest/api/2/issue', { fields });
        return response.data;
    }

    async updateIssue(issueKey: string, params: UpdateIssueParams): Promise<void> {
        const fields: Record<string, unknown> = {};

        if (params.summary) fields.summary = params.summary;
        if (params.description !== undefined) fields.description = params.description;
        if (params.assignee !== undefined) fields.assignee = params.assignee ? { name: params.assignee } : null;
        if (params.priority) fields.priority = { name: params.priority };
        if (params.labels) fields.labels = params.labels;
        if (params.components) {
            fields.components = params.components.map((name) => ({ name }));
        }
        if (params.customFields) {
            Object.assign(fields, params.customFields);
        }

        await this.client.put(`/rest/api/2/issue/${issueKey}`, { fields });
    }

    async deleteIssue(issueKey: string, deleteSubtasks = false): Promise<void> {
        await this.client.delete(`/rest/api/2/issue/${issueKey}`, {
            params: { deleteSubtasks },
        });
    }
}
