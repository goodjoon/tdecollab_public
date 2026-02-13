import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthError, NotFoundError, ConflictError } from './errors.js';
import { logger } from './logger.js';
import { ServiceConfig } from './types.js';

export function createHttpClient(config: ServiceConfig): AxiosInstance {
    const client = axios.create({
        baseURL: config.baseUrl,
        timeout: 30000, // 30초 타임아웃
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // 요청 인터셉터: 인증 헤더 주입
    client.interceptors.request.use((reqConfig) => {
        // Basic 인증 (사용자명 + 토큰)
        if (config.auth.username && config.auth.token) {
            const token = Buffer.from(`${config.auth.username}:${config.auth.token}`).toString('base64');
            reqConfig.headers.Authorization = `Basic ${token}`;
        }
        // 토큰 기반 인증 (GitLab 등)
        else if (config.auth.token) {
            // GitLab 등은 PRIVATE-TOKEN 헤더를 사용하기도 하나,
            // 여기서는 표준 Authorization Bearer 헤더를 기본으로 사용.
            // 서비스별 특수 헤더는 필요 시 호출자나 별도 로직에서 처리.
            if (!reqConfig.headers.Authorization && !reqConfig.headers['PRIVATE-TOKEN']) {
                reqConfig.headers.Authorization = `Bearer ${config.auth.token}`;
            }
        }
        return reqConfig;
    });

    // 응답 인터셉터: 에러 핸들링 및 로깅
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            logger.debug(`[HTTP] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
            return response;
        },
        (error: AxiosError) => {
            if (error.response) {
                const status = error.response.status;
                const method = error.config?.method?.toUpperCase();
                const url = error.config?.url;
                const message = (error.response.data as any)?.message || error.message;

                logger.error(`[HTTP] ${status} ${method} ${url} - ${message}`);

                // 상태 코드별 커스텀 에러 매핑
                if (status === 401 || status === 403) {
                    throw new AuthError(`인증 실패: ${message}`);
                }
                if (status === 404) {
                    throw new NotFoundError('리소스', url || 'unknown');
                }
                if (status === 409) {
                    throw new ConflictError(`충돌 발생: ${message}`);
                }

                throw new ApiError(status, message, error.response.data);
            } else if (error.request) {
                logger.error(`[HTTP] No Response: ${error.message}`);
                throw new ApiError(0, `서버로부터 응답이 없습니다: ${error.message}`);
            } else {
                logger.error(`[HTTP] Request Error: ${error.message}`);
                throw new ApiError(0, `요청 설정 중 오류 발생: ${error.message}`);
            }
        }
    );

    return client;
}
