import { Plugin, Notice, MarkdownView } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, TdecollabSettingTab } from './settings.js';
import { uploadMarkdown, downloadPage } from './api/confluence.js';
import { extractFrontmatter, updateOrInsertFrontmatter } from './utils/frontmatter.js';

export default class TdecollabPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TdecollabSettingTab(this.app, this));
    
    this.addCommand({
      id: 'upload-to-confluence',
      name: 'Upload Current Note to Confluence',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
          new Notice('마크다운 파일이 열려있지 않습니다.');
          return;
        }
        
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

    this.addCommand({
      id: 'download-from-confluence',
      name: 'Download from Confluence (Overwrite)',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.file) {
          new Notice('마크다운 파일이 열려있지 않습니다.');
          return;
        }
        
        const file = view.file;
        const content = await this.app.vault.read(file);
        const fm = extractFrontmatter(content);
        const pageId = fm?.confluence_page_id;

        if (!pageId) {
          new Notice('Frontmatter에 confluence_page_id가 없습니다.');
          return;
        }

        try {
          new Notice('Downloading from Confluence...');
          const { markdown } = await downloadPage(
            this.settings.baseUrl,
            this.settings.email,
            this.settings.apiToken,
            pageId
          );
          
          // Preserve existing frontmatter
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
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
