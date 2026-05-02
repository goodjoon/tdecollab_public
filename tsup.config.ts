import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'tools/index.ts',
    cli: 'tools/cli.ts',
    'tui/index': 'tools/tui/index.tsx',
  },
  format: ['esm'],
  target: 'node20',
  // TUI 는 React 컴포넌트로 구성되어 있어 dts 생성 시 React 타입까지 emit 하려고 시도하므로 비활성화한다.
  // 라이브러리가 아닌 실행 파일이라 .d.ts 가 필요 없음.
  dts: false,
  sourcemap: true,
  clean: true,
  shims: false,
});
