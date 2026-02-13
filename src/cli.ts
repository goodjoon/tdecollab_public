#!/usr/bin/env node
import { Command } from 'commander';
import { registerConfluenceCommands } from './confluence/commands/index.js';
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

program.parse(process.argv);
