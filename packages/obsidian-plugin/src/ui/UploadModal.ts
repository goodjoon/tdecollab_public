import { App, Modal, Setting } from 'obsidian';
import { parseParentPageUrl } from '../utils/confluence-url.js';

export class UploadModal extends Modal {
  spaceKey: string;
  parentId: string;
  parentUrl: string;
  onSubmit: (spaceKey: string, parentId: string) => void;

  constructor(app: App, defaultSpaceKey: string, onSubmit: (spaceKey: string, parentId: string) => void) {
    super(app);
    this.spaceKey = defaultSpaceKey;
    this.parentId = '';
    this.parentUrl = '';
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Confluence 업로드 설정' });
    contentEl.createEl('p', { text: '새 문서를 생성하기 위해 스페이스 키와 부모 페이지를 입력해주세요.' });

    let spaceText: { setValue: (value: string) => unknown } | undefined;
    let parentIdText: { setValue: (value: string) => unknown } | undefined;

    new Setting(contentEl)
      .setName('Space Key')
      .setDesc('어느 공간(Space)에 문서를 생성할지 입력하세요 (예: DEV)')
      .addText((text) => {
        spaceText = text;
        return text
          .setValue(this.spaceKey)
          .onChange((value) => {
            this.spaceKey = value;
          });
      });

    new Setting(contentEl)
      .setName('Parent Page URL (선택)')
      .setDesc('부모 페이지 URL을 붙여넣으면 Space Key와 Parent Page ID가 자동으로 채워집니다.')
      .addText((text) =>
        text
          .setPlaceholder('예: https://confluence.example.com/spaces/DEV/pages/12345678/title')
          .setValue(this.parentUrl)
          .onChange((value) => {
            this.parentUrl = value;
            const parsed = parseParentPageUrl(value);

            if (parsed.spaceKey) {
              this.spaceKey = parsed.spaceKey;
              spaceText?.setValue(parsed.spaceKey);
            }

            if (parsed.parentId) {
              this.parentId = parsed.parentId;
              parentIdText?.setValue(parsed.parentId);
            }
          })
      );

    new Setting(contentEl)
      .setName('Parent Page ID (선택)')
      .setDesc('부모 페이지 ID입니다. URL 입력 시 자동으로 채워지며, 직접 입력해도 됩니다.')
      .addText((text) => {
        parentIdText = text;
        return text
          .setPlaceholder('예: 12345678')
          .setValue(this.parentId)
          .onChange((value) => {
            this.parentId = value.trim();
          });
      });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('업로드')
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.spaceKey, this.parentId);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
