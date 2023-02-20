import { MetadataCache } from 'obsidian';

import { CommandDispatcher, CommandViewPlugin, createCommandRemovalPostProcessor } from "derobst/command";
import { ObsidianPluginBase } from "derobst/main";

import * as EraseQuote from "commands/erase_quote/Command";
import * as KnownTags from "commands/known_tags/Command";

import { publishAPI } from 'derobst/api';
import { DerAmmoKnownTagsABI_V1 } from '../api/api';
import { KnownTagsCache } from './KnownTagsCache';
import { DEFAULT_SETTINGS, Host, Settings } from './Plugin';
import { SettingTab } from './SettingTab';

export class KnownTagsPlugin extends ObsidianPluginBase<Settings> implements Host {
	commands: CommandDispatcher<Host> = new CommandDispatcher<Host>();
	cache: KnownTagsCache;

	async onload() {
		await this.loadSettings();

		this.cache = new KnownTagsCache(this);
		publishAPI(DerAmmoKnownTagsABI_V1, this.cache);

		// this adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this, this));

		this.buildCommands();
		this.registerViewPlugin(createCommandViewPlugin(this));
		this.registerMarkdownPostProcessor(createCommandRemovalPostProcessor(this.commands));
		this.registerContextMenuDeleteElement();
		
		app.workspace.onLayoutReady(() => {
			// usually this has already happend from a view plugin running before layout is ready
			this.cache.initialize();
		});
	}

	private buildCommands() {
		this.commands.registerCommand(EraseQuote.Command);
		this.commands.registerCommand(KnownTags.Command);
	}

	onunload() {
		// reset in case of reload
		publishAPI(DerAmmoKnownTagsABI_V1, undefined);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	get metadataCache(): MetadataCache {
		return this.app.metadataCache;
	}
}

function createCommandViewPlugin(host: Host) {
	// create a unique class to identify the view plugin, which has access to this Obsidian plugin through capture
	return class extends
		CommandViewPlugin<Host> {
		getPlugin(): Host {
			return host;
		}
	};
}
