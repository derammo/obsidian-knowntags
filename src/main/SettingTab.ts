import { App, PluginSettingTab, Setting } from 'obsidian';
import { KnownTagsPlugin } from "./PluginImplementation";

export class SettingTab extends PluginSettingTab {
	plugin: KnownTagsPlugin;

	constructor(app: App, plugin: KnownTagsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
				.setValue(this.plugin.settings.tagsFolder ?? "")
				.onChange(async (value) => {
					this.plugin.settings.tagsFolder = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Default Hide')
			.setDesc('If set, recognized inline commands are hidden when not being edited.  Can be overridden by "hide" or "nohide" keywords in command string.')
			.addToggle(value => value
				.setValue(this.plugin.settings.defaultHide)
				.onChange(async (value) => {
					this.plugin.settings.defaultHide = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Default Dim')
			.setDesc('If set, recognized and unhidden inline commands are shown dim when not being edited.  Can be overridden by "dim" or "nodim" keywords in command string.')
			.addToggle(value => value
				.setValue(this.plugin.settings.defaultDim)
				.onChange(async (value) => {
					this.plugin.settings.defaultDim = value;
					await this.plugin.saveSettings();
				}));
	}
		
}
