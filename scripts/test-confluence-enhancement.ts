import { ConfluenceContentApi } from '../src/confluence/api/content.js';
import { createConfluenceClient } from '../src/confluence/api/client.js';
import { loadConfluenceConfig } from '../src/common/config.js';
import { MarkdownToStorageConverter } from '../src/confluence/converters/md-to-storage.js';
import fs from 'fs';
import path from 'fs';

async function main() {
    const parentId = '951466645';
    const spaceKey = '~1111812';
    const filePath = 'tdecollab-docs/specs/001-agentic-prd-harness/plan.md';

    console.log(`[Test] Confluence 업로드 테스트 시작...`);
    console.log(`[Test] 대상 부모 ID: ${parentId}`);
    console.log(`[Test] 소스 파일: ${filePath}`);

    try {
        const config = loadConfluenceConfig();
        const client = createConfluenceClient(config);
        const contentApi = new ConfluenceContentApi(client);
        const converter = new MarkdownToStorageConverter();

        const markdown = fs.readFileSync(filePath, 'utf-8');
        const storageBody = converter.convert(markdown);

        console.log(`[Test] Markdown 변환 완료. 페이지 생성 중...`);

        const title = `고도화 테스트 - ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`;
        
        const page = await contentApi.createPage({
            spaceKey,
            title,
            body: storageBody,
            parentId
        });

        console.log(`[Test] 페이지 생성 성공!`);
        console.log(`[Test] ID: ${page.id}`);
        console.log(`[Test] URL: ${page._links.base}${page._links.webui}`);

    } catch (error) {
        console.error(`[Test] 오류 발생:`, error);
    }
}

main();
