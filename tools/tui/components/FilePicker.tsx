import { Box, Text, useInput } from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { useMemo, useState } from 'react';
import { T, DEFAULT_ACCENT } from '../theme.js';

interface FilePickerProps {
  initialPath: string;
  pathType: 'file' | 'dir';
  onSelect: (selectedPath: string) => void;
  onCancel: () => void;
  accent?: string;
  maxVisible?: number;
}

interface Entry {
  name: string;
  isDir: boolean;
  isCurrent?: boolean; // "." — 현재 디렉토리 선택용
}

function resolveStartDir(initialPath: string): string {
  if (!initialPath) return process.cwd();
  const expanded = initialPath.replace(/^~/, os.homedir());
  const abs = path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
  try {
    const stat = fs.statSync(abs);
    return stat.isDirectory() ? abs : path.dirname(abs);
  } catch {
    // 존재하지 않는 경우 디렉토리 부분까지만 사용
    let dir = path.dirname(abs);
    while (dir && dir !== '/' && !fs.existsSync(dir)) {
      dir = path.dirname(dir);
    }
    return dir || process.cwd();
  }
}

export function FilePicker({
  initialPath,
  pathType,
  onSelect,
  onCancel,
  accent = DEFAULT_ACCENT,
  maxVisible = 14,
}: FilePickerProps) {
  const [currentDir, setCurrentDir] = useState(() => resolveStartDir(initialPath));
  const [cursor, setCursor] = useState(0);
  const [scroll, setScroll] = useState(0);

  const entries: Entry[] = useMemo(() => {
    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true })
        .filter((d) => !d.name.startsWith('.'));
      const dirs: Entry[] = items
        .filter((i) => i.isDirectory())
        .map((i) => ({ name: i.name, isDir: true }));
      const files: Entry[] = pathType === 'file'
        ? items.filter((i) => i.isFile()).map((i) => ({ name: i.name, isDir: false }))
        : [];
      return [
        { name: '.', isDir: true, isCurrent: true },
        { name: '..', isDir: true },
        ...dirs.sort((a, b) => a.name.localeCompare(b.name)),
        ...files.sort((a, b) => a.name.localeCompare(b.name)),
      ];
    } catch {
      return [
        { name: '.', isDir: true, isCurrent: true },
        { name: '..', isDir: true },
      ];
    }
  }, [currentDir, pathType]);

  function move(delta: number) {
    const next = Math.max(0, Math.min(entries.length - 1, cursor + delta));
    setCursor(next);
    if (next < scroll) setScroll(next);
    else if (next >= scroll + maxVisible) setScroll(next - maxVisible + 1);
  }

  function selectEntry(entry: Entry) {
    // "." — 현재 디렉토리 자체 선택 (말미에 / 포함하여 이어쓰기 용이)
    if (entry.isCurrent) {
      onSelect(toRelativeIfPossible(currentDir) + path.sep);
      return;
    }
    const fullPath = entry.name === '..'
      ? path.dirname(currentDir)
      : path.join(currentDir, entry.name);
    if (entry.isDir) {
      // 디렉토리는 진입
      setCurrentDir(fullPath);
      setCursor(0);
      setScroll(0);
    } else {
      // 파일 선택
      onSelect(toRelativeIfPossible(fullPath));
    }
  }

  function selectCurrentDir() {
    // 디렉토리 모드: 현재 디렉토리 자체를 선택
    onSelect(toRelativeIfPossible(currentDir) + path.sep);
  }

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.upArrow) {
      move(-1);
    } else if (key.downArrow) {
      move(1);
    } else if (key.pageUp) {
      move(-maxVisible);
    } else if (key.pageDown) {
      move(maxVisible);
    } else if (key.return) {
      const entry = entries[cursor];
      if (entry) selectEntry(entry);
    } else if (input === ' ' || key.tab) {
      // Space/Tab: 현재 디렉토리 선택 (특히 dir 모드에서 유용)
      if (pathType === 'dir') {
        selectCurrentDir();
      } else {
        const entry = entries[cursor];
        if (entry && !entry.isDir) selectEntry(entry);
      }
    }
  });

  const visible = entries.slice(scroll, scroll + maxVisible);
  const displayPath = currentDir.replace(os.homedir(), '~');

  return (
    <Box
      borderStyle="round"
      borderColor={accent}
      flexDirection="column"
      paddingX={1}
    >
      {/* 헤더 */}
      <Box>
        <Text color={accent} bold>
          {pathType === 'file' ? '📄 파일 선택' : '📁 디렉토리 선택'}
        </Text>
        <Text color={T.fgFaint}>  {displayPath}</Text>
      </Box>

      {/* 엔트리 목록 */}
      <Box flexDirection="column" marginTop={1}>
        {visible.map((entry, vi) => {
          const idx = vi + scroll;
          const isActive = idx === cursor;
          return (
            <Box key={`${entry.name}-${idx}`}>
              <Text color={isActive ? accent : 'transparent'}>
                {isActive ? '▶ ' : '  '}
              </Text>
              <Text
                color={
                  isActive ? accent :
                  entry.isCurrent ? T.amber :
                  entry.isDir ? T.cyan :
                  T.fg
                }
                bold={isActive}
              >
                {entry.isCurrent ? '✓ ' : entry.isDir ? '📁 ' : '📄 '}
                {entry.name}
                {entry.isCurrent ? '   (현재 디렉토리 선택)' : entry.isDir && entry.name !== '..' ? '/' : ''}
              </Text>
            </Box>
          );
        })}
        {entries.length > maxVisible && (
          <Text color={T.fgFaint}>
            {scroll + 1}–{Math.min(scroll + maxVisible, entries.length)} / {entries.length}
          </Text>
        )}
      </Box>

      {/* 푸터 */}
      <Box marginTop={1}>
        <Text color={T.fgFaint}>
          ↑↓ navigate · ↵ on "." select current · ↵ on dir = open · ↵ on file = select · Esc cancel
        </Text>
      </Box>
    </Box>
  );
}

// 가능하면 cwd 기준 상대경로로 변환 (그렇지 않으면 절대경로 유지)
function toRelativeIfPossible(absPath: string): string {
  const cwd = process.cwd();
  const rel = path.relative(cwd, absPath);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
    return './' + rel;
  }
  return absPath;
}
