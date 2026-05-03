import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Config diagnostics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      CONFLUENCE_BASE_URL: 'https://confluence.example.com',
      CONFLUENCE_API_TOKEN: 'secret-token-value',
      CONFLUENCE_AUTH_TYPE: 'bearer',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('민감값은 masking하고 최종 인증 방식을 출력한다', async () => {
    const { formatRuntimeConfigDiagnostics } = await import('../../tools/common/config-diagnostics.js');

    const diagnostics = formatRuntimeConfigDiagnostics();

    expect(diagnostics).toContain('설정 로딩 진단');
    expect(diagnostics).toContain('confluence auth mode: Bearer');
    expect(diagnostics).toContain('CONFLUENCE_BASE_URL=https://confluence.example.com');
    expect(diagnostics).toContain('CONFLUENCE_API_TOKEN=secr...alue len=18');
    expect(diagnostics).not.toContain('secret-token-value');
  });
});
