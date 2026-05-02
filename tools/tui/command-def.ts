export type FieldType = 'text' | 'bool' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  defaultValue?: string | boolean;
  prefix?: string;
  options?: string[];   // select 타입용
  pathType?: 'file' | 'dir';  // 경로 타입: Enter 시 디렉토리 선택창 오픈
}

export interface CommandDef {
  key: string;
  label: string;
  description: string;
  synopsis: string;
  svc: 'confluence' | 'jira' | 'gitlab';
  fields: FieldDef[];
}

export const COMMANDS: Record<string, CommandDef> = {
  'confluence:page:get': {
    key: 'confluence:page:get',
    label: 'confluence page get',
    description: 'Confluence 페이지를 조회하고 Markdown으로 변환하여 출력하거나 파일로 저장합니다. 이미지를 함께 다운로드할 수 있습니다.',
    synopsis: 'tdecollab confluence page get <pageId> [options]',
    svc: 'confluence',
    fields: [
      { key: 'pageId',          label: 'pageId',           type: 'text', required: true,  hint: '페이지 ID (숫자)', prefix: '#' },
      { key: 'output',          label: '--output',         type: 'text', hint: '저장할 Markdown 파일 경로', prefix: '📄', pathType: 'file' },
      { key: 'downloadImages',  label: '-d  --download-images', type: 'bool', defaultValue: false },
      { key: 'imageDir',        label: '--image-dir',      type: 'text', defaultValue: 'images', hint: '이미지 디렉토리 이름 (output 파일 위치 하위에 생성됨)', prefix: '📁' },
      { key: 'quiet',           label: '-q  --quiet',      type: 'bool', defaultValue: false },
      { key: 'raw',             label: '-r  --raw',        type: 'bool', defaultValue: false },
    ],
  },

  'confluence:page:create': {
    key: 'confluence:page:create',
    label: 'confluence page create',
    description: 'Markdown 파일 또는 텍스트로 Confluence 페이지를 생성합니다.',
    synopsis: 'tdecollab confluence page create -s <space> -t <title> [options]',
    svc: 'confluence',
    fields: [
      { key: 'space',  label: '--space',  type: 'text', required: true, hint: 'Confluence 스페이스 키 (예: TDE)', prefix: '🔑' },
      { key: 'title',  label: '--title',  type: 'text', required: true, hint: '페이지 제목', prefix: '✎' },
      { key: 'file',   label: '--file',   type: 'text', hint: 'Markdown 파일 경로', prefix: '📄', pathType: 'file' },
      { key: 'parent', label: '--parent', type: 'text', hint: '부모 페이지 ID', prefix: '#' },
    ],
  },

  'confluence:page:update': {
    key: 'confluence:page:update',
    label: 'confluence page update',
    description: '기존 Confluence 페이지를 업데이트합니다.',
    synopsis: 'tdecollab confluence page update <pageId> [options]',
    svc: 'confluence',
    fields: [
      { key: 'pageId', label: 'pageId', type: 'text', required: true, hint: '업데이트할 페이지 ID', prefix: '#' },
      { key: 'title',  label: '--title', type: 'text', hint: '새 제목 (생략 시 기존 제목 유지)' },
      { key: 'file',   label: '--file',  type: 'text', hint: 'Markdown 파일 경로', prefix: '📄', pathType: 'file' },
    ],
  },

  'confluence:space:list': {
    key: 'confluence:space:list',
    label: 'confluence space list',
    description: 'Confluence 스페이스 목록을 조회합니다.',
    synopsis: 'tdecollab confluence space list [options]',
    svc: 'confluence',
    fields: [
      { key: 'limit', label: '--limit', type: 'text', defaultValue: '50', hint: '최대 조회 수' },
    ],
  },

  'confluence:search': {
    key: 'confluence:search',
    label: 'confluence search',
    description: 'CQL(Confluence Query Language)로 페이지를 검색합니다.',
    synopsis: 'tdecollab confluence search <cql> [options]',
    svc: 'confluence',
    fields: [
      { key: 'cql',   label: 'cql',     type: 'text', required: true, hint: 'CQL 검색 쿼리 (예: title ~ "가이드" AND space = TDE)', prefix: 'cql›' },
      { key: 'limit', label: '--limit', type: 'text', defaultValue: '10', hint: '최대 결과 수' },
    ],
  },

  'jira:issue:get': {
    key: 'jira:issue:get',
    label: 'jira issue get',
    description: 'JIRA 이슈를 조회합니다.',
    synopsis: 'tdecollab jira issue get <issueId>',
    svc: 'jira',
    fields: [
      { key: 'issueId', label: 'issueId', type: 'text', required: true, hint: '이슈 키 (예: PROJ-1234)', prefix: '🎫' },
    ],
  },

  'jira:issue:create': {
    key: 'jira:issue:create',
    label: 'jira issue create',
    description: 'JIRA 이슈를 생성합니다.',
    synopsis: 'tdecollab jira issue create -p <project> -s <summary> [options]',
    svc: 'jira',
    fields: [
      { key: 'project',  label: '--project (-p)',  type: 'text', required: true, hint: '프로젝트 키 (예: PROJ)' },
      { key: 'summary',  label: '--summary (-s)',  type: 'text', required: true, hint: '이슈 제목' },
      { key: 'type',     label: '--type (-t)',     type: 'select', defaultValue: 'Task', options: ['Task', 'Bug', 'Story', 'Epic', 'Sub-task'] },
      { key: 'assignee', label: '--assignee (-a)', type: 'text', hint: '담당자 사용자명' },
      { key: 'labels',   label: '--labels (-l)',   type: 'text', hint: '레이블 (쉼표 구분)' },
    ],
  },

  'jira:issue:transition': {
    key: 'jira:issue:transition',
    label: 'jira issue transition',
    description: 'JIRA 이슈 상태를 전환합니다.',
    synopsis: 'tdecollab jira issue transition <issueId> -t <transitionId>',
    svc: 'jira',
    fields: [
      { key: 'issueId',      label: 'issueId',          type: 'text', required: true, hint: '이슈 키', prefix: '🎫' },
      { key: 'transitionId', label: '--transition (-t)', type: 'text', required: true, hint: 'Transition ID' },
    ],
  },

  'jira:search': {
    key: 'jira:search',
    label: 'jira search',
    description: 'JQL로 JIRA 이슈를 검색합니다.',
    synopsis: 'tdecollab jira search <jql> [options]',
    svc: 'jira',
    fields: [
      { key: 'jql',   label: 'jql',     type: 'text', required: true, hint: 'JQL 쿼리 (예: assignee = currentUser())', prefix: 'jql›' },
      { key: 'limit', label: '--limit', type: 'text', defaultValue: '20', hint: '최대 결과 수' },
    ],
  },

  'gitlab:mr:list': {
    key: 'gitlab:mr:list',
    label: 'gitlab mr list',
    description: 'GitLab 프로젝트의 Merge Request 목록을 조회합니다.',
    synopsis: 'tdecollab gitlab mr list <projectId> [options]',
    svc: 'gitlab',
    fields: [
      { key: 'projectId', label: 'projectId',    type: 'text', required: true, hint: '프로젝트 ID (숫자)', prefix: '#' },
      { key: 'state',     label: '--state (-s)',  type: 'select', defaultValue: 'opened', options: ['opened', 'closed', 'merged', 'all'] },
    ],
  },

  'gitlab:mr:get': {
    key: 'gitlab:mr:get',
    label: 'gitlab mr get',
    description: 'GitLab Merge Request 상세 정보를 조회합니다.',
    synopsis: 'tdecollab gitlab mr get <projectId> <mrId>',
    svc: 'gitlab',
    fields: [
      { key: 'projectId', label: 'projectId', type: 'text', required: true, hint: '프로젝트 ID', prefix: '#' },
      { key: 'mrId',      label: 'mrId',      type: 'text', required: true, hint: 'MR 번호', prefix: '!' },
    ],
  },

  'gitlab:mr:create': {
    key: 'gitlab:mr:create',
    label: 'gitlab mr create',
    description: 'GitLab Merge Request를 생성합니다.',
    synopsis: 'tdecollab gitlab mr create <projectId> --source <branch> [options]',
    svc: 'gitlab',
    fields: [
      { key: 'projectId',    label: 'projectId',      type: 'text', required: true, hint: '프로젝트 ID', prefix: '#' },
      { key: 'sourceBranch', label: '--source',        type: 'text', required: true, hint: '소스 브랜치명' },
      { key: 'targetBranch', label: '--target',        type: 'text', defaultValue: 'main', hint: '타겟 브랜치명' },
      { key: 'title',        label: '--title',         type: 'text', hint: 'MR 제목 (기본: 브랜치명)' },
    ],
  },

  'gitlab:pipeline:get': {
    key: 'gitlab:pipeline:get',
    label: 'gitlab pipeline get',
    description: 'GitLab 파이프라인 정보를 조회합니다.',
    synopsis: 'tdecollab gitlab pipeline get <projectId> <pipelineId> [options]',
    svc: 'gitlab',
    fields: [
      { key: 'projectId',  label: 'projectId',   type: 'text', required: true, hint: '프로젝트 ID', prefix: '#' },
      { key: 'pipelineId', label: 'pipelineId',  type: 'text', required: true, hint: '파이프라인 ID', prefix: '#' },
      { key: 'jobs',       label: '--jobs',       type: 'bool', defaultValue: false },
    ],
  },
};

// 커맨드 실행/미리보기 직전에 값을 가공한다.
// confluence:page:get 의 imageDir 은 사용자가 디렉토리 이름만 입력하지만,
// 실제 cli 파라미터로는 output 파일 디렉토리 하위 경로로 결합되어 전달되어야 한다.
export function applyValueTransform(
  commandKey: string,
  values: Record<string, string | boolean>,
): Record<string, string | boolean> {
  if (commandKey === 'confluence:page:get') {
    const result = { ...values };
    const imageDir = String(result['imageDir'] ?? '').trim();
    const output = String(result['output'] ?? '').trim();
    if (imageDir && output) {
      // 이미 / 가 포함된 경로면(사용자가 직접 경로 입력) 그대로 둔다
      if (!imageDir.includes('/')) {
        const lastSlash = output.lastIndexOf('/');
        const outputDir = lastSlash >= 0 ? output.substring(0, lastSlash) : '.';
        result['imageDir'] = `${outputDir}/${imageDir}`.replace(/\/+/g, '/');
      }
    }
    return result;
  }
  return values;
}

// 커맨드 preview 문자열 생성
export function buildPreview(def: CommandDef, values: Record<string, string | boolean>): string {
  const transformed = applyValueTransform(def.key, values);
  const parts: string[] = ['tdecollab', ...def.key.split(':')];

  for (const field of def.fields) {
    const val = transformed[field.key] ?? field.defaultValue;
    if (!val && val !== false) continue;

    if (field.type === 'bool') {
      if (val === true) parts.push(`-${field.key.charAt(0)}`);
    } else if (field.type === 'text') {
      const isPositional = !field.label.startsWith('-');
      if (isPositional) {
        if (val) parts.push(String(val));
      } else {
        const flag = field.label.split(' ')[0];
        if (val) parts.push(flag, String(val));
      }
    }
  }
  return parts.join(' ');
}
