// JIRA 이슈 필드
export interface JiraIssueFields {
    summary: string;
    description?: string;
    issuetype: { id?: string; name?: string };
    project: { id?: string; key?: string; name?: string };
    status?: { id: string; name: string; statusCategory?: { key: string; name: string } };
    priority?: { id: string; name: string };
    assignee?: JiraUser | null;
    reporter?: JiraUser;
    creator?: JiraUser;
    labels?: string[];
    components?: Array<{ id?: string; name: string }>;
    fixVersions?: Array<{ id: string; name: string }>;
    resolution?: { id: string; name: string } | null;
    created?: string;
    updated?: string;
    duedate?: string | null;
    parent?: { id: string; key: string; fields?: { summary: string } };
    subtasks?: Array<{ id: string; key: string; fields: { summary: string; status: { name: string } } }>;
    comment?: { comments: JiraComment[]; maxResults: number; total: number; startAt: number };
    [key: string]: unknown;
}

// JIRA 사용자
export interface JiraUser {
    key?: string;
    name: string;
    emailAddress?: string;
    displayName: string;
    active?: boolean;
}

// JIRA 이슈 응답
export interface JiraIssueResponse {
    id: string;
    key: string;
    self: string;
    fields: JiraIssueFields;
}

// JQL 검색 응답
export interface JiraSearchResponse {
    startAt: number;
    maxResults: number;
    total: number;
    issues: JiraIssueResponse[];
}

// 트랜지션
export interface JiraTransition {
    id: string;
    name: string;
    to: {
        id: string;
        name: string;
        statusCategory?: { key: string; name: string };
    };
}

// 코멘트
export interface JiraComment {
    id: string;
    body: string;
    author: JiraUser;
    updateAuthor?: JiraUser;
    created: string;
    updated: string;
}

// 프로젝트
export interface JiraProject {
    id: string;
    key: string;
    name: string;
    lead?: JiraUser;
    issueTypes?: Array<{ id: string; name: string; subtask: boolean }>;
}

// Agile 보드
export interface JiraBoard {
    id: number;
    name: string;
    type: string;
    location?: { projectKey: string; name: string };
}

// 스프린트
export interface JiraSprint {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    completeDate?: string;
    goal?: string;
}

// 이슈 생성 파라미터
export interface CreateIssueParams {
    projectKey: string;
    summary: string;
    issueType: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
    components?: string[];
    parentKey?: string;
    customFields?: Record<string, unknown>;
}

// 이슈 수정 파라미터
export interface UpdateIssueParams {
    summary?: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
    components?: string[];
    customFields?: Record<string, unknown>;
}
