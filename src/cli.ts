#!/usr/bin/env node
import { Command } from 'commander';
import { registerConfluenceCommands } from './confluence/commands/index.js';
import { registerJiraCommands } from './jira/commands/index.js';
import { registerGitlabCommands } from './gitlab/commands/index.js';
import { logger } from './common/logger.js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const program = new Command();

program
    .name('tdecollab')
    .description('TDE Collaboration CLI')
    .version('0.1.0', '-V, --version', '버전 정보 출력')
    .option('-v, --verbose', '상세 로그 출력')
    .option('-d, --debug', '디버그 로그 출력')
    .enablePositionalOptions()
    .hook('preAction', (thisCommand) => {
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

// 인자 파싱 (pnpm/tsx 환경에서 넘어올 수 있는 불필요한 '--' 처리)
let args = process.argv;
if (args[2] === '--') {
    args = [args[0], args[1], ...args.slice(3)];
}
program.parse(args);
