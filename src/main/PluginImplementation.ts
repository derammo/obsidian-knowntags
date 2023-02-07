import { PluginSpec, ViewPlugin } from "@codemirror/view";
import { CachedMetadata, MetadataCache, Plugin, TFile } from 'obsidian';

import { Configuration, ImagesResponseDataInner, OpenAIApi } from "openai";

import { KnownTagsCache } from './KnownTagsCache';
import { SettingTab } from './SettingTab';

import { DEFAULT_SETTINGS, Host, Settings } from './Plugin';

import { createGeneratedImagesDecorationsStateField } from "src/image_generation/StateField";
import { CommandsViewPlugin } from './CommandsViewPlugin';

// XXX remove and only take from config
const openaiConfiguration = new Configuration({
	apiKey: "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" // process.env.OPENAI_API_KEY,
});
   
export const openai = new OpenAIApi(openaiConfiguration);

export class KnownTagsPlugin extends Plugin implements Host {
	cache: KnownTagsCache;
	commandsView: ViewPlugin<CommandsViewPlugin>;
	settings: Settings;
	settingsDirty: boolean = false;
	generatedImagesView: ViewPlugin<CommandsViewPlugin>;

	get metadataCache(): MetadataCache {
		return this.app.metadataCache;
	}

	async onload() {
		await this.loadSettings();

		this.cache = new KnownTagsCache();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		/**
		 * XXX This is not called when a file is renamed for performance reasons.
		 * You must hook the vault rename event for those.
		 *
		 * XXX this means we would have to figure out if any of our metadata files are affected if we wanted to have well defined behavior
		 * with duplicate definitions
		 *
		 * (Details: https://github.com/obsidianmd/obsidian-api/issues/77)
		 */
		this.registerEvent(this.app.metadataCache.on('changed', (file: TFile, data: string, cache: CachedMetadata) => this.cache.onMetadataChanged(file, data, cache)));
		this.registerEvent(this.app.metadataCache.on('deleted', (file: TFile, prevCache: CachedMetadata) => this.cache.onMetadataDeleted(file, prevCache)));

		this.registerCommandsView();
		this.registerEditorExtension(createGeneratedImagesDecorationsStateField(this));

		app.workspace.onLayoutReady(() => {
			// usually this has already happend from a view plugin running before layout is ready
			this.cache.initialize();
		});
	}

	private registerCommandsView() {
		const commandsSpec: PluginSpec<CommandsViewPlugin> = {
			decorations: (value: CommandsViewPlugin) => value.decorations,
		};
		const host: Host = this;
		this.commandsView = ViewPlugin.fromClass(class extends CommandsViewPlugin {
			getPlugin(): Host {
				return host;
			}
		}, commandsSpec);
		this.registerEditorExtension(this.commandsView);
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settingsDirty = true;
		await this.saveData(this.settings);
		this.app.workspace.updateOptions();
	}

	async generateImages(prompt: string): Promise<{ generationId: string; urls: string[]; }> {
		return openai.createImage({
			prompt: prompt,
			// XXX config
			n: 4,
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