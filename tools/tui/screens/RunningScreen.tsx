import { Box, Text } from 'ink';
import { Spinner } from '../components/Spinner.js';
import { AppShell } from '../components/AppShell.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import { MENU, META_ITEMS, flattenMenu, pathFromCommandKey, type MenuItem } from '../menu-def.js';
import type { AppState } from '../state.js';
import { T, DEFAULT_ACCENT } from '../theme.js';

interface RunningScreenProps {
  state: AppState;
  onCancel: () => void;
  accent?: string;
}

export function RunningScreen({ state, onCancel, accent = DEFAULT_ACCENT }: RunningScreenProps) {
  const crumbs = pathFromCommandKey(state.commandKey);
  const doneCount = state.steps.filter((s) => s.state === 'done').length;
  const total = state.steps.length;

  const menuItems = [
    ...flattenMenu(MENU, state.expandedKeys),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];
  const menuCursor = menuItems.findIndex((f) => f.item.commandKey === state.commandKey);

  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const barWidth = 40;
  const filled = Math.round((progressPct / 100) * barWidth);

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={crumbs}
          status={
            <Box gap={1}>
              <Spinner color={T.cyan} />
              <Text color={T.cyan} bold>RUNNING</Text>
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
        <Panel title="Pipeline" badge="EXEC" accent={T.cyan} focused>
          <Box flexDirection="column" gap={1} paddingY={1}>
            <Text color={T.fgDim} bold>STEPS</Text>
            {state.steps.map((step) => (
              <Box key={step.id} gap={2}>
                {step.state === 'done'    && <Text color={T.mint}>✓</Text>}
                {step.state === 'running' && <Spinner color={T.cyan} />}
                {step.state === 'pending' && <Text color={T.fgFaint}>○</Text>}
                {step.state === 'err'     && <Text color={T.red}>✕</Text>}
                <Box flexDirection="column">
                  <Text
                    color={
                      step.state === 'pending' ? T.fgMute :
                      step.state === 'running' ? T.fg :
                      step.state === 'err'     ? T.red :
                      T.fg
                    }
                    bold={step.state === 'running'}
                  >
                    {step.title}
                  </Text>
                  <Text color={T.fgFaint}>{step.detail}</Text>
                </Box>
                {step.state === 'running' && (
                  <Text backgroundColor={T.cyan} color={T.bg} bold> IN PROGRESS </Text>
                )}
                {step.state === 'done' && <Text color={T.fgFaint}>done</Text>}
              </Box>
            ))}

            {/* 진행바 */}
            <Box
              borderStyle="single"
              borderColor={T.borderDim}
              paddingX={1}
              flexDirection="column"
              marginTop={1}
            >
              <Box gap={2}>
                <Text color={T.fgDim}>Overall progress</Text>
                <Text color={T.cyan}>{doneCount} / {total} · {progressPct}%</Text>
              </Box>
              <Box>
                <Text color={T.mint}>{'█'.repeat(filled)}</Text>
                <Text color={T.borderDim}>{'░'.repeat(barWidth - filled)}</Text>
              </Box>
            </Box>
          </Box>
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} title="Stream" maxLines={6} />}
      footer={
        <Keymap accent={accent} keys={[
          { key: 'Ctrl-C', label: 'cancel' },
        ]} />
      }
    />
  );
}
