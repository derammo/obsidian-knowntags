import { MinimalCommandHost } from "derobst/interfaces";
import { MetadataCache } from "obsidian";
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

    // pass through to Obsidian API
    metadataCache: MetadataCache;
};
