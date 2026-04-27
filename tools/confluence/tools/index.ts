import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { ConfluenceContentApi } from '../api/content.js';
import { ConfluenceSpaceApi } from '../api/space.js';
import { ConfluenceSearchApi } from '../api/search.js';
import { ConfluenceLabelApi } from '../api/label.js';
import { createConfluenceClient } from '../api/client.js';
import { MarkdownToStorageConverter } from '../converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../converters/storage-to-md.js';
import { AIConversionService } from '../converters/ai-refiner.js';
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
        const aiService = new AIConversionService();

        // Tools

        server.tool(
            'confluence_get_page',
            'TDE Confluence 페이지 상세 조회. 페이지 내용을 Markdown으로 변환하여 반환합니다.',
            {
                pageId: z.string().describe('페이지 ID'),
                downloadImages: z.boolean().optional().describe('이미지 다운로드 여부'),
                imageDir: z.string().optional().describe('이미지 저장 디렉토리 (기본값: ./images)'),
                useAiFallback: z.boolean().optional().describe('변환 결과 보정을 위해 AI를 사용할지 여부'),
            },
            async ({ pageId, downloadImages, imageDir, useAiFallback }) => {
                const page = await contentApi.getPage(pageId);

                let md = '';
                let imageInfo = '';

                if (page.body?.storage?.value) {
                    let imageUrlMap: Map<string, string> | undefined;

                    // 이미지 다운로드 옵션이 활성화된 경우
                    if (downloadImages) {
                        const { ImageDownloader } = await import('../utils/image-downloader.js');
                        const downloader = new ImageDownloader(contentApi, {
                            outputDir: imageDir || './images',
                            pageId: page.id,
                            baseUrl: config.baseUrl
                        });

                        imageUrlMap = await downloader.downloadAllImages(page.body.storage.value);
                        imageInfo = `\n\n다운로드된 이미지: ${imageUrlMap.size}개`;
                    }

                    md = storageToMd.convert(page.body.storage.value, imageUrlMap);
                    
                    if (useAiFallback) {
                        const aiResult = await aiService.refine({
                            sourceContent: md,
                            sourceType: 'markdown',
                            targetType: 'markdown',
                            context: '이전 변환 결과가 깨졌거나 표 형식이 부적절할 수 있습니다. 깨끗한 GFM 형식으로 보정해주세요.'
                        });
                        md = aiResult.convertedContent;
                    }
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Title: ${page.title}\nID: ${page.id}\nSpace: ${page.space?.name} (${page.space?.key})\nURL: ${page._links?.base}${page._links?.webui}${imageInfo}\n\n${md}`,
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
                useAiFallback: z.boolean().optional().describe('복잡한 변환을 위해 AI를 사용할지 여부'),
            },
            async ({ spaceKey, title, content, parentId, labels, useAiFallback }) => {
                let storageBody = mdToStorage.convert(content);
                
                if (useAiFallback) {
                    const aiResult = await aiService.refine({
                        sourceContent: content,
                        sourceType: 'markdown',
                        targetType: 'storage-xml',
                        context: 'Confluence Storage XML 형식으로 변환해주세요. Mermaid는 mermaiddiagram 매크로를 사용하세요.'
                    });
                    storageBody = aiResult.convertedContent;
                }

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
                title: z.string().optional().describe('페이지 제목 (생략 시 기존 제목 유지)'),
                content: z.string().describe('페이지 내용 (Markdown)'),
                version: z.number().optional().describe('현재 페이지 버전 (생략 시 자동 조회)'),
                useAiFallback: z.boolean().optional().describe('복잡한 변환을 위해 AI를 사용할지 여부'),
                baseDir: z.string().optional().describe('로컬 이미지를 찾을 기준 디렉토리 절대 경로'),
            },
            async ({ pageId, title, content, version, useAiFallback, baseDir }) => {
                let currentVersion = version;
                let currentTitle = title;
                
                if (currentVersion === undefined || !currentTitle) {
                    const currentPage = await contentApi.getPage(pageId, ['version', 'title']);
                    if (currentVersion === undefined) {
                        currentVersion = currentPage.version?.number ?? 1;
                    }
                    if (!currentTitle) {
                        currentTitle = currentPage.title;
                    }
                }

                let storageBody = mdToStorage.convert(content);
                
                if (useAiFallback) {
                    const aiResult = await aiService.refine({
                        sourceContent: content,
                        sourceType: 'markdown',
                        targetType: 'storage-xml',
                        context: 'Confluence Storage XML 형식으로 변환해주세요. Mermaid는 mermaiddiagram 매크로를 사용하세요.'
                    });
                    storageBody = aiResult.convertedContent;
                }

                const page = await contentApi.updatePage({
                    id: pageId,
                    title: currentTitle,
                    body: storageBody,
                    version: currentVersion
                });

                let imageUploadLog = '';
                if (baseDir) {
                    const localImages = mdToStorage.extractLocalImages(content);
                    if (localImages.length > 0) {
                        imageUploadLog += `\n\n로컬 이미지 업로드 (${localImages.length}개):`;
                        for (const imgSrc of localImages) {
                            try {
                                const imagePath = path.resolve(baseDir, imgSrc);
                                if (fs.existsSync(imagePath)) {
                                    const fileBuffer = fs.readFileSync(imagePath);
                                    const filename = path.basename(imgSrc);
                                    let contentType = 'application/octet-stream';
                                    if (filename.endsWith('.png')) contentType = 'image/png';
                                    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
                                    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
                                    else if (filename.endsWith('.gif')) contentType = 'image/gif';

                                    await contentApi.uploadAttachment(page.id, filename, fileBuffer, contentType);
                                    imageUploadLog += `\n  - 성공: ${filename}`;
                                } else {
                                    imageUploadLog += `\n  - 실패 (파일 없음): ${imagePath}`;
                                }
                            } catch (uploadErr: any) {
                                imageUploadLog += `\n  - 업로드 실패 (${imgSrc}): ${(uploadErr as Error).message}`;
                            }
                        }
                    }
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `페이지 수정 성공: ${page.title} (Version: ${page.version?.number})${imageUploadLog}`,
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
                useAi: z.boolean().optional().describe('지능형 변환을 위해 AI를 사용할지 여부'),
            },
            async ({ content, format, useAi }) => {
                let result = '';
                if (useAi) {
                    const sourceType = format === 'storage_to_markdown' ? 'storage-xml' : 'markdown';
                    const targetType = format === 'storage_to_markdown' ? 'markdown' : 'storage-xml';
                    const aiResult = await aiService.refine({
                        sourceContent: content,
                        sourceType,
                        targetType
                    });
                    result = aiResult.convertedContent;
                } else {
                    if (format === 'storage_to_markdown') {
                        result = storageToMd.convert(content);
                    } else {
                        result = mdToStorage.convert(content);
                    }
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
