import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ConfluenceContentApi } from '../api/content.js';
import { ConfluenceSpaceApi } from '../api/space.js';
import { ConfluenceSearchApi } from '../api/search.js';
import { ConfluenceLabelApi } from '../api/label.js';
import { createConfluenceClient } from '../api/client.js';
import { MarkdownToStorageConverter } from '../converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../converters/storage-to-md.js';
import { loadConfluenceConfig } from '../../common/config.js';
import { logger } from '../../common/logger.js';

export function registerConfluenceTools(server: McpServer) {
    try {
        const config = loadConfluenceConfig();
        const client = createConfluenceClient(config);

        const contentApi = new ConfluenceContentApi(client);
        const spaceApi = new ConfluenceSpaceApi(client);
        const searchApi = new ConfluenceSearchApi(client);
        const labelApi = new ConfluenceLabelApi(client);

        const mdToStorage = new MarkdownToStorageConverter();
        const storageToMd = new StorageToMarkdownConverter();

        // Tools

        server.tool(
            'confluence_get_page',
            'TDE Confluence 페이지 상세 조회. 페이지 내용을 Markdown으로 변환하여 반환합니다.',
            {
                pageId: z.string().describe('페이지 ID'),
            },
            async ({ pageId }) => {
                const page = await contentApi.getPage(pageId);
                const md = page.body?.storage?.value ? storageToMd.convert(page.body.storage.value) : '';

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Title: ${page.title}\nID: ${page.id}\nSpace: ${page.space?.name} (${page.space?.key})\nURL: ${page._links?.base}${page._links?.webui}\n\n${md}`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_create_page',
            'TDE Confluence에 새 페이지를 생성합니다. Markdown 형식의 내용을 Confluence Storage Format으로 자동 변환합니다.',
            {
                spaceKey: z.string().describe('스페이스 키'),
                title: z.string().describe('페이지 제목'),
                content: z.string().describe('페이지 내용 (Markdown)'),
                parentId: z.string().optional().describe('부모 페이지 ID'),
                labels: z.array(z.string()).optional().describe('라벨 목록'),
            },
            async ({ spaceKey, title, content, parentId, labels }) => {
                const storageBody = mdToStorage.convert(content);
                const page = await contentApi.createPage({
                    spaceKey,
                    title,
                    body: storageBody,
                    parentId,
                    labels
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `페이지 생성 성공: ${page.title} (ID: ${page.id})\nURL: ${page._links?.base}${page._links?.webui}`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_update_page',
            'TDE Confluence 페이지를 수정합니다. Markdown 형식의 내용으로 업데이트할 수 있습니다.',
            {
                pageId: z.string().describe('페이지 ID'),
                title: z.string().describe('페이지 제목'),
                content: z.string().describe('페이지 내용 (Markdown)'),
                version: z.number().describe('현재 페이지 버전 (충돌 방지용)'),
            },
            async ({ pageId, title, content, version }) => {
                const storageBody = mdToStorage.convert(content);
                const page = await contentApi.updatePage({
                    id: pageId,
                    title,
                    body: storageBody,
                    version
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `페이지 수정 성공: ${page.title} (Version: ${page.version?.number})`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_search_pages',
            'TDE Confluence에서 페이지를 검색합니다. CQL(Confluence Query Language)을 사용하여 고급 검색이 가능합니다.',
            {
                cql: z.string().describe('Confluence Query Language (예: title ~ "guide")'),
                limit: z.number().default(10).describe('결과 개수 제한'),
            },
            async ({ cql, limit }) => {
                const result = await searchApi.searchByCql(cql, 0, limit);
                const summary = result.results.map(p => `- [${p.id}] ${p.title} (Space: ${p.space?.key})`).join('\n');

                return {
                    content: [
                        {
                            type: 'text',
                            text: `검색 결과 (${result.size}/${result.totalSize}):\n${summary}`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_get_spaces',
            'TDE Confluence의 스페이스 목록을 조회합니다.',
            {
                limit: z.number().default(20).describe('결과 개수 제한')
            },
            async ({ limit }) => {
                const spaces = await spaceApi.getSpaces('global', 0, limit);
                const summary = spaces.map(s => `- [${s.key}] ${s.name}`).join('\n');
                return {
                    content: [{ type: 'text', text: `스페이스 목록:\n${summary}` }]
                };
            }
        );

        server.tool(
            'confluence_delete_page',
            'TDE Confluence 페이지를 삭제합니다.',
            {
                pageId: z.string().describe('페이지 ID'),
            },
            async ({ pageId }) => {
                await contentApi.deletePage(pageId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `페이지 삭제 성공 (ID: ${pageId})`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_get_page_tree',
            'TDE Confluence 페이지의 하위 페이지(자식 페이지) 목록을 조회합니다.',
            {
                pageId: z.string().describe('페이지 ID'),
                limit: z.number().default(20).describe('결과 개수 제한'),
            },
            async ({ pageId, limit }) => {
                const children = await contentApi.getChildPages(pageId, 0, limit);
                const summary = children.map(p => `- [${p.id}] ${p.title}`).join('\n');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `자식 페이지 목록 (${children.length}):\n${summary}`,
                        },
                    ],
                };
            }
        );

        server.tool(
            'confluence_manage_labels',
            'TDE Confluence 페이지의 라벨을 관리합니다. 라벨 조회, 추가, 삭제 기능을 제공합니다.',
            {
                pageId: z.string().describe('페이지 ID'),
                action: z.enum(['list', 'add', 'remove']).describe('작업 유형'),
                labels: z.array(z.string()).optional().describe('추가할 라벨 목록 (add 작업 시 필수)'),
                label: z.string().optional().describe('삭제할 라벨 (remove 작업 시 필수)'),
            },
            async ({ pageId, action, labels, label }) => {
                if (action === 'list') {
                    const result = await labelApi.getLabels(pageId);
                    const summary = result.map(l => l.name).join(', ');
                    return {
                        content: [{ type: 'text', text: `라벨 목록: ${summary}` }],
                    };
                } else if (action === 'add') {
                    if (!labels || labels.length === 0) {
                        throw new Error('라벨 목록을 입력해주세요.');
                    }
                    await labelApi.addLabels(pageId, labels);
                    return {
                        content: [{ type: 'text', text: `라벨 추가 성공: ${labels.join(', ')}` }],
                    };
                } else if (action === 'remove') {
                    if (!label) {
                        throw new Error('삭제할 라벨을 입력해주세요.');
                    }
                    await labelApi.removeLabel(pageId, label);
                    return {
                        content: [{ type: 'text', text: `라벨 삭제 성공: ${label}` }],
                    };
                }
                return { content: [] };
            }
        );

        server.tool(
            'confluence_convert_content',
            'TDE Confluence 컨텐츠 포맷을 변환합니다. Markdown과 Confluence Storage Format 간 양방향 변환을 지원합니다.',
            {
                content: z.string().describe('변환할 컨텐츠'),
                format: z.enum(['storage_to_markdown', 'markdown_to_storage']).describe('변환 방향'),
            },
            async ({ content, format }) => {
                let result = '';
                if (format === 'storage_to_markdown') {
                    result = storageToMd.convert(content);
                } else {
                    result = mdToStorage.convert(content);
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
        );

    } catch (error) {
        logger.warn(`Confluence 설정 로드 실패 또는 도구 등록 중 오류 발생: ${(error as Error).message}`);
        // Do not throw, just skip registration if config is missing (optional module pattern)
    }
}
