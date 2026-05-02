import { Plugin, Notice, MarkdownView, TFile } from 'obsidian';
import * as path from 'path';
import { PluginSettings, DEFAULT_SETTINGS, TdecollabSettingTab } from './settings.js';
import { uploadMarkdown, downloadPage } from './api/confluence.js';
import { extractFrontmatter, updateOrInsertFrontmatter } from './utils/frontmatter.js';
import { StorageToMarkdownConverter } from '../../../tools/confluence/converters/storage-to-md.js';
import { UploadModal } from './ui/UploadModal.js';
import { DownloadModal } from './ui/DownloadModal.js';
import { ImageDownloader } from '../../../tools/confluence/utils/image-downloader.js';
import { ConfluenceContentApi } from '../../../tools/confluence/api/content.js';
import { createConfluenceClient } from '../../../tools/confluence/api/client.js';

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

        if (pageId) {
          // 문서 업데이트는 부모 ID 불필요하므로 즉시 실행
          await this.executeUpload(file, content, this.settings.defaultSpaceKey, pageId, undefined);
        } else {
          // 새 문서 생성 시 Modal 띄움
          new UploadModal(this.app, this.settings.defaultSpaceKey, async (spaceKey, parentId) => {
            if (!spaceKey) {
              new Notice('Space Key는 필수 입력사항입니다.');
              return;
            }
            await this.executeUpload(file, content, spaceKey, undefined, parentId);
          }).open();
        }
      }
    });

    this.addCommand({
      id: 'download-from-confluence',
      name: 'Download from Confluence',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file;
        let defaultPageId = '';
        
        if (file) {
          const content = await this.app.vault.read(file);
          const fm = extractFrontmatter(content);
          defaultPageId = fm?.confluence_page_id || '';
        }

        new DownloadModal(this.app, defaultPageId, !!file, async (pageId, saveMode) => {
          if (!pageId) {
            new Notice('Page ID가 입력되지 않았습니다.');
            return;
          }

          try {
            console.log(`[TDE Collab] Downloading page: ${pageId}, saveMode: ${saveMode}`);
            new Notice('Downloading from Confluence...');
            
            // 1. Confluence 클라이언트 초기화
            const axiosClient = createConfluenceClient({
              baseUrl: this.settings.baseUrl,
              auth: { username: this.settings.email || undefined, token: this.settings.apiToken }
            });
            const contentApi = new ConfluenceContentApi(axiosClient);

            // 2. 페이지 데이터 가져오기 (Storage XML 포함)
            const pageData = await contentApi.getPage(pageId);
            const storageXml = pageData.body.storage.value;
            console.log(`[TDE Collab] Page data fetched: ${pageData.title}`);

            let imageUrlMap: Map<string, string> | undefined;
            
            // 3. 이미지 다운로드 처리
            if (this.settings.downloadImages) {
              // 저장될 기본 폴더 경로 결정
              let baseFolderPath = '';
              if (saveMode === 'overwrite' && file) {
                baseFolderPath = file.parent ? file.parent.path : '';
              } else {
                baseFolderPath = this.settings.defaultDownloadPath.trim();
              }
              if (baseFolderPath.endsWith('/')) baseFolderPath = baseFolderPath.slice(0, -1);
              if (baseFolderPath === '/') baseFolderPath = '';

              const imgSubDir = this.settings.imageDir || 'assets';
              const imgDir = baseFolderPath ? `${baseFolderPath}/${imgSubDir}` : imgSubDir;
              
              console.log(`[TDE Collab] Image download enabled. Target dir: ${imgDir}`);
              
              // 폴더 계층 생성 (Recursive)
              const parts = imgDir.split('/');
              let currentPath = '';
              for (const part of parts) {
                if (!part) continue;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!this.app.vault.getAbstractFileByPath(currentPath)) {
                  console.log(`[TDE Collab] Creating directory: ${currentPath}`);
                  await this.app.vault.createFolder(currentPath);
                }
              }

              const vaultPath = (this.app.vault.adapter as any).getBasePath();
              const absoluteImgDir = path.join(vaultPath, imgDir);

              const downloader = new ImageDownloader(contentApi, {
                outputDir: absoluteImgDir,
                pageId: pageId,
                baseUrl: this.settings.baseUrl
              });

              new Notice('이미지 다운로드 중...');
              const rawImageUrlMap = await downloader.downloadAllImages(storageXml);
              console.log(`[TDE Collab] Downloaded ${rawImageUrlMap.size} images.`);
              
              // 마크다운 내에서는 Vault 루트 기준의 상대 경로를 사용
              imageUrlMap = new Map();
              for (const [key, absPath] of rawImageUrlMap.entries()) {
                const relPath = path.relative(vaultPath, absPath);
                imageUrlMap.set(key, relPath);
              }
            }

            // 4. 마크다운 변환 (저장된 이미지 맵 적용)
            const converter = new StorageToMarkdownConverter({ baseUrl: this.settings.baseUrl });
            const finalMarkdown = converter.convert(storageXml, imageUrlMap);
            
            const fmString = `---\nconfluence_page_id: ${pageId}\n---`;
            const finalContent = `${fmString}\n\n${finalMarkdown}`;

            if (saveMode === 'overwrite' && file) {
              await this.app.vault.modify(file, finalContent);
              new Notice('다운로드하여 현재 문서를 덮어썼습니다!');
            } else {
              // 새 파일 생성 경로 결정
              let folderPath = this.settings.defaultDownloadPath.trim();
              if (folderPath.endsWith('/')) folderPath = folderPath.slice(0, -1);
              
              if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
                await this.app.vault.createFolder(folderPath);
              }

              let newFileName = `${pageData.title}.md`;
              newFileName = newFileName.replace(/[\\/:*?"<>|]/g, '-');
              
              let newFilePath = folderPath ? `${folderPath}/${newFileName}` : newFileName;
              let counter = 1;
              while (this.app.vault.getAbstractFileByPath(newFilePath)) {
                newFilePath = folderPath 
                  ? `${folderPath}/${newFileName.replace('.md', '')} (${counter}).md`
                  : `${newFileName.replace('.md', '')} (${counter}).md`;
                counter++;
              }
              
              const newFile = await this.app.vault.create(newFilePath, finalContent);
              new Notice(`'${newFilePath}' 파일로 다운로드 완료!`);
              
              const leaf = this.app.workspace.getLeaf(true);
              await leaf.openFile(newFile);
            }
          } catch (e: any) {
            console.error('[TDE Collab] Download failed:', e);
            new Notice(`다운로드 실패: ${e.message}`);
          }
        }).open();
      }
    });
  }

  async executeUpload(file: TFile, content: string, spaceKey: string, pageId?: string, parentId?: string) {
    const title = file.basename;
    try {
      new Notice('Uploading to Confluence...');
      const res = await uploadMarkdown(
        this.settings.baseUrl,
        this.settings.email,
        this.settings.apiToken,
        spaceKey,
        title,
        content,
        pageId,
        parentId
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

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
