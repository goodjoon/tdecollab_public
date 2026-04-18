import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'tools/index.ts',
    cli: 'tools/cli.ts',
  },
  format: ['esm'],
  target: 'node20',
  dts: true,
  sourcemap: true,
  clean: true,
  shims: false,
});
