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
