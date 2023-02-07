import { MetadataCache, TFile } from "obsidian";
import { Decoration, ParsedCommand } from "src/derobst/ParsedCommand";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";
import { MinimalPlugin } from "src/derobst/ViewPluginBase";
import { KnownTagsCache } from "./KnownTagsCache";
import { ViewPluginContextBase } from "../derobst/ViewPluginContextBase";

export interface Settings {
    tagsFolder: string;
    defaultHide: boolean;
    defaultDim: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
    tagsFolder: "",
    defaultHide: true,
    defaultDim: true
};

// stable services our plugin provides to its components
export interface Host extends MinimalPlugin {
    cache: KnownTagsCache;
    settings: Settings;
    settingsDirty: boolean;
    metadataCache: MetadataCache;

    /**
     * Registers an DOM event to be detached when unloading
     * @public
     */
    registerDomEvent<K extends keyof WindowEventMap>(el: Window, type: K, callback: (this: HTMLElement, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    /**
     * Registers an DOM event to be detached when unloading
     * @public
     */
    registerDomEvent<K extends keyof DocumentEventMap>(el: Document, type: K, callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    /**
     * Registers an DOM event to be detached when unloading
     * @public
     */
    registerDomEvent<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;

	generateImages(prompt: string): Promise<{ generationId: string; urls: string[]; }>; 
	createFileFromBuffer(arg0: string, buffer: Buffer): Promise<TFile>;
	loadFile(path: string): Promise<TFile>;
};

// services used during construction of decorations for a particular inline code command
export class CommandContext extends ViewPluginContextBase<Host> {
    public constructor(fields?: Partial<CommandContext>) {
        super(fields);
    }

    calculateUnfocusedStyle(command: ParsedCommandWithSettings): { hide: boolean; dim: boolean; } {
        const settings: Settings = this.plugin.settings;

        // get default behavior from settings
        let hide = settings.defaultHide;
        let dim = settings.defaultDim;

        // process overrides, including conflicting ones
        if (command.settings.dim) {
            dim = true;
        }
        if (command.settings.hide) {
            hide = true;
        }
        if (command.settings.nodim) {
            dim = false;
        }
        if (command.settings.nohide) {
            hide = false;
        }
        return { hide, dim };
    }

    markBasedOnSettings(command: ParsedCommandWithSettings) {
        this.autoDimOrHide(command, this.calculateUnfocusedStyle(command));
    }

    markBasedOnDefaults(command: ParsedCommand) {
        // get default behavior from settings
        const settings: Settings = this.plugin.settings;
        this.autoDimOrHide(command, { dim: settings.defaultDim, hide: settings.defaultHide });
    }

    // use style that implements the selected behavior when not focused
    private autoDimOrHide(command: ParsedCommand, { dim, hide }: { dim: boolean; hide: boolean; }) {
        if (hide) {
            this.builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-hide" } }));
        } else if (dim) {
            this.builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-dim" } }));
        } else {
            this.builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags" } }));
        }
    }
}
