import { ContextMenuActions, MinimalCommandHost } from "derobst/interfaces";
import { MetadataCache } from "obsidian";
import { KnownTagsCache } from "./KnownTagsCache";

export interface Settings {
    tagsFolder: string;
    defaultHide: boolean;
    defaultDim: boolean;
}

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

    /** 
     * can be called to tie context menu actions to an HTML element
     */
    registerDomContextMenuTarget(element: HTMLElement, command: ContextMenuActions): void;

    /**
     * can be called to temporarily redirect context menu actions to specific objects we created
     */ 
    setContextTarget(target: ContextMenuActions, timeStampMilliseconds: number): void;

    // pass through to Obsidian API
    metadataCache: MetadataCache;
}
