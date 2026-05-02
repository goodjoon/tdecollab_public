import { AxiosInstance } from 'axios';
import { JiraConfig } from '../../common/types.js';
import { createHttpClient } from '../../common/http-client.js';

export function createJiraClient(config: JiraConfig): AxiosInstance {
    return createHttpClient(config);
}
