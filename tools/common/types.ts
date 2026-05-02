// 서비스 설정 인터페이스
export interface ServiceConfig {
  baseUrl: string;
  auth: {
    username?: string;
    password?: string;
    token?: string;
  };
}

// 페이지네이션 요청 파라미터
export interface PaginatedParams {
  start?: number;
  limit?: number;
}

// 페이지네이션 응답 결과
export interface PaginatedResult<T> {
  results: T[];
  start: number;
  limit: number;
  size: number;
  total?: number;
  isLast?: boolean;
}

// 각 서비스별 설정 타입 별칭
export type ConfluenceConfig = ServiceConfig;
export type JiraConfig = ServiceConfig;
export type GitlabConfig = ServiceConfig;

// MCP 도구 응답 인터페이스
export interface McpToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
