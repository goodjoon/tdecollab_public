import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Environment Loader', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string;
  let projectDir: string;
  let homeDir: string;

  beforeEach(() => {
    vi.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tdecollab-env-test-'));
    projectDir = path.join(tempDir, 'project');
    homeDir = path.join(tempDir, 'home');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(homeDir, '.config', 'tdecollab'), { recursive: true });

    process.env = { ...originalEnv, HOME: homeDir };
    delete process.env.CONFLUENCE_BASE_URL;
    delete process.env.CONFLUENCE_API_TOKEN;
    process.chdir(projectDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('사용자 글로벌 설정 파일을 로드한다', async () => {
    fs.writeFileSync(
      path.join(homeDir, '.config', 'tdecollab', '.env'),
      'CONFLUENCE_BASE_URL=https://global.example.com\n',
    );

    const { loadEnv } = await import('../../tools/common/env-loader.js');
    loadEnv();

    expect(process.env.CONFLUENCE_BASE_URL).toBe('https://global.example.com');
  });

  it('현재 디렉토리의 tdecollab.env가 사용자 글로벌 설정보다 우선한다', async () => {
    fs.writeFileSync(
      path.join(homeDir, '.config', 'tdecollab', '.env'),
      'CONFLUENCE_BASE_URL=https://global.example.com\n',
    );
    fs.writeFileSync(
      path.join(projectDir, 'tdecollab.env'),
      'CONFLUENCE_BASE_URL=https://local.example.com\n',
    );

    const { loadEnv } = await import('../../tools/common/env-loader.js');
    loadEnv();

    expect(process.env.CONFLUENCE_BASE_URL).toBe('https://local.example.com');
  });

  it('이미 설정된 환경변수가 설정 파일보다 우선한다', async () => {
    process.env.CONFLUENCE_BASE_URL = 'https://shell.example.com';
    fs.writeFileSync(
      path.join(homeDir, '.config', 'tdecollab', '.env'),
      'CONFLUENCE_BASE_URL=https://global.example.com\n',
    );
    fs.writeFileSync(
      path.join(projectDir, 'tdecollab.env'),
      'CONFLUENCE_BASE_URL=https://local.example.com\n',
    );

    const { loadEnv } = await import('../../tools/common/env-loader.js');
    loadEnv();

    expect(process.env.CONFLUENCE_BASE_URL).toBe('https://shell.example.com');
  });
});
