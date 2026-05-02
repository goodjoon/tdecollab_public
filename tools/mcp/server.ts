
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerConfluenceTools } from '../confluence/tools/index.js';
import { registerJiraTools } from '../jira/tools/index.js';
import { registerGitlabTools } from '../gitlab/tools/index.js';
import { logger } from '../common/logger.js';

export async function runServer() {
    try {
        const server = new McpServer({
            name: 'TDE Collab',
            version: '1.0.0',
            description: 'TDE 포털(Confluence, JIRA, GitLab) 통합 도구. Confluence 페이지 관리, JIRA 이슈 관리, 검색 기능을 제공합니다.',
        });

        // Confluence 도구 등록
        registerConfluenceTools(server);

        // JIRA 도구 등록
        registerJiraTools(server);

        // GitLab 도구 등록
        registerGitlabTools(server);

        // Stdio 전송 계층 연결
        const transport = new StdioServerTransport();
        await server.connect(transport);

        logger.info('TDE Collab MCP Server running on stdio');
    } catch (error) {
        logger.error(`Fatal error in MCP Server: ${error}`);
        process.exit(1);
    }
}
