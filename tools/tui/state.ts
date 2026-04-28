export type LogLevel = 'info' | 'ok' | 'warn' | 'err' | 'run' | 'dim';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  text: string;
}

export interface StepEntry {
  id: string;
  title: string;
  detail: string;
  state: 'pending' | 'running' | 'done' | 'err';
}

export interface HistoryEntry {
  when: string;
  svc: 'cf' | 'jr' | 'gl';
  cmd: string;
  state: 'ok' | 'warn' | 'err';
  dur: string;
  result: string;
}

export type ScreenType =
  | 'menu'
  | 'form'
  | 'running'
  | 'result-list'
  | 'result-text'
  | 'error'
  | 'history';

export interface AppState {
  screen: ScreenType;
  // 메뉴 탐색
  activePath: string;
  expandedKeys: string[];
  // 폼
  commandKey: string;
  formValues: Record<string, string | boolean>;
  formErrors: Record<string, string>;
  focusedField: number;
  // 실행
  steps: StepEntry[];
  progress: number;
  // 결과
  resultText: string;
  resultList: Array<Record<string, string>>;
  resultListCols: string[];
  resultListSelected: number;
  // 로그
  logs: LogEntry[];
  // 히스토리
  history: HistoryEntry[];
  historySelected: number;
}

export function makeLog(level: LogLevel, text: string): LogEntry {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  return { ts, level, text };
}
