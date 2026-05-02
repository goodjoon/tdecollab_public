import { Command } from 'commander';
import { GitlabProjectApi } from '../api/project.js';
import { GitlabMergeRequestApi } from '../api/merge-request.js';
import { GitlabPipelineApi } from '../api/pipeline.js';
import { GitlabBranchApi } from '../api/branch.js';
import { GitlabRepositoryApi } from '../api/repository.js';
import { createGitlabClient } from '../api/client.js';
import { loadGitlabConfig } from '../../common/config.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function registerGitlabCommands(program: Command) {
    const gitlabCmd = program.command('gitlab').description('GitLab 관리');

    const initClient = () => {
        try {
            const config = loadGitlabConfig();
            return createGitlabClient(config);
        } catch (e: any) {
            console.error(chalk.red(`설정 로드 실패: ${e.message}`));
            process.exit(1);
        }
    };

    // --- Project Commands ---
    const projectCmd = gitlabCmd.command('project').description('프로젝트 관리');

    projectCmd
        .command('list')
        .option('-s, --search <query>', '프로젝트명 검색')
        .option('--owned', '소유 프로젝트만')
        .option('--membership', '멤버십 프로젝트만')
        .description('프로젝트 목록 조회')
        .action(async (options) => {
            const client = initClient();
            const api = new GitlabProjectApi(client);
            try {
                const projects = await api.getProjects({
                    search: options.search,
                    owned: options.owned,
                    membership: options.membership,
                });
                const table = new Table({
                    head: ['ID', 'Name', 'Visibility', 'Default Branch', 'Last Activity'],
                    style: { head: ['cyan'] },
                });
                projects.forEach((p) =>
                    table.push([
                        p.id.toString(),
                        p.name_with_namespace,
                        p.visibility,
                        p.default_branch || 'N/A',
                        p.last_activity_at?.substring(0, 10) || 'N/A',
                    ]),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    projectCmd
        .command('get <projectId>')
        .description('프로젝트 상세 조회')
        .action(async (projectId) => {
            const client = initClient();
            const api = new GitlabProjectApi(client);
            try {
                const p = await api.getProject(parseInt(projectId));
                console.log(chalk.bold(p.name_with_namespace));
                console.log(`ID: ${p.id}`);
                console.log(`Path: ${p.path_with_namespace}`);
                console.log(`Default Branch: ${p.default_branch}`);
                console.log(`Visibility: ${p.visibility}`);
                console.log(`Web URL: ${p.web_url}`);
                console.log(`SSH URL: ${p.ssh_url_to_repo}`);
                console.log(`HTTP URL: ${p.http_url_to_repo}`);
                console.log(`Last Activity: ${p.last_activity_at}`);
                if (p.description) console.log(`Description: ${p.description}`);
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- MR Commands ---
    const mrCmd = gitlabCmd.command('mr').description('Merge Request 관리');

    mrCmd
        .command('list <projectId>')
        .option('-s, --state <state>', '상태 필터 (opened/closed/merged/all)', 'opened')
        .option('--scope <scope>', '범위 (created_by_me/assigned_to_me)')
        .description('MR 목록 조회')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                const mrs = await api.getMergeRequests(parseInt(projectId), {
                    state: options.state,
                    scope: options.scope,
                });
                const table = new Table({
                    head: ['IID', 'Title', 'State', 'Source → Target', 'Author'],
                    style: { head: ['cyan'] },
                });
                mrs.forEach((m) =>
                    table.push([
                        `!${m.iid}`,
                        m.title.substring(0, 50),
                        m.state,
                        `${m.source_branch} → ${m.target_branch}`,
                        m.author?.name || 'N/A',
                    ]),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    mrCmd
        .command('get <projectId> <mrIid>')
        .option('-c, --changes', '변경 파일 포함')
        .description('MR 상세 조회')
        .action(async (projectId, mrIid, options) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                const mr = options.changes
                    ? await api.getMergeRequestChanges(parseInt(projectId), parseInt(mrIid))
                    : await api.getMergeRequest(parseInt(projectId), parseInt(mrIid));

                console.log(chalk.bold(`[!${mr.iid}] ${mr.title}`));
                console.log(`State: ${mr.state}`);
                console.log(`Source: ${mr.source_branch} → Target: ${mr.target_branch}`);
                console.log(`Author: ${mr.author?.name || 'N/A'}`);
                console.log(`Assignee: ${mr.assignee?.name || '미배정'}`);
                console.log(`Merge Status: ${mr.merge_status}`);
                console.log(`Has Conflicts: ${mr.has_conflicts}`);
                console.log(`Pipeline: ${mr.pipeline?.status || 'N/A'}`);
                console.log(`URL: ${mr.web_url}`);

                if (mr.description) {
                    console.log(chalk.dim('\n--- Description ---'));
                    console.log(mr.description);
                }

                if (mr.changes && mr.changes.length > 0) {
                    console.log(chalk.dim(`\n--- Changes (${mr.changes.length}개 파일) ---`));
                    mr.changes.forEach((c) => {
                        const prefix = c.new_file
                            ? '[NEW]'
                            : c.deleted_file
                              ? '[DEL]'
                              : c.renamed_file
                                ? '[REN]'
                                : '[MOD]';
                        console.log(`  ${prefix} ${c.new_path}`);
                    });
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    mrCmd
        .command('create <projectId>')
        .requiredOption('--source <branch>', '소스 브랜치')
        .requiredOption('--target <branch>', '타겟 브랜치')
        .requiredOption('--title <text>', 'MR 제목')
        .option('-d, --description <text>', 'MR 설명')
        .description('MR 생성')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                const mr = await api.createMergeRequest(parseInt(projectId), {
                    source_branch: options.source,
                    target_branch: options.target,
                    title: options.title,
                    description: options.description,
                });
                console.log(chalk.green(`MR 생성 완료: !${mr.iid}`));
                console.log(`URL: ${mr.web_url}`);
            } catch (e: any) {
                console.error(chalk.red(`생성 실패: ${e.message}`));
            }
        });

    mrCmd
        .command('merge <projectId> <mrIid>')
        .option('--squash', '스쿼시 머지')
        .option('--remove-source-branch', '소스 브랜치 삭제')
        .description('MR 머지')
        .action(async (projectId, mrIid, options) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                const mr = await api.mergeMergeRequest(parseInt(projectId), parseInt(mrIid), {
                    squash: options.squash,
                    should_remove_source_branch: options.removeSourceBranch,
                });
                console.log(chalk.green(`MR !${mrIid} 머지 완료`));
                console.log(`State: ${mr.state}`);
            } catch (e: any) {
                console.error(chalk.red(`머지 실패: ${e.message}`));
            }
        });

    mrCmd
        .command('close <projectId> <mrIid>')
        .description('MR 닫기')
        .action(async (projectId, mrIid) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                await api.updateMergeRequest(parseInt(projectId), parseInt(mrIid), {
                    state_event: 'close',
                });
                console.log(chalk.green(`MR !${mrIid} 닫기 완료`));
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    mrCmd
        .command('comment <projectId> <mrIid>')
        .requiredOption('-b, --body <text>', '코멘트 내용')
        .description('MR 코멘트 추가')
        .action(async (projectId, mrIid, options) => {
            const client = initClient();
            const api = new GitlabMergeRequestApi(client);
            try {
                const note = await api.addMergeRequestNote(
                    parseInt(projectId),
                    parseInt(mrIid),
                    options.body,
                );
                console.log(chalk.green(`코멘트 추가 완료 (ID: ${note.id})`));
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- Pipeline Commands ---
    const pipelineCmd = gitlabCmd.command('pipeline').description('파이프라인 관리');

    pipelineCmd
        .command('list <projectId>')
        .option('-s, --status <status>', '상태 필터')
        .option('-r, --ref <branch>', '브랜치/태그 필터')
        .description('파이프라인 목록 조회')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabPipelineApi(client);
            try {
                const pipelines = await api.getPipelines(parseInt(projectId), {
                    status: options.status,
                    ref: options.ref,
                });
                const table = new Table({
                    head: ['ID', 'Status', 'Ref', 'SHA', 'Created'],
                    style: { head: ['cyan'] },
                });
                pipelines.forEach((p) =>
                    table.push([
                        p.id.toString(),
                        p.status,
                        p.ref,
                        p.sha.substring(0, 8),
                        p.created_at?.substring(0, 10) || 'N/A',
                    ]),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    pipelineCmd
        .command('get <projectId> <pipelineId>')
        .option('-j, --jobs', '작업 목록 포함')
        .description('파이프라인 상세 조회')
        .action(async (projectId, pipelineId, options) => {
            const client = initClient();
            const api = new GitlabPipelineApi(client);
            try {
                const p = await api.getPipeline(parseInt(projectId), parseInt(pipelineId));
                console.log(chalk.bold(`Pipeline #${p.id}`));
                console.log(`Status: ${p.status}`);
                console.log(`Ref: ${p.ref}`);
                console.log(`SHA: ${p.sha}`);
                console.log(`Duration: ${p.duration ? p.duration + 's' : 'N/A'}`);
                console.log(`URL: ${p.web_url}`);

                if (options.jobs) {
                    const jobs = await api.getPipelineJobs(
                        parseInt(projectId),
                        parseInt(pipelineId),
                    );
                    console.log(chalk.dim(`\n--- Jobs (${jobs.length}개) ---`));
                    const table = new Table({
                        head: ['Stage', 'Name', 'Status', 'Duration'],
                        style: { head: ['cyan'] },
                    });
                    jobs.forEach((j) =>
                        table.push([
                            j.stage,
                            j.name,
                            j.status,
                            j.duration ? j.duration + 's' : 'N/A',
                        ]),
                    );
                    console.log(table.toString());
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- Branch Commands ---
    const branchCmd = gitlabCmd.command('branch').description('브랜치 관리');

    branchCmd
        .command('list <projectId>')
        .option('-s, --search <query>', '검색 키워드')
        .description('브랜치 목록 조회')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabBranchApi(client);
            try {
                const branches = await api.getBranches(parseInt(projectId), {
                    search: options.search,
                });
                const table = new Table({
                    head: ['Name', 'Commit', 'Message', 'Protected', 'Default'],
                    style: { head: ['cyan'] },
                });
                branches.forEach((b) =>
                    table.push([
                        b.name,
                        b.commit.short_id,
                        b.commit.message.split('\n')[0].substring(0, 40),
                        b.protected ? 'Yes' : 'No',
                        b.default ? 'Yes' : 'No',
                    ]),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    branchCmd
        .command('get <projectId> <branchName>')
        .description('브랜치 상세 조회')
        .action(async (projectId, branchName) => {
            const client = initClient();
            const api = new GitlabBranchApi(client);
            try {
                const b = await api.getBranch(parseInt(projectId), branchName);
                console.log(chalk.bold(b.name));
                console.log(`Default: ${b.default}`);
                console.log(`Protected: ${b.protected}`);
                console.log(`Merged: ${b.merged}`);
                console.log(`Commit: ${b.commit.id}`);
                console.log(`Message: ${b.commit.message}`);
                console.log(`Author: ${b.commit.author_name}`);
                console.log(`Date: ${b.commit.authored_date}`);
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    branchCmd
        .command('create <projectId>')
        .requiredOption('-n, --name <branch>', '브랜치 이름')
        .requiredOption('-r, --ref <ref>', '기준 ref')
        .description('브랜치 생성')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabBranchApi(client);
            try {
                const b = await api.createBranch(
                    parseInt(projectId),
                    options.name,
                    options.ref,
                );
                console.log(chalk.green(`브랜치 생성 완료: ${b.name}`));
            } catch (e: any) {
                console.error(chalk.red(`생성 실패: ${e.message}`));
            }
        });

    branchCmd
        .command('delete <projectId> <branchName>')
        .description('브랜치 삭제')
        .action(async (projectId, branchName) => {
            const client = initClient();
            const api = new GitlabBranchApi(client);
            try {
                await api.deleteBranch(parseInt(projectId), branchName);
                console.log(chalk.green(`브랜치 삭제 완료: ${branchName}`));
            } catch (e: any) {
                console.error(chalk.red(`삭제 실패: ${e.message}`));
            }
        });

    // --- File Commands ---
    const fileCmd = gitlabCmd.command('file').description('파일 관리');

    fileCmd
        .command('get <projectId> <filePath>')
        .option('-r, --ref <ref>', '브랜치/태그/커밋')
        .description('파일 내용 조회')
        .action(async (projectId, filePath, options) => {
            const client = initClient();
            const api = new GitlabRepositoryApi(client);
            try {
                const file = await api.getFile(parseInt(projectId), filePath, options.ref);
                console.log(chalk.bold(file.file_path));
                console.log(chalk.gray(`Size: ${file.size} bytes | Ref: ${file.ref}`));
                console.log(chalk.dim('---'));
                console.log(file.content);
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    fileCmd
        .command('tree <projectId>')
        .option('-p, --path <dir>', '디렉토리 경로')
        .option('-r, --ref <ref>', '브랜치/태그')
        .option('--recursive', '재귀 조회')
        .description('디렉토리 트리 조회')
        .action(async (projectId, options) => {
            const client = initClient();
            const api = new GitlabRepositoryApi(client);
            try {
                const entries = await api.getTree(parseInt(projectId), {
                    path: options.path,
                    ref: options.ref,
                    recursive: options.recursive,
                });
                entries.forEach((e) => {
                    const icon = e.type === 'tree' ? '📁' : '📄';
                    console.log(`${icon} ${e.path}`);
                });
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });
}
