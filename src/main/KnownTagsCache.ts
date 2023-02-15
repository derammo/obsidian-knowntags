import { Definitions, GlobalFrontMatter } from 'derobst/files';
import { Plugin } from 'obsidian';
import { DerAmmoKnownTagsAPI_V1 } from '../api/api';

// definitions for each subtag by subpath
type TopLevel = Map<string, Definitions>;

export class KnownTagsCache extends GlobalFrontMatter implements DerAmmoKnownTagsAPI_V1 {
	private data: Map<string, TopLevel> = new Map<string, TopLevel>();

    constructor(plugin: Plugin) {
        super(plugin);
        this.rootKey = "derammo-known-tags";
    }

    getTopLevel(tag: string): string | null {
		this.initialize();
		const { topLevelKey } = this.splitKeys(tag);
		return topLevelKey ?? null;
	}

	getMetadata(tag: string, frontMatterSection: string): any | null {
		this.initialize();
		const { topLevelKey, subPath } = this.splitKeys(tag);
        if (!this.data.has(topLevelKey)) {
            return null;
        }
		const topLevel = this.data.get(topLevelKey);
		if (!topLevel.has(subPath)) {
			return null;
		}
        return (topLevel.get(subPath).value?.[frontMatterSection] ?? null);
	}

	getChoices(topLevel: string): string[] {
		this.initialize();
        if (!this.data.has(topLevel)) {
			return [];
		}
		const definition = this.data.get(topLevel);
        if (definition === undefined) {
            return [];
        }
		return Array.from(definition.keys());
	}

	protected onVaultClosed() {
		this.data.clear();
		super.onVaultClosed();
	}

	protected splitKeys(tag: string): { topLevelKey?: string, subPath?: string } {
		const slash = tag.indexOf("/");
		if (slash < 1) {
			return {};
		}
		const topLevelKey = tag.slice(0, slash);
		const subPath = tag.slice(slash + 1);
		return { topLevelKey, subPath };
	}

    protected resolveRecord(key: string): Definitions | undefined {
		const { topLevelKey, subPath } = this.splitKeys(key);
		let topLevel: TopLevel;
        if (this.data.has(topLevelKey)) {
			topLevel = this.data.get(topLevelKey);
        } else {
			topLevel = new Map<string, Definitions>();
			this.data.set(topLevelKey, topLevel);
		}
		let record: Definitions;
		if (topLevel.has(subPath)) {
			record = topLevel.get(subPath);
		} else {	
			record = new Definitions();
			topLevel.set(subPath, record);
		}
        return record;
    }

    protected removeRecord(key: string): void {
		const { topLevelKey, subPath } = this.splitKeys(key);
        if (!this.data.has(topLevelKey)) {
			return;
        } 
		const topLevel = this.data.get(topLevelKey);
		if (!topLevel.has(subPath)) {
			return;
		}
		topLevel.delete(subPath);		
	}	
}