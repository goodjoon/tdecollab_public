import fs from 'fs';
import path from 'path';
import { ConfluenceContentApi } from '../../confluence/api/content.js';
import { ConfluenceSpaceApi } from '../../confluence/api/space.js';
import { ConfluenceSearchApi } from '../../confluence/api/search.js';
import { createConfluenceClient } from '../../confluence/api/client.js';
import { MarkdownToStorageConverter } from '../../confluence/converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../../confluence/converters/storage-to-md.js';
import { tryBuildJiraIssueMap } from '../../confluence/converters/jira-enricher.js';
import { ImageDownloader } from '../../confluence/utils/image-downloader.js';
import { loadConfluenceConfig } from '../../common/config.js';
import type { StepEntry, LogEntry } from '../state.js';
import { makeLog } from '../state.js';

export interface ExecuteResult {
  type: 'text' | 'list';
  content?: string;
  list?: Array<Record<string, string>>;
  cols?: string[];
  logs: LogEntry[];
}

type StepCallback = (steps: StepEntry[]) => void;
type LogCallback = (log: LogEntry) => void;

// 단계 헬퍼
function makeStep(id: string, title: string, detail = ''): StepEntry {
  return { id, title, detail, state: 'pending' };
}

// page get 실행
export async function executePageGet(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };

  const steps: StepEntry[] = [
    makeStep('validate', 'Validate arguments'),
    makeStep('fetch', 'Fetch page from Confluence'),
    makeStep('convert', 'Convert to Markdown'),
    makeStep('images', 'Download images', values['downloadImages'] ? 'enabled' : 'skipped'),
    makeStep('output', 'Write output'),
  ];
  onSteps([...steps]);

  // Step 1: validate
  steps[0] = { ...steps[0], state: 'running', detail: `pageId=${values['pageId']}` };
  onSteps([...steps]);
  if (!values['pageId']) throw new Error('pageId is required');
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const config = loadConfluenceConfig();
  const client = createConfluenceClient(config);
  const api = new ConfluenceContentApi(client);

  // Step 2: fetch
  steps[1] = { ...steps[1], state: 'running', detail: `GET /rest/api/content/${values['pageId']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /rest/api/content/${values['pageId']}?expand=body.storage,version`));

  const page = await api.getPage(String(values['pageId']));
  addLog(makeLog('ok', `200 OK · "${page.title}" · ${page.space?.key}`));
  steps[1] = { ...steps[1], state: 'done', detail: `"${page.title}"` };
  onSteps([...steps]);

  // Step 3: convert
  steps[2] = { ...steps[2], state: 'running' };
  onSteps([...steps]);
  let imageUrlMap: Map<string, string> | undefined;

  if (values['downloadImages'] && page.body?.storage?.value) {
    steps[3] = { ...steps[3], state: 'running', detail: 'downloading...' };
    onSteps([...steps]);

    let baseDir = process.cwd();
    if (values['output']) baseDir = path.dirname(path.resolve(process.cwd(), String(values['output'])));
    const imgDir = path.resolve(baseDir, String(values['imageDir'] || './images'));
    const downloader = new ImageDownloader(api, { outputDir: imgDir, pageId: page.id, baseUrl: config.baseUrl });
    imageUrlMap = await downloader.downloadAllImages(page.body.storage.value);

    // 절대경로 → 상대경로 변환
    for (const [key, abs] of imageUrlMap.entries()) {
      imageUrlMap.set(key, path.relative(baseDir, abs).split(path.sep).join('/'));
    }
    addLog(makeLog('ok', `이미지 다운로드 완료 (${imageUrlMap.size}개) → ${imgDir}`));
    steps[3] = { ...steps[3], state: 'done', detail: `${imageUrlMap.size} files` };
    onSteps([...steps]);
  } else {
    steps[3] = { ...steps[3], state: 'done', detail: 'skipped' };
    onSteps([...steps]);
  }

  const converter = new StorageToMarkdownConverter();
  const jiraIssueMap = page.body?.storage?.value
    ? await tryBuildJiraIssueMap(page.body.storage.value)
    : undefined;
  const markdown = page.body?.storage?.value
    ? converter.convert(page.body.storage.value, imageUrlMap, jiraIssueMap)
    : '(No content)';
  addLog(makeLog('ok', `Markdown 변환 완료 (${markdown.split('\n').length} lines)`));
  steps[2] = { ...steps[2], state: 'done', detail: `${markdown.split('\n').length} lines` };
  onSteps([...steps]);

  // Step 5: output
  steps[4] = { ...steps[4], state: 'running' };
  onSteps([...steps]);
  if (values['output']) {
    const outputPath = path.resolve(process.cwd(), String(values['output']));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    addLog(makeLog('ok', `파일 저장: ${outputPath}`));
    steps[4] = { ...steps[4], state: 'done', detail: outputPath };
  } else {
    steps[4] = { ...steps[4], state: 'done', detail: 'console output' };
  }
  onSteps([...steps]);

  return { type: 'text', content: markdown, logs };
}

// page create 실행
export async function executePageCreate(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };

  const steps: StepEntry[] = [
    makeStep('validate', 'Validate arguments'),
    makeStep('read', 'Read Markdown file'),
    makeStep('convert', 'Convert Markdown → Storage'),
    makeStep('create', 'Create Confluence page'),
  ];
  onSteps([...steps]);

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  if (!values['space']) throw new Error('--space is required');
  if (!values['title']) throw new Error('--title is required');
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const config = loadConfluenceConfig();
  const client = createConfluenceClient(config);
  const api = new ConfluenceContentApi(client);

  let content = '';
  if (values['file']) {
    steps[1] = { ...steps[1], state: 'running', detail: String(values['file']) };
    onSteps([...steps]);
    const filePath = path.resolve(process.cwd(), String(values['file']));
    if (!fs.existsSync(filePath)) throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    content = fs.readFileSync(filePath, 'utf-8');
    addLog(makeLog('ok', `파일 읽기 완료: ${filePath} (${content.split('\n').length} lines)`));
    steps[1] = { ...steps[1], state: 'done', detail: `${content.split('\n').length} lines` };
    onSteps([...steps]);
  } else {
    steps[1] = { ...steps[1], state: 'done', detail: 'no file (empty page)' };
    onSteps([...steps]);
  }

  steps[2] = { ...steps[2], state: 'running' };
  onSteps([...steps]);
  const converter = new MarkdownToStorageConverter();
  const storageXml = converter.convert(content);
  addLog(makeLog('ok', 'Markdown → Storage XML 변환 완료'));
  steps[2] = { ...steps[2], state: 'done' };
  onSteps([...steps]);

  steps[3] = { ...steps[3], state: 'running', detail: `POST /rest/api/content · space=${values['space']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `POST /rest/api/content  space=${values['space']}  title="${values['title']}"`));

  const page = await api.createPage({
    title: String(values['title']),
    spaceKey: String(values['space']),
    body: storageXml,
    parentId: values['parent'] ? String(values['parent']) : undefined,
  });
  addLog(makeLog('ok', `페이지 생성 완료: "${page.title}" (ID: ${page.id})`));
  steps[3] = { ...steps[3], state: 'done', detail: `ID: ${page.id}` };
  onSteps([...steps]);

  const resultText = [
    `# 페이지 생성 완료`,
    ``,
    `- **제목**: ${page.title}`,
    `- **ID**: ${page.id}`,
    `- **스페이스**: ${page.space?.key}`,
    `- **URL**: ${config.baseUrl}${page._links?.webui ?? ''}`,
  ].join('\n');

  return { type: 'text', content: resultText, logs };
}

// space list 실행
export async function executeSpaceList(
  _values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps: StepEntry[] = [makeStep('fetch', 'Fetch space list')];
  onSteps([...steps]);

  steps[0] = { ...steps[0], state: 'running', detail: 'GET /rest/api/space' };
  onSteps([...steps]);
  addLog(makeLog('run', 'GET /rest/api/space?limit=50'));

  const config = loadConfluenceConfig();
  const client = createConfluenceClient(config);
  const api = new ConfluenceSpaceApi(client);
  const spaces = await api.getSpaces();

  addLog(makeLog('ok', `${spaces.length}개 스페이스 조회 완료`));
  steps[0] = { ...steps[0], state: 'done', detail: `${spaces.length} spaces` };
  onSteps([...steps]);

  const list = spaces.map((s) => ({
    key: s.key ?? '',
    name: s.name ?? '',
    type: s.type ?? '',
    id: String(s.id ?? ''),
  }));

  return { type: 'list', list, cols: ['key', 'name', 'type', 'id'], logs };
}

// search 실행
export async function executeSearch(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps: StepEntry[] = [makeStep('search', 'Search Confluence pages')];
  onSteps([...steps]);

  if (!values['cql']) throw new Error('cql is required');

  steps[0] = { ...steps[0], state: 'running', detail: String(values['cql']) };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /rest/api/content/search?cql=${encodeURIComponent(String(values['cql']))}`));

  const config = loadConfluenceConfig();
  const client = createConfluenceClient(config);
  const api = new ConfluenceSearchApi(client);
  const searchResult = await api.searchByCql(String(values['cql']), 0, Number(values['limit'] ?? 10));
  const results = searchResult.results ?? [];

  addLog(makeLog('ok', `${results.length}개 결과`));
  steps[0] = { ...steps[0], state: 'done', detail: `${results.length} results` };
  onSteps([...steps]);

  const list = results.map((r) => ({
    id: String(r.id ?? ''),
    title: r.title ?? '',
    space: r.space?.key ?? '',
    type: r.type ?? '',
  }));

  return { type: 'list', list, cols: ['id', 'title', 'space', 'type'], logs };
}

// page update 실행
export async function executePageUpdate(
  values: Record<string, string | boolean>,
  onSteps: StepCallback,
  onLog: LogCallback,
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const addLog = (l: LogEntry) => { logs.push(l); onLog(l); };
  const steps: StepEntry[] = [
    makeStep('validate', 'Validate arguments'),
    makeStep('fetch', 'Fetch current page'),
    makeStep('convert', 'Convert Markdown'),
    makeStep('update', 'Update page'),
  ];
  onSteps([...steps]);

  steps[0] = { ...steps[0], state: 'running' };
  onSteps([...steps]);
  if (!values['pageId']) throw new Error('pageId is required');
  steps[0] = { ...steps[0], state: 'done' };
  onSteps([...steps]);

  const config = loadConfluenceConfig();
  const client = createConfluenceClient(config);
  const api = new ConfluenceContentApi(client);

  steps[1] = { ...steps[1], state: 'running', detail: `GET /rest/api/content/${values['pageId']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `GET /rest/api/content/${values['pageId']}`));
  const current = await api.getPage(String(values['pageId']));
  addLog(makeLog('ok', `현재 페이지: "${current.title}" v${current.version?.number}`));
  steps[1] = { ...steps[1], state: 'done', detail: `v${current.version?.number}` };
  onSteps([...steps]);

  steps[2] = { ...steps[2], state: 'running' };
  onSteps([...steps]);
  let storageXml = current.body?.storage?.value ?? '';
  if (values['file']) {
    const filePath = path.resolve(process.cwd(), String(values['file']));
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const converter = new MarkdownToStorageConverter();
    storageXml = converter.convert(markdown);
    addLog(makeLog('ok', `Markdown 변환 완료: ${filePath}`));
  }
  steps[2] = { ...steps[2], state: 'done' };
  onSteps([...steps]);

  steps[3] = { ...steps[3], state: 'running', detail: `PUT /rest/api/content/${values['pageId']}` };
  onSteps([...steps]);
  addLog(makeLog('run', `PUT /rest/api/content/${values['pageId']}`));
  const updated = await api.updatePage({
    id: String(values['pageId']),
    title: values['title'] ? String(values['title']) : current.title!,
    body: storageXml,
    version: (current.version?.number ?? 1) + 1,
  });
  addLog(makeLog('ok', `업데이트 완료: "${updated.title}" v${updated.version?.number}`));
  steps[3] = { ...steps[3], state: 'done', detail: `v${updated.version?.number}` };
  onSteps([...steps]);

  return {
    type: 'text',
    content: `# 페이지 업데이트 완료\n\n- **제목**: ${updated.title}\n- **ID**: ${updated.id}\n- **버전**: v${updated.version?.number}`,
    logs,
  };
}
