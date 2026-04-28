import { Box, Text, useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { COMMANDS } from '../command-def.js';
import { AppShell } from '../components/AppShell.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import {
  MENU,
  META_ITEMS,
  flattenMenu,
  pathFromCommandKey,
  type MenuItem,
} from '../menu-def.js';
import type { AppState } from '../state.js';
import { T, DEFAULT_ACCENT } from '../theme.js';

interface MenuScreenProps {
  state: AppState;
  onSelectCommand: (commandKey: string) => void;
  onToggleExpanded: (key: string) => void;
  onOpenHistory: () => void;
  onQuit: () => void;
  accent?: string;
}

export function MenuScreen({
  state,
  onSelectCommand,
  onToggleExpanded,
  onOpenHistory,
  onQuit,
  accent = DEFAULT_ACCENT,
}: MenuScreenProps) {
  const expanded = state.expandedKeys;
  const allItems = [
    ...flattenMenu(MENU, expanded),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];

  // 마지막으로 선택했던 위치를 초기 커서로 사용
  const initialCursor = (() => {
    if (!state.activePath) return 0;
    const idx = allItems.findIndex(
      (f) => f.item.commandKey === state.activePath || f.item.key === state.activePath,
    );
    return idx >= 0 ? idx : 0;
  })();

  const [cursor, setCursor] = useState(initialCursor);
  const [scrollOffset, setScrollOffset] = useState(0);

  // 현재 커서 아이템
  const currentFlat = allItems[cursor];
  const currentItem = currentFlat?.item;
  const commandKey = currentItem?.commandKey;
  const commandDef = commandKey ? COMMANDS[commandKey] : null;

  // 화면에 맞게 스크롤 조정
  const adjustScroll = useCallback((newCursor: number) => {
    const maxVisible = 24;
    if (newCursor < scrollOffset) setScrollOffset(newCursor);
    else if (newCursor >= scrollOffset + maxVisible) setScrollOffset(newCursor - maxVisible + 1);
  }, [scrollOffset]);

  useInput((input, key) => {
    if (key.upArrow) {
      const next = Math.max(0, cursor - 1);
      setCursor(next);
      adjustScroll(next);
    } else if (key.downArrow) {
      const next = Math.min(allItems.length - 1, cursor + 1);
      setCursor(next);
      adjustScroll(next);
    } else if (key.rightArrow || key.return) {
      if (currentItem?.children) {
        onToggleExpanded(currentItem.key);
      } else if (currentItem?.commandKey) {
        onSelectCommand(currentItem.commandKey);
      } else if (currentItem?.key === 'history') {
        onOpenHistory();
      }
    } else if (key.leftArrow) {
      if (currentFlat?.parentKey && expanded.includes(currentFlat.parentKey)) {
        onToggleExpanded(currentFlat.parentKey);
      }
    } else if (input === 'h') {
      onOpenHistory();
    } else if (input === 'q' || (key.ctrl && input === 'c')) {
      onQuit();
    }
  });

  // 초기 마운트 시 스크롤을 커서 위치로 맞춤
  useEffect(() => {
    if (initialCursor > 0) adjustScroll(initialCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crumbs = commandKey
    ? pathFromCommandKey(commandKey)
    : currentItem?.key === 'history'
      ? ['history']
      : ['menu'];

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={crumbs}
          status={
            <Box gap={1}>
              <Text color={T.mint}>●</Text>
              <Text color={T.fgDim}>ready</Text>
            </Box>
          }
        />
      }
      menu={
        <Panel title="Commands" badge="MENU" accent={accent} focused>
          <MenuTree items={allItems} cursor={cursor} accent={accent} scrollOffset={scrollOffset} />
        </Panel>
      }
      body={
        <Panel
          title={commandDef?.label ?? currentItem?.label ?? 'tdecollab'}
          badge="DETAILS"
          accent={accent}
        >
          {commandDef ? (
            <CommandDetails def={commandDef} accent={accent} />
          ) : (
            <WelcomeView accent={accent} />
          )}
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} />}
      footer={
        <Keymap accent={accent} keys={[
          { key: '↑↓', label: 'navigate' },
          { key: '→/↵', label: 'select / expand' },
          { key: '←', label: 'collapse' },
          { key: 'h', label: 'history' },
          { key: 'q', label: 'quit' },
        ]} />
      }
    />
  );
}

function WelcomeView({ accent }: { accent: string }) {
  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      <Text color={accent} bold>tdecollab TUI</Text>
      <Text color={T.fgDim}>좌측 메뉴에서 명령을 선택하세요.</Text>
      <Box marginTop={1} flexDirection="column" gap={0}>
        <Text color={T.fgFaint}>  Confluence  ◆ 페이지/스페이스/검색</Text>
        <Text color={T.fgFaint}>  JIRA        ◆ 이슈/검색</Text>
        <Text color={T.fgFaint}>  GitLab      ◆ MR/파이프라인</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={T.amber}>↵</Text>
        <Text color={T.fgDim}> 를 눌러 명령 폼으로 진입합니다.</Text>
      </Box>
    </Box>
  );
}

function CommandDetails({ def, accent }: { def: import('../command-def.js').CommandDef; accent: string }) {
  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      <Box flexDirection="column" gap={0}>
        <Text color={T.fgDim} bold>DESCRIPTION</Text>
        <Text color={T.fg}>{def.description}</Text>
      </Box>
      <Box flexDirection="column" gap={0}>
        <Text color={T.fgDim} bold>SYNOPSIS</Text>
        <Box borderStyle="single" borderColor={T.borderDim} paddingX={1} marginTop={0}>
          <Text color={T.cyan}>$ {def.synopsis}</Text>
        </Box>
      </Box>
      <Box flexDirection="column" gap={0}>
        <Text color={T.fgDim} bold>OPTIONS</Text>
        {def.fields.map((f: import('../command-def.js').FieldDef) => (
          <Box key={f.key} gap={2}>
            <Text color={accent}>{f.label.padEnd(28)}</Text>
            <Text color={T.fgDim}>{f.hint ?? (f.type === 'bool' ? 'flag' : f.type)}</Text>
            {f.required && <Text color={T.amber}> *required</Text>}
          </Box>
        ))}
      </Box>
      <Box
        borderStyle="single"
        borderColor={T.borderDim}
        paddingX={1}
        marginTop={1}
      >
        <Text color={T.amber}>↵</Text>
        <Text color={T.fgDim}> Enter를 눌러 입력 폼으로 진입합니다.</Text>
      </Box>
    </Box>
  );
}
