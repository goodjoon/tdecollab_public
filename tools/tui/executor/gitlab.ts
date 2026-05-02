import { createGitlabClient } from '../../gitlab/api/client.js';
import { GitlabMergeRequestApi } from '../../gitlab/api/merge-request.js';
import { GitlabPipelineApi } from '../../gitlab/api/pipeline.js';
import { loadGitlabConfig } from '../../common/config.js';
import type { StepEntry, LogEntry } from '../state.js';
import { makeLog } from '../state.js';
import type { ExecuteResult } from './confluence.js';

type StepCallback = (steps: StepEntry[]) => void;
type LogCallback = (log: LogEntry) => void;

function makeStep(id: string, title: string, detail = ''): StepEntry {
  return { id, title, detail, state: 'pending' };
}

export async function executeMrList(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('fetch', 'Fetch MR list')];
  onSteps([...steps]);

  if (!values['projectId']) throw new Error('projectId is required');

  steps[0] = { ...steps[0], state: 'running', detail: `project=${values['projectId']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /api/v4/projects/${values['projectId']}/merge_requests?state=${values['state'] ?? 'opened'}`));

  const config = loadGitlabConfig();
  const client = createGitlabClient(config);
  const api = new GitlabMergeRequestApi(client);
  const mrs = await api.getMergeRequests(Number(values['projectId']), {
    state: String(values['state'] ?? 'opened') as 'opened' | 'closed' | 'merged' | 'all',
  });

  addLog(makeLog('ok', `${mrs.length}개 MR 조회 완료`));
  steps[0] = { ...steps[0], state: 'done', detail: `${mrs.length} MRs` };
  onSteps([...steps]);

  const list = mrs.map((mr) => ({
    iid: String(mr.iid ?? ''),
    title: (mr.title ?? '').slice(0, 50),
    state: mr.state ?? '',
    author: mr.author?.name ?? '',
    target: mr.target_branch ?? '',
  }));

  return { type: 'list', list, cols: ['iid', 'title', 'state', 'author', 'target'], logs };
}

export async function executeMrGet(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('fetch', 'Fetch MR detail')];
  onSteps([...steps]);

  if (!values['projectId'] || !values['mrId']) throw new Error('projectId and mrId are required');

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /api/v4/projects/${values['projectId']}/merge_requests/${values['mrId']}`));

  const config = loadGitlabConfig();
  const client = createGitlabClient(config);
  const api = new GitlabMergeRequestApi(client);
  const mr = await api.getMergeRequest(Number(values['projectId']), Number(values['mrId']));

  addLog(makeLog('ok', `200 OK · !${mr.iid} "${mr.title}"`));
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const lines = [
    `# MR !${mr.iid}: ${mr.title}`,
    '',
    `- **상태**: ${mr.state}`,
    `- **작성자**: ${mr.author?.name ?? ''}`,
    `- **브랜치**: \`${mr.source_branch}\` → \`${mr.target_branch}\``,
    `- **생성일**: ${mr.created_at ?? ''}`,
    '',
    `## 설명`,
    mr.description ?? '(없음)',
  ];

  return { type: 'text', content: lines.join('\n'), logs };
}

export async function executeMrCreate(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [
    makeStep('validate', 'Validate arguments'),
    makeStep('create', 'Create MR'),
  ];
  onSteps([...steps]);

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  if (!values['projectId'] || !values['sourceBranch']) throw new Error('projectId and sourceBranch are required');
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const config = loadGitlabConfig();
  const client = createGitlabClient(config);
  const api = new GitlabMergeRequestApi(client);

  steps[1] = { ...steps[1], state: 'running', detail: `POST /api/v4/projects/${values['projectId']}/merge_requests` };
  onSteps([...steps]);
  addLog(makeLog('run', `POST /api/v4/projects/${values['projectId']}/merge_requests`));

  const mr = await api.createMergeRequest(Number(values['projectId']), {
    source_branch: String(values['sourceBranch']),
    target_branch: String(values['targetBranch'] ?? 'main'),
    title: values['title'] ? String(values['title']) : `Merge ${values['sourceBranch']} → ${values['targetBranch'] ?? 'main'}`,
  });

  addLog(makeLog('ok', `MR 생성 완료: !${mr.iid}`));
  steps[1] = { ...steps[1], state: 'done', detail: `!${mr.iid}` };
  onSteps([...steps]);

  return {
    type: 'text',
    content: `# MR 생성 완료\n\n- **번호**: !${mr.iid}\n- **제목**: ${mr.title}\n- **브랜치**: \`${mr.source_branch}\` → \`${mr.target_branch}\``,
    logs,
  };
}

export async function executePipelineGet(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('fetch', 'Fetch pipeline')];
  onSteps([...steps]);

  if (!values['projectId'] || !values['pipelineId']) throw new Error('projectId and pipelineId are required');

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /api/v4/projects/${values['projectId']}/pipelines/${values['pipelineId']}`));

  const config = loadGitlabConfig();
  const client = createGitlabClient(config);
  const api = new GitlabPipelineApi(client);
  const pipeline = await api.getPipeline(Number(values['projectId']), Number(values['pipelineId']));

  addLog(makeLog('ok', `200 OK · pipeline #${pipeline.id} · ${pipeline.status}`));

  let jobsText = '';
  if (values['jobs']) {
    const jobs = await api.getPipelineJobs(Number(values['projectId']), Number(values['pipelineId']));
    addLog(makeLog('ok', `${jobs.length}개 job 조회 완료`));
    jobsText = '\n\n## Jobs\n\n' + jobs.map((j) => `- **${j.name}**: ${j.status}`).join('\n');
  }

  steps[0] = { ...steps[0], state: 'done', detail: pipeline.status };
  onSteps([...steps]);

  const lines = [
    `# Pipeline #${pipeline.id}`,
    '',
    `- **상태**: ${pipeline.status}`,
    `- **브랜치**: ${pipeline.ref ?? ''}`,
    `- **SHA**: ${(pipeline.sha ?? '').slice(0, 8)}`,
    `- **생성일**: ${pipeline.created_at ?? ''}`,
    jobsText,
  ];

  return { type: 'text', content: lines.join('\n'), logs };
}
