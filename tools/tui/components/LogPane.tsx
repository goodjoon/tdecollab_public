import { Box, Text } from 'ink';
import type { LogEntry } from '../state.js';
import { T } from '../theme.js';

const LEVEL_COLOR: Record<string, string> = {
  info: T.fgDim,
  ok:   T.mint,
  warn: T.amber,
  err:  T.red,
  run:  T.cyan,
  dim:  T.fgMute,
};
const LEVEL_LABEL: Record<string, string> = {
  info: 'INFO',
  ok:   ' OK ',
  warn: 'WARN',
  err:  ' ERR',
  run:  'RUN ',
  dim:  '... ',
};

interface LogPaneProps {
  lines: LogEntry[];
  accent?: string;
  title?: string;
  maxLines?: number;
}

export function LogPane({ lines, accent = T.pink, title = 'Log', maxLines = 8 }: LogPaneProps) {
  const visible = lines.slice(-maxLines);
  return (
    <Box
      borderStyle="round"
      borderColor={T.borderDim}
      flexDirection="column"
      flexGrow={1}
    >
      <Box
        borderStyle="single"
        borderBottom
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderColor={T.borderDim}
        paddingX={1}
      >
        <Text color={T.fgFaint} bold>{title.toUpperCase()}</Text>
        <Box flexGrow={1} />
        <Text color={T.fgFaint}>{lines.length} lines</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        {visible.map((l, i) => (
          <Box key={i} gap={2}>
            <Text color={T.fgFaint}>{l.ts}</Text>
            <Text color={LEVEL_COLOR[l.level] ?? T.fgDim} bold>
              {LEVEL_LABEL[l.level] ?? l.level.toUpperCase()}
            </Text>
            <Text
              color={
                l.level === 'err' ? T.red :
                l.level === 'warn' ? T.amber :
                T.fg
              }
            >
              {l.text}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
