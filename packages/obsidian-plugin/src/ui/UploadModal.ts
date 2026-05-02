import { App, Modal, Setting } from 'obsidian';

export class UploadModal extends Modal {
  spaceKey: string;
  parentId: string;
  onSubmit: (spaceKey: string, parentId: string) => void;

  constructor(app: App, defaultSpaceKey: string, onSubmit: (spaceKey: string, parentId: string) => void) {
    super(app);
    this.spaceKey = defaultSpaceKey;
    this.parentId = '';
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Confluence 업로드 설정' });
    contentEl.createEl('p', { text: '새 문서를 생성하기 위해 스페이스 키와 부모 페이지를 입력해주세요.' });

    new Setting(contentEl)
      .setName('Space Key')
      .setDesc('어느 공간(Space)에 문서를 생성할지 입력하세요 (예: DEV)')
      .addText((text) =>
        text
          .setValue(this.spaceKey)
          .onChange((value) => {
            this.spaceKey = value;
          })
      );

    new Setting(contentEl)
      .setName('Parent Page ID / URL (선택)')
      .setDesc('부모 페이지의 ID(숫자) 또는 Confluence URL을 입력하면 하위 페이지로 생성됩니다.')
      .addText((text) =>
        text
          .setPlaceholder('예: 12345678 또는 URL')
          .setValue(this.parentId)
          .onChange((value) => {
            // URL이 들어오면 ID 추출 시도
            const urlMatch = value.match(/pages\/(\d+)/);
            if (urlMatch) {
              this.parentId = urlMatch[1];
              text.setValue(this.parentId); // ID만 남기기
            } else {
              this.parentId = value;
            }
          })
      );

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
