import { ServiceConfig } from './types.js';

// Basic 인증 헤더 생성
export function createBasicAuthHeader(username: string, token: string): string {
    const credentials = Buffer.from(`${username}:${token}`).toString('base64');
    return `Basic ${credentials}`;
}

// Bearer 인증 헤더 생성
export function createBearerAuthHeader(token: string): string {
    return `Bearer ${token}`;
}

// 설정 기반 인증 헤더 반환
export function getAuthHeader(config: ServiceConfig): Record<string, string> {
    if (config.auth.username && config.auth.token) {
        // Confluence, JIRA 등 Basic Auth 사용 (Email + API Token)
        return {
            Authorization: createBasicAuthHeader(config.auth.username, config.auth.token),
        };
    } else if (config.auth.token) {
        // GitLab 등 토큰 기반 인증
        // GitLab은 주로 'PRIVATE-TOKEN' 헤더를 사용하나, OAuth 등에서는 Bearer도 사용 가능
        // 여기서는 일반적인 Authorization 헤더를 반환하며, 서비스별 특수 헤더는 클라이언트 레벨에서 처리 필요
        return {
            Authorization: `Bearer ${config.auth.token}`,
        };
    }
    return {};
}
