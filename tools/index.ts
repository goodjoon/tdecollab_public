#!/usr/bin/env node
import { runServer } from './mcp/server.js';


runServer().catch((error) => {
    console.error('Fatal error in MCP Server entry point:', error);
    process.exit(1);
});
