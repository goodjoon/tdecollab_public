import { App, Modal, Setting } from 'obsidian';

export class DownloadModal extends Modal {
  pageId: string;
  saveMode: 'new' | 'overwrite';
  hasActiveFile: boolean;
  onSubmit: (pageId: string, saveMode: 'new' | 'overwrite') => void;

  constructor(
    app: App, 
    defaultPageId: string, 
    hasActiveFile: boolean, 
    onSubmit: (pageId: string, saveMode: 'new' | 'overwrite') => void
  ) {
    super(app);
    this.pageId = defaultPageId;
    this.saveMode = hasActiveFile ? 'overwrite' : 'new';
    this.hasActiveFile = hasActiveFile;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Confluence 다운로드 설정' });
    contentEl.createEl('p', { text: '다운로드할 페이지 정보를 입력하고 저장 방식을 선택하세요.' });

    new Setting(contentEl)
      .setName('Page ID / URL (필수)')
      .setDesc('가져올 Confluence 페이지의 ID(숫자) 또는 URL을 입력하세요.')
      .addText((text) =>
        text
          .setPlaceholder('예: 12345678 또는 URL')
          .setValue(this.pageId)
          .onChange((value) => {
            const urlMatch = value.match(/pages\/(\d+)/);
            if (urlMatch) {
              this.pageId = urlMatch[1];
              text.setValue(this.pageId);
            } else {
              this.pageId = value;
            }
          })
      );

    new Setting(contentEl)
      .setName('저장 방식')
      .setDesc('다운로드한 내용을 어떻게 저장할지 선택하세요.')
      .addDropdown((dropdown) => {
        if (this.hasActiveFile) {
          dropdown.addOption('overwrite', '현재 활성화된 노트 덮어쓰기');
        }
        dropdown.addOption('new', '새로운 노트로 생성하기');
        
        dropdown.setValue(this.saveMode);
        dropdown.onChange((value: 'new' | 'overwrite') => {
          this.saveMode = value;
        });
      });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('다운로드')
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.pageId, this.saveMode);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
