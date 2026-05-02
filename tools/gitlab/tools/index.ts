import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabProjectApi } from '../api/project.js';
import { GitlabMergeRequestApi } from '../api/merge-request.js';
import { GitlabPipelineApi } from '../api/pipeline.js';
import { GitlabBranchApi } from '../api/branch.js';
import { GitlabRepositoryApi } from '../api/repository.js';
import { createGitlabClient } from '../api/client.js';
import { loadGitlabConfig } from '../../common/config.js';
import { logger } from '../../common/logger.js';

export function registerGitlabTools(server: McpServer) {
    try {
        const config = loadGitlabConfig();
        const client = createGitlabClient(config);

        const projectApi = new GitlabProjectApi(client);
        const mrApi = new GitlabMergeRequestApi(client);
        const pipelineApi = new GitlabPipelineApi(client);
        const branchApi = new GitlabBranchApi(client);
        const repoApi = new GitlabRepositoryApi(client);

        // 1. 프로젝트 조회
        server.tool(
            'gitlab_get_project',
            'TDE GitLab 프로젝트를 조회합니다. projectId 지정 시 상세 조회, 미지정 시 목록 조회합니다.',
            {
                projectId: z
                    .number()
                    .optional()
                    .describe('프로젝트 ID (지정 시 상세 조회)'),
                search: z.string().optional().describe('프로젝트명 검색 (목록 조회 시)'),
                owned: z.boolean().optional().describe('소유 프로젝트만 필터'),
                membership: z.boolean().optional().describe('멤버십 프로젝트만 필터'),
            },
            async ({ projectId, search, owned, membership }) => {
                if (projectId) {
                    const project = await projectApi.getProject(projectId);
                    const lines = [
                        `ID: ${project.id}`,
                        `Name: ${project.name_with_namespace}`,
                        `Path: ${project.path_with_namespace}`,
                        `Default Branch: ${project.default_branch}`,
                        `Visibility: ${project.visibility}`,
                        `Web URL: ${project.web_url}`,
                        `SSH URL: ${project.ssh_url_to_repo}`,
                        `HTTP URL: ${project.http_url_to_repo}`,
                        `Last Activity: ${project.last_activity_at}`,
                    ];
                    if (project.description) {
                        lines.push(`Description: ${project.description}`);
                    }
                    return { content: [{ type: 'text', text: lines.join('\n') }] };
                } else {
                    const projects = await projectApi.getProjects({
                        search,
                        owned,
                        membership,
                    });
                    const summary = projects
                        .map(
                            (p) =>
                                `- [${p.id}] ${p.name_with_namespace} (${p.visibility}) - ${p.web_url}`,
                        )
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `프로젝트 목록 (${projects.length}건):\n${summary}`,
                            },
                        ],
                    };
                }
            },
        );

        // 2. MR 조회
        server.tool(
            'gitlab_get_merge_request',
            'TDE GitLab Merge Request를 조회합니다. mrIid 지정 시 상세 조회, 미지정 시 목록 조회합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                mrIid: z.number().optional().describe('MR IID (지정 시 상세 조회)'),
                state: z
                    .enum(['opened', 'closed', 'merged', 'all'])
                    .optional()
                    .describe('상태 필터 (목록 조회 시)'),
                includeChanges: z
                    .boolean()
                    .optional()
                    .describe('변경 파일 포함 여부 (상세 조회 시)'),
            },
            async ({ projectId, mrIid, state, includeChanges }) => {
                if (mrIid) {
                    const mr = includeChanges
                        ? await mrApi.getMergeRequestChanges(projectId, mrIid)
                        : await mrApi.getMergeRequest(projectId, mrIid);
                    const lines = [
                        `IID: !${mr.iid}`,
                        `Title: ${mr.title}`,
                        `State: ${mr.state}`,
                        `Source: ${mr.source_branch} → Target: ${mr.target_branch}`,
                        `Author: ${mr.author?.name || 'N/A'}`,
                        `Assignee: ${mr.assignee?.name || '미배정'}`,
                        `Merge Status: ${mr.merge_status}`,
                        `Has Conflicts: ${mr.has_conflicts}`,
                        `Pipeline: ${mr.pipeline?.status || 'N/A'}`,
                        `Web URL: ${mr.web_url}`,
                        `Created: ${mr.created_at}`,
                        `Updated: ${mr.updated_at}`,
                    ];
                    if (mr.description) {
                        lines.push('', '--- Description ---', mr.description);
                    }
                    if (mr.changes && mr.changes.length > 0) {
                        lines.push(
                            '',
                            `--- Changes (${mr.changes.length}개 파일) ---`,
                            ...mr.changes.map(
                                (c) =>
                                    `- ${c.new_file ? '[NEW] ' : c.deleted_file ? '[DEL] ' : c.renamed_file ? '[REN] ' : ''}${c.new_path}`,
                            ),
                        );
                    }
                    return { content: [{ type: 'text', text: lines.join('\n') }] };
                } else {
                    const mrs = await mrApi.getMergeRequests(projectId, { state });
                    const summary = mrs
                        .map(
                            (m) =>
                                `- [!${m.iid}] ${m.title} (${m.state}, ${m.source_branch} → ${m.target_branch}) by ${m.author?.name || 'N/A'}`,
                        )
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `MR 목록 (${mrs.length}건):\n${summary}`,
                            },
                        ],
                    };
                }
            },
        );

        // 3. MR 생성
        server.tool(
            'gitlab_create_merge_request',
            'TDE GitLab에 새 Merge Request를 생성합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                sourceBranch: z.string().describe('소스 브랜치'),
                targetBranch: z.string().describe('타겟 브랜치'),
                title: z.string().describe('MR 제목'),
                description: z.string().optional().describe('MR 설명'),
            },
            async ({ projectId, sourceBranch, targetBranch, title, description }) => {
                const mr = await mrApi.createMergeRequest(projectId, {
                    source_branch: sourceBranch,
                    target_branch: targetBranch,
                    title,
                    description,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `MR 생성 성공: !${mr.iid}\nTitle: ${mr.title}\nURL: ${mr.web_url}`,
                        },
                    ],
                };
            },
        );

        // 4. MR 관리 (머지/닫기/재열기/코멘트)
        server.tool(
            'gitlab_manage_merge_request',
            'TDE GitLab MR를 관리합니다. 머지, 닫기, 재열기, 코멘트 추가 작업을 수행합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                mrIid: z.number().describe('MR IID'),
                action: z
                    .enum(['merge', 'close', 'reopen', 'comment'])
                    .describe('작업 유형'),
                comment: z.string().optional().describe('코멘트 내용 (action=comment 시 필수)'),
                squash: z.boolean().optional().describe('스쿼시 머지 (action=merge 시)'),
                removeSourceBranch: z
                    .boolean()
                    .optional()
                    .describe('소스 브랜치 삭제 (action=merge 시)'),
            },
            async ({ projectId, mrIid, action, comment, squash, removeSourceBranch }) => {
                if (action === 'merge') {
                    const mr = await mrApi.mergeMergeRequest(projectId, mrIid, {
                        squash,
                        should_remove_source_branch: removeSourceBranch,
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `MR !${mrIid} 머지 성공\nState: ${mr.state}`,
                            },
                        ],
                    };
                } else if (action === 'close' || action === 'reopen') {
                    const mr = await mrApi.updateMergeRequest(projectId, mrIid, {
                        state_event: action,
                    });
                    const msg = action === 'close' ? '닫기' : '재열기';
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `MR !${mrIid} ${msg} 성공\nState: ${mr.state}`,
                            },
                        ],
                    };
                } else {
                    if (!comment) throw new Error('코멘트 내용을 입력해주세요.');
                    const note = await mrApi.addMergeRequestNote(projectId, mrIid, comment);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `MR !${mrIid}에 코멘트 추가 성공 (ID: ${note.id})`,
                            },
                        ],
                    };
                }
            },
        );

        // 5. 파이프라인 조회
        server.tool(
            'gitlab_get_pipelines',
            'TDE GitLab CI/CD 파이프라인을 조회합니다. pipelineId 지정 시 상세 조회, 미지정 시 목록 조회합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                pipelineId: z.number().optional().describe('파이프라인 ID (지정 시 상세 조회)'),
                status: z.string().optional().describe('상태 필터 (running, success, failed 등)'),
                ref: z.string().optional().describe('브랜치/태그 필터'),
                includeJobs: z.boolean().optional().describe('작업(Job) 목록 포함 여부'),
            },
            async ({ projectId, pipelineId, status, ref, includeJobs }) => {
                if (pipelineId) {
                    const pipeline = await pipelineApi.getPipeline(projectId, pipelineId);
                    const lines = [
                        `ID: ${pipeline.id}`,
                        `Status: ${pipeline.status}`,
                        `Ref: ${pipeline.ref}`,
                        `SHA: ${pipeline.sha}`,
                        `Created: ${pipeline.created_at}`,
                        `Duration: ${pipeline.duration ? pipeline.duration + 's' : 'N/A'}`,
                        `Web URL: ${pipeline.web_url}`,
                    ];
                    if (includeJobs) {
                        const jobs = await pipelineApi.getPipelineJobs(projectId, pipelineId);
                        lines.push(
                            '',
                            `--- Jobs (${jobs.length}개) ---`,
                            ...jobs.map(
                                (j) =>
                                    `- [${j.stage}] ${j.name}: ${j.status} (${j.duration ? j.duration + 's' : 'N/A'})`,
                            ),
                        );
                    }
                    return { content: [{ type: 'text', text: lines.join('\n') }] };
                } else {
                    const pipelines = await pipelineApi.getPipelines(projectId, {
                        status,
                        ref,
                    });
                    const summary = pipelines
                        .map(
                            (p) =>
                                `- [${p.id}] ${p.status} (ref: ${p.ref}, sha: ${p.sha.substring(0, 8)}) ${p.web_url}`,
                        )
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `파이프라인 목록 (${pipelines.length}건):\n${summary}`,
                            },
                        ],
                    };
                }
            },
        );

        // 6. 브랜치 관리
        server.tool(
            'gitlab_manage_branches',
            'TDE GitLab 브랜치를 관리합니다. 목록 조회, 상세 조회, 생성, 삭제 작업을 수행합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                action: z
                    .enum(['list', 'get', 'create', 'delete'])
                    .describe('작업 유형'),
                branchName: z
                    .string()
                    .optional()
                    .describe('브랜치 이름 (get/create/delete 시 필수)'),
                ref: z.string().optional().describe('기준 ref (create 시 필수)'),
                search: z.string().optional().describe('검색 키워드 (list 시)'),
            },
            async ({ projectId, action, branchName, ref, search }) => {
                if (action === 'list') {
                    const branches = await branchApi.getBranches(projectId, { search });
                    const summary = branches
                        .map(
                            (b) =>
                                `- ${b.name}${b.default ? ' [default]' : ''}${b.protected ? ' [protected]' : ''} (${b.commit.short_id}: ${b.commit.message.split('\n')[0]})`,
                        )
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `브랜치 목록 (${branches.length}건):\n${summary}`,
                            },
                        ],
                    };
                } else if (action === 'get') {
                    if (!branchName) throw new Error('브랜치 이름을 입력해주세요.');
                    const branch = await branchApi.getBranch(projectId, branchName);
                    const lines = [
                        `Name: ${branch.name}`,
                        `Default: ${branch.default}`,
                        `Protected: ${branch.protected}`,
                        `Merged: ${branch.merged}`,
                        `Commit: ${branch.commit.id}`,
                        `Message: ${branch.commit.message}`,
                        `Author: ${branch.commit.author_name}`,
                        `Date: ${branch.commit.authored_date}`,
                    ];
                    return { content: [{ type: 'text', text: lines.join('\n') }] };
                } else if (action === 'create') {
                    if (!branchName) throw new Error('브랜치 이름을 입력해주세요.');
                    if (!ref) throw new Error('기준 ref를 입력해주세요.');
                    const branch = await branchApi.createBranch(projectId, branchName, ref);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `브랜치 생성 성공: ${branch.name} (from ${ref})`,
                            },
                        ],
                    };
                } else {
                    if (!branchName) throw new Error('브랜치 이름을 입력해주세요.');
                    await branchApi.deleteBranch(projectId, branchName);
                    return {
                        content: [
                            { type: 'text', text: `브랜치 삭제 성공: ${branchName}` },
                        ],
                    };
                }
            },
        );

        // 7. 파일/트리 조회
        server.tool(
            'gitlab_get_file',
            'TDE GitLab 저장소의 파일 내용 또는 디렉토리 트리를 조회합니다.',
            {
                projectId: z.number().describe('프로젝트 ID'),
                path: z.string().describe('파일 경로 또는 디렉토리 경로'),
                ref: z.string().optional().describe('브랜치/태그/커밋 (기본: 기본 브랜치)'),
                type: z
                    .enum(['file', 'tree'])
                    .optional()
                    .describe('"file" (기본) 또는 "tree"'),
                recursive: z.boolean().optional().describe('재귀 조회 (type=tree 시)'),
            },
            async ({ projectId, path, ref, type, recursive }) => {
                if (type === 'tree') {
                    const entries = await repoApi.getTree(projectId, {
                        path,
                        ref,
                        recursive,
                    });
                    const summary = entries
                        .map((e) => `${e.type === 'tree' ? '📁' : '📄'} ${e.path}`)
                        .join('\n');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `디렉토리 트리 (${entries.length}개 항목):\n${summary}`,
                            },
                        ],
                    };
                } else {
                    const file = await repoApi.getFile(projectId, path, ref);
                    const lines = [
                        `File: ${file.file_path}`,
                        `Size: ${file.size} bytes`,
                        `Ref: ${file.ref}`,
                        `Last Commit: ${file.last_commit_id}`,
                        '',
                        '--- Content ---',
                        file.content,
                    ];
                    return { content: [{ type: 'text', text: lines.join('\n') }] };
                }
            },
        );
    } catch (error) {
        logger.warn(
            `GitLab 설정 로드 실패 또는 도구 등록 중 오류 발생: ${(error as Error).message}`,
        );
    }
}
