import { AxiosInstance } from 'axios';
import { ConfluenceConfig } from '../../common/types.js';
import { createHttpClient } from '../../common/http-client.js';

export function createConfluenceClient(config: ConfluenceConfig): AxiosInstance {
    // Confluence API base context path handling
    // If user provides 'https://example.atlassian.net/wiki', we should use that.
    // API path usually appends '/rest/api/content' etc.

    // Ensure config.baseUrl includes '/wiki' if it's a cloud instance, usually users put it in env.
    // But standard is commonly base domain.
    // We'll trust the config for now, but client consumers should append specific endpoints.
    // Typically, Confluence API is at /wiki/rest/api if cloud, or /rest/api if server.
    // Let's assume baseUrl in config points to the root of the instance, e.g. https://site.atlassian.net/wiki

    return createHttpClient(config);
}
