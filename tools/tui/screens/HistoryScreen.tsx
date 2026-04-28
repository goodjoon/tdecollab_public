import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { AppShell } from '../components/AppShell.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import { MENU, META_ITEMS, flattenMenu, type MenuItem } from '../menu-def.js';
import type { AppState, HistoryEntry } from '../state.js';
import { T, SVC_COLOR, DEFAULT_ACCENT } from '../theme.js';

interface HistoryScreenProps {
  state: AppState;
  onBack: () => void;
  onReplay: (entry: HistoryEntry) => void;
  accent?: string;
}

const SVC_LABEL: Record<string, string> = { cf: 'CF', jr: 'JR', gl: 'GL' };
const STATE_COLOR: Record<string, string> = { ok: T.mint, warn: T.amber, err: T.red };

export function HistoryScreen({ state, onBack, onReplay, accent = DEFAULT_ACCENT }: HistoryScreenProps) {
  const [selected, setSelected] = useState(state.historySelected);
  const history = state.history;
  const okCount = history.filter((h) => h.state === 'ok').length;
  const warnCount = history.filter((h) => h.state === 'warn').length;
  const errCount = history.filter((h) => h.state === 'err').length;

  useInput((input, key) => {
    if (key.escape) onBack();
    else if (key.upArrow) setSelected((s) => Math.max(0, s - 1));
    else if (key.downArrow) setSelected((s) => Math.min(history.length - 1, s + 1));
    else if (key.return) {
      if (history[selected]) onReplay(history[selected]);
    } else if (input === 'x' || input === 'X') {
      // clearHistory는 App 레벨에서 처리
    }
  });

  const menuItems = [
    ...flattenMenu(MENU, state.expandedKeys),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];
  const menuCursor = menuItems.findIndex((f) => f.item.key === 'history');

  const selectedEntry = history[selected];

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={['history']}
          status={
            <Box gap={1}>
              <Text color={T.fg}>{history.length}</Text>
              <Text color={T.fgDim}>commands ·</Text>
              <Text color={T.mint}>{okCount} ok</Text>
              <Text color={T.fgDim}>/</Text>
              <Text color={T.amber}>{warnCount} warn</Text>
              <Text color={T.fgDim}>/</Text>
              <Text color={T.red}>{errCount} err</Text>
            </Box>
          }
        />
      }
      menu={
        <Panel title="Commands" badge="MENU" accent={accent}>
          <MenuTree items={menuItems} cursor={menuCursor >= 0 ? menuCursor : 0} accent={accent} />
        </Panel>
      }
      body={
        <Panel title="History" badge="LOG" accent={accent} focused>
          <Box flexDirection="column">
            {/* 테이블 헤더 */}
            <Box
              borderStyle="single"
              borderBottom
              borderTop={false}
              borderLeft={false}
              borderRight={false}
              borderColor={T.borderDim}
            >
              <Text color={T.fgFaint} bold>{'TIME '.padEnd(7)}</Text>
              <Text color={T.fgFaint} bold>{'SVC '.padEnd(5)}</Text>
              <Text color={T.fgFaint} bold>{'COMMAND'.padEnd(55)}</Text>
              <Text color={T.fgFaint} bold>{'TOOK'.padEnd(9)}</Text>
              <Text color={T.fgFaint} bold>RESULT</Text>
            </Box>

            {history.length === 0 ? (
              <Box marginTop={2}>
                <Text color={T.fgFaint}>히스토리가 없습니다. 명령을 실행하면 여기에 기록됩니다.</Text>
              </Box>
            ) : (
              history.map((h, i) => (
                <Box
                  key={i}
                  borderStyle="single"
                  borderBottom
                  borderTop={false}
                  borderLeft={false}
                  borderRight={false}
                  borderColor={T.borderDim}
                >
                  <Text color={i === selected ? accent : T.fgDim}>
                    {h.when.padEnd(7)}
                  </Text>
                  <Text
                    backgroundColor={`${(SVC_COLOR[h.svc] ?? T.fgDim)}22`}
                    color={SVC_COLOR[h.svc] ?? T.fgDim}
                    bold
                  >
                    {` ${SVC_LABEL[h.svc] ?? h.svc} `}
                  </Text>
                  <Text> </Text>
                  <Text color={i === selected ? accent : T.fg}>
                    {`tdecollab ${h.cmd}`.slice(0, 54).padEnd(55)}
                  </Text>
                  <Text color={T.fgDim}>{h.dur.padEnd(9)}</Text>
                  <Text color={STATE_COLOR[h.state] ?? T.fg}>
                    {'● '}{h.result}
                  </Text>
                </Box>
              ))
            )}

            {/* 선택된 항목 상세 */}
            {selectedEntry && (
              <Box marginTop={1} flexDirection="column" gap={0}>
                <Text color={T.fgFaint}>─── 선택된 항목 ───</Text>
                <Box gap={1}>
                  <Text color={T.fgDim}>명령:</Text>
                  <Text color={accent}>tdecollab {selectedEntry.cmd}</Text>
                </Box>
                <Box gap={1}>
                  <Text color={T.fgDim}>결과:</Text>
                  <Text color={STATE_COLOR[selectedEntry.state]}>{selectedEntry.result}</Text>
                  <Text color={T.fgDim}>· {selectedEntry.dur}</Text>
                </Box>
              </Box>
            )}
          </Box>
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} />}
      footer={
        <Keymap accent={accent} keys={[
          { key: '↑↓', label: 'navigate' },
          { key: '↵', label: 'replay' },
          { key: 'x', label: 'clear' },
          { key: 'Esc', label: 'back' },
        ]} />
      }
    />
  );
}
