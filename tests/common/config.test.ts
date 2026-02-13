import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfluenceConfig, loadJiraConfig, loadGitlabConfig } from '../../src/common/config.js';

describe('Config Loader', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('loadConfluenceConfig', () => {
        it('should load valid config', () => {
            process.env.CONFLUENCE_BASE_URL = 'https://confluence.example.com';
            process.env.CONFLUENCE_USERNAME = 'user@example.com';
            process.env.CONFLUENCE_API_TOKEN = 'secret-token';

            const config = loadConfluenceConfig();
            expect(config.baseUrl).toBe('https://confluence.example.com');
            expect(config.auth.username).toBe('user@example.com');
            expect(config.auth.token).toBe('secret-token');
        });

        it('should throw error if missing env vars', () => {
            delete process.env.CONFLUENCE_BASE_URL;
            expect(() => loadConfluenceConfig()).toThrow(/환경변수 'CONFLUENCE_BASE_URL'가 설정되지 않았습니다/);
        });
    });

    describe('loadJiraConfig', () => {
        it('should load valid config', () => {
            process.env.JIRA_BASE_URL = 'https://jira.example.com';
            process.env.JIRA_USERNAME = 'user@example.com';
            process.env.JIRA_API_TOKEN = 'secret-token';

            const config = loadJiraConfig();
            expect(config.baseUrl).toBe('https://jira.example.com');
            expect(config.auth.username).toBe('user@example.com');
            expect(config.auth.token).toBe('secret-token');
        });
    });

    describe('loadGitlabConfig', () => {
        it('should load valid config with default base url', () => {
            process.env.GITLAB_PRIVATE_TOKEN = 'glpat-secret';

            const config = loadGitlabConfig();
            expect(config.baseUrl).toBe('https://gitlab.com');
            expect(config.auth.token).toBe('glpat-secret');
        });

        it('should load custom base url', () => {
            process.env.GITLAB_BASE_URL = 'https://gitlab.company.com';
            process.env.GITLAB_PRIVATE_TOKEN = 'glpat-secret';

            const config = loadGitlabConfig();
            expect(config.baseUrl).toBe('https://gitlab.company.com');
        });
    });
});
