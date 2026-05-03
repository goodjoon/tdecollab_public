#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerConfluenceCommands } from './confluence/commands/index.js';
import { registerJiraCommands } from './jira/commands/index.js';
import { registerGitlabCommands } from './gitlab/commands/index.js';
import { logger } from './common/logger.js';
import { loadEnv } from './common/env-loader.js';
import { formatRuntimeConfigDiagnostics } from './common/config-diagnostics.js';

// 환경변수 로드 (우선순위: shell env > ./tdecollab.env > ~/.config/tdecollab/.env)
loadEnv();

// package.json 에서 버전 동적 로드 (배포된 dist 의 상위에 위치)
function loadPackageVersion(): string {
    try {
        const here = path.dirname(fileURLToPath(import.meta.url));
        // 빌드된 dist/cli.js → ../package.json
        // 개발(tsx tools/cli.ts) → ../../package.json
        for (const candidate of [
            path.resolve(here, '..', 'package.json'),
            path.resolve(here, '..', '..', 'package.json'),
        ]) {
            if (fs.existsSync(candidate)) {
                const pkg = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
                if (pkg.name === 'tdecollab' && pkg.version) return pkg.version as string;
            }
        }
    } catch {
        // fallthrough
    }
    return '0.0.0';
}

// 인자 정규화 (pnpm/tsx 환경에서 넘어올 수 있는 불필요한 '--' 처리)
let args = process.argv;
if (args[2] === '--') {
    args = [args[0], args[1], ...args.slice(3)];
}

// 인자 없이 실행되면 TUI 모드로 진입
if (args.length <= 2) {
    await import('./tui/index.js');
    // TUI 가 alternate screen 을 점유하므로 commander 등록은 스킵
    process.exit(0);
}

const program = new Command();
let diagnosticsPrinted = false;

function printConfigDiagnosticsOnce() {
    if (diagnosticsPrinted) return;
    diagnosticsPrinted = true;
    console.error(formatRuntimeConfigDiagnostics());
}

program
    .name('tdecollab')
    .description('TDE Collaboration CLI')
    .version(loadPackageVersion(), '-V, --version', '버전 정보 출력')
    .option('-v, --verbose', '상세 로그 출력')
    .option('-d, --debug', '디버그 로그 출력')
    .enablePositionalOptions()
    .hook('preAction', (thisCommand) => {
        printConfigDiagnosticsOnce();
        const opts = program.opts();
        if (opts.verbose || opts.debug) {
            logger.setLevel('debug');
            logger.debug('Verbose/Debug mode enabled');
        }
    });

// 모듈별 커맨드 등록
registerConfluenceCommands(program);
registerJiraCommands(program);
registerGitlabCommands(program);

// MCP 서버 커맨드
program
    .command('mcp')
    .description('Run MCP Server')
    .action(async () => {
        const { runServer } = await import('./mcp/server.js');
        await runServer();
    });

program.parse(args);
