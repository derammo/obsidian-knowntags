import { MetadataCache, TFile } from 'obsidian';

import { Configuration, ImagesResponseDataInner, OpenAIApi } from "openai";

import { CommandDispatcher, createCommandRemovalPostProcessor, CommandViewPlugin } from "derobst/command";
import { ObsidianPluginBase } from "derobst/main";

import { createGeneratedImagesDecorationsStateField } from "image_generation/StateField";

import * as CharacterRandomDescription from "commands/character_random_description/Command";
import * as EraseQuote from "commands/erase_quote/Command";
import * as ImagePromptFromTags from "commands/image_prompt_from_tags/Command";
import * as ImageSet from "commands/image_set/Command";
import * as KnownTags from "commands/known_tags/Command";

import { KnownTagsCache } from './KnownTagsCache';
import { DEFAULT_SETTINGS, Host, Settings } from './Plugin';
import { SettingTab } from './SettingTab';

// XXX remove and only take from config
const openaiConfiguration = new Configuration({
	apiKey: "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" // process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(openaiConfiguration);

export class KnownTagsPlugin extends ObsidianPluginBase implements Host {
	settings: Settings;
	commands: CommandDispatcher<Host> = new CommandDispatcher<Host>();
	cache: KnownTagsCache;

	async onload() {
		await this.loadSettings();

		this.cache = new KnownTagsCache(this);

		// this adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		this.buildCommands();
		this.registerViewPlugin(createCommandViewPlugin(this));
		this.registerEditorExtension(createGeneratedImagesDecorationsStateField(this));
		this.registerMarkdownPostProcessor(createCommandRemovalPostProcessor(this.commands));

		app.workspace.onLayoutReady(() => {
			// usually this has already happend from a view plugin running before layout is ready
			this.cache.initialize();
		});
	}

	private buildCommands() {
		this.commands.registerCommand(ImagePromptFromTags.Command);
		this.commands.registerCommand(CharacterRandomDescription.Command);
		this.commands.registerCommand(EraseQuote.Command);
		this.commands.registerCommand(ImageSet.Command);
		this.commands.registerCommand(KnownTags.Command);
	}

	onunload() {
		// no code
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settingsDirty = true;
		await this.saveData(this.settings);
		this.app.workspace.updateOptions();
	}

	get metadataCache(): MetadataCache {
		return this.app.metadataCache;
	}

	async generateImages(prompt: string): Promise<{ generationId: string; urls: string[]; }> {
		return openai.createImage({
			prompt: prompt,
			// XXX config
			n: 4,
			// XXX config
			size: "256x256",
			response_format: "url"
		})
			.then((response) => {
				let generationId: string | undefined = undefined;
				const urls: string[] = [];
				response.data.data.forEach((image: ImagesResponseDataInner) => {
					if (image.url === undefined) {
						return;
					}
					urls.push(image.url);
					const match = (image.url ?? "").match(/st=([0-9-T%AZ]+)(?:&|$)/);
					if (match !== null) {
						if (generationId === undefined) {
							// unescape URL
							generationId = decodeURIComponent(match[1]);
						} else {
							if (generationId !== decodeURIComponent(match[1])) {
								console.log(`ERROR: mismatched generation id '${generationId}' vs '${decodeURIComponent(match[1])}'`);
							}
						}
					}
				});
				return { generationId: generationId ?? "", urls: urls };
			});
	}

	async createFileFromBuffer(path: string, buffer: Buffer): Promise<TFile> {
		const existing = app.vault.getAbstractFileByPath(path);
		if (existing !== null) {
			await app.vault.delete(existing);
		}
		return app.vault.createBinary(path, buffer);
	}

	async loadFile(path: string): Promise<TFile> {
		const maybe = app.vault.getAbstractFileByPath(path);
		if (maybe === null) {
			return Promise.reject(`File not found: '${path}'`);
		}
		if (!(maybe instanceof TFile)) {
			return Promise.reject(`Path does not identify a file: '${path}'`);
		}
		return Promise.resolve(maybe as TFile);
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
