import { Box, Text, useInput, useStdout } from 'ink';
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

interface TextViewProps {
  state: AppState;
  onBack: () => void;
  accent?: string;
}

export function TextView({ state, onBack, accent = DEFAULT_ACCENT }: TextViewProps) {
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 40;
  const visibleLines = Math.max(8, termHeight - 18);
  const lines = state.resultText.split('\n');
  const [scrollTop, setScrollTop] = useState(0);
  const crumbs = pathFromCommandKey(state.commandKey);

  const maxScroll = Math.max(0, lines.length - visibleLines);
  const halfPage = Math.max(1, Math.floor(visibleLines / 2));

  useInput((input, key) => {
    if (key.escape || input === 'q') onBack();
    // 한 줄 단위
    else if (key.downArrow || input === 'j') setScrollTop((s) => Math.min(maxScroll, s + 1));
    else if (key.upArrow || input === 'k') setScrollTop((s) => Math.max(0, s - 1));
    // 페이지 끝
    else if (input === 'g') setScrollTop(0);
    else if (input === 'G') setScrollTop(maxScroll);
    // 한 페이지 단위 (vim: Ctrl+F / Ctrl+B, PageDown / PageUp)
    else if ((key.ctrl && input === 'f') || key.pageDown) {
      setScrollTop((s) => Math.min(maxScroll, s + visibleLines));
    }
    else if ((key.ctrl && input === 'b') || key.pageUp) {
      setScrollTop((s) => Math.max(0, s - visibleLines));
    }
    // 반 페이지 단위 (vim: Ctrl+D / Ctrl+U)
    else if (key.ctrl && input === 'd') {
      setScrollTop((s) => Math.min(maxScroll, s + halfPage));
    }
    else if (key.ctrl && input === 'u') {
      setScrollTop((s) => Math.max(0, s - halfPage));
    }
  });

  const visible = lines.slice(scrollTop, scrollTop + visibleLines);

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
          crumbs={[...crumbs, 'result']}
          status={
            <Box gap={1}>
              <Text color={T.cyan}>VIEW</Text>
              <Text color={T.fgDim}>· {lines.length} lines</Text>
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
        <Panel title="Result" badge="MARKDOWN" accent={accent} focused>
          <Box flexDirection="column">
            {/* 줄 번호 + 내용 */}
            {visible.map((line, i) => {
              const lineNo = scrollTop + i + 1;
              const isH1 = line.startsWith('# ');
              const isH2 = line.startsWith('## ');
              const isH3 = line.startsWith('### ');
              const isCode = line.startsWith('```') || line.startsWith('    ');
              const isListItem = /^[*\-+] /.test(line) || /^\d+\. /.test(line);
              return (
                <Box key={lineNo} gap={1}>
                  <Text color={T.fgFaint}>{String(lineNo).padStart(4)}</Text>
                  <Text
                    color={
                      isH1 ? accent :
                      isH2 ? accent :
                      isH3 ? T.cyan :
                      isCode ? T.mint :
                      isListItem ? T.fg :
                      T.fg
                    }
                    bold={isH1 || isH2}
                  >
                    {line}
                  </Text>
                </Box>
              );
            })}
            {/* 스크롤 힌트 */}
            <Box marginTop={1}>
              <Text color={T.fgFaint}>
                {scrollTop + 1}–{Math.min(scrollTop + visibleLines, lines.length)} / {lines.length} lines
              </Text>
            </Box>
          </Box>
        </Panel>
      }
      log={<LogPane lines={state.logs} accent={accent} />}
      footer={
        <Keymap accent={accent} keys={[
          { key: 'j/k', label: 'line' },
          { key: 'Ctrl+D/U', label: 'half page' },
          { key: 'Ctrl+F/B', label: 'full page' },
          { key: 'g/G', label: 'top/end' },
          { key: 'q/Esc', label: 'back' },
        ]} />
      }
    />
  );
}
