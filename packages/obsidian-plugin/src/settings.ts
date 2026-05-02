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
      .setName('Email / Username (필수)')
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
  }
}
