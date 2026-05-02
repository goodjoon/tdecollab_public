import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { JiraIssueApi } from '../api/issue.js';
import { JiraSearchApi } from '../api/search.js';
import { JiraTransitionApi } from '../api/transition.js';
import { JiraCommentApi } from '../api/comment.js';
import { JiraProjectApi } from '../api/project.js';
import { createJiraClient } from '../api/client.js';
import { loadJiraConfig } from '../../common/config.js';
import { logger } from '../../common/logger.js';

export function registerJiraTools(server: McpServer) {
    try {
        const config = loadJiraConfig();
        const client = createJiraClient(config);

        const issueApi = new JiraIssueApi(client);
        const searchApi = new JiraSearchApi(client);
        const transitionApi = new JiraTransitionApi(client);
        const commentApi = new JiraCommentApi(client);
        const projectApi = new JiraProjectApi(client);

        // 이슈 상세 조회
        server.tool(
            'jira_get_issue',
            'TDE JIRA 이슈를 상세 조회합니다. 이슈 키(예: PROJ-123)로 조회하며, 필드 목록을 지정할 수 있습니다.',
            {
                issueKey: z.string().describe('이슈 키 (예: PROJ-123)'),
                fields: z
                    .array(z.string())
                    .optional()
                    .describe('조회할 필드 목록 (미지정 시 전체)'),
            },
            async ({ issueKey, fields }) => {
                const issue = await issueApi.getIssue(issueKey, fields);
                const f = issue.fields;

                const lines = [
                    `Key: ${issue.key}`,
                    `Summary: ${f.summary}`,
                    `Status: ${f.status?.name || 'N/A'}`,
                    `Type: ${f.issuetype?.name || 'N/A'}`,
                    `Priority: ${f.priority?.name || 'N/A'}`,
                    `Assignee: ${f.assignee?.displayName || '미배정'}`,
                    `Reporter: ${f.reporter?.displayName || 'N/A'}`,
                    `Labels: ${f.labels?.join(', ') || '없음'}`,
                    `Created: ${f.created || 'N/A'}`,
                    `Updated: ${f.updated || 'N/A'}`,
                ];

                if (f.parent) {
                    lines.push(`Parent: ${f.parent.key} - ${f.parent.fields?.summary || ''}`);
                }

                if (f.description) {
                    lines.push('', '--- Description ---', f.description);
                }

                if (f.subtasks && f.subtasks.length > 0) {
                    lines.push(
                        '',
                        '--- Subtasks ---',
                        ...f.subtasks.map(
                            (st) => `- [${st.key}] ${st.fields.summary} (${st.fields.status.name})`,
                        ),
                    );
                }

                return {
                    content: [{ type: 'text', text: lines.join('\n') }],
                };
            },
        );

        // 이슈 생성
        server.tool(
            'jira_create_issue',
            'TDE JIRA에 새 이슈를 생성합니다.',
            {
                projectKey: z.string().describe('프로젝트 키 (예: PROJ)'),
                summary: z.string().describe('이슈 제목'),
                issueType: z.string().describe('이슈 유형 (예: Task, Bug, Story, Sub-task)'),
                description: z.string().optional().describe('이슈 설명'),
                assignee: z.string().optional().describe('담당자 사용자 이름'),
                priority: z.string().optional().describe('우선순위 (예: High, Medium, Low)'),
                labels: z.array(z.string()).optional().describe('라벨 목록'),
                components: z.array(z.string()).optional().describe('컴포넌트 이름 목록'),
                parentKey: z
                    .string()
                    .optional()
                    .describe('상위 이슈 키 (Sub-task 생성 시)'),
            },
            async ({ projectKey, summary, issueType, description, assignee, priority, labels, components, parentKey }) => {
                const issue = await issueApi.createIssue({
                    projectKey,
                    summary,
                    issueType,
                    description,
                    assignee,
                    priority,
                    labels,
                    components,
                    parentKey,
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `이슈 생성 성공: ${issue.key}\nURL: ${config.baseUrl}/browse/${issue.key}`,
                        },
                    ],
                };
            },
        );

        // 이슈 수정
        server.tool(
            'jira_update_issue',
            'TDE JIRA 이슈를 수정합니다.',
            {
                issueKey: z.string().describe('이슈 키'),
                summary: z.string().optional().describe('이슈 제목'),
                description: z.string().optional().describe('이슈 설명'),
                assignee: z.string().optional().describe('담당자 (빈 문자열로 배정 해제)'),
                priority: z.string().optional().describe('우선순위'),
                labels: z.array(z.string()).optional().describe('라벨 목록 (전체 교체)'),
                components: z.array(z.string()).optional().describe('컴포넌트 목록 (전체 교체)'),
            },
            async ({ issueKey, summary, description, assignee, priority, labels, components }) => {
                await issueApi.updateIssue(issueKey, {
                    summary,
                    description,
                    assignee,
                    priority,
                    labels,
                    components,
                });

                return {
                    content: [{ type: 'text', text: `이슈 수정 성공: ${issueKey}` }],
                };
            },
        );

        // JQL 검색
        server.tool(
            'jira_search_issues',
            'TDE JIRA에서 JQL(JIRA Query Language)로 이슈를 검색합니다.',
            {
                jql: z.string().describe('JQL 쿼리 (예: project = PROJ AND status = Open)'),
                maxResults: z.number().default(20).describe('최대 결과 수'),
                fields: z
                    .array(z.string())
                    .optional()
                    .describe('조회할 필드 목록'),
            },
            async ({ jql, maxResults, fields }) => {
                const result = await searchApi.searchByJql(jql, 0, maxResults, fields);
                const summary = result.issues
                    .map(
                        (i) =>
                            `- [${i.key}] ${i.fields.summary} (${i.fields.status?.name || 'N/A'}, ${i.fields.assignee?.displayName || '미배정'})`,
                    )
                    .join('\n');

                return {
                    content: [
                        {
                            type: 'text',
                            text: `검색 결과 (${result.issues.length}/${result.total}):\n${summary}`,
                        },
                    ],
                };
            },
        );

        // 상태 변경 (트랜지션)
        server.tool(
            'jira_transition_issue',
            'TDE JIRA 이슈의 상태를 변경합니다. 가능한 트랜지션 목록 조회 또는 트랜지션 실행을 할 수 있습니다.',
            {
                issueKey: z.string().describe('이슈 키'),
                action: z
                    .enum(['list', 'do'])
                    .describe('작업 유형: list(가능한 트랜지션 조회), do(트랜지션 실행)'),
                transitionId: z
                    .string()
                    .optional()
                    .describe('트랜지션 ID (do 작업 시 필수)'),
            },
            async ({ issueKey, action, transitionId }) => {
                if (action === 'list') {
                    const transitions = await transitionApi.getTransitions(issueKey);
                    const summary = transitions
                        .map((t) => `- [${t.id}] ${t.name} → ${t.to.name}`)
                        .join('\n');
                    return {
                        content: [
                            { type: 'text', text: `가능한 트랜지션:\n${summary}` },
                        ],
                    };
                } else {
                    if (!transitionId) {
                        throw new Error('트랜지션 ID를 입력해주세요.');
                    }
                    await transitionApi.doTransition(issueKey, transitionId);
                    return {
                        content: [
                            { type: 'text', text: `트랜지션 완료: ${issueKey}` },
                        ],
                    };
                }
            },
        );

        // 코멘트 관리
        server.tool(
            'jira_manage_comments',
            'TDE JIRA 이슈의 코멘트를 관리합니다. 조회, 추가, 수정, 삭제 기능을 제공합니다.',
            {
                issueKey: z.string().describe('이슈 키'),
                action: z
                    .enum(['list', 'add', 'update', 'delete'])
                    .describe('작업 유형'),
                body: z
                    .string()
                    .optional()
                    .describe('코멘트 내용 (add, update 시 필수)'),
                commentId: z
                    .string()
                    .optional()
                    .describe('코멘트 ID (update, delete 시 필수)'),
            },
            async ({ issueKey, action, body, commentId }) => {
                if (action === 'list') {
                    const result = await commentApi.getComments(issueKey);
                    const summary = result.comments
                        .map(
                            (c) =>
                                `- [${c.id}] ${c.author.displayName} (${c.created}):\n  ${c.body.substring(0, 200)}`,
                        )
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `코멘트 목록 (${result.comments.length}/${result.total}):\n${summary}`,
                            },
                        ],
                    };
                } else if (action === 'add') {
                    if (!body) throw new Error('코멘트 내용을 입력해주세요.');
                    const comment = await commentApi.addComment(issueKey, body);
                    return {
                        content: [
                            { type: 'text', text: `코멘트 추가 성공 (ID: ${comment.id})` },
                        ],
                    };
                } else if (action === 'update') {
                    if (!commentId) throw new Error('코멘트 ID를 입력해주세요.');
                    if (!body) throw new Error('코멘트 내용을 입력해주세요.');
                    await commentApi.updateComment(issueKey, commentId, body);
                    return {
                        content: [{ type: 'text', text: `코멘트 수정 성공 (ID: ${commentId})` }],
                    };
                } else {
                    if (!commentId) throw new Error('코멘트 ID를 입력해주세요.');
                    await commentApi.deleteComment(issueKey, commentId);
                    return {
                        content: [{ type: 'text', text: `코멘트 삭제 성공 (ID: ${commentId})` }],
                    };
                }
            },
        );

        // 프로젝트/보드 조회
        server.tool(
            'jira_get_projects',
            'TDE JIRA 프로젝트 목록 또는 Agile 보드/스프린트를 조회합니다.',
            {
                action: z
                    .enum(['projects', 'project', 'boards', 'sprints'])
                    .describe('조회 유형'),
                projectKey: z
                    .string()
                    .optional()
                    .describe('프로젝트 키 (project, boards 조회 시)'),
                boardId: z
                    .number()
                    .optional()
                    .describe('보드 ID (sprints 조회 시 필수)'),
                sprintState: z
                    .string()
                    .optional()
                    .describe('스프린트 상태 필터 (active, closed, future)'),
            },
            async ({ action, projectKey, boardId, sprintState }) => {
                if (action === 'projects') {
                    const projects = await projectApi.getProjects();
                    const summary = projects
                        .map((p) => `- [${p.key}] ${p.name} (Lead: ${p.lead?.displayName || 'N/A'})`)
                        .join('\n');
                    return {
                        content: [{ type: 'text', text: `프로젝트 목록:\n${summary}` }],
                    };
                } else if (action === 'project') {
                    if (!projectKey) throw new Error('프로젝트 키를 입력해주세요.');
                    const project = await projectApi.getProject(projectKey);
                    const issueTypes = project.issueTypes
                        ?.map((t) => t.name)
                        .join(', ');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `프로젝트: ${project.name} (${project.key})\nLead: ${project.lead?.displayName || 'N/A'}\nIssue Types: ${issueTypes || 'N/A'}`,
                            },
                        ],
                    };
                } else if (action === 'boards') {
                    const result = await projectApi.getBoards(projectKey);
                    const summary = result.values
                        .map((b) => `- [${b.id}] ${b.name} (${b.type})`)
                        .join('\n');
                    return {
                        content: [{ type: 'text', text: `보드 목록:\n${summary}` }],
                    };
                } else {
                    if (!boardId) throw new Error('보드 ID를 입력해주세요.');
                    const result = await projectApi.getSprints(boardId, sprintState);
                    const summary = result.values
                        .map(
                            (s) =>
                                `- [${s.id}] ${s.name} (${s.state})${s.goal ? ' - ' + s.goal : ''}`,
                        )
                        .join('\n');
                    return {
                        content: [{ type: 'text', text: `스프린트 목록:\n${summary}` }],
                    };
                }
            },
        );
    } catch (error) {
        logger.warn(
            `JIRA 설정 로드 실패 또는 도구 등록 중 오류 발생: ${(error as Error).message}`,
        );
    }
}
