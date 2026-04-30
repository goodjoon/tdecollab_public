import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['tests/**/*.test.ts', 'src/**/*.spec.ts', 'tools/**/__tests__/**/*.spec.ts'],
    globals: true,
  },
});
