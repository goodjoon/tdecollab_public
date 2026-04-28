import { Box } from 'ink';
import React from 'react';
import { T } from '../theme.js';

interface AppShellProps {
  header: React.ReactNode;
  menu: React.ReactNode;
  body: React.ReactNode;
  log: React.ReactNode;
  footer?: React.ReactNode;
  menuWidth?: number;
}

export function AppShell({
  header,
  menu,
  body,
  log,
  footer,
  menuWidth = 32,
}: AppShellProps) {
  return (
    <Box flexDirection="column" flexGrow={1} height="100%" width="100%">
      {/* 헤더 */}
      <Box
        borderStyle="single"
        borderColor={T.borderDim}
        paddingX={1}
        flexShrink={0}
      >
        {header}
      </Box>

      {/* 3-pane 메인 영역 — 남은 공간 모두 차지 */}
      <Box flexGrow={1} gap={1} minHeight={0}>
        {/* 좌측 메뉴 */}
        <Box width={menuWidth} flexShrink={0}>
          {menu}
        </Box>
        {/* 우측 본문 */}
        <Box flexGrow={1} minWidth={0}>
          {body}
        </Box>
      </Box>

      {/* 하단 로그 */}
      <Box height={10} flexShrink={0}>
        {log}
      </Box>

      {/* 키맵 */}
      {footer && (
        <Box
          borderStyle="single"
          borderColor={T.borderDim}
          flexShrink={0}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
}
