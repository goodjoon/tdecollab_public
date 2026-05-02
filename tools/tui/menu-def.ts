export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  dim?: boolean;
  children?: MenuItem[];
  commandKey?: string; // 선택 시 실행할 커맨드
}

export const MENU: MenuItem[] = [
  {
    key: 'confluence',
    label: 'Confluence',
    icon: '◆',
    badge: '9',
    badgeColor: '#7DD3FC',
    children: [
      {
        key: 'confluence/page',
        label: 'page',
        icon: '▸',
        children: [
          { key: 'confluence/page/get',    label: 'get',    icon: '·', commandKey: 'confluence:page:get' },
          { key: 'confluence/page/create', label: 'create', icon: '·', commandKey: 'confluence:page:create' },
          { key: 'confluence/page/update', label: 'update', icon: '·', commandKey: 'confluence:page:update' },
        ],
      },
      {
        key: 'confluence/space',
        label: 'space',
        icon: '▸',
        children: [
          { key: 'confluence/space/list', label: 'list', icon: '·', commandKey: 'confluence:space:list' },
        ],
      },
      {
        key: 'confluence/search',
        label: 'search',
        icon: '▸',
        commandKey: 'confluence:search',
      },
    ],
  },
  {
    key: 'jira',
    label: 'JIRA',
    icon: '◆',
    badge: '7',
    badgeColor: '#86EFAC',
    children: [
      {
        key: 'jira/issue',
        label: 'issue',
        icon: '▸',
        children: [
          { key: 'jira/issue/get',        label: 'get',        icon: '·', commandKey: 'jira:issue:get' },
          { key: 'jira/issue/create',     label: 'create',     icon: '·', commandKey: 'jira:issue:create' },
          { key: 'jira/issue/transition', label: 'transition', icon: '·', commandKey: 'jira:issue:transition' },
        ],
      },
      {
        key: 'jira/search',
        label: 'search',
        icon: '▸',
        commandKey: 'jira:search',
      },
    ],
  },
  {
    key: 'gitlab',
    label: 'GitLab',
    icon: '◆',
    badge: '7',
    badgeColor: '#FBBF24',
    children: [
      {
        key: 'gitlab/mr',
        label: 'mr',
        icon: '▸',
        children: [
          { key: 'gitlab/mr/list',   label: 'list',   icon: '·', commandKey: 'gitlab:mr:list' },
          { key: 'gitlab/mr/get',    label: 'get',    icon: '·', commandKey: 'gitlab:mr:get' },
          { key: 'gitlab/mr/create', label: 'create', icon: '·', commandKey: 'gitlab:mr:create' },
        ],
      },
      {
        key: 'gitlab/pipeline',
        label: 'pipeline',
        icon: '▸',
        children: [
          { key: 'gitlab/pipeline/get', label: 'get', icon: '·', commandKey: 'gitlab:pipeline:get' },
        ],
      },
    ],
  },
];

export const META_ITEMS: MenuItem[] = [
  { key: 'history',  label: 'History',    icon: '⏱' },
  { key: 'settings', label: 'Settings',   icon: '⚙', dim: true },
];

// 메뉴 트리를 평탄화하여 탐색 가능한 배열로 변환
export interface FlatItem {
  item: MenuItem;
  depth: number;
  parentKey?: string;
}

export function flattenMenu(
  items: MenuItem[],
  expanded: string[],
  depth = 0,
  parentKey?: string,
): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    result.push({ item, depth, parentKey });
    if (item.children && expanded.includes(item.key)) {
      result.push(...flattenMenu(item.children, expanded, depth + 1, item.key));
    }
  }
  return result;
}

// 기본 확장 상태
export const DEFAULT_EXPANDED = ['confluence', 'confluence/page'];

// commandKey로 breadcrumb 경로 추출
export function pathFromCommandKey(commandKey: string): string[] {
  return commandKey.split(':');
}

// commandKey 의 모든 상위 메뉴 키를 계산 (자동 확장용)
// 'confluence:page:get' → ['confluence', 'confluence/page']
export function getParentMenuKeys(commandKey: string): string[] {
  const menuKey = commandKey.replace(/:/g, '/');
  const parts = menuKey.split('/');
  const parents: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('/'));
  }
  return parents;
}
