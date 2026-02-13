import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { ConfluenceContentApi } from '../api/content.js';
import { ConfluenceSpaceApi } from '../api/space.js';
import { ConfluenceSearchApi } from '../api/search.js';
import { ConfluenceLabelApi } from '../api/label.js';
import { createConfluenceClient } from '../api/client.js';
import { MarkdownToStorageConverter } from '../converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../converters/storage-to-md.js';
import { loadConfluenceConfig } from '../../common/config.js';
import { logger } from '../../common/logger.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export function registerConfluenceCommands(program: Command) {
    const confluenceCmd = program.command('confluence')
        .description('Confluence 관리');

    // 공통 초기화 함수
    const initClient = () => {
        try {
            const config = loadConfluenceConfig();
            return createConfluenceClient(config);
        } catch (e: any) {
            console.error(chalk.red(`설정 로드 실패: ${e.message}`));
            process.exit(1);
        }
    };

    // --- Page Commands ---
    const pageCmd = confluenceCmd.command('page').description('페이지 관리');

    pageCmd.command('get <pageId>')
        .description('페이지 조회')
        .option('-r, --raw', 'Raw Storage Format 출력')
        .option('-q, --quiet', '메타데이터 생략')
        .action(async (pageId, options) => {
            const client = initClient();
            const api = new ConfluenceContentApi(client);
            const storageToMd = new StorageToMarkdownConverter();
            try {
                const page = await api.getPage(pageId);

                if (!options.quiet) {
                    console.log(chalk.bold(`Title: ${page.title}`));
                    console.log(chalk.gray(`ID: ${page.id}`));
                    console.log(`Space: ${page.space?.name} (${page.space?.key})`);
                    console.log(`URL: ${page._links?.base}${page._links?.webui}`);
                }

                if (options.raw) {
                    if (!options.quiet) console.log(chalk.dim('--- Content (Storage Format) ---'));
                    if (page.body?.storage?.value) {
                        console.log(page.body.storage.value);
                    } else {
                        if (!options.quiet) console.log(chalk.yellow('(No content)'));
                    }
                } else {
                    if (!options.quiet) console.log(chalk.dim('--- Content (Markdown) ---'));
                    if (page.body?.storage?.value) {
                        console.log(storageToMd.convert(page.body.storage.value));
                    } else {
                        if (!options.quiet) console.log(chalk.yellow('(No content)'));
                    }
                }
            } catch (e: any) {
                console.error(chalk.red(`Error: ${e.message}`));
            }
        });

    pageCmd.command('create')
        .requiredOption('-s, --space <key>', '스페이스 키')
        .requiredOption('-t, --title <title>', '제목')
        .option('-c, --content <content>', '내용 (Markdown 텍스트)')
        .option('-f, --file <path>', '내용 파일 경로 (Markdown)')
        .option('-p, --parent <id>', '부모 페이지 ID')
        .description('페이지 생성')
        .action(async (options) => {
            const client = initClient();
            const api = new ConfluenceContentApi(client);
            const mdToStorage = new MarkdownToStorageConverter();

            try {
                let markdownContent = '';

                if (options.file) {
                    try {
                        const filePath = path.resolve(process.cwd(), options.file);
                        markdownContent = fs.readFileSync(filePath, 'utf-8');
                    } catch (e: any) {
                        console.error(chalk.red(`파일 읽기 실패: ${e.message}`));
                        process.exit(1);
                    }
                } else if (options.content) {
                    markdownContent = options.content;
                } else {
                    console.error(chalk.red('오류: --content 또는 --file 옵션 중 하나는 필수입니다.'));
                    process.exit(1);
                }

                const page = await api.createPage({
                    spaceKey: options.space,
                    title: options.title,
                    body: mdToStorage.convert(markdownContent),
                    parentId: options.parent
                });
                console.log(chalk.green(`페이지 생성 완료: ${page.title} (ID: ${page.id})`));
                console.log(`URL: ${page._links?.base}${page._links?.webui}`);
            } catch (e: any) {
                console.error(chalk.red(`생성 실패: ${e.message}`));
            }
        });

    // --- Space Commands ---
    const spaceCmd = confluenceCmd.command('space').description('스페이스 관리');

    spaceCmd.command('list')
        .description('스페이스 목록 조회')
        .action(async () => {
            const client = initClient();
            const api = new ConfluenceSpaceApi(client);
            try {
                const spaces = await api.getSpaces();
                const table = new Table({
                    head: ['Key', 'Name', 'Type', 'ID'],
                    style: { head: ['cyan'] }
                });
                spaces.forEach(s => table.push([s.key, s.name, s.type, s.id.toString()]));
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`목록 조회 실패: ${e.message}`));
            }
        });

    // --- Search Commands ---
    confluenceCmd.command('search <cql>')
        .description('CQL 검색')
        .action(async (cql) => {
            const client = initClient();
            const api = new ConfluenceSearchApi(client);
            try {
                const result = await api.searchByCql(cql);
                console.log(chalk.bold(`검색 결과: ${result.size}건 (총 ${result.totalSize}건)`));
                const table = new Table({
                    head: ['ID', 'Title', 'Space', 'URL'],
                    style: { head: ['cyan'] }
                });
                result.results.forEach(p => table.push([
                    p.id,
                    p.title,
                    p.space?.key || '',
                    `${p._links?.base}${p._links?.webui}`
                ]));
                console.log(table.toString());
            } catch (e: any) {
                console.error(chalk.red(`검색 실패: ${e.message}`));
            }
        });
}
