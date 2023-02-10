import { CommandDispatcher } from "derobst/command";
import { MinimalCommandHost } from "derobst/interfaces";
import { MetadataCache, TFile } from "obsidian";
import { KnownTagsCache } from "./KnownTagsCache";

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

// stable services our Obsidian plugin provides to its components
export interface Host extends MinimalCommandHost<Host> {
    // data specific to this plugin
    settings: Settings;
    cache: KnownTagsCache;

    // functionality specific to this plugin
	generateImages(prompt: string): Promise<{ generationId: string; urls: string[]; }>; 
	createFileFromBuffer(arg0: string, buffer: Buffer): Promise<TFile>;
	loadFile(path: string): Promise<TFile>;
 
    // pass through to Obsidian API
    metadataCache: MetadataCache;
};
