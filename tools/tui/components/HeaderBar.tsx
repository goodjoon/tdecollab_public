import { Box, Text } from 'ink';
import React from 'react';
import { T } from '../theme.js';

interface HeaderBarProps {
  crumbs?: string[];
  status?: React.ReactNode;
  accent?: string;
}

export function HeaderBar({ crumbs = [], status, accent = T.pink }: HeaderBarProps) {
  return (
    <Box paddingX={1} gap={1}>
      <Text color={accent} bold>tdecollab</Text>
      <Text color={T.fgFaint}>v0.2.3</Text>
      <Text color={T.fgFaint}>│</Text>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text color={T.fgFaint}>›</Text>}
          <Text color={i === crumbs.length - 1 ? T.fg : T.fgDim}>{c}</Text>
        </React.Fragment>
      ))}
      <Box flexGrow={1} />
      {status && <Box>{status}</Box>}
    </Box>
  );
}
