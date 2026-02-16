#!/usr/bin/env node
import { Command } from 'commander';
import { registerConfluenceCommands } from './confluence/commands/index.js';
import { registerJiraCommands } from './jira/commands/index.js';
import { registerGitlabCommands } from './gitlab/commands/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
    .name('tdecollab')
    .description('TDE Collaboration CLI')
    .version('0.1.0');

// Register module commands
registerConfluenceCommands(program);
registerJiraCommands(program);
registerGitlabCommands(program);

program
    .command('mcp')
    .description('Run MCP Server')
    .action(async () => {
        const { runServer } = await import('./mcp/server.js');
        await runServer();
    });

program.parse(process.argv);
