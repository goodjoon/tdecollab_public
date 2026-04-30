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
      .addText(text => {
        text.inputEl.type = 'password';
        return text
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          });
      });

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
