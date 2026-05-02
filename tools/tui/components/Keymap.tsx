import { Box, Text } from 'ink';
import { T } from '../theme.js';

interface KeyBinding {
  key: string;
  label: string;
}

interface KeymapProps {
  keys: KeyBinding[];
  accent?: string;
  hidden?: boolean;
}

export function Keymap({ keys, accent = T.pink, hidden = false }: KeymapProps) {
  if (hidden) return null;
  return (
    <Box paddingX={1} gap={2} flexWrap="wrap">
      {keys.map((k, i) => (
        <Box key={i} gap={1}>
          <Text backgroundColor={T.panelHi} color={accent}> {k.key} </Text>
          <Text color={T.fgDim}>{k.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
