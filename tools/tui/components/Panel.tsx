import { Box, Text } from 'ink';
import React from 'react';
import { T } from '../theme.js';

interface PanelProps {
  title?: string;
  badge?: string;
  accent?: string;
  focused?: boolean;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  width?: number;
  flexGrow?: number;
}

export function Panel({
  title,
  badge,
  accent = T.pink,
  focused = false,
  children,
  headerRight,
  width,
  flexGrow,
}: PanelProps) {
  const borderColor = focused ? accent : T.border;

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      flexDirection="column"
      width={width}
      flexGrow={flexGrow ?? (width ? 0 : 1)}
    >
      {(title || badge) && (
        <Box
          borderStyle="single"
          borderBottom
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderColor={T.borderDim}
          paddingX={1}
          paddingY={0}
        >
          {badge && (
            <Text
              backgroundColor={focused ? accent : T.panelHi}
              color={focused ? T.bg : T.fgDim}
              bold
            >
              {' '}{badge}{' '}
            </Text>
          )}
          {title && (
            <Text color={focused ? accent : T.fgDim}>
              {badge ? ' ' : ''}{title}
            </Text>
          )}
          {headerRight && (
            <>
              <Text> </Text>
              {headerRight}
            </>
          )}
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {children}
      </Box>
    </Box>
  );
}
