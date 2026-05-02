import { Box, useApp, useStdout } from 'ink';
import { useCallback, useEffect, useRef, useState } from 'react';
import { COMMANDS } from './command-def.js';
import { DEFAULT_EXPANDED, getParentMenuKeys } from './menu-def.js';
import { ErrorScreen } from './screens/ErrorScreen.js';
import { FormScreen } from './screens/FormScreen.js';
import { HistoryScreen } from './screens/HistoryScreen.js';
import { ListScreen } from './screens/ListScreen.js';
import { MenuScreen } from './screens/MenuScreen.js';
import { RunningScreen } from './screens/RunningScreen.js';
import { TextView } from './screens/TextView.js';
import type { AppState, HistoryEntry, LogEntry, StepEntry } from './state.js';
import { makeLog } from './state.js';
import { DEFAULT_ACCENT } from './theme.js';
import { loadTuiConfig, saveLastUsed, type TuiConfig } from './tuiconfig.js';
import { appendHistory, loadHistory } from './history.js';

// Executor imports
import { executePageGet, executePageCreate, executeSpaceList, executeSearch, executePageUpdate } from './executor/confluence.js';
import { executeIssueGet, executeIssueCreate, executeIssueTransition, executeJiraSearch } from './executor/jira.js';
import { executeMrList, executeMrGet, executeMrCreate, executePipelineGet } from './executor/gitlab.js';

const EXECUTOR_MAP: Record<string, (
  values: Record<string, string | boolean>,
  onSteps: (s: StepEntry[]) => void,
  onLog: (l: LogEntry) => void,
) => Promise<{ type: 'text' | 'list'; content?: string; list?: Array<Record<string, string>>; cols?: string[]; logs: LogEntry[] }>> = {
  'confluence:page:get':    executePageGet,
  'confluence:page:create': executePageCreate,
  'confluence:page:update': executePageUpdate,
  'confluence:space:list':  executeSpaceList,
  'confluence:search':      executeSearch,
  'jira:issue:get':         executeIssueGet,
  'jira:issue:create':      executeIssueCreate,
  'jira:issue:transition':  executeIssueTransition,
  'jira:search':            executeJiraSearch,
  'gitlab:mr:list':         executeMrList,
  'gitlab:mr:get':          executeMrGet,
  'gitlab:mr:create':       executeMrCreate,
  'gitlab:pipeline:get':    executePipelineGet,
};

interface AppProps {
  config: TuiConfig;
}

const INITIAL_STATE: AppState = {
  screen: 'menu',
  activePath: 'confluence:page:get',
  expandedKeys: DEFAULT_EXPANDED,
  commandKey: '',
  formValues: {},
  formErrors: {},
  focusedField: 0,
  steps: [],
  progress: 0,
  resultText: '',
  resultList: [],
  resultListCols: [],
  resultListSelected: 0,
  logs: [makeLog('info', 'session 시작 · tdecollab TUI v0.2.3')],
  history: loadHistory(),
  historySelected: 0,
};

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const accent = config.accent ?? DEFAULT_ACCENT;
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 터미널 크기 추적 (resize 대응)
  const [size, setSize] = useState({
    cols: stdout?.columns ?? 120,
    rows: stdout?.rows ?? 40,
  });
  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setSize({ cols: stdout.columns, rows: stdout.rows });
    stdout.on('resize', onResize);
    return () => { stdout.off('resize', onResize); };
  }, [stdout]);

  const addLog = useCallback((log: LogEntry) => {
    setState((s) => ({ ...s, logs: [...s.logs, log] }));
  }, []);

  // 메뉴에서 커맨드 선택
  const handleSelectCommand = useCallback((commandKey: string) => {
    const def = COMMANDS[commandKey];
    if (!def) return;

    // cosmiconfig에서 마지막 사용값 로드
    const lastUsed = config.lastUsed?.[commandKey] ?? {};
    const initValues: Record<string, string | boolean> = {};
    for (const f of def.fields) {
      initValues[f.key] = f.key in lastUsed ? lastUsed[f.key] : (f.defaultValue ?? '');
    }

    // 선택된 커맨드의 부모 메뉴들을 자동으로 확장 상태에 포함시킨다
    const parents = getParentMenuKeys(commandKey);

    setState((s) => ({
      ...s,
      screen: 'form',
      commandKey,
      formValues: initValues,
      formErrors: {},
      focusedField: 0,
      activePath: commandKey,
      expandedKeys: Array.from(new Set([...s.expandedKeys, ...parents])),
    }));
    addLog(makeLog('dim', `폼 열기: ${commandKey}`));
  }, [config.lastUsed, addLog]);

  // 메뉴 확장/축소 토글
  const handleToggleExpanded = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      expandedKeys: s.expandedKeys.includes(key)
        ? s.expandedKeys.filter((k) => k !== key)
        : [...s.expandedKeys, key],
    }));
  }, []);

  // 폼에서 실행
  const handleRun = useCallback(async (values: Record<string, string | boolean>) => {
    const commandKey = stateRef.current.commandKey;
    const executor = EXECUTOR_MAP[commandKey];
    if (!executor) {
      addLog(makeLog('err', `실행기를 찾을 수 없습니다: ${commandKey}`));
      return;
    }

    const startTime = Date.now();

    // 실행 화면으로 전환
    setState((s) => ({
      ...s,
      screen: 'running',
      formValues: values,
      steps: [],
      progress: 0,
    }));
    addLog(makeLog('run', `tdecollab ${commandKey.split(':').join(' ')}`));

    // executor 는 imageDir 을 자동으로 output 디렉토리 기준으로 resolve 하므로
    // 사용자 입력 원본을 그대로 전달한다 (preview 만 결합된 경로로 표시).
    try {
      const result = await executor(
        values,
        (steps) => setState((s) => ({ ...s, steps })),
        (log) => setState((s) => ({ ...s, logs: [...s.logs, log] })),
      );

      const dur = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      const def = COMMANDS[commandKey];
      const svc = def?.svc === 'confluence' ? 'cf' : def?.svc === 'jira' ? 'jr' : 'gl';

      // 히스토리에 저장
      const histEntry: HistoryEntry = {
        when: new Date().toTimeString().slice(0, 5),
        svc,
        cmd: commandKey.split(':').join(' '),
        state: 'ok',
        dur,
        result: result.type === 'list' ? `${result.list?.length ?? 0} items` : 'done',
      };
      appendHistory(histEntry);
      saveLastUsed(commandKey, values);

      // 결과 화면으로 전환
      if (result.type === 'list') {
        setState((s) => ({
          ...s,
          screen: 'result-list',
          resultList: result.list ?? [],
          resultListCols: result.cols ?? [],
          resultListSelected: 0,
          logs: [...s.logs, makeLog('ok', `완료 (${dur})`)],
          history: [histEntry, ...s.history],
        }));
      } else {
        setState((s) => ({
          ...s,
          screen: 'result-text',
          resultText: result.content ?? '',
          logs: [...s.logs, makeLog('ok', `완료 (${dur})`)],
          history: [histEntry, ...s.history],
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const dur = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      const def = COMMANDS[commandKey];
      const svc = def?.svc === 'confluence' ? 'cf' : def?.svc === 'jira' ? 'jr' : 'gl';

      const histEntry: HistoryEntry = {
        when: new Date().toTimeString().slice(0, 5),
        svc,
        cmd: commandKey.split(':').join(' '),
        state: 'err',
        dur,
        result: msg.slice(0, 40),
      };
      appendHistory(histEntry);

      setState((s) => ({
        ...s,
        screen: 'error',
        formErrors: { error: msg },
        logs: [...s.logs, makeLog('err', msg)],
        history: [histEntry, ...s.history],
      }));
    }
  }, [addLog]);

  const handleBack = useCallback(() => {
    setState((s) => ({ ...s, screen: 'menu' }));
  }, []);

  const handleOpenHistory = useCallback(() => {
    setState((s) => ({ ...s, screen: 'history', history: loadHistory() }));
  }, []);

  const handleReplay = useCallback((entry: HistoryEntry) => {
    // 커맨드 키로 변환
    const commandKey = entry.cmd.replace(/\s+/g, ':');
    handleSelectCommand(commandKey);
  }, [handleSelectCommand]);

  const handleSavePreset = useCallback((values: Record<string, string | boolean>) => {
    const commandKey = stateRef.current.commandKey;
    saveLastUsed(commandKey, values);
    addLog(makeLog('ok', `프리셋 저장: ${commandKey}`));
  }, [addLog]);

  const handleQuit = useCallback(() => exit(), [exit]);

  let screen;
  switch (state.screen) {
    case 'menu':
      screen = (
        <MenuScreen
          state={state}
          onSelectCommand={handleSelectCommand}
          onToggleExpanded={handleToggleExpanded}
          onOpenHistory={handleOpenHistory}
          onQuit={handleQuit}
          accent={accent}
        />
      );
      break;
    case 'form':
      screen = (
        <FormScreen
          state={state}
          onRun={handleRun}
          onBack={handleBack}
          onSavePreset={handleSavePreset}
          accent={accent}
        />
      );
      break;
    case 'running':
      screen = <RunningScreen state={state} onCancel={handleBack} accent={accent} />;
      break;
    case 'result-list':
      screen = <ListScreen state={state} onBack={handleBack} accent={accent} />;
      break;
    case 'result-text':
      screen = <TextView state={state} onBack={handleBack} accent={accent} />;
      break;
    case 'error':
      screen = (
        <ErrorScreen
          state={state}
          onBack={() => setState((s) => ({ ...s, screen: 'form' }))}
          onRetry={() => handleRun(state.formValues)}
          accent={accent}
        />
      );
      break;
    case 'history':
      screen = <HistoryScreen state={state} onBack={handleBack} onReplay={handleReplay} accent={accent} />;
      break;
    default:
      screen = (
        <MenuScreen
          state={state}
          onSelectCommand={handleSelectCommand}
          onToggleExpanded={handleToggleExpanded}
          onOpenHistory={handleOpenHistory}
          onQuit={handleQuit}
          accent={accent}
        />
      );
  }

  // 터미널 전체 화면을 채우는 루트 컨테이너
  return (
    <Box width={size.cols} height={size.rows} flexDirection="column">
      {screen}
    </Box>
  );
}
