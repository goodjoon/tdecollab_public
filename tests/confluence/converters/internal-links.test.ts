import { describe, expect, it } from 'vitest';
import { MarkdownToStorageConverter } from '../../../tools/confluence/converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../../../tools/confluence/converters/storage-to-md.js';

const anchor = (name: string) =>
  `<ac:structured-macro ac:name="anchor" ac:schema-version="1"><ac:parameter ac:name="">${name}</ac:parameter></ac:structured-macro>`;

describe('Confluence 목차 내부 링크', () => {
  const converter = new MarkdownToStorageConverter({});

  it('한글 목차 링크와 대상 제목을 Confluence 앵커로 연결한다', () => {
    const storage = converter.convert('- [설치 방법](#설치-방법)\n\n## 설치 방법');

    expect(storage).toContain(
      '<ac:link ac:anchor="설치-방법"><ac:link-body>설치 방법</ac:link-body></ac:link>',
    );
    expect(storage).toContain(`${anchor('설치-방법')}<h2>설치 방법</h2>`);
    expect(storage).not.toContain('<a href="#');
  });

  it('인코딩된 제목 원문과 서식이 있는 영문 제목의 링크를 연결한다', () => {
    const storage = converter.convert(
      [
        '[한글](#%EC%84%A4%EC%B9%98%20%EB%B0%A9%EB%B2%95)',
        '[**API** 안내](#1-api--usage)',
        '',
        '## 설치 방법',
        '## 1. **API** & `Usage`',
      ].join('\n'),
    );

    expect(storage).toContain('ac:anchor="설치-방법"');
    expect(storage).toContain(
      '<ac:link ac:anchor="1-api--usage"><ac:link-body><strong>API</strong> 안내</ac:link-body></ac:link>',
    );
    expect(storage).toContain(anchor('1-api--usage'));
  });

  it('실제 가이드의 절 번호와 화살표·인라인 코드가 있는 제목을 연결한다', () => {
    const storage = converter.convert(
      [
        '- [5.1 접속 주소](#51-접속-주소)',
        '- [2.1 Client → Server](#21-client--server)',
        '- [8.1 `session.setup`](#81-sessionsetup)',
        '',
        '### 5.1 접속 주소',
        '### 2.1 Client → Server',
        '### 8.1 `session.setup`',
      ].join('\n'),
    );

    for (const name of ['51-접속-주소', '21-client--server', '81-sessionsetup']) {
      expect(storage).toContain(`ac:anchor="${name}"`);
      expect(storage).toContain(anchor(name));
    }
    expect(storage).not.toContain('<a href="#');
  });

  it('중복 제목과 숫자 접미사가 있는 제목의 앵커 충돌을 피한다', () => {
    const storage = converter.convert(
      [
        '[첫째](#a) [둘째](#a-1) [셋째](#a-1-1) [넷째](#a-2)',
        '',
        '## A',
        '## A',
        '## A-1',
        '## A',
      ].join('\n'),
    );

    for (const name of ['a', 'a-1', 'a-1-1', 'a-2']) {
      expect(storage).toContain(`ac:anchor="${name}"`);
      expect(storage.split(anchor(name))).toHaveLength(2);
    }
  });

  it('외부 링크와 다른 문서 링크 및 원시 HTML 앵커 링크를 유지한다', () => {
    const storage = converter.convert(
      [
        '[외부](https://example.com/#hello)',
        '[다른 문서](other.md#hello)',
        '[사용자 앵커](#custom)',
        '<a id="custom"></a>',
        '## Hello',
      ].join('\n'),
    );

    expect(storage).toContain('href="https://example.com/#hello"');
    expect(storage).toContain('href="other.md#hello"');
    expect(storage).toContain('href="#custom"');
    expect(storage).not.toContain('ac:name="anchor"');
  });

  it('변환기 재사용 시 이전 문서의 제목을 참조하지 않는다', () => {
    converter.convert('[링크](#hello)\n\n## Hello');
    expect(converter.convert('[링크](#hello)')).toBe('<p><a href="#hello">링크</a></p>\n');
  });

  it('내부 링크를 다운로드 후 재업로드해도 앵커와 링크가 유지된다', () => {
    const storage = `${anchor('설치-방법')}<h2>설치 방법</h2><p><ac:link ac:anchor="설치-방법"><ac:link-body><strong>설치</strong> 안내</ac:link-body></ac:link></p>`;
    const markdown = new StorageToMarkdownConverter().convert(storage);

    expect(markdown).toContain('[**설치** 안내](#설치-방법)');
    expect(markdown).toMatch(/^## 설치 방법/);
    expect(converter.convert(markdown)).toContain('ac:anchor="설치-방법"');
    expect(converter.convert(markdown)).toContain(anchor('설치-방법'));
  });

  it('서버가 매크로 식별자를 추가한 실제 페이지 형식도 다운로드한다', () => {
    const storage =
      '<h3><ac:structured-macro ac:macro-id="server-id" ac:name="anchor" ac:schema-version="1"><ac:parameter ac:name="">51-접속-주소</ac:parameter></ac:structured-macro>5.1 접속 주소</h3><p><ac:link ac:anchor="51-접속-주소"><ac:plain-text-link-body><![CDATA[5.1 접속 주소]]></ac:plain-text-link-body></ac:link></p>';
    const markdown = new StorageToMarkdownConverter().convert(storage);

    expect(markdown).toMatch(/^### 5.1 접속 주소/);
    expect(markdown).toContain('[5.1 접속 주소](#51-접속-주소)');
    expect(markdown).not.toContain('51-접속-주소5.1');
  });

  it('제목에서 재생성할 수 없는 사용자 정의 앵커는 기존 매크로 표시를 유지한다', () => {
    const storage = `${anchor('custom')}<h2>설치 방법</h2><p><ac:link ac:anchor="custom"><ac:plain-text-link-body><![CDATA[참고]]></ac:plain-text-link-body></ac:link></p>`;
    const markdown = new StorageToMarkdownConverter().convert(storage);

    expect(markdown).toContain('<!-- Macro: anchor -->');
    expect(markdown).toContain('참고');
    expect(markdown).not.toContain('[참고](#custom)');
  });

  it('일반 텍스트 목차의 CDATA를 HTML 태그나 엔티티로 해석하지 않는다', () => {
    const storage = `${anchor('설치-방법')}<h2>설치 방법</h2><p><ac:link ac:anchor="설치-방법"><ac:plain-text-link-body><![CDATA[<예시> &quot;설치&quot;]]></ac:plain-text-link-body></ac:link></p>`;
    const markdown = new StorageToMarkdownConverter().convert(storage);

    expect(markdown).toContain('[&lt;예시&gt; &amp;quot;설치&amp;quot;](#설치-방법)');
    expect(converter.convert(markdown)).toContain(
      '<ac:link-body>&lt;예시&gt; &amp;quot;설치&amp;quot;</ac:link-body>',
    );
  });
});
