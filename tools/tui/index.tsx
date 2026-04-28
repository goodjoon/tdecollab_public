#!/usr/bin/env node
import { render } from 'ink';
import { App } from './App.js';
import { loadTuiConfig } from './tuiconfig.js';

// 터미널 alternate screen buffer 진입/복귀 (vim/less 방식)
const ENTER_ALT_SCREEN = '\x1b[?1049h\x1b[H';
const LEAVE_ALT_SCREEN = '\x1b[?1049l';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  process.stdout.write(SHOW_CURSOR + LEAVE_ALT_SCREEN);
}

async function main() {
  const config = await loadTuiConfig();

  // alternate screen 진입 (전체 화면 모드)
  process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);

  // 비정상 종료 대비
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });
  process.on('uncaughtException', (err) => {
    cleanup();
    console.error(err);
    process.exit(1);
  });

  const { waitUntilExit } = render(<App config={config} />, {
    exitOnCtrlC: true,
  });

  await waitUntilExit();
  cleanup();
}

main().catch((err) => {
  cleanup();
  console.error('TUI 시작 실패:', err);
  process.exit(1);
});
