import { Command } from 'commander';
import { JiraIssueApi } from '../api/issue.js';
import { JiraSearchApi } from '../api/search.js';
import { JiraTransitionApi } from '../api/transition.js';
import { JiraCommentApi } from '../api/comment.js';
import { JiraProjectApi } from '../api/project.js';
import { createJiraClient } from '../api/client.js';
import { loadJiraConfig } from '../../common/config.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function registerJiraCommands(program: Command) {
    const jiraCmd = program.command('jira').description('JIRA 관리');

    const initClient = () => {
        try {
            const config = loadJiraConfig();
            return createJiraClient(config);
        } catch (e: any) {
            console.error(chalk.red(`설정 로드 실패: ${e.message}`));
            process.exit(1);
        }
    };

    // --- Issue Commands ---
    const issueCmd = jiraCmd.command('issue').description('이슈 관리');

    issueCmd
        .command('get <issueKey>')
        .description('이슈 조회')
        .action(async (issueKey) => {
            const client = initClient();
            const api = new JiraIssueApi(client);
            try {
                const issue = await api.getIssue(issueKey);
                const f = issue.fields;

                console.log(chalk.bold(`[${issue.key}] ${f.summary}`));
                console.log(chalk.gray(`Status: ${f.status?.name || 'N/A'}`));
                console.log(`Type: ${f.issuetype?.name || 'N/A'}`);
                console.log(`Priority: ${f.priority?.name || 'N/A'}`);
                console.log(`Assignee: ${f.assignee?.displayName || '미배정'}`);
                console.log(`Reporter: ${f.reporter?.displayName || 'N/A'}`);
                console.log(`Labels: ${f.labels?.join(', ') || '없음'}`);
                console.log(`Created: ${f.created || 'N/A'}`);
                console.log(`Updated: ${f.updated || 'N/A'}`);

                if (f.description) {
                    console.log(chalk.dim('\n--- Description ---'));
                    console.log(f.description);
                }

                if (f.subtasks && f.subtasks.length > 0) {
                    console.log(chalk.dim('\n--- Subtasks ---'));
                    f.subtasks.forEach((st) => {
                        console.log(`  - [${st.key}] ${st.fields.summary} (${st.fields.status.name})`);
                    });
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    issueCmd
        .command('create')
        .requiredOption('-p, --project <key>', '프로젝트 키')
        .requiredOption('-s, --summary <summary>', '이슈 제목')
        .requiredOption('-t, --type <type>', '이슈 유형 (Task, Bug, Story 등)')
        .option('-d, --description <desc>', '이슈 설명')
        .option('-a, --assignee <name>', '담당자')
        .option('--priority <priority>', '우선순위')
        .option('-l, --labels <labels>', '라벨 (쉼표 구분)')
        .option('--parent <key>', '상위 이슈 키 (Sub-task)')
        .description('이슈 생성')
        .action(async (options) => {
            const client = initClient();
            const api = new JiraIssueApi(client);
            try {
                const issue = await api.createIssue({
                    projectKey: options.project,
                    summary: options.summary,
                    issueType: options.type,
                    description: options.description,
                    assignee: options.assignee,
                    priority: options.priority,
                    labels: options.labels?.split(',').map((l: string) => l.trim()),
                    parentKey: options.parent,
                });
                const config = loadJiraConfig();
                console.log(chalk.green(`이슈 생성 완료: ${issue.key}`));
                console.log(`URL: ${config.baseUrl}/browse/${issue.key}`);
            } catch (e: any) {
                console.error(chalk.red(`생성 실패: ${e.message}`));
            }
        });

    issueCmd
        .command('update <issueKey>')
        .option('-s, --summary <summary>', '제목')
        .option('-d, --description <desc>', '설명')
        .option('-a, --assignee <name>', '담당자')
        .option('--priority <priority>', '우선순위')
        .option('-l, --labels <labels>', '라벨 (쉼표 구분)')
        .description('이슈 수정')
        .action(async (issueKey, options) => {
            const client = initClient();
            const api = new JiraIssueApi(client);
            try {
                await api.updateIssue(issueKey, {
                    summary: options.summary,
                    description: options.description,
                    assignee: options.assignee,
                    priority: options.priority,
                    labels: options.labels?.split(',').map((l: string) => l.trim()),
                });
                console.log(chalk.green(`이슈 수정 완료: ${issueKey}`));
            } catch (e: any) {
                console.error(chalk.red(`수정 실패: ${e.message}`));
            }
        });

    issueCmd
        .command('transition <issueKey>')
        .option('-l, --list', '가능한 트랜지션 조회')
        .option('-t, --transition <id>', '트랜지션 실행')
        .description('이슈 상태 변경')
        .action(async (issueKey, options) => {
            const client = initClient();
            const api = new JiraTransitionApi(client);
            try {
                if (options.list || !options.transition) {
                    const transitions = await api.getTransitions(issueKey);
                    const table = new Table({
                        head: ['ID', 'Name', 'To'],
                        style: { head: ['cyan'] },
                    });
                    transitions.forEach((t) => table.push([t.id, t.name, t.to.name]));
                    console.log(table.toString());
                } else {
                    await api.doTransition(issueKey, options.transition);
                    console.log(chalk.green(`트랜지션 완료: ${issueKey}`));
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- Search Command ---
    jiraCmd
        .command('search <jql>')
        .option('-n, --max <number>', '최대 결과 수', '20')
        .description('JQL 검색')
        .action(async (jql, options) => {
            const client = initClient();
            const api = new JiraSearchApi(client);
            try {
                const result = await api.searchByJql(jql, 0, parseInt(options.max));
                console.log(chalk.bold(`검색 결과: ${result.issues.length}건 (총 ${result.total}건)`));
                const table = new Table({
                    head: ['Key', 'Summary', 'Status', 'Assignee'],
                    style: { head: ['cyan'] },
                });
                result.issues.forEach((i) =>
                    table.push([
                        i.key,
                        i.fields.summary.substring(0, 60),
                        i.fields.status?.name || 'N/A',
                        i.fields.assignee?.displayName || '미배정',
                    ]),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`검색 실패: ${e.message}`));
            }
        });

    // --- Comment Commands ---
    const commentCmd = jiraCmd.command('comment').description('코멘트 관리');

    commentCmd
        .command('list <issueKey>')
        .description('코멘트 목록 조회')
        .action(async (issueKey) => {
            const client = initClient();
            const api = new JiraCommentApi(client);
            try {
                const result = await api.getComments(issueKey);
                result.comments.forEach((c) => {
                    console.log(chalk.bold(`[${c.id}] ${c.author.displayName} (${c.created})`));
                    console.log(c.body);
                    console.log(chalk.dim('---'));
                });
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    commentCmd
        .command('add <issueKey> <body>')
        .description('코멘트 추가')
        .action(async (issueKey, body) => {
            const client = initClient();
            const api = new JiraCommentApi(client);
            try {
                const comment = await api.addComment(issueKey, body);
                console.log(chalk.green(`코멘트 추가 완료 (ID: ${comment.id})`));
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- Project Commands ---
    const projectCmd = jiraCmd.command('project').description('프로젝트 관리');

    projectCmd
        .command('list')
        .description('프로젝트 목록 조회')
        .action(async () => {
            const client = initClient();
            const api = new JiraProjectApi(client);
            try {
                const projects = await api.getProjects();
                const table = new Table({
                    head: ['Key', 'Name', 'Lead'],
                    style: { head: ['cyan'] },
                });
                projects.forEach((p) =>
                    table.push([p.key, p.name, p.lead?.displayName || 'N/A']),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    projectCmd
        .command('get <projectKey>')
        .description('프로젝트 상세 조회')
        .action(async (projectKey) => {
            const client = initClient();
            const api = new JiraProjectApi(client);
            try {
                const project = await api.getProject(projectKey);
                console.log(chalk.bold(`${project.name} (${project.key})`));
                console.log(`Lead: ${project.lead?.displayName || 'N/A'}`);
                if (project.issueTypes) {
                    console.log(
                        `Issue Types: ${project.issueTypes.map((t) => t.name).join(', ')}`,
                    );
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    // --- Board Commands ---
    const boardCmd = jiraCmd.command('board').description('Agile 보드 관리');

    boardCmd
        .command('list')
        .option('-p, --project <key>', '프로젝트 키')
        .description('보드 목록 조회')
        .action(async (options) => {
            const client = initClient();
            const api = new JiraProjectApi(client);
            try {
                const result = await api.getBoards(options.project);
                const table = new Table({
                    head: ['ID', 'Name', 'Type'],
                    style: { head: ['cyan'] },
                });
                result.values.forEach((b) => table.push([b.id.toString(), b.name, b.type]));
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    boardCmd
        .command('sprints <boardId>')
        .option('-s, --state <state>', '상태 필터 (active, closed, future)')
        .description('스프린트 목록 조회')
        .action(async (boardId, options) => {
            const client = initClient();
            const api = new JiraProjectApi(client);
            try {
                const result = await api.getSprints(parseInt(boardId), options.state);
                const table = new Table({
                    head: ['ID', 'Name', 'State', 'Goal'],
                    style: { head: ['cyan'] },
                });
                result.values.forEach((s) =>
                    table.push([s.id.toString(), s.name, s.state, s.goal || '']),
                );
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });
}
