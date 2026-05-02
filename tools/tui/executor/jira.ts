import { createJiraClient } from '../../jira/api/client.js';
import { JiraIssueApi } from '../../jira/api/issue.js';
import { JiraSearchApi } from '../../jira/api/search.js';
import { loadJiraConfig } from '../../common/config.js';
import type { StepEntry, LogEntry } from '../state.js';
import { makeLog } from '../state.js';
import type { ExecuteResult } from './confluence.js';

type StepCallback = (steps: StepEntry[]) => void;
type LogCallback = (log: LogEntry) => void;

function makeStep(id: string, title: string, detail = ''): StepEntry {
  return { id, title, detail, state: 'pending' };
}

export async function executeIssueGet(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('fetch', 'Fetch JIRA issue')];
  onSteps([...steps]);

  if (!values['issueId']) throw new Error('issueId is required');

  steps[0] = { ...steps[0], state: 'running', detail: String(values['issueId']) };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /rest/api/2/issue/${values['issueId']}`));

  const config = loadJiraConfig();
  const client = createJiraClient(config);
  const api = new JiraIssueApi(client);
  const issue = await api.getIssue(String(values['issueId']));
  addLog(makeLog('ok', `200 OK · "${issue.fields?.summary}"`));
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const lines = [
    `# ${issue.key}: ${issue.fields?.summary ?? ''}`,
    '',
    `- **상태**: ${issue.fields?.status?.name ?? ''}`,
    `- **담당자**: ${issue.fields?.assignee?.displayName ?? '미지정'}`,
    `- **우선순위**: ${issue.fields?.priority?.name ?? ''}`,
    `- **이슈 유형**: ${issue.fields?.issuetype?.name ?? ''}`,
    '',
    `## 설명`,
    issue.fields?.description ?? '(없음)',
  ];

  return { type: 'text', content: lines.join('\n'), logs };
}

export async function executeIssueCreate(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [
    makeStep('validate', 'Validate arguments'),
    makeStep('create', 'Create JIRA issue'),
  ];
  onSteps([...steps]);

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  if (!values['project']) throw new Error('--project is required');
  if (!values['summary']) throw new Error('--summary is required');
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const config = loadJiraConfig();
  const client = createJiraClient(config);
  const api = new JiraIssueApi(client);

  steps[1] = { ...steps[1], state: 'running', detail: `POST /rest/api/2/issue` };
  onSteps([...steps]);
  addLog(makeLog('run', `POST /rest/api/2/issue  project=${values['project']}`));

  const issue = await api.createIssue({
    projectKey: String(values['project']),
    summary: String(values['summary']),
    issueType: String(values['type'] ?? 'Task'),
    ...(values['assignee'] ? { assignee: String(values['assignee']) } : {}),
    ...(values['labels'] ? { labels: String(values['labels']).split(',').map((l) => l.trim()) } : {}),
  });
  addLog(makeLog('ok', `이슈 생성 완료: ${issue.key}`));
  steps[1] = { ...steps[1], state: 'done', detail: issue.key };
  onSteps([...steps]);

  return {
    type: 'text',
    content: `# 이슈 생성 완료\n\n- **키**: ${issue.key}\n- **제목**: ${values['summary']}`,
    logs,
  };
}

export async function executeIssueTransition(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('transition', 'Transition JIRA issue')];
  onSteps([...steps]);

  if (!values['issueId'] || !values['transitionId']) throw new Error('issueId and transitionId are required');

  steps[0] = { ...steps[0], state: 'running', detail: `${values['issueId']} → ${values['transitionId']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `POST /rest/api/2/issue/${values['issueId']}/transitions`));

  const config = loadJiraConfig();
  const client = createJiraClient(config);
  await client.post(`/rest/api/2/issue/${values['issueId']}/transitions`, {
    transition: { id: String(values['transitionId']) },
  });
  addLog(makeLog('ok', `전환 완료: ${values['issueId']}`));
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  return { type: 'text', content: `# 이슈 전환 완료\n\n- **이슈**: ${values['issueId']}\n- **Transition ID**: ${values['transitionId']}`, logs };
}

export async function executeJiraSearch(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps = [makeStep('search', 'Search JIRA issues')];
  onSteps([...steps]);

  if (!values['jql']) throw new Error('jql is required');

  steps[0] = { ...steps[0], state: 'running', detail: String(values['jql']) };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /rest/api/2/search?jql=${encodeURIComponent(String(values['jql']))}`));

  const config = loadJiraConfig();
  const client = createJiraClient(config);
  const api = new JiraSearchApi(client);
  const result = await api.searchByJql(String(values['jql']), 0, Number(values['limit'] ?? 20));

  addLog(makeLog('ok', `${result.issues?.length ?? 0}개 이슈 조회 완료`));
  steps[0] = { ...steps[0], state: 'done', detail: `${result.issues?.length ?? 0} issues` };
  onSteps([...steps]);

  const list = (result.issues ?? []).map((i) => ({
    key: i.key ?? '',
    summary: (i.fields?.summary ?? '').slice(0, 50),
    status: i.fields?.status?.name ?? '',
    assignee: i.fields?.assignee?.displayName ?? '',
  }));

  return { type: 'list', list, cols: ['key', 'summary', 'status', 'assignee'], logs };
}
