import { AxiosInstance } from 'axios';
import { GitlabConfig } from '../../common/types.js';
import { createHttpClient } from '../../common/http-client.js';

export function createGitlabClient(config: GitlabConfig): AxiosInstance {
    const client = createHttpClient({
        ...config,
        baseUrl: `${config.baseUrl}/api/v4`,
    });

    // GitLab Self-hosted는 PRIVATE-TOKEN 헤더 사용
    client.defaults.headers.common['PRIVATE-TOKEN'] = config.auth.token!;

    return client;
}
