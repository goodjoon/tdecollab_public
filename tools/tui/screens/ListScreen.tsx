import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { AppShell } from '../components/AppShell.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import { MENU, META_ITEMS, flattenMenu, pathFromCommandKey, type MenuItem } from '../menu-def.js';
import type { AppState } from '../state.js';
import { T, DEFAULT_ACCENT } from '../theme.js';

interface ListScreenProps {
  state: AppState;
  onBack: () => void;
  onDrillIn?: (row: Record<string, string>) => void;
  accent?: string;
}

export function ListScreen({ state, onBack, onDrillIn, accent = DEFAULT_ACCENT }: ListScreenProps) {
  const [selected, setSelected] = useState(state.resultListSelected);
  const crumbs = pathFromCommandKey(state.commandKey);
  const rows = state.resultList;
  const cols = state.resultListCols;

  useInput((_input, key) => {
    if (key.escape) onBack();
    else if (key.upArrow) setSelected((s) => Math.max(0, s - 1));
    else if (key.downArrow) setSelected((s) => Math.min(rows.length - 1, s + 1));
    else if (key.return) {
      if (rows[selected] && onDrillIn) onDrillIn(rows[selected]);
    }
  });

  const menuItems = [
    ...flattenMenu(MENU, state.expandedKeys),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];
  const menuCursor = menuItems.findIndex((f) => f.item.commandKey === state.commandKey);

  // 컬럼 너비 계산 (균등 분배)
  const colWidth = cols.length > 0 ? Math.floor(60 / cols.length) : 20;

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={crumbs}
          status={
            <Box gap={1}>
              <Text color={T.mint}>●</Text>
              <Text color={T.fgDim}>{rows.length} results</Text>
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
        <Panel title={crumbs.join(' ')} badge="LIST" accent={accent} focused>
          <Box flexDirection="column">
            {/* 헤더 행 */}
            <Box borderStyle="single" borderBottom borderTop={false} borderLeft={false} borderRight={false} borderColor={T.borderDim}>
              {cols.map((c) => (
                <Text key={c} color={T.fgFaint} bold>
                  {c.toUpperCase().padEnd(colWidth)}
                </Text>
              ))}
            </Box>
            {/* 데이터 행 */}
            {rows.map((row, i) => (
              <Box
                key={i}
                borderStyle="single"
                borderBottom
                borderTop={false}
                borderLeft={false}
                borderRight={false}
                borderColor={T.borderDim}
              >
                {cols.map((c) => (
                  <Text
                    key={c}
                    color={i === selected ? accent : T.fg}
                    bold={i === selected}
                  >
                    {String(row[c] ?? '').slice(0, colWidth - 1).padEnd(colWidth)}
                  </Text>
                ))}
              </Box>
            ))}
            {/* 푸터 */}
            <Box marginTop={1}>
              <Text color={T.fgFaint}>
                showing 1–{rows.length} · row{' '}
              </Text>
              <Text color={accent}>{selected + 1}</Text>
              <Text color={T.fgFaint}> selected · ↵ to drill in</Text>
            </Box>
          </Box>
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} />}
      footer={
        <Keymap accent={accent} keys={[
          { key: '↑↓', label: 'navigate' },
          { key: '↵', label: 'view' },
          { key: 'Esc', label: 'back' },
        ]} />
      }
    />
  );
}
