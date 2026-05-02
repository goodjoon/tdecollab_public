import { Box, Text } from 'ink';
import type { FlatItem } from '../menu-def.js';
import { T } from '../theme.js';

interface MenuTreeProps {
  items: FlatItem[];
  cursor: number;
  accent?: string;
  maxVisible?: number;
  scrollOffset?: number;
}

export function MenuTree({
  items,
  cursor,
  accent = T.pink,
  maxVisible = 30,
  scrollOffset = 0,
}: MenuTreeProps) {
  const visible = items.slice(scrollOffset, scrollOffset + maxVisible);

  return (
    <Box flexDirection="column">
      {visible.map((flat, visIdx) => {
        const idx = visIdx + scrollOffset;
        const { item, depth } = flat;
        const isActive = idx === cursor;
        const indent = depth * 2;
        const isSeparator = item.label.startsWith('─');

        if (isSeparator) {
          return (
            <Box key={item.key}>
              <Text color={T.fgFaint}>{item.label}</Text>
            </Box>
          );
        }

        return (
          <Box key={item.key} gap={0}>
            {/* 들여쓰기 */}
            <Text>{' '.repeat(indent)}</Text>
            {/* 커서 */}
            <Text color={isActive ? accent : 'transparent'}>{isActive ? '▶' : ' '}</Text>
            {/* 아이콘 */}
            {item.icon && (
              <Text color={isActive ? accent : (item.dim ? T.fgFaint : T.fgDim)}>
                {item.icon}{' '}
              </Text>
            )}
            {/* 레이블 */}
            <Text
              color={isActive ? accent : (item.dim ? T.fgMute : T.fg)}
              bold={isActive}
            >
              {item.label}
            </Text>
            {/* 뱃지 */}
            {item.badge && (
              <Text color={item.badgeColor ?? T.fgDim}> {item.badge}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
