import { App, PluginSettingTab, Setting } from 'obsidian';
import type TdecollabPlugin from './main.js';

export interface PluginSettings {
  baseUrl: string;
  email: string;
  apiToken: string;
  defaultSpaceKey: string;
  defaultDownloadPath: string;
  downloadImages: boolean;
  imageDir: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  baseUrl: '',
  email: '',
  apiToken: '',
  defaultSpaceKey: '',
  defaultDownloadPath: '',
  downloadImages: true,
  imageDir: 'assets'
};

export class TdecollabSettingTab extends PluginSettingTab {
  plugin: TdecollabPlugin;

  constructor(app: App, plugin: TdecollabPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'TDE Collab Confluence 설정' });
    containerEl.createEl('p', { text: '현재 선택한 마크다운 노트를 Confluence 페이지로 업로드(생성/수정)하거나, Confluence 페이지를 다운로드하여 덮어쓸 수 있습니다.' });
    containerEl.createEl('p', { text: '사용 전 Confluence API URL 및 인증 정보를 입력해주세요.' });

    new Setting(containerEl)
      .setName('Confluence Base URL (필수)')
      .setDesc('예: https://your-domain.atlassian.net')
      .addText(text => {
        text.inputEl.style.width = '450px';
        return text
          .setPlaceholder('Enter URL')
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.baseUrl = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Email / Username (선택)')
      .setDesc('Confluence 계정 이메일 또는 아이디입니다.')
      .addText(text => {
        text.inputEl.style.width = '450px';
        return text
          .setValue(this.plugin.settings.email)
          .onChange(async (value) => {
            this.plugin.settings.email = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('API Token (필수)')
      .setDesc('Confluence 개인 접근 토큰 (PAT)')
      .addText(text => {
        text.inputEl.type = 'password';
        text.inputEl.style.width = '450px';
        return text
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Default Space Key (선택)')
      .setDesc('새 문서 업로드 시 기본 스페이스 키 (예: DEV)')
      .addText(text => {
        text.inputEl.style.width = '450px';
        return text
          .setValue(this.plugin.settings.defaultSpaceKey)
          .onChange(async (value) => {
            this.plugin.settings.defaultSpaceKey = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Default Download Path (선택)')
      .setDesc('신규 페이지 다운로드 시 저장될 기본 폴더 경로 (예: Confluence/Downloads)')
      .addText(text => {
        text.inputEl.style.width = '450px';
        return text
          .setPlaceholder('Vault 내 상대경로 입력')
          .setValue(this.plugin.settings.defaultDownloadPath)
          .onChange(async (value) => {
            this.plugin.settings.defaultDownloadPath = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Download Images')
      .setDesc('Confluence 페이지 다운로드 시 이미지 파일도 함께 다운로드합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.downloadImages)
        .onChange(async (value) => {
          this.plugin.settings.downloadImages = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Image Storage Directory')
      .setDesc('이미지 파일이 저장될 상대 폴더 경로입니다.')
      .addText(text => {
        text.inputEl.style.width = '450px';
        return text
          .setPlaceholder('예: assets')
          .setValue(this.plugin.settings.imageDir)
          .onChange(async (value) => {
            this.plugin.settings.imageDir = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
