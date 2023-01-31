import { App, PluginSettingTab, Setting } from 'obsidian';
import KnownTagsPlugin from './main';

export class KnownTagsSettingTab extends PluginSettingTab {
	plugin: KnownTagsPlugin;

	constructor(app: App, plugin: KnownTagsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.tagsFolder ?? "")
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.tagsFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
