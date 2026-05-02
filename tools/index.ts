#!/usr/bin/env node
import { loadEnv } from './common/env-loader.js';
import { runServer } from './mcp/server.js';

// 환경변수 로드 (우선순위: shell env > ./tdecollab.env > ~/.config/tdecollab/.env)
loadEnv();

runServer().catch((error) => {
    console.error('Fatal error in MCP Server entry point:', error);
    process.exit(1);
});
