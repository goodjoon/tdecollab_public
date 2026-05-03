import { ConfluenceConfig, GitlabConfig, JiraConfig } from './types.js';
import { logger } from './logger.js';
import { loadEnv } from './env-loader.js';

// 환경변수 로드 (우선순위: shell env > ./tdecollab.env > ~/.config/tdecollab/.env)
loadEnv();

// 환경변수 조회 및 미설정 시 에러 발생
function getEnvOrThrow(key: string, description: string): string {
    const value = process.env[key];
    if (!value) {
        const errorMsg = `환경변수 '${key}'가 설정되지 않았습니다. (${description})`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    return value;
}

// Confluence 설정 로드 (PAT 인증 권장)
export function loadConfluenceConfig(): ConfluenceConfig & { mermaidMacroName: string, inlineCodeStyle: string } {
    const baseUrl = getEnvOrThrow('CONFLUENCE_BASE_URL', 'Confluence 기본 URL');
    // PAT 사용 시 username은 불필요 (Basic Auth 사용 시에만 필요)
    const authType = (process.env.CONFLUENCE_AUTH_TYPE || 'bearer').toLowerCase();
    const username = authType === 'basic' ? process.env.CONFLUENCE_USERNAME : undefined;
    const token = getEnvOrThrow('CONFLUENCE_API_TOKEN', 'Confluence PAT 토큰');
    
    // Mermaid 매크로 이름 (기본값: mermaiddiagram)
    const mermaidMacroName = process.env.CONFLUENCE_MERMAID_MACRO_NAME || 'mermaiddiagram';

    // 인라인 코드 강조 스타일 (기본값: 붉은색 굵게)
    const inlineCodeStyle = process.env.CONFLUENCE_INLINE_CODE_STYLE || 'color: #d04437; font-weight: bold;';

    return {
        baseUrl,
        auth: {
            username,
            token,
        },
        mermaidMacroName,
        inlineCodeStyle,
    };
}

// AI 서비스 설정 로드
export function loadAIConfig() {
    return {
        openaiApiKey: process.env.OPENAI_API_KEY,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        defaultProvider: process.env.AI_PROVIDER || 'openai',
        defaultModel: process.env.AI_MODEL || 'gpt-4o',
    };
}

// JIRA 설정 로드 (PAT 인증 권장)
export function loadJiraConfig(): JiraConfig {
    const baseUrl = getEnvOrThrow('JIRA_BASE_URL', 'JIRA 기본 URL');
    // PAT 사용 시 username은 불필요
    const username = process.env.JIRA_USERNAME;
    const token = getEnvOrThrow('JIRA_API_TOKEN', 'JIRA PAT 토큰');

    return {
        baseUrl,
        auth: {
            username,
            token,
        },
    };
}

// GitLab 설정 로드
export function loadGitlabConfig(): GitlabConfig {
    const baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
    const token = getEnvOrThrow('GITLAB_PRIVATE_TOKEN', 'GitLab Private Token');

    return {
        baseUrl,
        auth: {
            token,
        },
    };
}
