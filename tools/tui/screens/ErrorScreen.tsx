import { Box, Text, useInput } from 'ink';
import { AppShell } from '../components/AppShell.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import { MENU, META_ITEMS, flattenMenu, pathFromCommandKey, type MenuItem } from '../menu-def.js';
import type { AppState } from '../state.js';
import { T, DEFAULT_ACCENT } from '../theme.js';

interface ErrorScreenProps {
  state: AppState;
  onBack: () => void;
  onRetry: () => void;
  accent?: string;
}

export function ErrorScreen({ state, onBack, onRetry, accent = DEFAULT_ACCENT }: ErrorScreenProps) {
  const crumbs = pathFromCommandKey(state.commandKey);
  const errors = Object.entries(state.formErrors);

  useInput((input, key) => {
    if (key.escape) onBack();
    else if (input === 'r' || input === 'R') onRetry();
  });

  const menuItems = [
    ...flattenMenu(MENU, state.expandedKeys),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];
  const menuCursor = menuItems.findIndex((f) => f.item.commandKey === state.commandKey);

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={crumbs}
          status={
            <Box gap={1}>
              <Text color={T.red}>●</Text>
              <Text color={T.red}>{errors.length} errors</Text>
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
        <Panel title={crumbs.join(' ')} badge="ERROR" accent={T.red} focused>
          <Box flexDirection="column" gap={1} paddingY={1}>
            {/* 에러 배너 */}
            <Box
              borderStyle="single"
              borderColor={T.red}
              paddingX={1}
              flexDirection="column"
              gap={0}
            >
              <Text color={T.red} bold>✕ 유효성 검증에 실패했습니다 (E_VALIDATION)</Text>
              <Text color={T.fgDim}>
                {errors.length}개 오류를 수정한 뒤 다시 시도하세요.
              </Text>
            </Box>

            {/* 에러 항목 */}
            {errors.map(([key, msg]) => (
              <Box key={key} flexDirection="column" gap={0}>
                <Box gap={2}>
                  <Text color={T.red} bold>{key.padEnd(20)}</Text>
                  <Text color={T.red}>{msg}</Text>
                </Box>
              </Box>
            ))}

            {/* 로그에서 온 에러 (state.logs 중 err 레벨) */}
            {state.logs.filter((l) => l.level === 'err' || l.level === 'warn').map((l, i) => (
              <Box key={i} gap={2}>
                <Text color={l.level === 'err' ? T.red : T.amber}>
                  {l.level === 'err' ? '✕' : '⚠'}
                </Text>
                <Text color={l.level === 'err' ? T.red : T.amber}>{l.text}</Text>
              </Box>
            ))}

            {/* 액션 버튼 힌트 */}
            <Box gap={3} marginTop={1}>
              <Box gap={1}>
                <Text backgroundColor={T.panelHi} color={T.fg}> ↵ Back to form </Text>
              </Box>
              <Box gap={1}>
                <Text backgroundColor={T.panelHi} color={T.amber}> R Retry </Text>
              </Box>
              <Box gap={1}>
                <Text backgroundColor={T.panelHi} color={T.fgDim}> Esc Menu </Text>
              </Box>
            </Box>
          </Box>
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} title="Diagnostics" />}
      footer={
        <Keymap accent={accent} keys={[
          { key: '↵', label: 'back to form' },
          { key: 'R', label: 'retry' },
          { key: 'Esc', label: 'menu' },
        ]} />
      }
    />
  );
}
