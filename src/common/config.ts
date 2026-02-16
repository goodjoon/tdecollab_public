import dotenv from 'dotenv';
import { ConfluenceConfig, GitlabConfig, JiraConfig } from './types.js';
import { logger } from './logger.js';

dotenv.config();

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

// Confluence 설정 로드
export function loadConfluenceConfig(): ConfluenceConfig {
    const baseUrl = getEnvOrThrow('CONFLUENCE_BASE_URL', 'Confluence 기본 URL');
    // Username은 선택값 (Bearer Token 사용 시 불필요)
    const username = process.env.CONFLUENCE_USERNAME;
    const token = getEnvOrThrow('CONFLUENCE_API_TOKEN', 'Confluence API 토큰');

    return {
        baseUrl,
        auth: {
            username,
            token, // API 토큰은 일반적으로 패스워드 필드에 사용되지만, 여기서는 token으로 저장하여 범용성 확보
        },
    };
}

// JIRA 설정 로드
export function loadJiraConfig(): JiraConfig {
    const baseUrl = getEnvOrThrow('JIRA_BASE_URL', 'JIRA 기본 URL');
    // Username은 선택값 (PAT 사용 시 불필요)
    const username = process.env.JIRA_USERNAME;
    const token = getEnvOrThrow('JIRA_API_TOKEN', 'JIRA API 토큰');

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
