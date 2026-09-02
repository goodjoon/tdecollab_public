# Confluence raw HTML 줄바꿈 XHTML 정규화 수정 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Markdown table 안의 raw HTML `<br>` 때문에 Obsidian의 Confluence page upload가 HTTP 400으로 실패하는 문제를 공통 converter에서 수정한다.

**Architecture:** Obsidian plugin은 별도 변환 로직을 추가하지 않고 기존 `MarkdownToStorageConverter`를 계속 재사용한다. `markdown-it`이 raw HTML을 분리한 `html_inline`과 `html_block` token renderer 경계에서 `<br>` 계열만 XML self-closing form인 `<br />`로 정규화하여 code span, code fence, CDATA의 literal text는 변경하지 않는다.

**Tech Stack:** TypeScript strict mode, Node.js 20 이상, ESM, markdown-it 14, Vitest 3, esbuild

**Spec:** `tdecollab-docs/specs/003-obsidian-confluence-plugin-design.md`

## Global Constraints

- 모든 응답, 문서, 주석, 사용자 노출 메시지는 한국어로 작성하고 technical term은 원문을 유지한다.
- source code import는 `.js` 확장자를 유지한다.
- Prettier 규칙은 `semi: true`, `singleQuote: true`, `trailingComma: all`, `printWidth: 100`이다.
- 기능 수정은 TDD로 진행하고 `pnpm test:run`으로 전체 regression을 확인한다.
- 실제 재현 문서는 외부 workspace에만 두고 repository의 test fixture나 문서로 복사하지 않는다.
- `main`을 `public` remote에 직접 push하지 않는다.

---

## 1. 조사 결과

### 1.1 재현 증거

| 확인 항목 | 결과 |
|---|---|
| 첨부 오류 | HTTP 400, `Unexpected close tag </td>; expected </br>` |
| parent URL parsing | 사용자 제공 parent URL에서 Space Key와 Parent Page ID를 정상 parsing |
| Obsidian 개발 plugin 연결 | plugin의 `main.js`가 현재 repository의 `packages/obsidian-plugin/main.js`를 가리킴 |
| 재현 문서의 raw line break | `<br>` 102개, `<br />` 0개 |
| converter 출력 최초 실패 | Storage XML 239행의 `<td>...<br>...</td>` |
| 전체 XML 실험 | 현재 출력은 `xmllint` 실패, `<br>`만 `<br />`로 정규화하면 통과 |
| 기존 converter test | 10개 모두 통과하므로 raw HTML XHTML 회귀 test가 빠져 있음 |

`xhtmlOut: true`는 Markdown line break로 생성된 tag에는 적용되지만, 사용자가 입력한 raw HTML token은 그대로 통과시킨다.

```mermaid
flowchart LR
    A["Markdown table cell의 raw &lt;br&gt;"] --> B["markdown-it html_inline token"]
    B --> C["현재 renderer가 &lt;br&gt; 그대로 출력"]
    C --> D["Storage XML의 &lt;td&gt; 안에서 br가 열린 상태"]
    D --> E["Confluence XML parser가 &lt;/br&gt;를 기대"]
    E --> F["&lt;/td&gt;에서 HTTP 400"]
```

### 1.2 root cause

`tools/confluence/converters/md-to-storage.ts`의 MarkdownIt 설정은 `html: true`와 `xhtmlOut: true`를 함께 사용한다. 그러나 `xhtmlOut`은 `markdown-it` renderer가 생성하는 `hardbreak`/`softbreak` 같은 tag에만 영향을 주며, `html_inline` token의 `content`인 raw `<br>`는 변환하지 않는다. Confluence Storage representation은 XML로 parsing되므로 HTML void element form인 `<br>`를 열린 element로 보고 뒤의 `</td>`에서 tag mismatch를 반환한다.

Obsidian upload 경로는 `packages/obsidian-plugin/src/api/confluence.ts`에서 이 공통 converter의 결과를 그대로 `ConfluenceContentApi.createPage()`에 전달한다. 따라서 증상은 Obsidian에서 나타났지만 결함의 소유 경계는 plugin UI, vault, symlink, parent page 처리나 HTTP client가 아니라 공통 Markdown → Storage converter다.

### 1.3 접근 방법 비교

| 접근 | 장점 | 위험 | 결정 |
|---|---|---|---|
| raw HTML token renderer에서 `<br>` 정규화 | code context를 건드리지 않고 CLI/TUI/MCP/Obsidian에 함께 적용 | `html_inline`과 `html_block` 두 경계를 모두 처리해야 함 | 채택 |
| Markdown 원문 전체를 regex 치환 | 구현이 짧음 | code span, code fence, CDATA의 예시까지 바꿀 수 있음 | 제외 |
| converter 최종 문자열을 일괄 치환 | 현재 문서는 통과함 | code macro의 CDATA 안 literal `<br>`도 바꿈 | 제외 |
| 사용자 문서의 `<br>`를 수동 수정 | 즉시 workaround 가능 | 다른 문서에서 반복되고 공통 converter 계약을 보장하지 못함 | 임시 workaround로만 사용 |

## 2. 범위와 Task 준비도

| 구분 | 내용 |
|---|---|
| 범위 | raw `<br>`, `<BR>`, `<br/>`, `<br />`를 Storage output의 `<br />`로 통일 |
| 비범위 | 모든 HTML5 void element 일반화, Confluence API 변경, parent URL parsing 변경, vault/symlink 변경, 원본 문서 수정 |
| 관찰 가능한 성공 기준 | 제공된 문서를 Obsidian에서 upload할 때 XHTML parsing 400이 발생하지 않고 table cell line break가 유지됨 |
| 실패 case | raw `<br>`가 `<td>` 안에 남음, code example의 literal `<br>`가 바뀜, CLI/TUI/MCP converter test regression |
| 기존 성공 test 영향 | 기대값 변경 없음. 새 회귀 test만 추가함 |
| E2E | plugin build 후 제공된 문서로 실제 child page create와 rendering을 수동 확인 |
| PRD milestone | 기존 Obsidian upload 계약의 regression 수정이므로 새 Product milestone을 만들지 않음 |
| Milestone 상세화 | 단일 converter 경계의 bounded fix여서 별도 milestone 문서를 만들지 않음 |

## 3. File 구조

| File | 책임 | 변경 |
|---|---|---|
| `tools/confluence/converters/md-to-storage.ts` | Markdown을 Confluence Storage XML로 변환 | raw HTML line break 정규화 helper와 token renderer 추가 |
| `tools/confluence/converters/__tests__/md-to-storage.spec.ts` | 공통 converter regression test | table cell, tag variant, code context 보존 test 추가 |
| `packages/obsidian-plugin/main.js` | Obsidian runtime bundle | build로 재생성하되 `.gitignore` 대상이므로 commit하지 않음 |
| `packages/obsidian-plugin/src/api/confluence.ts` | plugin upload orchestration | 변경하지 않음. 공통 converter 수정 효과를 그대로 사용 |

### Task 1: raw HTML line break 회귀 test와 token renderer 구현

**Files:**

- Modify: `tools/confluence/converters/md-to-storage.ts:14-43,242-357`
- Test: `tools/confluence/converters/__tests__/md-to-storage.spec.ts:13-122`

**Interfaces:**

- Consumes: `markdown-it`의 `html_inline`/`html_block` token `content: string`
- Produces: `normalizeRawHtmlBreaksForConfluenceStorage(rawHtml: string): string`과 XHTML `<br />`를 포함하는 `MarkdownToStorageConverter.convert(markdown: string): string`

- [x] **Step 1: table cell raw `<br>`를 재현하는 failing test를 추가한다**

```ts
it('raw HTML 줄바꿈 태그를 Confluence XHTML self-closing tag로 정규화한다', () => {
    const markdown = ['| 값 |', '|---|', '| 첫째<br>둘째<BR>셋째<br/>넷째<br />다섯째 |'].join('\n');

    const storage = converter.convert(markdown);

    expect(storage).toContain('<td>첫째<br />둘째<br />셋째<br />넷째<br />다섯째</td>');
    expect(storage).not.toContain('<br>');
    expect(storage).not.toContain('<BR>');
});
```

- [x] **Step 2: block raw HTML과 code context 경계를 검증하는 regression test를 추가한다**

```ts
it('block raw HTML 줄바꿈 태그도 XHTML self-closing tag로 정규화한다', () => {
    const storage = converter.convert(['앞', '', '<br>', '', '뒤'].join('\n'));

    expect(storage).toContain('<p>앞</p>\n<br />\n<p>뒤</p>');
});

it('code context의 literal br tag는 정규화하지 않는다', () => {
    const markdown = ['`<br>`', '', '```html', '<br>', '```'].join('\n');

    const storage = converter.convert(markdown);

    expect(storage).toContain('&lt;br&gt;');
    expect(storage).toContain('<![CDATA[<br>]]>');
});
```

- [x] **Step 3: 새 test가 현재 구현에서 의도대로 실패하는지 확인한다**

Run:

```bash
pnpm test:run tools/confluence/converters/__tests__/md-to-storage.spec.ts
```

Expected: inline과 block raw HTML test가 `<br>` 실제값과 `<br />` 기대값 차이로 FAIL한다. code context test는 PASS해도 되며, 이 결과는 수정 경계를 확인하는 증거로 기록한다.

- [x] **Step 4: raw HTML line break 정규화 helper를 구현한다**

`tools/confluence/converters/md-to-storage.ts`의 기존 helper 영역에 다음 함수를 추가한다.

```ts
/**
 * raw HTML 줄바꿈 tag를 Confluence Storage XML 형식으로 정규화한다.
 *
 * @param rawHtml markdown-it이 분리한 raw HTML token
 */
function normalizeRawHtmlBreaksForConfluenceStorage(rawHtml: string): string {
    if (/<!\[CDATA\[|<!--/i.test(rawHtml)) {
        return rawHtml;
    }

    return rawHtml.replace(/<br\s*\/?>/gi, '<br />');
}
```

- [x] **Step 5: `html_inline`과 `html_block` renderer에 helper를 연결한다**

`MarkdownIt` 생성 직후, task list core rule 등록 전에 다음 renderer를 추가한다.

```ts
this.md.renderer.rules.html_inline = (tokens, idx) => {
    return normalizeRawHtmlBreaksForConfluenceStorage(tokens[idx].content);
};

this.md.renderer.rules.html_block = (tokens, idx) => {
    return normalizeRawHtmlBreaksForConfluenceStorage(tokens[idx].content);
};
```

- [x] **Step 6: targeted test가 모두 통과하는지 확인한다**

Run:

```bash
pnpm test:run tools/confluence/converters/__tests__/md-to-storage.spec.ts
```

Expected: 기존 10개와 신규 4개를 합한 14개 test가 PASS한다.

- [x] **Step 7: 변경을 commit한다**

```bash
git add tools/confluence/converters/md-to-storage.ts tools/confluence/converters/__tests__/md-to-storage.spec.ts
git commit -m "fix(confluence): raw HTML 줄바꿈 태그 XHTML 정규화"
```

### Task 2: 실제 문서와 전체 consumer regression 검증

**Files:**

- Verify: `tools/confluence/converters/md-to-storage.ts`
- Verify: `packages/obsidian-plugin/src/api/confluence.ts`
- Generated, not committed: `packages/obsidian-plugin/main.js`
- Update verification evidence: `tdecollab-docs/plans/2026-09-02-001-confluence-raw-html-xhtml-normalization.md`

**Interfaces:**

- Consumes: Task 1의 `MarkdownToStorageConverter.convert(markdown)`
- Produces: CLI/TUI/MCP/Obsidian이 공유하는 well-formed Storage XML과 Obsidian runtime bundle

- [x] **Step 1: 제공된 원본 문서의 변환 결과에 raw `<br>`가 남지 않는지 확인한다**

원본 내용은 repository에 복사하지 않고 개발 환경의 file을 직접 읽는다. 출력 본문도 저장하지 않고 count만 확인한다.

Run:

```bash
TDE_RAW_DOC_PATH="$TDE_RAW_DOC_PATH" pnpm exec tsx -e "import { readFileSync } from 'node:fs'; import { MarkdownToStorageConverter } from './tools/confluence/converters/md-to-storage.ts'; const markdown=readFileSync(process.argv[1], 'utf8'); const storage=new MarkdownToStorageConverter({baseUrl:'https://confluence.example.com'}).convert(markdown); console.log({rawBr:(storage.match(/<br>/g) ?? []).length,selfClosingBr:(storage.match(/<br \/>/g) ?? []).length});" "$TDE_RAW_DOC_PATH"
```

Expected: `rawBr: 0`, `selfClosingBr: 102`.

- [x] **Step 2: 제공된 원본 문서의 전체 Storage XML이 well-formed인지 확인한다**

Confluence namespace prefix를 test wrapper에서만 선언한 뒤 XML parser로 검사한다. wrapper는 API payload에 포함하지 않는다.

Run:

```bash
pnpm exec tsx -e "import { readFileSync } from 'node:fs'; import { MarkdownToStorageConverter } from './tools/confluence/converters/md-to-storage.ts'; const markdown=readFileSync(process.argv[1], 'utf8'); const storage=new MarkdownToStorageConverter({baseUrl:'https://confluence.example.com'}).convert(markdown); process.stdout.write('<root xmlns:ac=\"urn:ac\" xmlns:ri=\"urn:ri\">'+storage+'</root>');" "$TDE_RAW_DOC_PATH" | xmllint --noout -
```

Expected: exit code 0, parser error 없음.

- [x] **Step 3: 전체 automated regression을 실행한다**

Run:

```bash
pnpm test:run
pnpm lint
pnpm build
pnpm --dir packages/obsidian-plugin test -- --run
pnpm --dir packages/obsidian-plugin build
```

Expected: lint는 eslint dependency 부재로 BLOCKED일 수 있으며, test와 build 명령은 exit code 0이어야 한다. 마지막 build가 개발 plugin symlink target인 `packages/obsidian-plugin/main.js`를 갱신한다.

- [x] **Step 4: Obsidian uploadMarkdown() entrypoint로 실제 E2E를 검증한다 (UI 자동화 대체)**

1. native Obsidian UI 자동화가 가능한 환경이면 plugin을 reload하고 원본 문서 upload를 실행한다.
2. UI 자동화가 불가능한 현재 환경에서는 plugin source와 동일한 `uploadMarkdown()` entrypoint로 synthetic child create를 실행한다.
3. create 후 `getPage(..., ['ancestors', 'body.storage'])`로 parent 관계와 Storage XML을 확인한다.
4. 확인이 끝나면 `finally`에서 synthetic page를 삭제한다.

Expected: 새 child page가 생성되고 오류 Notice가 나타나지 않으며 table이 정상 rendering된다.

- [x] **Step 5: 검증 결과와 남은 위험을 이 문서에 기록한다**

다음 형식으로 `검증 결과` section을 추가한다.

```markdown
## 검증 결과

| 검증 | 결과 | 증거 |
|---|---|---|
| targeted converter test | PASS | 13 tests |
| 전체 test/lint/build | PASS | 실행 시각과 command |
| 실제 문서 XML parsing | PASS | rawBr 0, selfClosingBr 102, xmllint exit 0 |
| Obsidian E2E | PASS | 생성 page ID와 child 관계 확인 |

남은 위험: 이번 변경은 raw `<br>` 계열만 다루며 다른 raw HTML5 void element는 별도 case가 확인될 때 확장한다.
```

- [x] **Step 6: 문서 증거 변경을 commit한다**

```bash
git add tdecollab-docs/plans/2026-09-02-001-confluence-raw-html-xhtml-normalization.md
git commit -m "docs(confluence): raw HTML XHTML 수정 검증 결과 기록"
```

## 4. 검증 및 운영 고려사항

### Acceptance Criteria

- raw `<br>` variant가 table cell과 일반 raw HTML에서 `<br />`로 출력된다.
- inline code와 fenced code 안의 literal `<br>`는 각각 escaped text와 CDATA 내용으로 보존된다.
- 제공된 전체 문서 변환 결과가 XML parser를 통과한다.
- Obsidian plugin의 실제 upload가 지정 parent 아래에서 성공한다.
- CLI, TUI, MCP는 같은 converter를 사용하므로 별도 분기 없이 regression test를 통과한다.

### Rollback

- code rollback은 Task 1 commit 하나를 revert한다.
- E2E에서 생성한 page가 test용이면 삭제 전에 page ID와 사용자 의도를 확인한다.
- 원본 Markdown 문서는 구현 과정에서 수정하지 않으므로 file rollback은 필요 없다.

### 문서 동기화 판단

- `tdecollab-docs/architecture.md`는 converter 공유 경계를 이미 설명하므로 구조 변경이 없어 수정하지 않는다.
- API/Contract signature와 UI flow가 바뀌지 않으므로 별도 Contract/ADR 문서는 만들지 않는다.
- 이 plan과 구현 후 추가할 검증 결과가 진단, TDD, E2E traceability의 source of truth다.

### 적용 workflow

| Skill | 목적 |
|---|---|
| `superpowers:systematic-debugging` | 오류 row/column에서 data flow를 역추적하고 root cause를 실험으로 확인 |
| `goodjoon-workflow:good-plan` | 범위, 비범위, Acceptance Criteria, E2E와 test 영향을 기록 |
| `superpowers:writing-plans` | TDD 기반의 실행 가능한 단계와 command 작성 |
| 구현 시 `superpowers:test-driven-development` | failing test부터 RED/GREEN 수행 |
| 완료 시 `superpowers:verification-before-completion` | 최신 전체 test/build/E2E 증거 확인 |

## 검증 결과

실행 시각: 2026-09-02 20:59~21:01 KST. 실제 문서는 외부 workspace에서 직접 읽었고, 변환된 Storage XML 본문은 저장하지 않았다.

| 검증 | 결과 | 증거 |
|---|---|---|
| targeted converter test | PASS | `tools/confluence/converters/__tests__/md-to-storage.spec.ts`가 전체 regression에 포함되어 13 tests PASS |
| 전체 test | PASS | `pnpm test:run`: 21 test files, 128 tests PASS |
| lint | BLOCKED | `pnpm lint` 실행 시 `sh: eslint: command not found` (exit 1). root `package.json`의 `devDependencies`에 `eslint`가 없어 실행 불가 |
| root build | PASS | `pnpm build` (`tsup`) exit 0 |
| Obsidian plugin test | PASS | `pnpm --dir packages/obsidian-plugin test -- --run`: 5 test files, 22 tests PASS |
| Obsidian plugin build | PASS | `pnpm --dir packages/obsidian-plugin build` exit 0, ignored generated output `packages/obsidian-plugin/main.js` 갱신 |
| 실제 문서 XHTML 정규화 | PASS | converter 출력 `rawBr: 0`, `selfClosingBr: 122`; `xmllint --noout -` exit 0. brief의 예상 102와 다른 122는 검증 시점 원본 문서의 현재 count |
| live Confluence E2E | PASS | plugin source와 같은 `uploadMarkdown()` entrypoint로 synthetic child page 생성. `getPage(..., ['ancestors', 'body.storage'])` 재조회에서 parent 관계, `rawBr: 0`, `selfClosingBr: 122`, inline code tag 1000개 확인. finally에서 page 삭제 SUCCESS |
| 최초 live E2E cleanup | PASS | inline code 탐지 regex 보정 전 생성된 synthetic page도 parent/XHTML 확인 뒤 finally에서 삭제 SUCCESS |

native Obsidian UI 자동화 환경이 없어 plugin reload, parent URL 입력 UI의 자동 채움, Note frontmatter 쓰기와 Notice 표시는 직접 검증하지 못했다. 대신 같은 plugin `uploadMarkdown()` entrypoint를 사용해 실제 Confluence create, parent 관계, Storage line break와 inline code tag, cleanup을 live API에서 확인했다.

남은 위험: 이번 변경은 raw `<br>` 계열만 다루며 다른 raw HTML5 void element는 별도 case가 확인될 때 확장한다. 또한 `pnpm lint`는 `eslint` devDependency 부재로 현재 worktree에서 검증할 수 없으므로 dependency 선언을 복구한 뒤 재실행이 필요하다.

### 2026-09-02 comment·CDATA 혼합 token 재검증

최초 보정은 comment 또는 CDATA가 포함된 token 전체를 보존했다. 이 방식은 literal을 보호하지만, 같은 token 안의 실제 raw `<br>`도 정규화하지 않는 결함이 있었다. comment/CDATA span은 그대로 복사하고, 그 밖의 `<br>`, `<BR>`, `<br/>`, `<br />`만 `<br />`로 치환하도록 보정했다.

| 검증 | 결과 | 증거 |
|---|---|---|
| mixed literal regression | PASS | comment와 CDATA 사이의 실제 `<br>` 및 `<BR>`만 정규화하는 test 추가, targeted converter 15 tests PASS |
| 전체 test | PASS | `pnpm test:run`: 21 test files, 130 tests PASS |
| root build | PASS | `pnpm build` (`tsup`) exit 0 |
| Obsidian plugin test/build | PASS | 5 test files, 22 tests PASS; production build exit 0 |
| 실제 문서 XHTML 정규화 | PASS | `rawBr: 0`, `xhtmlBreaks: 122`, `xmllint --noout -` exit 0 |
| live Confluence E2E | BLOCKED | `uploadMarkdown()` create 요청이 server의 `403` read-only/권한 거부로 page 생성 전에 중단됨. 생성·삭제 대상 없음 |
| lint | BLOCKED | `eslint` executable/devDependency가 없어 `pnpm lint`가 실행되지 않음 |
