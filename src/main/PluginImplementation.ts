import {
	PluginSpec,
	ViewPlugin
} from "@codemirror/view";
import { App, CachedMetadata, Editor, MarkdownPostProcessorContext, MarkdownView, MetadataCache, Modal, Notice, Plugin, TFile } from 'obsidian';
import { Configuration, ImagesResponseDataInner, OpenAIApi } from "openai";

import * as KnownTagsCommand from 'src/commands/known_tags/Comand';
import { KnownTagsCache } from './KnownTagsCache';
import { SettingTab } from './SettingTab';

import { DEFAULT_SETTINGS, Host, Settings } from './Plugin';

import { CommandsViewPlugin } from './CommandsViewPlugin';
import { GeneratedImagesViewPlugin } from '../image_generation/GeneratedImagesViewPlugin';
import { createGeneratedImagesDecorationsStateField } from "src/image_generation/StateField";

// XXX remove and only take from config
const configuration = new Configuration({
  apiKey: "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" // process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

		// code blocks can be handled in edit mode, for syntax highlighting etc.
		this.registerMarkdownCodeBlockProcessor(
			// WARNING: don't use punctuation such as ! in the language name; it will break the app's scripts
			"known_tags",
			async (source: string, element: HTMLElement, context: MarkdownPostProcessorContext) => this.onCodeBlock(source, element, context));

		// this is only called in reading mode
		this.registerMarkdownPostProcessor(
			async (element: HTMLElement, context: MarkdownPostProcessorContext) => this.onMarkDownPostProcessing(element, context));

		// view plugins (may need state field also, if we grow stuff vertically too much)
		this.registerCommandsView();
		this.registerGeneratedImagesView();
		this.registerEditorExtension(createGeneratedImagesDecorationsStateField(this));

		app.workspace.onLayoutReady(() => {
			// usually this has already happend from a view plugin running before layout is ready
			this.cache.initialize();
		});
	}

	private registerGeneratedImagesView() {
		const generateImagesSpec: PluginSpec<CommandsViewPlugin> = {
			decorations: (value: CommandsViewPlugin) => value.decorations,
		};
		const host = this;
		this.generatedImagesView = ViewPlugin.fromClass(class extends GeneratedImagesViewPlugin {
			getPlugin(): Host {
				return host;
			}
		}, generateImagesSpec);
		this.registerEditorExtension(this.generatedImagesView);
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

	onMarkDownPostProcessing(element: HTMLElement, _context: MarkdownPostProcessorContext): any {
		console.log("markdown post processing");

		element.querySelectorAll("code").forEach((code: HTMLElement, _key: number, _parent: NodeListOf<HTMLElement>) => {
			if (KnownTagsCommand.Command.match(code.innerText)) {
				// this is processing the DOM for the reading view (rendered markdown) so we can destructively change it
				code.remove();
			}
		});
	}

	onCodeBlock(source: string, _element: HTMLElement, _context: MarkdownPostProcessorContext): any {
		console.log(`code block ${source}`);
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
			// console.log(response);
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
		return app.vault.createBinary(path, buffer);
	}
}

// XXX remove
export class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

