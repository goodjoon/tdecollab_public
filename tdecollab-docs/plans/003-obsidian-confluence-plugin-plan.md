# Obsidian Confluence Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 선택한 마크다운 문서를 Confluence 페이지로 업로드하거나 다운로드하는 Obsidian 플러그인 개발

**Architecture:** `packages/obsidian-plugin` 경로에 플러그인 프로젝트를 세팅하고, `tdecollab`의 `tools/confluence` 모듈을 가져와 플러그인 내부에 번들링하여 통신 및 변환 수행.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild, vitest

---

### Task 1: Project Initialization

**Files:**
- Create: `packages/obsidian-plugin/package.json`
- Create: `packages/obsidian-plugin/tsconfig.json`
- Create: `packages/obsidian-plugin/esbuild.config.mjs`
- Create: `packages/obsidian-plugin/manifest.json`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Workspace 등록**
  `pnpm-workspace.yaml` 파일에 `packages/obsidian-plugin` 추가.

```yaml
packages:
  - "frontend"
  - "packages/*"
```

- [ ] **Step 2: package.json 생성**

```json
{
  "name": "obsidian-tdecollab",
  "version": "1.0.0",
  "description": "Obsidian Plugin for Confluence Sync",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production",
    "test": "vitest"
  },
  "dependencies": {
    "markdown-it": "^14.1.0",
    "turndown": "^7.2.4",
    "turndown-plugin-gfm": "^1.0.2",
    "tdecollab": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "obsidian": "latest",
    "tslib": "2.6.3",
    "typescript": "5.6.3",
    "esbuild": "0.24.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: tsconfig.json 및 manifest.json 생성**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noImplicitAny": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```json
// manifest.json
{
  "id": "obsidian-tdecollab",
  "name": "TDE Collab Confluence",
  "version": "1.0.0",
  "minAppVersion": "1.1.15",
  "description": "Upload/Download markdown to Confluence using TDE Collab core",
  "author": "TDE Collab",
  "isDesktopOnly": true
}
```

- [ ] **Step 4: esbuild.config.mjs 생성**

```javascript
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

- [ ] **Step 5: 설치 및 테스트 실행**

Run: `pnpm install` in workspace root.
Run: `cd packages/obsidian-plugin && pnpm test`
Expected: 에러 없이(혹은 테스트 없다는 경고로) 종료됨.

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml packages/obsidian-plugin/
git commit -m "chore(obsidian): initialize plugin project structure"
```

---

### Task 2: Core Plugin & Settings Tab

**Files:**
- Create: `packages/obsidian-plugin/src/settings.ts`
- Create: `packages/obsidian-plugin/src/main.ts`

- [ ] **Step 1: Settings 인터페이스 및 UI 탭 구현**

`src/settings.ts` 작성:
```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';
import type TdecollabPlugin from './main.js';

export interface PluginSettings {
  baseUrl: string;
  email: string;
  apiToken: string;
  defaultSpaceKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  baseUrl: '',
  email: '',
  apiToken: '',
  defaultSpaceKey: ''
}

export class TdecollabSettingTab extends PluginSettingTab {
  plugin: TdecollabPlugin;

  constructor(app: App, plugin: TdecollabPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Confluence Base URL')
      .setDesc('예: https://your-domain.atlassian.net')
      .addText(text => text
        .setPlaceholder('Enter URL')
        .setValue(this.plugin.settings.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.baseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Email / Username')
      .addText(text => text
        .setValue(this.plugin.settings.email)
        .onChange(async (value) => {
          this.plugin.settings.email = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('API Token')
      .addText(text => text
        .setValue(this.plugin.settings.apiToken)
        .onChange(async (value) => {
          this.plugin.settings.apiToken = value;
          await this.plugin.saveSettings();
        }));
        
    new Setting(containerEl)
      .setName('Default Space Key')
      .addText(text => text
        .setValue(this.plugin.settings.defaultSpaceKey)
        .onChange(async (value) => {
          this.plugin.settings.defaultSpaceKey = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

- [ ] **Step 2: main.ts 구현 (빈 플러그인 뼈대)**

`src/main.ts` 작성:
```typescript
import { Plugin } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, TdecollabSettingTab } from './settings.js';

export default class TdecollabPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TdecollabSettingTab(this.app, this));
    
    // Commands placeholder
    this.addCommand({
      id: 'upload-to-confluence',
      name: 'Upload Current Note to Confluence',
      callback: () => {
        console.log('Upload command triggered');
      }
    });

    this.addCommand({
      id: 'download-from-confluence',
      name: 'Download from Confluence',
      callback: () => {
        console.log('Download command triggered');
      }
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

- [ ] **Step 3: 빌드 테스트**

Run: `pnpm build` in `packages/obsidian-plugin`
Expected: 빌드가 에러 없이 완료되고 `main.js`가 생성됨.

- [ ] **Step 4: Commit**

```bash
git add packages/obsidian-plugin/src/
git commit -m "feat(obsidian): add settings tab and basic plugin commands"
```

---

### Task 3: Frontmatter Utils (TDD)

**Files:**
- Create: `packages/obsidian-plugin/src/utils/frontmatter.ts`
- Create: `packages/obsidian-plugin/tests/frontmatter.test.ts`

- [ ] **Step 1: Write failing test**

`tests/frontmatter.test.ts` 작성:
```typescript
import { describe, it, expect } from 'vitest';
import { extractFrontmatter, updateOrInsertFrontmatter } from '../src/utils/frontmatter.js';

describe('Frontmatter Utils', () => {
  it('extracts confluence_page_id from frontmatter', () => {
    const content = `---\nconfluence_page_id: 12345\n---\n# Title`;
    expect(extractFrontmatter(content)?.confluence_page_id).toBe('12345');
  });

  it('inserts confluence_page_id if missing', () => {
    const content = `# Title\nBody`;
    const updated = updateOrInsertFrontmatter(content, 'confluence_page_id', '67890');
    expect(updated).toContain('confluence_page_id: 67890');
    expect(updated).toContain('# Title');
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `pnpm test`
Expected: FAIL (functions not defined)

- [ ] **Step 3: Write minimal implementation**

`src/utils/frontmatter.ts` 작성:
```typescript
export function extractFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const frontmatter: Record<string, string> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const [key, ...values] = line.split(':');
    if (key && values.length > 0) {
      frontmatter[key.trim()] = values.join(':').trim();
    }
  }
  return frontmatter;
}

export function updateOrInsertFrontmatter(content: string, key: string, value: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (match) {
    const lines = match[1].split('\n');
    let found = false;
    const newLines = lines.map(line => {
      if (line.startsWith(`${key}:`)) {
        found = true;
        return `${key}: ${value}`;
      }
      return line;
    });
    
    if (!found) {
      newLines.push(`${key}: ${value}`);
    }
    
    return content.replace(match[0], `---\n${newLines.join('\n')}\n---`);
  } else {
    return `---\n${key}: ${value}\n---\n\n${content}`;
  }
}
```

- [ ] **Step 4: Run test to verify passes**
Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add packages/obsidian-plugin/src/utils/ packages/obsidian-plugin/tests/
git commit -m "feat(obsidian): add frontmatter utility functions"
```

---

### Task 4: Upload to Confluence (Integration)

**Files:**
- Create: `packages/obsidian-plugin/src/api/confluence.ts`
- Modify: `packages/obsidian-plugin/src/main.ts`

- [ ] **Step 1: Write Confluence API Helper**

`src/api/confluence.ts` 작성 (tdecollab의 converter와 api 클래스를 활용하여 브릿지):
*(Obsidian API에서는 직접 tdecollab 내장 모듈 임포트가 어렵거나 axios CORS 이슈가 있을 수 있으므로 tdecollab의 순수 로직만 호출)*

```typescript
import { MarkdownToStorageConverter } from 'tdecollab/dist/confluence/converters/md-to-storage.js'; // 혹은 경로 조정 필요
import { ConfluenceClient } from 'tdecollab/dist/confluence/api/client.js';

export async function uploadMarkdown(
  baseUrl: string, 
  email: string, 
  token: string, 
  spaceKey: string,
  title: string,
  markdown: string, 
  pageId?: string
) {
  const converter = new MarkdownToStorageConverter({ baseUrl });
  const storageXml = await converter.convert(markdown);
  
  const client = new ConfluenceClient({
    baseUrl,
    auth: { type: 'basic', email, apiToken: token }
  });

  if (pageId) {
    return await client.updatePage(pageId, title, storageXml);
  } else {
    return await client.createPage(spaceKey, title, storageXml);
  }
}
```

- [ ] **Step 2: main.ts의 upload 커맨드에 연동**

`src/main.ts` 수정:
```typescript
// ... 기존 import 유지
import { Notice, MarkdownView } from 'obsidian';
import { uploadMarkdown } from './api/confluence.js';
import { extractFrontmatter, updateOrInsertFrontmatter } from './utils/frontmatter.js';

// ... 생략
  async onload() {
// ...
    this.addCommand({
      id: 'upload-to-confluence',
      name: 'Upload Current Note to Confluence',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return new Notice('마크다운 파일이 열려있지 않습니다.');
        
        const file = view.file;
        if (!file) return;

        const content = await this.app.vault.read(file);
        const fm = extractFrontmatter(content);
        const pageId = fm?.confluence_page_id;
        const title = file.basename;

        try {
          new Notice('Uploading to Confluence...');
          const res = await uploadMarkdown(
            this.settings.baseUrl,
            this.settings.email,
            this.settings.apiToken,
            this.settings.defaultSpaceKey,
            title,
            content,
            pageId
          );
          
          if (!pageId && res.id) {
            const newContent = updateOrInsertFrontmatter(content, 'confluence_page_id', res.id);
            await this.app.vault.modify(file, newContent);
          }
          new Notice('업로드 성공!');
        } catch (e: any) {
          console.error(e);
          new Notice(`업로드 실패: ${e.message}`);
        }
      }
    });
// ...
```

- [ ] **Step 3: 빌드 확인 및 커밋**

Run: `pnpm build` in `packages/obsidian-plugin`
```bash
git add packages/obsidian-plugin/src/
git commit -m "feat(obsidian): implement upload to confluence feature"
```

---

### Task 5: Download from Confluence (Integration)

**Files:**
- Modify: `packages/obsidian-plugin/src/api/confluence.ts`
- Modify: `packages/obsidian-plugin/src/main.ts`

- [ ] **Step 1: Write Download Helper**

`src/api/confluence.ts` 에 추가:
```typescript
import { StorageToMarkdownConverter } from 'tdecollab/dist/confluence/converters/storage-to-md.js'; // 혹은 경로 조정 필요

export async function downloadPage(
  baseUrl: string, 
  email: string, 
  token: string, 
  pageId: string
) {
  const client = new ConfluenceClient({
    baseUrl,
    auth: { type: 'basic', email, apiToken: token }
  });

  const page = await client.getPage(pageId);
  const converter = new StorageToMarkdownConverter({ baseUrl });
  const markdown = await converter.convert(page.body.storage.value);
  
  return { title: page.title, markdown };
}
```

- [ ] **Step 2: main.ts의 download 커맨드에 연동**

`src/main.ts`의 `download-from-confluence` callback 수정:
```typescript
// ...
    this.addCommand({
      id: 'download-from-confluence',
      name: 'Download from Confluence (Overwrite)',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.file) return new Notice('마크다운 파일이 열려있지 않습니다.');
        
        const file = view.file;
        const content = await this.app.vault.read(file);
        const fm = extractFrontmatter(content);
        const pageId = fm?.confluence_page_id;

        if (!pageId) {
          return new Notice('Frontmatter에 confluence_page_id가 없습니다.');
        }

        try {
          new Notice('Downloading from Confluence...');
          const { markdown } = await downloadPage(
            this.settings.baseUrl,
            this.settings.email,
            this.settings.apiToken,
            pageId
          );
          
          // 기존 frontmatter 보존 로직
          const match = content.match(/^---\n([\s\S]*?)\n---/);
          const fmString = match ? match[0] : `---\nconfluence_page_id: ${pageId}\n---`;
          
          await this.app.vault.modify(file, `${fmString}\n\n${markdown}`);
          new Notice('다운로드 완료!');
        } catch (e: any) {
          console.error(e);
          new Notice(`다운로드 실패: ${e.message}`);
        }
      }
    });
// ...
```

- [ ] **Step 3: 빌드 확인 및 커밋**

Run: `pnpm build` in `packages/obsidian-plugin`
```bash
git add packages/obsidian-plugin/src/
git commit -m "feat(obsidian): implement download from confluence feature"
```
