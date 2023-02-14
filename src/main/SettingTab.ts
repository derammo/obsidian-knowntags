import { App, PluginSettingTab, Plugin, Setting } from 'obsidian';
import { Host } from './Plugin';

export class SettingTab extends PluginSettingTab {
	constructor(app: App, plugin: Plugin, private host: Host) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for Known Tags Plugin' });

		new Setting(containerEl)
			.setName('Tags Folder')
			.setDesc('If set, only the specified folder is scanned for meta information in frontmatter.')
			.addText(text => text
				.setPlaceholder('Folder Name')
				.setValue(this.host.settings.tagsFolder ?? "")
				.onChange(async (value) => {
					this.host.settings.tagsFolder = value;
					await this.host.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Default Hide')
			.setDesc('If set, recognized inline commands are hidden when not being edited.  Can be overridden by "hide" or "nohide" keywords in command string.')
			.addToggle(value => value
				.setValue(this.host.settings.defaultHide)
				.onChange(async (value) => {
					this.host.settings.defaultHide = value;
					await this.host.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Default Dim')
			.setDesc('If set, recognized and unhidden inline commands are shown dim when not being edited.  Can be overridden by "dim" or "nodim" keywords in command string.')
			.addToggle(value => value
				.setValue(this.host.settings.defaultDim)
				.onChange(async (value) => {
					this.host.settings.defaultDim = value;
					await this.host.saveSettings();
				}));
	}
		
}
