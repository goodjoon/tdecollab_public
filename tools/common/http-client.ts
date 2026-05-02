import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthError, NotFoundError, ConflictError } from './errors.js';
import { logger } from './logger.js';
import { ServiceConfig } from './types.js';

export function createHttpClient(config: ServiceConfig): AxiosInstance {
    // URL 정규화 (후행 슬래시 제거)
    const normalizedBaseUrl = config.baseUrl.replace(/\/+$/, '');

    const client = axios.create({
        baseURL: normalizedBaseUrl,
        timeout: 30000, // 30초 타임아웃
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // 요청 인터셉터: 인증 헤더 주입 및 로깅
    client.interceptors.request.use((reqConfig) => {
        // 1. Basic 인증 (Username + Token)
        if (config.auth.username && config.auth.token && !reqConfig.headers.Authorization) {
            const token = Buffer.from(`${config.auth.username}:${config.auth.token}`).toString('base64');
            reqConfig.headers.Authorization = `Basic ${token}`;
        }
        // 2. 토큰 기반 Bearer 인증 (Confluence/JIRA PAT 권장 방식)
        else if (config.auth.token && !reqConfig.headers.Authorization && !reqConfig.headers['PRIVATE-TOKEN']) {
            // GitLab은 PRIVATE-TOKEN 헤더를 선호하므로 제외
            reqConfig.headers.Authorization = `Bearer ${config.auth.token}`;
        }

        logger.debug(`[HTTP Request] ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`, {
            headers: reqConfig.headers,
            params: reqConfig.params,
            data: reqConfig.data,
        });

        return reqConfig;
    });

    // 응답 인터셉터: 에러 핸들링 및 로깅
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            logger.debug(`[HTTP Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                headers: response.headers,
                data: response.data,
            });
            return response;
        },
        (error: AxiosError) => {
            if (error.response) {
                const status = error.response.status;
                const method = error.config?.method?.toUpperCase();
                const url = error.config?.url;
                const message = (error.response.data as any)?.message || error.message;

                logger.error(`[HTTP Error] ${status} ${method} ${url}`, {
                    message,
                    responseData: error.response.data,
                    requestHeaders: error.config?.headers,
                });

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
