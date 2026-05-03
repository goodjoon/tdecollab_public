import { Plugin, Notice, MarkdownView, TFile, requestUrl } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, TdecollabSettingTab } from './settings.js';
import { uploadMarkdown, downloadPage } from './api/confluence.js';
import { extractFrontmatter, updateOrInsertFrontmatter } from './utils/frontmatter.js';
import { UploadModal } from './ui/UploadModal.js';
import { DownloadModal } from './ui/DownloadModal.js';
import { ConfluenceContentApi } from '../../../tools/confluence/api/content.js';
import { createConfluenceClient } from '../../../tools/confluence/api/client.js';
import { MarkdownToStorageConverter } from '../../../tools/confluence/converters/md-to-storage.js';
import {
  ObsidianImageDownloader,
  createRequestUrlBinaryDownloader,
  resolveDocumentFolderPath,
  resolveImageFolderPath,
} from './utils/image-download.js';
import { uploadLocalImages } from './utils/image-upload.js';
import {
  assertNewPageTitleAvailable,
  buildDuplicatePageTitleMessage,
  isDuplicatePageTitleApiError,
} from './utils/page-title.js';

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
            new Notice('Downloading from Confluence...');
            
            let imageUrlMap: Map<string, string> | undefined;
            const documentFolderPath = resolveDocumentFolderPath({
              saveMode,
              currentFile: file,
              defaultDownloadPath: this.settings.defaultDownloadPath,
            });
            
            // 1. 이미지 다운로드 처리
            if (this.settings.downloadImages) {
              const axiosClient = createConfluenceClient({
                baseUrl: this.settings.baseUrl,
                auth: { username: this.settings.email || undefined, token: this.settings.apiToken }
              });
              const contentApi = new ConfluenceContentApi(axiosClient);
              
              // 임시로 contentApi를 이용해 storageXml을 가져와 이미지 목록 추출
              const initialData = await downloadPage(
                this.settings.baseUrl,
                this.settings.email,
                this.settings.apiToken,
                pageId
              );

              const imageFolderPath = resolveImageFolderPath(
                documentFolderPath,
                this.settings.imageDir || 'assets',
              );
              await this.ensureVaultFolder(imageFolderPath);

              const downloader = new ObsidianImageDownloader(contentApi, {
                adapter: this.app.vault.adapter,
                imageDir: imageFolderPath,
                markdownBaseDir: documentFolderPath,
                pageId: pageId,
                baseUrl: this.settings.baseUrl,
                downloadBinary: createRequestUrlBinaryDownloader(
                  requestUrl,
                  this.createConfluenceAuthHeaders(),
                ),
              });

              new Notice('이미지 다운로드 중...');
              imageUrlMap = await downloader.downloadAllImages(initialData.storageXml);
            }

            // 2. 최종 마크다운 변환
            const { title, markdown } = await downloadPage(
              this.settings.baseUrl,
              this.settings.email,
              this.settings.apiToken,
              pageId,
              imageUrlMap
            );
            
            const fmString = `---\nconfluence_page_id: ${pageId}\n---`;
            const finalContent = `${fmString}\n\n${markdown}`;

            if (saveMode === 'overwrite' && file) {
              await this.app.vault.modify(file, finalContent);
              new Notice('다운로드하여 현재 문서를 덮어썼습니다!');
            } else {
              // 새 파일 생성 경로 결정
              const folderPath = documentFolderPath;
              await this.ensureVaultFolder(folderPath);

              let newFileName = `${title}.md`;
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
            console.error(e);
            new Notice(`다운로드 실패: ${e.message}`);
          }
        }).open();
      }
    });
  }

  async ensureVaultFolder(folderPath: string) {
    if (!folderPath || this.app.vault.getAbstractFileByPath(folderPath)) {
      return;
    }

    const parts = folderPath.split('/').filter(Boolean);
    let current = '';

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  createConfluenceAuthHeaders(): Record<string, string> {
    if (this.settings.email && this.settings.apiToken) {
      return {
        Authorization: `Basic ${Buffer.from(`${this.settings.email}:${this.settings.apiToken}`).toString('base64')}`,
      };
    }

    if (this.settings.apiToken) {
      return {
        Authorization: `Bearer ${this.settings.apiToken}`,
      };
    }

    return {};
  }

  async executeUpload(file: TFile, content: string, spaceKey: string, pageId?: string, parentId?: string) {
    const title = file.basename;
    try {
      new Notice('Uploading to Confluence...');

      if (pageId) {
        await this.assertConfluencePageExists(pageId);
        await this.uploadLocalImageAttachments(file, content, pageId);
      } else {
        await this.assertNewPageTitleAvailable(spaceKey, title);
      }

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
        await this.uploadLocalImageAttachments(file, content, res.id);
      }
      
      if (!pageId && res.id) {
        const newContent = updateOrInsertFrontmatter(content, 'confluence_page_id', res.id);
        await this.app.vault.modify(file, newContent);
      }
      new Notice('업로드 성공!');
    } catch (e: any) {
      console.error(e);
      const message = !pageId && isDuplicatePageTitleApiError(e)
        ? buildDuplicatePageTitleMessage(title, spaceKey)
        : e.message;
      new Notice(`업로드 실패: ${message}`);
    }
  }

  async assertConfluencePageExists(pageId: string) {
    try {
      const axiosClient = createConfluenceClient({
        baseUrl: this.settings.baseUrl,
        auth: { username: this.settings.email || undefined, token: this.settings.apiToken },
      });
      const contentApi = new ConfluenceContentApi(axiosClient);
      await contentApi.getPage(pageId, ['version']);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error(
          `현재 문서의 confluence_page_id(${pageId}) 페이지를 찾을 수 없습니다. 기존 페이지를 업데이트하려면 올바른 page id로 수정하고, 새 페이지로 생성하려면 frontmatter의 confluence_page_id를 제거하세요.`,
        );
      }
      throw error;
    }
  }

  async assertNewPageTitleAvailable(spaceKey: string, title: string) {
    const axiosClient = createConfluenceClient({
      baseUrl: this.settings.baseUrl,
      auth: { username: this.settings.email || undefined, token: this.settings.apiToken },
    });
    const contentApi = new ConfluenceContentApi(axiosClient);
    await assertNewPageTitleAvailable(contentApi, spaceKey, title);
  }

  async uploadLocalImageAttachments(file: TFile, content: string, pageId: string) {
    const axiosClient = createConfluenceClient({
      baseUrl: this.settings.baseUrl,
      auth: { username: this.settings.email || undefined, token: this.settings.apiToken },
    });
    const contentApi = new ConfluenceContentApi(axiosClient);
    const converter = new MarkdownToStorageConverter();
    const localImages = converter.extractLocalImages(content);

    if (localImages.length === 0) {
      return;
    }

    new Notice(`로컬 이미지 attachment 업로드 중... (${localImages.length}개)`);
    const uploadedImages = await uploadLocalImages({
      adapter: this.app.vault.adapter,
      contentApi,
      pageId,
      markdownPath: file.path,
      imageSources: localImages,
    });
    console.log(`[tdecollab] 이미지 attachment 업로드 완료: ${uploadedImages.length}/${localImages.length}개`);

    if (uploadedImages.length !== localImages.length) {
      throw new Error(`로컬 이미지 attachment 업로드 실패: ${uploadedImages.length}/${localImages.length}개 성공`);
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
