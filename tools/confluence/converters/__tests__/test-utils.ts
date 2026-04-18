/**
 * 테스트를 위한 Confluence Storage XML 문자열 생성 유틸리티
 */
export function createCodeMacro(lang: string, code: string): string {
    return `<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">${lang}</ac:parameter>
  <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
</ac:structured-macro>`;
}

export function createMermaidMacro(name: string, content: string): string {
    return `<ac:structured-macro ac:name="${name}" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[${content}]]></ac:plain-text-body>
</ac:structured-macro>`;
}

export function createSimpleTable(): string {
    return `<table>
  <tbody>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
  </tbody>
</table>`;
}
