import { describe, it, expect, beforeEach } from 'vitest';
import { StorageToMarkdownConverter, JiraIssueInfo } from '../storage-to-md.js';

describe('StorageToMarkdownConverter', () => {
    let converter: StorageToMarkdownConverter;

    beforeEach(() => {
        converter = new StorageToMarkdownConverter();
    });

    it('should convert simple HTML to markdown', () => {
        const html = '<h1>Title</h1><p>Hello world</p>';
        const md = converter.convert(html);
        expect(md).toContain('# Title');
        expect(md).toContain('Hello world');
    });

    it('Confluence 이미지 width/height를 Markdown image title로 보존한다', () => {
        const html =
            '<ac:image ac:width="320" ac:height="180"><ri:attachment ri:filename="diagram.png" /></ac:image>';

        const md = converter.convert(html);

        expect(md).toContain('![diagram.png](diagram.png "width=320 height=180")');
    });

    it('should convert HTML tables to markdown tables', () => {
        const html = `
            <table>
                <thead>
                    <tr><th>Header 1</th><th>Header 2</th></tr>
                </thead>
                <tbody>
                    <tr><td>Cell 1</td><td>Cell 2</td></tr>
                </tbody>
            </table>
        `;
        const md = converter.convert(html);
        expect(md).toContain('| Header 1 | Header 2 |');
        expect(md).toContain('| --- | --- |');
        expect(md).toContain('| Cell 1 | Cell 2 |');
    });

    it('Confluence의 중첩 bullet list를 Markdown 중첩 list로 보존한다', () => {
        const html = `
            <h2>Controller별 Description (안)</h2>
            <ul>
                <li><p>WebRTC Wrapper</p>
                    <ul>
                        <li><p>역할</p>
                            <ul>
                                <li><p>WebRTC와 IMS간 연동을 위한 변환 역할</p>
                                    <ul>
                                        <li><p>RTP가 아닌 SRTP 사용</p></li>
                                        <li><p>연결을 위한 Candidate 명세 사용</p>
                                            <ul>
                                                <li><p>Host Candidate</p>
                                                    <ul>
                                                        <li><p>동일한 Lan에 있는 경우 Host IP/Port로만 연동 가능</p></li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>
        `;

        const md = converter.convert(html);

        expect(md).toMatch(/^- {1,3}WebRTC Wrapper/m);
        expect(md).toMatch(/^ {4}- {1,3}역할/m);
        expect(md).toMatch(/^ {8}- {1,3}WebRTC와 IMS간 연동을 위한 변환 역할/m);
        expect(md).toMatch(/^ {12}- {1,3}RTP가 아닌 SRTP 사용/m);
        expect(md).toMatch(/^ {12}- {1,3}연결을 위한 Candidate 명세 사용/m);
        expect(md).toMatch(/^ {16}- {1,3}Host Candidate/m);
        expect(md).toMatch(/^ {20}- {1,3}동일한 Lan에 있는 경우 Host IP\/Port로만 연동 가능/m);
    });

    it('Confluence editor의 flat list indent metadata를 Markdown 중첩 list로 변환한다', () => {
        const html = `
            <ul>
                <li data-indent-level="0">WebRTC Wrapper</li>
                <li data-indent-level="1">역할</li>
                <li data-indent-level="2">WebRTC와 IMS간 연동을 위한 변환 역할</li>
                <li data-indent-level="3">RTP가 아닌 SRTP 사용</li>
                <li data-indent-level="3">연결을 위한 Candidate 명세 사용</li>
                <li data-indent-level="4">Host Candidate</li>
                <li data-indent-level="5">동일한 Lan에 있는 경우 Host IP/Port로만 연동 가능</li>
            </ul>
        `;

        const md = converter.convert(html);

        expect(md).toContain('- WebRTC Wrapper');
        expect(md).toContain('    - 역할');
        expect(md).toContain('        - WebRTC와 IMS간 연동을 위한 변환 역할');
        expect(md).toContain('            - RTP가 아닌 SRTP 사용');
        expect(md).toContain('            - 연결을 위한 Candidate 명세 사용');
        expect(md).toContain('                - Host Candidate');
        expect(md).toContain('                    - 동일한 Lan에 있는 경우 Host IP/Port로만 연동 가능');
    });

    it('Confluence가 li의 sibling으로 저장한 malformed nested list도 중첩 list로 복원한다', () => {
        const html = `
            <h2>Controller별 Description (안)</h2>
            <ul class="ul1">
                <li class="li1">WebRTC Wrapper</li>
                <ul class="ul1">
                    <li class="li2"><span>역할</span></li>
                    <ul class="ul1">
                        <li class="li1">WebRTC와 IMS간 연동을 위한 변환 역할</li>
                        <ul class="ul1">
                            <li class="li1">RTP가 아닌 SRTP 사용</li>
                            <li class="li1">연결을 위한 Candidate 명세 사용</li>
                            <ul class="ul1">
                                <li class="li1">Host Candidate</li>
                                <ul class="ul1">
                                    <li class="li1">동일한 Lan에 있는 경우 Host IP/Port로만 연동 가능</li>
                                </ul>
                            </ul>
                        </ul>
                    </ul>
                </ul>
            </ul>
        `;

        const md = converter.convert(html);

        expect(md).toMatch(/^- {1,3}WebRTC Wrapper/m);
        expect(md).toMatch(/^ {4}- {1,3}역할/m);
        expect(md).toMatch(/^ {8}- {1,3}WebRTC와 IMS간 연동을 위한 변환 역할/m);
        expect(md).toMatch(/^ {12}- {1,3}RTP가 아닌 SRTP 사용/m);
        expect(md).toMatch(/^ {12}- {1,3}연결을 위한 Candidate 명세 사용/m);
        expect(md).toMatch(/^ {16}- {1,3}Host Candidate/m);
        expect(md).toMatch(/^ {20}- {1,3}동일한 Lan에 있는 경우 Host IP\/Port로만 연동 가능/m);
    });

    it('should convert Confluence code macro back to markdown block', () => {
        const html = `
            <ac:structured-macro ac:name="code">
                <ac:parameter ac:name="language">python</ac:parameter>
                <ac:plain-text-body><![CDATA[print("hello")]]></ac:plain-text-body>
            </ac:structured-macro>
        `;
        const md = converter.convert(html);
        expect(md).toContain('```python');
        expect(md).toContain('print("hello")');
        expect(md).toContain('```');
    });

    it('should convert Confluence mermaid macro back to markdown mermaid block', () => {
        const html = `
            <ac:structured-macro ac:name="mermaiddiagram">
                <ac:plain-text-body><![CDATA[graph TD\nA --> B]]></ac:plain-text-body>
            </ac:structured-macro>
        `;
        const md = converter.convert(html);
        expect(md).toContain('```mermaid');
        expect(md).toContain('graph TD');
        expect(md).toContain('A --> B');
        expect(md).toContain('```');
    });

    describe('expand 매크로 변환', () => {
        it('제목과 본문을 details/summary 태그로 변환한다', () => {
            const html = `
                <ac:structured-macro ac:name="expand">
                    <ac:parameter ac:name="title">SIP 흐름</ac:parameter>
                    <ac:rich-text-body><p>본문 내용입니다.</p></ac:rich-text-body>
                </ac:structured-macro>
            `;
            const md = converter.convert(html);
            expect(md).toContain('<details>');
            expect(md).toContain('<summary>SIP 흐름</summary>');
            expect(md).toContain('본문 내용입니다.');
            expect(md).toContain('</details>');
        });

        it('title 파라미터가 없으면 기본값 "더보기"를 사용한다', () => {
            const html = `
                <ac:structured-macro ac:name="expand">
                    <ac:rich-text-body><p>내용</p></ac:rich-text-body>
                </ac:structured-macro>
            `;
            const md = converter.convert(html);
            expect(md).toContain('<summary>더보기</summary>');
        });

        it('본문의 표·목록 등 복합 콘텐츠도 Markdown으로 변환한다', () => {
            const html = `
                <ac:structured-macro ac:name="expand">
                    <ac:parameter ac:name="title">세부 내용</ac:parameter>
                    <ac:rich-text-body>
                        <ul><li>항목 1</li><li>항목 2</li></ul>
                    </ac:rich-text-body>
                </ac:structured-macro>
            `;
            const md = converter.convert(html);
            expect(md).toContain('<summary>세부 내용</summary>');
            expect(md).toContain('항목 1');
            expect(md).toContain('항목 2');
        });
    });

    describe('JIRA 매크로 변환', () => {
        const jiraXml = `
            <ac:structured-macro ac:name="jira" ac:schema-version="1">
                <ac:parameter ac:name="server">TDE Jira</ac:parameter>
                <ac:parameter ac:name="serverId">5b2d9c8b-0000-0000-0000-000000000000</ac:parameter>
                <ac:parameter ac:name="key">PROJ-1234</ac:parameter>
            </ac:structured-macro>
        `;

        it('jiraBaseUrl 옵션으로 지정한 URL로 링크를 생성한다', () => {
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com' });
            const md = conv.convert(jiraXml);
            expect(md).toContain('[PROJ-1234](https://jira.example.com/browse/PROJ-1234)');
        });

        it('링크 앞뒤에 공백을 포함한다 (인라인 텍스트와 분리)', () => {
            const inlineXml = `<p>앞 텍스트 <ac:structured-macro ac:name="jira" ac:schema-version="1"><ac:parameter ac:name="key">PROJ-1234</ac:parameter></ac:structured-macro> 뒤 텍스트</p>`;
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com' });
            const md = conv.convert(inlineXml);
            expect(md).toMatch(/ \[PROJ-1234\]\(https:\/\/jira\.example\.com\/browse\/PROJ-1234\) /);
        });

        it('JIRA_BASE_URL 환경변수를 fallback으로 사용한다', () => {
            process.env.JIRA_BASE_URL = 'https://jira.env.example.com';
            const conv = new StorageToMarkdownConverter();
            const md = conv.convert(jiraXml);
            expect(md).toContain('[PROJ-1234](https://jira.env.example.com/browse/PROJ-1234)');
            delete process.env.JIRA_BASE_URL;
        });

        it('base URL 끝의 슬래시를 정규화한다', () => {
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com/' });
            const md = conv.convert(jiraXml);
            expect(md).toContain('[PROJ-1234](https://jira.example.com/browse/PROJ-1234)');
        });

        it('key 파라미터가 없는 경우 빈 문자열을 반환한다', () => {
            const noKeyXml = `
                <ac:structured-macro ac:name="jira" ac:schema-version="1">
                    <ac:parameter ac:name="server">TDE Jira</ac:parameter>
                </ac:structured-macro>
            `;
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com' });
            const md = conv.convert(noKeyXml);
            expect(md).not.toContain('<!-- Macro: jira -->');
            expect(md).not.toContain('/browse/');
        });

        it('인라인 위치(li 안)에서도 올바르게 링크를 삽입한다', () => {
            const inlineXml = `
                <ul>
                    <li>(완료) <ac:structured-macro ac:name="jira" ac:schema-version="1"><ac:parameter ac:name="key">AIVOICEBOT-1195</ac:parameter></ac:structured-macro> → 배포 예정</li>
                </ul>
            `;
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.tde.example.com' });
            const md = conv.convert(inlineXml);
            expect(md).toContain('[AIVOICEBOT-1195](https://jira.tde.example.com/browse/AIVOICEBOT-1195)');
            expect(md).toContain('배포 예정');
        });

        it('jiraIssueMap이 제공되면 티켓 제목과 상태를 함께 표시한다', () => {
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com' });
            const issueMap = new Map<string, JiraIssueInfo>([
                ['PROJ-1234', { summary: '주소 변경 처리 오류', status: '완료(Close)' }],
            ]);
            const md = conv.convert(jiraXml, undefined, issueMap);
            expect(md).toContain('[PROJ-1234](https://jira.example.com/browse/PROJ-1234)');
            expect(md).toContain('주소 변경 처리 오류');
            expect(md).toContain('`완료(Close)`');
        });

        it('jiraIssueMap에 해당 키가 없으면 링크만 표시한다', () => {
            const conv = new StorageToMarkdownConverter({ jiraBaseUrl: 'https://jira.example.com' });
            const emptyMap = new Map<string, JiraIssueInfo>();
            const md = conv.convert(jiraXml, undefined, emptyMap);
            expect(md).toContain('[PROJ-1234](https://jira.example.com/browse/PROJ-1234)');
            expect(md).not.toContain('`');
        });
    });
});
