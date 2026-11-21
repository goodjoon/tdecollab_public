import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { downloadPage, uploadMarkdown } from '../../packages/obsidian-plugin/src/api/confluence.js';

describe('Obsidian 업로드 경로 E2E — 로컬 Confluence HTTP 서버', () => {
  let server: Server;
  let baseUrl: string;
  let page: any;
  const requests: string[] = [];

  beforeAll(async () => {
    server = createServer(async (request, response) => {
      const path = new URL(request.url!, 'http://localhost').pathname;
      requests.push(`${request.method} ${path}`);
      response.setHeader('Content-Type', 'application/json');

      if (request.method === 'GET' && path === '/wiki/rest/api/content/123') {
        response.end(JSON.stringify(page));
        return;
      }

      if (
        (request.method === 'POST' && path === '/wiki/rest/api/content') ||
        (request.method === 'PUT' && path === '/wiki/rest/api/content/123')
      ) {
        let body = '';
        for await (const chunk of request) body += chunk;
        const payload = JSON.parse(body);
        page = { ...payload, id: '123', version: payload.version || { number: 1 } };
        response.end(JSON.stringify(page));
        return;
      }

      response.writeHead(404).end('{}');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('테스트 서버 주소 확인 실패');
    baseUrl = `http://127.0.0.1:${address.port}/wiki`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it('새 페이지 생성부터 다운로드·재업로드까지 목차 대상과 버전을 보존한다', async () => {
    const markdown = [
      '---',
      'tags: [테스트]',
      '---',
      '## 목차',
      '- [설치 방법](#설치-방법)',
      '- [API 사용](#api-사용)',
      '',
      '## 설치 방법',
      '본문',
      '',
      '## API 사용',
      '본문',
    ].join('\n');

    await uploadMarkdown(baseUrl, '', 'test-token', 'TEST', '목차 검증', markdown, undefined, '99');
    expect(page.ancestors).toEqual([{ id: '99' }]);
    expect(page.body.storage.representation).toBe('storage');
    expect(page.body.storage.value).not.toContain('tags:');
    assertTocTargets(page.body.storage.value);

    const downloaded = await downloadPage(baseUrl, '', 'test-token', '123');
    expect(downloaded.markdown).toContain('[설치 방법](#설치-방법)');

    await uploadMarkdown(
      baseUrl,
      '',
      'test-token',
      'TEST',
      '변경된 페이지 제목',
      downloaded.markdown,
      '123',
    );
    expect(page.version.number).toBe(2);
    expect(page.title).toBe('변경된 페이지 제목');
    assertTocTargets(page.body.storage.value);
    expect(requests).toEqual([
      'POST /wiki/rest/api/content',
      'GET /wiki/rest/api/content/123',
      'GET /wiki/rest/api/content/123',
      'PUT /wiki/rest/api/content/123',
    ]);
  });
});

function assertTocTargets(storage: string): void {
  const dom = new JSDOM(`<root xmlns:ac="urn:confluence:ac">${storage}</root>`, {
    contentType: 'text/xml',
  });
  const document = dom.window.document;
  const links = Array.from(document.getElementsByTagName('ac:link'));
  expect(links.map((link) => link.getAttribute('ac:anchor'))).toEqual(['설치-방법', 'api-사용']);

  const anchors = Array.from(document.getElementsByTagName('ac:structured-macro')).filter(
    (macro) => macro.getAttribute('ac:name') === 'anchor',
  );
  for (const [index, heading] of ['설치 방법', 'API 사용'].entries()) {
    const target = anchors.find(
      (macro) => macro.textContent === links[index].getAttribute('ac:anchor'),
    );
    expect(target?.nextElementSibling?.tagName).toBe('h2');
    expect(target?.nextElementSibling?.textContent).toBe(heading);
  }
  dom.window.close();
}
